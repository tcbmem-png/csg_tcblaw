/** Inputs to the TN child support calculation. All dollar amounts are monthly unless suffixed Annual. */

/**
 * Income methodology captured by the optional Income Helper.
 * Stored on CalcInputs but NOT consumed by the calculation engine — only
 * surfaced on the worksheet appendix to document how the monthly gross
 * figure was derived. Phase 2: discriminated union over the six income
 * paths. `monthlyGrossResult` is the canonical "what flows into
 * parentXGrossMonthly" field for every path.
 */
export type IncomeMethodology =
  | SimpleMethodology
  | VariableMethodology
  | SelfEmployedMethodology
  | MultiSourceMethodology
  | ImputedMethodology
  | SpecialMethodology;

export interface SimpleMethodology {
  path: "simple";
  source: "w2_box5_annual" | "monthly_gross";
  w2Box5Annual?: number;
  monthlyGrossEntered?: number;
  /** Optional 401(k)/403(b) etc. monthly contributions added back to monthly_gross source. */
  voluntaryRetirementMonthly?: number;
  monthlyGrossResult: number;
}

export interface VariableYearRow {
  year: string;
  amount: number;
}
export interface VariableMethodology {
  path: "variable";
  years: VariableYearRow[];
  averagingMethod: "3yr" | "5yr" | "custom";
  rationale?: string;
  monthlyGrossResult: number;
}

export interface SelfEmployedAddBack {
  label: string;
  amount: number;
}
export interface SelfEmployedMethodology {
  path: "self_employed";
  businessType?: string;
  grossReceiptsAnnual: number;
  ordinaryExpensesAnnual: number;
  addBacks: SelfEmployedAddBack[];
  monthlyGrossResult: number;
}

export interface MultiSourceRow {
  label: string;
  annual: number;
  note?: string;
}
export interface MultiSourceMethodology {
  path: "multi_source";
  sources: MultiSourceRow[];
  monthlyGrossResult: number;
}

export type ImputationBasis =
  | "voluntary_underemployment"
  | "failure_to_produce_evidence"
  | "non_income_producing_assets";

export interface ImputedMethodology {
  path: "imputed";
  basis: ImputationBasis;
  method: "prior_earnings" | "vocational_capacity" | "asset_based";
  /** Actual real-earnings monthly figure (gross slot holds the imputed figure). */
  actualMonthlyGross: number;
  // prior_earnings sub-flow
  years?: VariableYearRow[];
  averagingMethod?: "3yr" | "5yr" | "custom";
  // vocational_capacity sub-flow
  occupation?: string;
  area?: string;
  hoursPerWeek?: number;
  // asset_based sub-flow
  assetsTotal?: number;
  rateOfReturn?: number;
  rationale?: string;
  monthlyGrossResult: number;
}

export type SpecialSituation =
  | "ssi_only"
  | "incarcerated"
  | "military"
  | "federal_benefit_to_child";

export interface SpecialMethodology {
  path: "special";
  situation: SpecialSituation;
  incarcerationReason?: "domestic_violence" | "child_abuse" | "criminal_nonpayment" | "other";
  hasMeansToPay?: boolean;
  bahMonthly?: number;
  basMonthly?: number;
  federalBenefitMonthly?: number;
  rationale?: string;
  monthlyGrossResult: number;
}

export interface CalcInputs {
  parentALabel: string;
  parentBLabel: string;

  /** Monthly gross income (per Rule .04(3) — use W-2 Box 5, not Box 1). */
  parentAGrossMonthly: number;
  parentBGrossMonthly: number;

  /** Optional methodology captured by the Income Helper (Phase 1: simple path only). */
  parentAIncomeMethodology?: IncomeMethodology;
  parentBIncomeMethodology?: IncomeMethodology;

  /** Optional imputation. When true, the gross field above is the IMPUTED figure
   *  and the *Actual* field is the parent's real income for comparison. */
  useImputationForA: boolean;
  parentAActualGrossMonthly?: number;
  useImputationForB: boolean;
  parentBActualGrossMonthly?: number;

  /** Age of the youngest child (0–17). Drives the comparison-tab horizon. */
  youngestChildAge: number;

  /** Means-tested only flag per Rule .04(3)(c)(2). */
  parentAMeansTestedOnly: boolean;
  parentBMeansTestedOnly: boolean;

  /** Monthly credits applied to gross to arrive at AGI. */
  parentASECredit: number;
  parentBSECredit: number;
  parentAPriorSupport: number;
  parentBPriorSupport: number;
  parentAInhomeCredit: number;
  parentBInhomeCredit: number;

  /** Monthly SSA/VA derivative benefit paid TO the child on this parent's disability/retirement
   *  record. Per TCA §36-5-101(a)(6) & Rule .04(10), this OFFSETS that parent's FCSO at line 16
   *  (does NOT reduce AGI). Leave 0 if none. */
  parentAFederalBenefit: number;
  parentBFederalBenefit: number;

  /** 1–5. */
  numChildren: number;

  /** Parenting situation. */
  parentingType: "standard" | "equal" | "custom";
  /** For 'standard': identifies which parent is the ARP. For 'custom': used with days. */
  arpForStandard?: "parent_a" | "parent_b";
  /** Only used for 'custom'. Total of days for both parents should equal 365. */
  parentADays?: number;
  parentBDays?: number;

  /** Add-ons (monthly, mandatory per Rule .04(8)). */
  healthPremiumMonthly: number;
  healthPaidBy: "parent_a" | "parent_b";
  uninsuredMedicalMonthly: number;
  uninsuredMedicalPaidBy: "parent_a" | "parent_b" | "split_pro_rata";
  childcareMonthly: number;
  childcarePaidBy: "parent_a" | "parent_b";
  /** Official Line 8c (payroll-deducted) vs 8d (non-payroll-deducted). Math identical;
   *  affects only which line on the AOC worksheet shows the amount. */
  childcarePayrollDeducted: boolean;

  /** Private school deviation per Rule .07(2)(d). */
  includePrivateSchool: boolean;
  privateSchoolAnnual: number;
  privateSchoolPaidBy: "parent_a" | "parent_b" | "split_pro_rata";
  /** Required when includePrivateSchool is true — drives the auto-composed
   *  Part VI narrative. Captured at the point of toggle, not in a separate
   *  filing-details form. */
  privateSchoolReason: string;

  /** Special Expenses deviation per Rule .07(2)(d) — 7% threshold rule. */
  includeSpecialExpenses: boolean;
  specialExpensesAnnual: number;
  specialExpensesWaiveThreshold: boolean;
  specialExpensesPaidBy: "parent_a" | "parent_b" | "split_pro_rata";
  /** Required when includeSpecialExpenses is true. See privateSchoolReason. */
  specialExpensesReason: string;
}

export type Direction = "parent_a_to_b" | "parent_b_to_a" | "none";

export interface CalcOutputs {
  // AGI block
  parentAAGI: number;
  parentBAGI: number;
  combinedAGI: number;
  piA: number; // 0..1
  piB: number;

  // BCSO
  bcso: number;
  bcsoSource: "schedule" | "above_cap" | "min_floor";
  scheduleAgiUsed: number | null;
  scheduleIsShaded: boolean;

  parentABcsoShare: number;
  parentBBcsoShare: number;

  // Parenting time
  arpIdentity: "parent_a" | "parent_b" | "equal";
  parentingTimeBand: "standard" | "reduction" | "neutral" | "increase" | "equal";
  variableMultiplier: number | null;

  // Net presumptive
  netPresumptiveSupport: number;
  presumptiveDirection: Direction;

  // SSR
  ssrApplied: boolean;
  ssrNote: string | null;

  // Minimum-order floor (official Line 15 Y/N).
  minimumOrderApplied: boolean;

  // Add-ons (signed from Parent A's perspective: positive => A owes more)
  addOnHealthFromA: number;
  addOnMedicalFromA: number;
  addOnChildcareFromA: number;
  addOnsTotalFromA: number;

  // Deviations
  privateSchoolMonthlyTotal: number;
  privateSchoolDeviationFromA: number;
  specialExpensesThresholdAmount: number;
  specialExpensesIncludedAsDeviation: number;
  specialExpensesDeviationFromA: number;

  // Federal benefit offset (line 16). Signed from Parent A's perspective:
  // negative => reduces A's outflow; positive => reduces B's outflow (increases A net).
  federalBenefitOffsetFromA: number;

  // Final
  /** Net monthly flow. Positive => parent A pays parent B; negative => parent B pays A. */
  allInMonthlyFromA: number;
  allInMonthly: number; // absolute value
  allInDirection: Direction;
  allInAnnual: number;

  // Flags
  warnings: string[];
  pcsoExceedsStatutoryMax: boolean;
  pcsoStatutoryMax: number;
  /** Neutral guideline note shown when PCSO is above the §36-5-101(e)(1)(B) cap. Not a warning. */
  pcsoCapNote: string | null;
  /** Dollar amount by which PCSO exceeds the statutory cap (0 if at or below). */
  pcsoExcessOverCap: number;
  /** Reassurance note shown when the PCSO is at or below the statutory cap. */
  pcsoBelowCapNote: string | null;
  /** Breakdown of the above-schedule-cap BCSO formula (Rule .09(2)(d)); null when not used. */
  bcsoAboveCapBreakdown: {
    topOfSchedule: number;
    excessAGI: number;
    rate: number;
    addition: number;
  } | null;
  /** Explainer shown when 50/50 parenting + similar incomes produce low/zero presumptive support. */
  equalParentingLowSupportNote: string | null;
  /** Explainer shown when ARP has no income — Rule .04(7)(f) permits but does not require PRP→ARP support. */
  nonEarnerArpNote: string | null;
  /** Explainer shown when the presumptive obligation is $0 and the $100 floor therefore does not apply. */
  zeroPresumptiveNote: string | null;

  // Metadata
  scheduleEffectiveDate: string;
  errors: string[];
}
