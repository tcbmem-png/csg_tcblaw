/**
 * Generic income-shares engine — the single orchestration of the shared
 * pipeline for TN, AR, AL, GA, and FL (FL after a gross→net pre-step):
 *
 *   AGI → combined → income shares → schedule lookup → parenting strategy →
 *   low-income strategy → pro-rata add-ons → net-transfer deviations →
 *   minimum-order floor → final rounding → signed order + direction.
 *
 * All metric sub-logic lives in core/{schedule,parenting,low-income,pro-rata}.
 * This file only sequences them under the state's spec. State-specific extras
 * that sit OUTSIDE this pipeline (TN's federal-benefit offset, statutory-cap
 * narrative, special-expenses 7% threshold, the explainer prose) are layered
 * by the state engine around this core, not duplicated here.
 */
import type { IncomeSharesSpec } from "./spec";
import { roundFinal } from "./spec";
import {
  directionFromASignedFlow,
  type IncomeSharesInputs,
  type IncomeSharesOutputs,
} from "./types";
import { lookupScheduleAmount } from "./schedule";
import { PARENTING_STRATEGIES, type ParentingStrategy } from "./parenting";
import { LOW_INCOME_STRATEGIES, type LowIncomeStrategy } from "./low-income";
import { splitProRataNetFromA } from "./pro-rata";
import { grossToNetMonthly } from "./net-income";

function emptyOutputs(errors: string[], warnings: string[]): IncomeSharesOutputs {
  return {
    parentAAGI: 0,
    parentBAGI: 0,
    combinedAGI: 0,
    piA: 0,
    piB: 0,
    bcso: 0,
    bcsoSource: "schedule",
    scheduleAgiUsed: null,
    scheduleIsShaded: false,
    arpIdentity: "equal",
    parentingBand: "neutral",
    variableMultiplier: null,
    netPresumptiveSupport: 0,
    presumptiveDirection: "none",
    ssrApplied: false,
    minimumOrderApplied: false,
    addOnsTotalFromA: 0,
    deviationsTotalFromA: 0,
    allInMonthlyFromA: 0,
    allInMonthly: 0,
    allInDirection: "none",
    warnings,
    errors,
  };
}

export function incomeShares(
  spec: IncomeSharesSpec,
  inputs: IncomeSharesInputs,
): IncomeSharesOutputs {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (
    inputs.numChildren < 1 ||
    inputs.numChildren > spec.schedule.maxChildren
  ) {
    errors.push(
      `Number of children must be between 1 and ${spec.schedule.maxChildren}.`,
    );
  }

  // income_shares_net (FL) runs a gross→net pre-step before combining. It is
  // stubbed fail-loud (core/net-income.ts) — throws until the FL pack lands.
  // income_shares_gross states (TN, AR, ...) use gross minus pre-summed
  // deductions and are unaffected.
  let aAGI: number;
  let bAGI: number;
  if (spec.model === "income_shares_net") {
    aAGI = grossToNetMonthly(
      inputs.parentAGrossMonthly,
      inputs.parentANetDeductions ?? [],
    );
    bAGI = grossToNetMonthly(
      inputs.parentBGrossMonthly,
      inputs.parentBNetDeductions ?? [],
    );
  } else {
    aAGI = Math.max(
      0,
      inputs.parentAGrossMonthly - (inputs.parentADeductionsMonthly ?? 0),
    );
    bAGI = Math.max(
      0,
      inputs.parentBGrossMonthly - (inputs.parentBDeductionsMonthly ?? 0),
    );
  }
  const combinedAGI = aAGI + bAGI;
  if (combinedAGI <= 0) {
    return emptyOutputs(
      [...errors, "Combined AGI must be greater than zero."],
      warnings,
    );
  }

  let piA = aAGI / combinedAGI;
  let piB = bAGI / combinedAGI;
  // Some states round each parent's income-share percentage before applying it
  // (AL Rule 32(C)(3): nearest 1%); the complement is derived so the shares
  // still sum to 1. Default (TN/AR/LA) carries full precision.
  if (spec.rounding.incomeShare === "nearest_1pct") {
    piA = Math.round(piA * 100) / 100;
    piB = 1 - piA;
  }

  let lookup;
  try {
    lookup = lookupScheduleAmount(spec.schedule, combinedAGI, inputs.numChildren);
  } catch (e) {
    return emptyOutputs([...errors, (e as Error).message], warnings);
  }
  const bcso = lookup.bcso;

  // --- Presumptive support: split custody (separate group worksheets) or the
  //     state's parenting-time strategy. ---
  let presumptiveFromA: number;
  let arpIdentity: IncomeSharesOutputs["arpIdentity"];
  let parentingBand: string;
  let variableMultiplier: number | null;
  let suppressLowIncome = false;

  if (inputs.splitCustody) {
    // Each parent is domiciliary of some children; run a schedule lookup per
    // group and offset (e.g. LA La. R.S. 9:315.10). A is the nondomiciliary
    // obligor for the children living with B, and vice versa.
    const { parentAChildren, parentBChildren } = inputs.splitCustody;
    const bcsoChildrenWithB = lookupScheduleAmount(
      spec.schedule,
      combinedAGI,
      parentBChildren,
    ).bcso;
    const bcsoChildrenWithA = lookupScheduleAmount(
      spec.schedule,
      combinedAGI,
      parentAChildren,
    ).bcso;
    const aOwes = piA * bcsoChildrenWithB;
    const bOwes = piB * bcsoChildrenWithA;
    presumptiveFromA = aOwes - bOwes;
    arpIdentity =
      presumptiveFromA > 0
        ? "parent_a"
        : presumptiveFromA < 0
          ? "parent_b"
          : "equal";
    parentingBand = "split_custody";
    variableMultiplier = null;
  } else {
    const parentingStrategy = PARENTING_STRATEGIES[
      spec.parenting.model
    ] as ParentingStrategy;
    const parenting = parentingStrategy(
      {
        bcso,
        piA,
        piB,
        parentingType: inputs.parentingType,
        arpForStandard: inputs.arpForStandard,
        parentADays: inputs.parentADays,
        parentBDays: inputs.parentBDays,
      },
      spec.parenting.params,
    );
    warnings.push(...parenting.warnings);
    presumptiveFromA = parenting.netFromA;
    arpIdentity = parenting.arpIdentity;
    parentingBand = parenting.band;
    variableMultiplier = parenting.multiplier;
    if (parenting.suppressLowIncome) suppressLowIncome = true;
  }

  // --- Low-income strategy ---
  let ssrApplied = false;
  let minimumOrderApplied = false;
  let suppressAddOns = false;
  let bcsoReported = bcso;
  if (spec.lowIncome && !suppressLowIncome) {
    const lowIncomeStrategy = LOW_INCOME_STRATEGIES[
      spec.lowIncome.model
    ] as LowIncomeStrategy;
    const li = lowIncomeStrategy(
      { presumptiveFromA, aAGI, bAGI, numChildren: inputs.numChildren },
      spec.lowIncome.params,
    );
    presumptiveFromA = li.presumptiveAfterAdjustment;
    ssrApplied = li.applied;
    if (li.note) warnings.push(li.note);
    if (li.minimumApplied) minimumOrderApplied = true;
    if (li.suppressAddOns) suppressAddOns = true;
    if (li.overrideBcso != null) bcsoReported = li.overrideBcso;
  }

  // --- Pro-rata add-ons (dropped when the low-income strategy suppresses) ---
  let addOnsTotalFromA = 0;
  if (!suppressAddOns) {
    for (const a of inputs.addOns ?? []) {
      addOnsTotalFromA += splitProRataNetFromA(a.monthly, a.paidBy, piA, piB);
    }
  }

  // --- Deviations: pro-rata expense splits + direct flat adjustments ---
  let deviationsTotalFromA = 0;
  if (!suppressAddOns) {
    for (const d of inputs.deviations ?? []) {
      deviationsTotalFromA += splitProRataNetFromA(d.monthly, d.paidBy, piA, piB);
    }
    // Direct deviations adjust the order in the payor→payee direction.
    const payorSign =
      Math.sign(presumptiveFromA + addOnsTotalFromA) || Math.sign(presumptiveFromA);
    for (const d of inputs.directDeviations ?? []) {
      const delta = (d.direction === "increase" ? 1 : -1) * d.amount * payorSign;
      deviationsTotalFromA += delta;
    }
  }

  let allInFromA = presumptiveFromA + addOnsTotalFromA + deviationsTotalFromA;

  // --- Minimum-order floor (applied to the presumptive magnitude) ---
  if (spec.minimumOrder != null && !suppressLowIncome) {
    const absPresumptive = Math.abs(presumptiveFromA);
    if (absPresumptive > 0 && absPresumptive < spec.minimumOrder) {
      const adjust = spec.minimumOrder - absPresumptive;
      allInFromA += presumptiveFromA > 0 ? adjust : -adjust;
      minimumOrderApplied = true;
    }
  }

  const allInMonthlyFromA = roundFinal(allInFromA, spec.rounding.finalOrder);
  const presumptiveRounded = roundFinal(presumptiveFromA, spec.rounding.finalOrder);

  return {
    parentAAGI: roundFinal(aAGI, spec.rounding.finalOrder),
    parentBAGI: roundFinal(bAGI, spec.rounding.finalOrder),
    combinedAGI: roundFinal(combinedAGI, spec.rounding.finalOrder),
    piA,
    piB,
    bcso: roundFinal(bcsoReported, spec.rounding.finalOrder),
    bcsoSource: lookup.source,
    scheduleAgiUsed: lookup.scheduleAgiUsed,
    scheduleIsShaded: lookup.isShaded,
    arpIdentity,
    parentingBand,
    variableMultiplier,
    netPresumptiveSupport: Math.abs(presumptiveRounded),
    presumptiveDirection: directionFromASignedFlow(presumptiveRounded),
    ssrApplied,
    minimumOrderApplied,
    addOnsTotalFromA: roundFinal(addOnsTotalFromA, spec.rounding.finalOrder),
    deviationsTotalFromA: roundFinal(
      deviationsTotalFromA,
      spec.rounding.finalOrder,
    ),
    allInMonthlyFromA,
    allInMonthly: Math.abs(allInMonthlyFromA),
    allInDirection: directionFromASignedFlow(allInMonthlyFromA),
    warnings,
    errors,
  };
}
