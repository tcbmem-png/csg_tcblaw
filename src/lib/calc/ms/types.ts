/**
 * Mississippi child support inputs and outputs.
 * Authority: Miss. Code Ann. § 43-19-101 (presumptive guideline),
 * § 43-19-103 (criteria for overcoming the presumption), and
 * § 43-19-36 (administrative suspension during incarceration > 180 days).
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

// =================================================================
// Structured per-factor sub-forms (MS_Deviation_Worksheet_v2 §3)
// Each variant captures the kinds of evidence a chancellor weighs
// when applying that specific factor. All fields optional — the
// free-text `description` and `proposedMonthly` on MSDeviation are
// always the source of truth for the worksheet total.
// =================================================================

export type MSExpenseDuration =
  | "3-6 months"
  | "6-12 months"
  | "1-2 years"
  | "through age 21"
  | "other";

export interface MSStructuredA {
  letter: "a";
  types: { medical: boolean; psychological: boolean; educational: boolean; dental: boolean };
  description: string;
  currentMonthlyCost: number;
  anticipatedDuration: MSExpenseDuration | "";
  documentation: { bills: boolean; eobs: boolean; treatmentPlan: boolean; other: boolean; otherNote: string };
  insuranceCovered: number;
  outOfPocket: number;
  currentlyPaidBy: "obligor" | "obligee" | "both" | "";
  allocationObligorPct: number; // 0..100
}

export interface MSStructuredB {
  letter: "b";
  earnedMonthly: number;
  ssBenefitsMonthly: number;
  trustMonthly: number;
  investmentMonthly: number;
  otherMonthly: number;
  otherNote: string;
  reliableRecurring: "yes" | "no" | "";
  description: string;
}

export interface MSStructuredC {
  letter: "c";
  status: "paying" | "pending" | "no" | "";
  currentMonthly: number;
  basis: { courtOrder: boolean; propertySettlement: boolean; pendingDissolution: boolean; caseNumber: string };
  description: string;
}

export interface MSStructuredD {
  letter: "d";
  incomeVaries: boolean;
  expensesVary: boolean;
  whichParent: "obligor" | "obligee" | "both" | "";
  peakMonths: string; // free-text list (Jan, Feb, …)
  lowMonths: string;
  highMonthGross: number;
  lowMonthGross: number;
  source: string;
  approach: "annualized" | "adjusted_monthly" | "build_in" | "";
  adjustedMonthlyAmount: number;
  buildInNote: string;
}

export interface MSStructuredE {
  letter: "e";
  ages: string; // comma-separated child ages
  greaterPerChildCosts: boolean;
  greaterEducational: boolean;
  needsJustifyUpward: boolean;
  itemsNotCovered: string;
}

export interface MSStructuredF {
  letter: "f";
  categories: { activities: boolean; religious: boolean; educationalEnrichment: boolean; travel: boolean; other: boolean };
  description: string;
  establishedPattern: string;
  monthlyCost: number;
  evidence: { receipts: boolean; photos: boolean; testimony: boolean; other: boolean; otherNote: string };
}

// Factor (g) per statute: Total available assets of obligee, obligor, and child.
export interface MSStructuredAssets {
  letter: "g";
  obligor: { realEstate: number; equity: number; investments: number; retirement: number; business: number; other: number; otherNote: string };
  obligee: { realEstate: number; equity: number; investments: number; retirement: number; business: number; other: number; otherNote: string };
  child: { value: number; note: string };
  incomeFromAssets: "yes_in_agi" | "no_additional" | "partial" | "";
  partialNote: string;
  description: string;
}

// Factor (h) per statute: Payment by obligee of child care expenses
// (employment or disability).
export interface MSStructuredChildcare {
  letter: "h";
  reason: "employment" | "disability" | "no" | "";
  provider: string;
  monthlyCost: number;
  hoursPerWeek: number;
  childrenCoveredNote: string;
  taxCredit: "yes" | "no" | "partial" | "";
  netOutOfPocket: number;
  allocation: "full" | "pro_rata" | "other" | "";
  allocationOther: string;
}

// Factor (i) per statute: The particular shared parental arrangement.
export interface MSStructuredParental {
  letter: "i";
  arrangement: "standard" | "substantially_shared" | "equal" | "other" | "";
  arrangementOther: string;
  obligorOvernights: number;
  obligeeOvernights: number;
  directExpenses: {
    foodMonthly: number;
    activitiesMonthly: number;
    clothingMonthly: number;
    transportationMonthly: number;
    otherMonthly: number;
    otherNote: string;
  };
  duplicatedExpenses: "yes" | "no" | "";
  duplicatedExpensesNote: string;
  approach: "none" | "downward_direct" | "other" | "";
  downwardAmount: number;
  approachOther: string;
}

// Back-compat aliases (kept so existing imports don't break, but the
// interface NAMES above describe the actual statutory content).
export type MSStructuredG = MSStructuredAssets;
export type MSStructuredH = MSStructuredChildcare;
export type MSStructuredI = MSStructuredParental;

export interface MSStructuredJ {
  letter: "j";
  basisIsExistingDebt: boolean;
  basisIsOtherEquity: boolean;
  otherEquityNote: string;
  debtType: { obligorMarital: boolean; obligeeMarital: boolean; childRelated: boolean; other: boolean; otherNote: string };
  currentMonthlyPayment: number;
  remainingMonths: number;
  originalPayee: string;
  whyDeviationWorthy: string;
}

export type MSDeviationStructured =
  | MSStructuredA
  | MSStructuredB
  | MSStructuredC
  | MSStructuredD
  | MSStructuredE
  | MSStructuredF
  | MSStructuredAssets
  | MSStructuredChildcare
  | MSStructuredParental
  | MSStructuredJ;

/**
 * Per-party position on a single § 43-19-103 factor. This is the brief's
 * factor-agnostic "two-party frame" — one entry exists per side (obligor /
 * obligee) and drives the per-factor side-by-side display and the
 * reconciliation totals.
 */
export type MSPartyPosition =
  | ""
  | "downward"
  | "upward"
  | "apply_no_amount"
  | "oppose";

export interface MSPartyEntry {
  position: MSPartyPosition;
  factsAsserted: string;
  documentationReferenced: string;
  /** Signed monthly amount. Same sign convention as MSDeviation.proposedMonthly. */
  proposedMonthly: number;
  legalAuthority: string;
}

export interface MSDeviation {
  letter: MSFactorLetter;
  applicable: boolean;
  /** Free-text "additional context" — preserved on every factor. */
  description: string;
  /** Signed monthly amount. Positive = increases support; negative = decreases. */
  proposedMonthly: number;
  /** Structured sub-form fields for this factor (optional, Position A only). */
  structured?: MSDeviationStructured;
  /** Brief's per-party block. Mirrors proposedMonthly above for this side. */
  party?: MSPartyEntry;
}

// =================================================================
// Imputation basis per § 43-19-101(5) (HB 1067, effective 2022-07-01)
// =================================================================

export type MSAgiBasis = "actual" | "imputed";

export interface MSImputationBasis {
  pastEarnings: boolean;
  jobSkills: boolean;
  localMarket: boolean;
  availableEmployers: boolean;
  other: boolean;
  note: string;
}

// =================================================================
// Incarceration suspension per § 43-19-36 (SB 2082, effective 2023-07-01)
// =================================================================

export type MSIncarcerationStatus = "none" | "under_180" | "over_180";

export interface MSIncarceration {
  status: MSIncarcerationStatus;
  reasons: {
    domesticViolence: boolean;
    childAbuse: boolean;
    criminalNonpayment: boolean;
  };
  hasMeansToPay: boolean;
}

// =================================================================
// Comparison mode
// =================================================================

export type MSComparisonMode = "single" | "side_by_side";
export type MSDeviationEntryMode = "walkthrough" | "pick";

export interface MSInputs {
  /** Display labels (not legally significant). */
  obligorLabel: string;
  obligeeLabel: string;

  /** Number of children supported in this case. Statute caps the rate at 5; 6+ uses the same 26%. */
  numChildren: number;

  // --- Incarceration gate (checked FIRST, may short-circuit) ---
  incarceration: MSIncarceration;

  // --- AGI computation (all annual) ---
  obligorAnnualGross: number;
  obligorAnnualTaxes: number;
  obligorAnnualSocialSecurity: number;
  obligorAnnualMandatoryRetirement: number;
  preexistingSupportAnnual: number;
  inHomeChildrenDeductionMonthly: number;

  /** Is the gross figure actual earnings or imputed earning capacity? */
  agiBasis: MSAgiBasis;
  imputationBasis: MSImputationBasis;

  // --- Health insurance per § 43-19-101(6) ---
  healthInsuranceMonthly: number;
  healthInsuranceProvidedBy: MSHealthProvider;

  /** Triggers Factor (g) callout — informational only. */
  sharedCustodyFlag: boolean;

  // --- Deviations ---
  comparisonMode: MSComparisonMode;
  deviationEntryMode: MSDeviationEntryMode;
  /** Position A's § 43-19-103 deviation slate (10 items, a–j). */
  deviationsA: MSDeviation[];
  /** Position B's slate — only populated when comparisonMode === 'side_by_side'. */
  deviationsB?: MSDeviation[];

  /**
   * Ages (in years) of the children before the court. Optional; powers the
   * reconciliation view's cumulative-impact estimate using
   *   avgMonthsRemaining = mean(max(0, 21 − age)) × 12  (capped at 21 yrs).
   * Empty array → cumulative display is suppressed.
   */
  childAges: number[];
}

export interface MSDeviationComputation {
  totalMonthly: number;
  proposedFinalMonthly: number;
}

export interface MSOutputs {
  // Suspension short-circuit (§ 43-19-36). When true, the worksheet
  // renders a suspension finding instead of a monthly amount.
  suspensionApplies: boolean;
  suspensionReason: string | null;

  annualAGI: number;
  monthlyAGI: number;
  statutoryPercentage: number;
  presumptiveMonthly: number;
  healthInsuranceAddOnMonthly: number;

  /** Position A: applicable deviation total + final monthly. */
  totalDeviationsMonthly: number;
  proposedFinalMonthly: number;

  /** Position B mirror — only present when comparisonMode === 'side_by_side'. */
  positionB?: MSDeviationComputation;

  requiresFindingHighIncome: boolean;
  requiresFindingLowIncome: boolean;
  warnings: string[];
  guidelinesEffectiveDate: string;
}
