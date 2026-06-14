import type { CalcInputs, CalcOutputs, Direction } from "./types";
import { lookupBcso, SCHEDULE_EFFECTIVE_DATE } from "./bcso";
import {
  ABOVE_CAP,
  COMBINED_AGI_CAP,
  MIN_SUPPORT_MONTHLY,
  PARENTING_TIME,
  SPECIAL_EXPENSES_THRESHOLD_RATIO,
  SSR_AMOUNT,
  STATUTORY_PCSO_MAX,
} from "./data/constants";
import {
  tnVariableMultiplier,
  type TnVariableMultiplierParams,
} from "../../core/parenting";
import { selfSupportReserve } from "../../core/low-income";

/** TN parenting-time strategy params, sourced from the TN constants. */
const TN_PARENTING_PARAMS: TnVariableMultiplierParams = {
  reductionThreshold: PARENTING_TIME.REDUCTION_THRESHOLD,
  increaseThreshold: PARENTING_TIME.INCREASE_THRESHOLD,
  variableMultiplierConstant: PARENTING_TIME.VARIABLE_MULTIPLIER_CONSTANT,
  equalDays: PARENTING_TIME.EQUAL_DAYS,
  standardArpDays: 80,
};

/** Round to nearest whole dollar — Rule .04(11)(a). */
function r$(n: number): number {
  return Math.round(n);
}

function directionFromASignedFlow(flowFromA: number): Direction {
  if (flowFromA > 0) return "parent_a_to_b";
  if (flowFromA < 0) return "parent_b_to_a";
  return "none";
}

/** Sign convention: each helper returns the amount added to Parent A's net outflow.
 * If A pays a third-party expense, B owes A their pro-rata share — that REDUCES A's net outflow,
 * so the returned value is negative. If B pays, A owes B their share — positive.
 */
function reimbursementFromA(
  totalMonthly: number,
  paidBy: "parent_a" | "parent_b",
  piA: number,
  piB: number,
): number {
  if (totalMonthly <= 0) return 0;
  if (paidBy === "parent_a") {
    // B reimburses A their pro-rata share -> reduces A's net outflow.
    return -totalMonthly * piB;
  }
  // A reimburses B their pro-rata share -> increases A's outflow.
  return totalMonthly * piA;
}

function splitProRataNetFromA(
  totalMonthly: number,
  paidBy: "parent_a" | "parent_b" | "split_pro_rata",
  piA: number,
  piB: number,
): number {
  if (totalMonthly <= 0) return 0;
  if (paidBy === "split_pro_rata") {
    // Each parent pays their share directly — no transfer through support order.
    return 0;
  }
  return reimbursementFromA(totalMonthly, paidBy, piA, piB);
}

export function calculate(inputs: CalcInputs): CalcOutputs {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (inputs.numChildren < 1 || inputs.numChildren > 5) {
    errors.push("Number of children must be between 1 and 5.");
  }

  // === Means-tested-only short circuit (Rule .04(3)(c)(2)) ===
  // If the obligor's only source of income is means-tested public assistance,
  // FCSO is $0 (not the $100 minimum). For v1 we treat either parent flag here
  // by zeroing the order entirely if either is means-tested-only. (The TCB
  // attorney use case for high-income clients makes this edge-case.)
  const meansTestedOnly =
    inputs.parentAMeansTestedOnly || inputs.parentBMeansTestedOnly;

  // === AGI ===
  const aAGI = Math.max(
    0,
    inputs.parentAGrossMonthly -
      inputs.parentASECredit -
      inputs.parentAPriorSupport -
      inputs.parentAInhomeCredit,
  );
  const bAGI = Math.max(
    0,
    inputs.parentBGrossMonthly -
      inputs.parentBSECredit -
      inputs.parentBPriorSupport -
      inputs.parentBInhomeCredit,
  );
  const combinedAGI = aAGI + bAGI;

  if (combinedAGI <= 0) {
    return emptyOutputs({
      errors: [...errors, "Combined AGI must be greater than zero."],
      warnings,
    });
  }

  const piA = aAGI / combinedAGI;
  const piB = bAGI / combinedAGI;

  // === BCSO ===
  let bcsoLookup;
  try {
    bcsoLookup = lookupBcso(combinedAGI, inputs.numChildren);
  } catch (e) {
    return emptyOutputs({
      errors: [...errors, (e as Error).message],
      warnings,
    });
  }
  const bcso = bcsoLookup.bcso;

  // === Parenting time (core tn_variable_multiplier strategy) ===
  const parenting = tnVariableMultiplier(
    {
      bcso,
      piA,
      piB,
      parentingType: inputs.parentingType,
      arpForStandard: inputs.arpForStandard,
      parentADays: inputs.parentADays,
      parentBDays: inputs.parentBDays,
    },
    TN_PARENTING_PARAMS,
  );
  const band = parenting.band as
    | "standard"
    | "reduction"
    | "neutral"
    | "increase"
    | "equal";
  const arpIdentity = parenting.arpIdentity;
  const arpIsA = arpIdentity === "parent_a";
  const multiplier = parenting.multiplier;
  const presumptiveFromA = parenting.netFromA;
  warnings.push(...parenting.warnings);

  // === SSR check (Rule .02(25) + .09 shaded area) — core strategy ===
  // The shaded-cell test keys off the OBLIGOR's own AGI, not combined AGI: a
  // combined-AGI cell can clear the threshold while the obligor-alone lookup is
  // shaded. The metric logic lives in core/low-income/self-support-reserve.ts;
  // TN supplies the reserve, cap, obligor-only lookup, and the note wording.
  let minimumOrderApplied = false;
  const ssr = selfSupportReserve(
    {
      presumptiveFromA,
      aAGI,
      bAGI,
      numChildren: inputs.numChildren,
    },
    {
      reserve: SSR_AMOUNT,
      cap: COMBINED_AGI_CAP,
      lookup: (agi, n) => {
        const r = lookupBcso(agi, n);
        return { bcso: r.bcso, isShaded: r.isShaded };
      },
      noteBuilder: (altBcso, reserve) =>
        `Self-Support Reserve applied (Rule .02(25)): obligor-only BCSO ($${altBcso}) used in place of pro-rata BCSO so the obligor retains the $${reserve}/mo reserve.`,
    },
  );
  const ssrApplied = ssr.applied;
  const ssrNote = ssr.note;
  const presumptiveAfterSsr = ssr.presumptiveAfterAdjustment;
  const ssrCollapsedToZero = ssr.collapsedToZero;
  const ssrObligorIsA = ssr.obligorIsA;

  // === Add-ons (Rule .04(8)) ===
  const addOnHealthFromA = reimbursementFromA(
    inputs.healthPremiumMonthly,
    inputs.healthPaidBy,
    piA,
    piB,
  );
  // Uninsured medical: pro-rata reimbursement when one parent pays out-of-pocket.
  const addOnMedicalFromA =
    inputs.uninsuredMedicalPaidBy === "split_pro_rata"
      ? 0
      : reimbursementFromA(
          inputs.uninsuredMedicalMonthly,
          inputs.uninsuredMedicalPaidBy,
          piA,
          piB,
        );
  const addOnChildcareFromA = reimbursementFromA(
    inputs.childcareMonthly,
    inputs.childcarePaidBy,
    piA,
    piB,
  );
  const addOnsTotalFromA =
    addOnHealthFromA + addOnMedicalFromA + addOnChildcareFromA;

  // === Private school deviation (Rule .07(2)(d)) ===
  const privateSchoolMonthlyTotal = inputs.includePrivateSchool
    ? inputs.privateSchoolAnnual / 12
    : 0;
  const privateSchoolDeviationFromA = inputs.includePrivateSchool
    ? splitProRataNetFromA(
        privateSchoolMonthlyTotal,
        inputs.privateSchoolPaidBy,
        piA,
        piB,
      )
    : 0;

  // === Special Expenses 7% threshold (Rule .07(2)(d)) ===
  const specialExpensesThresholdAmount = bcso * SPECIAL_EXPENSES_THRESHOLD_RATIO;
  let specialExpensesIncludedAsDeviation = 0;
  let specialExpensesDeviationFromA = 0;
  const specialExpensesMonthlyInput = (inputs.specialExpensesAnnual || 0) / 12;
  if (inputs.includeSpecialExpenses && specialExpensesMonthlyInput > 0) {
    if (inputs.specialExpensesWaiveThreshold) {
      specialExpensesIncludedAsDeviation = specialExpensesMonthlyInput;
    } else if (specialExpensesMonthlyInput > specialExpensesThresholdAmount) {
      specialExpensesIncludedAsDeviation =
        specialExpensesMonthlyInput - specialExpensesThresholdAmount;
    }
    if (specialExpensesIncludedAsDeviation > 0) {
      specialExpensesDeviationFromA = splitProRataNetFromA(
        specialExpensesIncludedAsDeviation,
        inputs.specialExpensesPaidBy,
        piA,
        piB,
      );
    }
  }

  // === PCSO check (Tenn. Code Ann. § 36-5-101(e)(1)(B)) ===
  const pcsoStatutoryMax =
    STATUTORY_PCSO_MAX[inputs.numChildren as 1 | 2 | 3 | 4 | 5] ?? 0;
  const pcsoMagnitude = Math.abs(presumptiveAfterSsr) + Math.abs(addOnsTotalFromA);
  const pcsoExceedsStatutoryMax = pcsoMagnitude > pcsoStatutoryMax;
  const pcsoExcessOverCap = pcsoExceedsStatutoryMax
    ? r$(pcsoMagnitude - pcsoStatutoryMax)
    : 0;
  const childWord = inputs.numChildren === 1 ? "child" : "children";
  let pcsoCapNote: string | null = null;
  let pcsoBelowCapNote: string | null = null;
  if (pcsoExceedsStatutoryMax) {
    const excessPct = pcsoStatutoryMax > 0 ? (pcsoExcessOverCap / pcsoStatutoryMax) * 100 : 0;
    const magnitudeLabel =
      excessPct < 5
        ? "trivial — routinely approved with brief written findings"
        : excessPct < 25
          ? "moderate — typically requires a short written explanation of the children's needs"
          : excessPct < 50
            ? "substantial — recipient should document the children's actual needs in detail"
            : "very substantial — detailed evidentiary record of the children's actual needs is typically required";
    const annualExcess = pcsoExcessOverCap * 12;
    const privSchoolDev = Math.abs(r$(privateSchoolDeviationFromA));
    const base =
      `Above the statutory presumptive cap (Tenn. Code Ann. §36-5-101(e)(1)(B)). ` +
      `Calculated PCSO is $${r$(pcsoMagnitude)}/mo; the cap for ${inputs.numChildren} ${childWord} is $${pcsoStatutoryMax}/mo — an excess of $${pcsoExcessOverCap}/mo ($${annualExcess.toLocaleString("en-US")}/yr). ` +
      `This is a rebuttable presumption, not a hard cap: the parent receiving support has the burden to prove by a preponderance of the evidence that the additional amount is reasonably necessary for the children's actual needs (Hugger v. Hugger, Tenn. Ct. App. 1999; Smith v. Smith, Tenn. Ct. App. 2007; Nash v. Mulle, 846 S.W.2d 803 (Tenn. 1993)). ` +
      `If that burden is not met, the order would be capped at $${pcsoStatutoryMax}/mo. ` +
      `The size of this excess is ${magnitudeLabel}.`;
    const privLine =
      inputs.includePrivateSchool && privSchoolDev > 0
        ? ` Your private-school deviation of $${privSchoolDev}/mo is included in this total and is a common basis for findings above the cap.`
        : "";
    pcsoCapNote = base + privLine;
  } else if (pcsoMagnitude > 0 && pcsoStatutoryMax > 0) {
    pcsoBelowCapNote =
      `This calculation falls below the statutory presumptive cap of $${pcsoStatutoryMax}/mo for ${inputs.numChildren} ${childWord} (Tenn. Code Ann. §36-5-101(e)(1)(B)). The guideline amount is presumed appropriate.`;
  }

  // === Above-schedule-cap BCSO breakdown (Rule .09(2)(d)) ===
  const bcsoAboveCapBreakdown =
    bcsoLookup.source === "above_cap"
      ? (() => {
          const cfg = ABOVE_CAP[inputs.numChildren as 1 | 2 | 3 | 4 | 5];
          const excessAGI = combinedAGI - COMBINED_AGI_CAP;
          return {
            topOfSchedule: cfg.bcsoAtCap,
            excessAGI: r$(excessAGI),
            rate: cfg.rate,
            addition: r$(excessAGI * cfg.rate),
          };
        })()
      : null;

  // === 50/50 low-support explainer (Rule .04(7)(b)(2)(i)) ===
  let equalParentingLowSupportNote: string | null = null;
  if (inputs.parentingType === "equal") {
    const piDiff = Math.abs(piA - piB);
    if (piDiff < 0.25) {
      equalParentingLowSupportNote =
        `In 50/50 parenting cases, presumptive support depends on the difference in parental income shares, not the absolute level. ` +
        `Per Rule 1240-02-04-.04(7)(b)(2)(i), net support = BCSO × |Parent A's PI − Parent B's PI|. ` +
        `Here the income shares differ by ${(piDiff * 100).toFixed(1)} percentage points, producing a small presumptive obligation. ` +
        `At identical incomes the presumptive support would be zero, regardless of how high those incomes are — the Income Shares model assumes two similarly-situated parents can each provide a comparable lifestyle for the children. ` +
        `Differences in non-income resources (private school paid directly, separate property, disproportionate expense-sharing) are handled as deviations under Rule .07, not in the base calculation.`;
    }
  }

  // === Non-earner ARP explainer (Rule .04(7)(f)) ===
  // When the ARP has zero/negligible income, pro-rata BCSO yields ~$0 and the
  // PRP (despite earning more) cannot be ordered to pay the ARP under the
  // Guidelines. .04(7)(f) permits but does not require PRP→ARP support.
  let nonEarnerArpNote: string | null = null;
  if (
    inputs.parentingType !== "equal" &&
    Math.abs(presumptiveAfterSsr) < 1 &&
    combinedAGI > 0
  ) {
    const arpAgi = arpIsA ? aAGI : bAGI;
    const prpAgi = arpIsA ? bAGI : aAGI;
    if (arpAgi <= 1 && prpAgi > 0) {
      const arpLabel = arpIsA ? inputs.parentALabel : inputs.parentBLabel;
      const prpLabel = arpIsA ? inputs.parentBLabel : inputs.parentALabel;
      nonEarnerArpNote =
        `Presumptive support is $0 because the alternate residential parent (${arpLabel}) has no income to pay from. ` +
        `Under the Income Shares model, the ARP's pro-rata share of the BCSO is BCSO × (ARP income / combined income); with zero ARP income that share is zero. ` +
        `Rule 1240-02-04-.04(7)(f) permits — but does not require — the primary residential parent (${prpLabel}) to be ordered to pay support to the ARP, and the Guidelines provide no formula for doing so. ` +
        `Any such order is a discretionary deviation under Rule .07, supported by written findings explaining why it is in the children's best interest.`;
    }
  }

  // === Zero-presumptive / floor-does-not-apply explainer (Rule .04(12)) ===
  // Floor does not apply only when there is no identifiable obligor (ARP has
  // no income). When SSR collapsed the obligor's pro-rata BCSO to $0, the
  // floor DOES apply — none of the .04(12)(b) exceptions (SSI-only income,
  // federal benefit, PTA-driven reduction) is triggered.
  // See docs/TN_Floor_SSR_Resolution.md.
  let zeroPresumptiveNote: string | null = null;
  if (
    !meansTestedOnly &&
    combinedAGI > 0 &&
    Math.abs(presumptiveAfterSsr) < 1 &&
    nonEarnerArpNote === null &&
    !ssrCollapsedToZero
  ) {
    zeroPresumptiveNote =
      `Presumptive support is $0, so the $100/month minimum-order floor under Rule 1240-02-04-.04(12) does not apply. ` +
      `The floor lifts a small calculated obligation up to $100; it does not create an obligation where the Guidelines produce none. ` +
      `If the parties believe a non-zero order is warranted (e.g., a parent has unreported income, voluntarily underemployed), the path is to revisit the income inputs or request a written deviation under Rule .07.`;
  }




  // === Final ===
  let allInMonthlyFromA =
    presumptiveAfterSsr +
    addOnsTotalFromA +
    privateSchoolDeviationFromA +
    specialExpensesDeviationFromA;

  // === Federal benefit offset (Line 16 / TCA §36-5-101(a)(6) / Rule .04(10)) ===
  // SSA/VA derivative benefit paid TO child on a parent's record offsets that
  // parent's FCSO dollar-for-dollar (capped at their obligation; excess does
  // not flip the order direction).
  let federalBenefitOffsetFromA = 0;
  const fbA = Math.max(0, inputs.parentAFederalBenefit || 0);
  const fbB = Math.max(0, inputs.parentBFederalBenefit || 0);
  if (allInMonthlyFromA > 0 && fbA > 0) {
    // A is obligor; A's federal benefit reduces A's outflow.
    const offset = Math.min(fbA, allInMonthlyFromA);
    federalBenefitOffsetFromA = -offset;
    allInMonthlyFromA -= offset;
  } else if (allInMonthlyFromA < 0 && fbB > 0) {
    // B is obligor; B's federal benefit reduces B's outflow (A's inflow).
    const obligation = -allInMonthlyFromA;
    const offset = Math.min(fbB, obligation);
    federalBenefitOffsetFromA = offset;
    allInMonthlyFromA += offset;
  }

  if (meansTestedOnly) {
    allInMonthlyFromA = 0;
    warnings.push(
      "A parent's only income is means-tested public assistance (SSI/TANF/SNAP). Per Rule .04(3)(c)(2), the order is set to $0 (not the $100 minimum).",
    );
  } else {
    // Minimum $100 floor (Rule .04(12)) applies to the absolute presumptive amount,
    // not to deviation-driven flows. We apply it to the headline presumptive only.
    const absPresumptive = Math.abs(presumptiveAfterSsr);
    if (absPresumptive > 0 && absPresumptive < MIN_SUPPORT_MONTHLY) {
      const adjust = MIN_SUPPORT_MONTHLY - absPresumptive;
      allInMonthlyFromA += presumptiveAfterSsr > 0 ? adjust : -adjust;
      minimumOrderApplied = true;
      warnings.push(
        `Minimum support floor of $${MIN_SUPPORT_MONTHLY}/month applied per Rule .04(12).`,
      );
    } else if (ssrCollapsedToZero) {
      // SSR drove the obligor's pro-rata BCSO to $0. The .04(12) $100 floor
      // still applies because none of the (b) exceptions is triggered. The
      // floor flows ARP→PRP (i.e., from the original obligor).
      allInMonthlyFromA += ssrObligorIsA ? MIN_SUPPORT_MONTHLY : -MIN_SUPPORT_MONTHLY;
      minimumOrderApplied = true;
      warnings.push(
        `SSR collapsed the obligor's pro-rata BCSO to $0, but the $${MIN_SUPPORT_MONTHLY}/month minimum order under Rule .04(12) still applies — none of the (b) exceptions (SSI-only income, federal benefit, or parenting-time reduction) is triggered. See docs/TN_Floor_SSR_Resolution.md.`,
      );
    }
  }

  const allInMonthly = Math.abs(r$(allInMonthlyFromA));
  const allInDirection = directionFromASignedFlow(r$(allInMonthlyFromA));

  return {
    parentAAGI: r$(aAGI),
    parentBAGI: r$(bAGI),
    combinedAGI: r$(combinedAGI),
    piA,
    piB,

    bcso: r$(bcso),
    bcsoSource: bcsoLookup.source,
    scheduleAgiUsed: bcsoLookup.scheduleAgiUsed,
    scheduleIsShaded: bcsoLookup.isShaded,

    parentABcsoShare: r$(bcso * piA),
    parentBBcsoShare: r$(bcso * piB),

    arpIdentity,
    parentingTimeBand: band,
    variableMultiplier: multiplier,

    netPresumptiveSupport: Math.abs(r$(presumptiveAfterSsr)),
    presumptiveDirection: directionFromASignedFlow(r$(presumptiveAfterSsr)),

    ssrApplied,
    ssrNote,
    minimumOrderApplied,

    addOnHealthFromA: r$(addOnHealthFromA),
    addOnMedicalFromA: r$(addOnMedicalFromA),
    addOnChildcareFromA: r$(addOnChildcareFromA),
    addOnsTotalFromA: r$(addOnsTotalFromA),

    privateSchoolMonthlyTotal: r$(privateSchoolMonthlyTotal),
    privateSchoolDeviationFromA: r$(privateSchoolDeviationFromA),
    specialExpensesThresholdAmount: r$(specialExpensesThresholdAmount),
    specialExpensesIncludedAsDeviation: r$(specialExpensesIncludedAsDeviation),
    specialExpensesDeviationFromA: r$(specialExpensesDeviationFromA),

    federalBenefitOffsetFromA: r$(federalBenefitOffsetFromA),

    allInMonthlyFromA: r$(allInMonthlyFromA),
    allInMonthly,
    allInDirection,
    allInAnnual: allInMonthly * 12,

    warnings,
    pcsoExceedsStatutoryMax,
    pcsoStatutoryMax,
    pcsoCapNote,
    pcsoExcessOverCap,
    pcsoBelowCapNote,
    bcsoAboveCapBreakdown,
    equalParentingLowSupportNote,
    nonEarnerArpNote,
    zeroPresumptiveNote,


    scheduleEffectiveDate: SCHEDULE_EFFECTIVE_DATE,
    errors,
  };
}

function emptyOutputs(opts: {
  errors: string[];
  warnings: string[];
}): CalcOutputs {
  return {
    parentAAGI: 0,
    parentBAGI: 0,
    combinedAGI: 0,
    piA: 0,
    piB: 0,
    bcso: 0,
    bcsoSource: "min_floor",
    scheduleAgiUsed: null,
    scheduleIsShaded: false,
    parentABcsoShare: 0,
    parentBBcsoShare: 0,
    arpIdentity: "equal",
    parentingTimeBand: "neutral",
    variableMultiplier: null,
    netPresumptiveSupport: 0,
    presumptiveDirection: "none",
    ssrApplied: false,
    ssrNote: null,
    minimumOrderApplied: false,
    addOnHealthFromA: 0,
    addOnMedicalFromA: 0,
    addOnChildcareFromA: 0,
    addOnsTotalFromA: 0,
    privateSchoolMonthlyTotal: 0,
    privateSchoolDeviationFromA: 0,
    specialExpensesThresholdAmount: 0,
    specialExpensesIncludedAsDeviation: 0,
    specialExpensesDeviationFromA: 0,
    federalBenefitOffsetFromA: 0,
    allInMonthlyFromA: 0,
    allInMonthly: 0,
    allInDirection: "none",
    allInAnnual: 0,
    warnings: opts.warnings,
    pcsoExceedsStatutoryMax: false,
    pcsoStatutoryMax: 0,
    pcsoCapNote: null,
    pcsoExcessOverCap: 0,
    pcsoBelowCapNote: null,
    bcsoAboveCapBreakdown: null,
    equalParentingLowSupportNote: null,
    nonEarnerArpNote: null,
    zeroPresumptiveNote: null,
    scheduleEffectiveDate: SCHEDULE_EFFECTIVE_DATE,
    errors: opts.errors,
  };
}

/** Make a fresh default input. Useful for the UI initial state. */
export function defaultInputs(): CalcInputs {
  return {
    parentALabel: "Parent A",
    parentBLabel: "Parent B",
    parentAGrossMonthly: 0,
    parentBGrossMonthly: 0,
    useImputationForA: false,
    parentAActualGrossMonthly: 0,
    useImputationForB: false,
    parentBActualGrossMonthly: 0,
    youngestChildAge: 8,
    parentAMeansTestedOnly: false,
    parentBMeansTestedOnly: false,
    parentASECredit: 0,
    parentBSECredit: 0,
    parentAPriorSupport: 0,
    parentBPriorSupport: 0,
    parentAInhomeCredit: 0,
    parentBInhomeCredit: 0,
    parentAFederalBenefit: 0,
    parentBFederalBenefit: 0,
    numChildren: 1,
    parentingType: "standard",
    arpForStandard: "parent_b",
    parentADays: 285,
    parentBDays: 80,
    healthPremiumMonthly: 0,
    healthPaidBy: "parent_a",
    uninsuredMedicalMonthly: 0,
    uninsuredMedicalPaidBy: "split_pro_rata",
    childcareMonthly: 0,
    childcarePaidBy: "parent_a",
    childcarePayrollDeducted: false,
    includePrivateSchool: false,
    privateSchoolAnnual: 0,
    privateSchoolPaidBy: "split_pro_rata",
    privateSchoolReason: "",
    includeSpecialExpenses: false,
    specialExpensesAnnual: 0,
    specialExpensesWaiveThreshold: false,
    specialExpensesPaidBy: "split_pro_rata",
    specialExpensesReason: "",
  };
}
