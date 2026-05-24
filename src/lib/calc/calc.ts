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

/** Round to nearest whole dollar — Rule .04(11)(a). */
function r$(n: number): number {
  return Math.round(n);
}

function directionFromASignedFlow(flowFromA: number): Direction {
  if (flowFromA > 0) return "parent_a_to_b";
  if (flowFromA < 0) return "parent_b_to_a";
  return "none";
}

/**
 * Compute the net presumptive support based on parenting band.
 * Returns the signed monthly support from Parent A's perspective:
 *   positive => Parent A pays Parent B
 *   negative => Parent B pays Parent A
 */
function computePresumptive(
  bcso: number,
  piA: number,
  piB: number,
  band: "standard" | "reduction" | "neutral" | "increase" | "equal",
  arpDays: number,
  arpIsA: boolean,
): { netFromA: number; multiplier: number | null } {
  const proRataA = bcso * piA;
  const proRataB = bcso * piB;

  if (band === "neutral" || band === "standard") {
    // ARP pays PRP their full pro-rata BCSO.
    if (arpIsA) return { netFromA: proRataA, multiplier: null };
    return { netFromA: -proRataB, multiplier: null };
  }

  if (band === "reduction" || band === "equal") {
    // Rule .04(7)(h)(4) variable multiplier — applies at arpDays ≥ 92.
    // For 50/50 (equal), Rule .04(7)(b)(2)(i) deems Parent 2 (B) the ARP at
    // 182.5 days, which yields multiplier = 2.0 and the same formula.
    // If the result is negative (PRP earns more than ARP), Rule .04(7)(f)
    // permits PRP→ARP support; we return the signed value and let the
    // caller derive direction.
    const multiplier = PARENTING_TIME.VARIABLE_MULTIPLIER_CONSTANT * arpDays;
    const adjustedBcso = bcso * multiplier;
    const additional = adjustedBcso - bcso;
    if (arpIsA) {
      const prpShareAdditional = additional * piB;
      const arpFinal = proRataA - prpShareAdditional;
      return { netFromA: arpFinal, multiplier };
    } else {
      const prpShareAdditional = additional * piA;
      const arpFinal = proRataB - prpShareAdditional;
      return { netFromA: -arpFinal, multiplier };
    }
  }

  // band === "increase"
  // Rule .04(7)(i): ARP's share increased by (69 - ARP_days) / 365.
  const daysBelow = 69 - arpDays;
  const increasePct = daysBelow / 365;
  if (arpIsA) {
    const adjusted = proRataA + proRataA * increasePct;
    return { netFromA: adjusted, multiplier: null };
  } else {
    const adjusted = proRataB + proRataB * increasePct;
    return { netFromA: -adjusted, multiplier: null };
  }
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

  // === Parenting time band ===
  let arpDays: number;
  let arpIsA: boolean;
  let band: "standard" | "reduction" | "neutral" | "increase" | "equal";
  let arpIdentity: "parent_a" | "parent_b" | "equal";

  if (inputs.parentingType === "equal") {
    arpDays = PARENTING_TIME.EQUAL_DAYS;
    arpIsA = false; // Rule .04(7)(b)(2)(i) — Parent B (Parent 2) deemed ARP
    band = "equal";
    arpIdentity = "equal";
  } else if (inputs.parentingType === "standard") {
    const arp = inputs.arpForStandard ?? "parent_b";
    arpIsA = arp === "parent_a";
    arpDays = 80;
    band = "standard";
    arpIdentity = arp;
  } else {
    // custom
    const aDays = inputs.parentADays ?? 285;
    const bDays = inputs.parentBDays ?? 365 - aDays;
    if (Math.abs(aDays + bDays - 365) > 1.5) {
      warnings.push(
        `Parenting days (${aDays} + ${bDays}) do not sum to 365. Adjust before relying on this calculation.`,
      );
    }
    // ARP is the parent with FEWER days. If exactly equal, treat as "equal".
    if (Math.abs(aDays - bDays) < 0.5) {
      band = "equal";
      arpDays = PARENTING_TIME.EQUAL_DAYS;
      arpIsA = false;
      arpIdentity = "equal";
    } else if (aDays < bDays) {
      arpIsA = true;
      arpDays = aDays;
      arpIdentity = "parent_a";
      band = bandForDays(arpDays);
    } else {
      arpIsA = false;
      arpDays = bDays;
      arpIdentity = "parent_b";
      band = bandForDays(arpDays);
    }
  }

  const { netFromA: presumptiveFromA, multiplier } = computePresumptive(
    bcso,
    piA,
    piB,
    band,
    arpDays,
    arpIsA,
  );

  // === SSR check (Rule .02(25) + .09 shaded area) ===
  // The shaded-cell test must key off the OBLIGOR's own AGI, not combined AGI:
  // a combined-AGI cell can clear the threshold while the obligor-alone lookup
  // is shaded — exactly the case the rule is meant to catch. For above-cap
  // combined cases the obligor's own income can still be on the schedule, so
  // we always perform the alt lookup whenever the obligor has positive AGI
  // within the schedule range.
  let ssrApplied = false;
  let ssrNote: string | null = null;
  let minimumOrderApplied = false;
  let presumptiveAfterSsr = presumptiveFromA;
  if (Math.abs(presumptiveFromA) > 0) {
    // Identify obligor (the parent with positive outflow).
    const obligorIsA = presumptiveFromA > 0;
    const obligorAgi = obligorIsA ? aAGI : bAGI;
    if (obligorAgi > 0 && obligorAgi <= COMBINED_AGI_CAP) {
      const altLookup = lookupBcso(obligorAgi, inputs.numChildren);
      if (altLookup.isShaded) {
        // Use lower of pro-rata BCSO or alt BCSO for the obligor.
        const proRataObligor = Math.abs(presumptiveFromA);
        const alt = altLookup.bcso;
        if (alt < proRataObligor) {
          // Make sure obligor still keeps SSR.
          const allowed = Math.max(0, obligorAgi - SSR_AMOUNT);
          const final = Math.min(alt, allowed);
          presumptiveAfterSsr = obligorIsA ? final : -final;
          ssrApplied = true;
          ssrNote = `Self-Support Reserve applied (Rule .02(25)): obligor-only BCSO ($${alt}) used in place of pro-rata BCSO so the obligor retains the $${SSR_AMOUNT}/mo reserve.`;
        }
      }
    }
  }

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
  if (inputs.includeSpecialExpenses && inputs.specialExpensesMonthly > 0) {
    if (inputs.specialExpensesWaiveThreshold) {
      specialExpensesIncludedAsDeviation = inputs.specialExpensesMonthly;
    } else if (inputs.specialExpensesMonthly > specialExpensesThresholdAmount) {
      specialExpensesIncludedAsDeviation =
        inputs.specialExpensesMonthly - specialExpensesThresholdAmount;
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


    scheduleEffectiveDate: SCHEDULE_EFFECTIVE_DATE,
    errors,
  };
}

function bandForDays(arpDays: number): "reduction" | "neutral" | "increase" {
  if (arpDays >= PARENTING_TIME.REDUCTION_THRESHOLD) return "reduction";
  if (arpDays <= PARENTING_TIME.INCREASE_THRESHOLD) return "increase";
  return "neutral";
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
    includeSpecialExpenses: false,
    specialExpensesMonthly: 0,
    specialExpensesWaiveThreshold: false,
    specialExpensesPaidBy: "split_pro_rata",
  };
}
