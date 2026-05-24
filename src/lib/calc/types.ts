/** Inputs to the TN child support calculation. All dollar amounts are monthly unless suffixed Annual. */
export interface CalcInputs {
  parentALabel: string;
  parentBLabel: string;

  /** Monthly gross income (per Rule .04(3) — use W-2 Box 5, not Box 1). */
  parentAGrossMonthly: number;
  parentBGrossMonthly: number;

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
  childcareMonthly: number;
  childcarePaidBy: "parent_a" | "parent_b";

  /** Private school deviation per Rule .07(2)(d). */
  includePrivateSchool: boolean;
  privateSchoolAnnual: number;
  privateSchoolPaidBy: "parent_a" | "parent_b" | "split_pro_rata";

  /** Special Expenses deviation per Rule .07(2)(d) — 7% threshold rule. */
  includeSpecialExpenses: boolean;
  specialExpensesMonthly: number;
  specialExpensesWaiveThreshold: boolean;
  specialExpensesPaidBy: "parent_a" | "parent_b" | "split_pro_rata";
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

  // Metadata
  scheduleEffectiveDate: string;
  errors: string[];
}
