/**
 * Mississippi child support inputs and outputs.
 * Authority: Miss. Code Ann. § 43-19-101 (presumptive guideline) and
 * § 43-19-103 (criteria for overcoming the presumption).
 *
 * Mississippi uses a single-obligor flat-percentage model. Only the
 * non-custodial (obligor) parent's adjusted gross income is computed;
 * the percentage applied depends on the number of children supported.
 *
 * All dollar amounts are annual unless suffixed `Monthly`.
 */

export type MSHealthProvider = "obligor" | "obligee" | "neither";

/** The ten statutory deviation factor letters per Miss. Code Ann. § 43-19-103. */
export type MSFactorLetter =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j";

export interface MSDeviation {
  letter: MSFactorLetter;
  applicable: boolean;
  description: string;
  /** Signed monthly amount. Positive = increases support; negative = decreases. */
  proposedMonthly: number;
}

export interface MSInputs {
  /** Display labels (not legally significant). */
  obligorLabel: string;
  obligeeLabel: string;

  /** Number of children supported in this case. Statute caps the rate at 5; 6+ uses the same 26%. */
  numChildren: number;

  // --- AGI computation (all annual) ---
  /** Obligor's annual gross income from all sources (§ 43-19-101(3)(a)). */
  obligorAnnualGross: number;
  /** Obligor's actual annual tax liability (federal + state + local). NOT over-withholding. */
  obligorAnnualTaxes: number;
  /** Obligor's annual Social Security & Medicare contributions (W-2 Box 4 + Box 6). */
  obligorAnnualSocialSecurity: number;
  /**
   * Obligor's annual MANDATORY retirement / disability contributions.
   * Government pension contributions only — 401(k) and other voluntary
   * contributions are NOT deductible. § 43-19-101(3)(b)(iii).
   */
  obligorAnnualMandatoryRetirement: number;
  /** Pre-existing court-ordered support for OTHER children, other cases. Annual. */
  preexistingSupportAnnual: number;
  /**
   * Discretionary deduction for obligor's other in-home children (monthly).
   * No statutory formula — purely a chancellor's discretion adjustment.
   */
  inHomeChildrenDeductionMonthly: number;

  // --- Health insurance per § 43-19-101(6) ---
  /** Children's share of the monthly health insurance premium. */
  healthInsuranceMonthly: number;
  healthInsuranceProvidedBy: MSHealthProvider;

  /**
   * Triggers the Factor (g) callout in the UI ("particular shared parental arrangement").
   * MS has NO statutory 50/50 formula; this flag only surfaces the deviation factor.
   */
  sharedCustodyFlag: boolean;

  /** Optional § 43-19-103 deviation factors. */
  deviations: MSDeviation[];
}

export interface MSOutputs {
  /** Annual AGI after statutory deductions and pre-existing support (before monthly in-home deduction). */
  annualAGI: number;
  /** Monthly AGI = annualAGI / 12 - inHomeChildrenDeductionMonthly. */
  monthlyAGI: number;

  /** Statutory percentage applied (0..1). */
  statutoryPercentage: number;
  /** Monthly AGI × statutory percentage. */
  presumptiveMonthly: number;

  /** Health insurance add-on actually added to the presumptive amount (0 if obligor provides). */
  healthInsuranceAddOnMonthly: number;

  /** Sum of applicable signed deviations (positive = increases support). */
  totalDeviationsMonthly: number;

  /**
   * Proposed final monthly award:
   *   presumptiveMonthly + healthInsuranceAddOnMonthly + totalDeviationsMonthly
   * Floored at zero — the obligor cannot owe a negative amount.
   */
  proposedFinalMonthly: number;

  /** § 43-19-101(4) threshold flags — written findings required. */
  requiresFindingHighIncome: boolean; // annual AGI > $100,000
  requiresFindingLowIncome: boolean; // annual AGI < $10,000

  /** Informational warnings / notes for the UI and PDF. */
  warnings: string[];

  /** Statutory effective date stamped on the worksheet. */
  guidelinesEffectiveDate: string;
}
