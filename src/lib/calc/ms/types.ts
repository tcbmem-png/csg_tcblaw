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

// Factor (g) per statute: The particular shared parental arrangement.
export interface MSStructuredParental {
  letter: "g";
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

// Factor (h) per statute: Total available assets of obligee, obligor, and child.
export interface MSStructuredAssets {
  letter: "h";
  obligor: { realEstate: number; equity: number; investments: number; retirement: number; business: number; other: number; otherNote: string };
  obligee: { realEstate: number; equity: number; investments: number; retirement: number; business: number; other: number; otherNote: string };
  child: { value: number; note: string };
  incomeFromAssets: "yes_in_agi" | "no_additional" | "partial" | "";
  partialNote: string;
  description: string;
}

// Factor (i) per statute: Payment by obligee of child care expenses
// (employment or disability).
export interface MSStructuredChildcare {
  letter: "i";
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

// Back-compat aliases (kept so existing imports don't break, but the
// interface NAMES above describe the actual statutory content).
export type MSStructuredG = MSStructuredParental;
export type MSStructuredH = MSStructuredAssets;
export type MSStructuredI = MSStructuredChildcare;

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
  // ---------------- §1.5 attribution (audit trail) ----------------
  /** Handoff round in which this entry was last materially edited.
   *  1 = originator's initial send; 2 = receiver's first amendments;
   *  3+ = subsequent re-sends. Null on legacy URLs predating attribution. */
  handoffRound?: number | null;
  /** ISO timestamp of the last material edit. */
  authoredAt?: string | null;
  /** Display name of the attorney who authored the last material edit. */
  authoredByName?: string | null;
  /** Firm of the attorney who authored the last material edit (optional). */
  authoredByFirm?: string | null;
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
//
// The 2022 amendment prohibits "imputation of income . . . based upon a
// standard amount in lieu of fact-gathering" and enumerates twelve specific
// factors that must support any imputed amount. The party asserting
// imputation documents the position factor-by-factor in their own words.
// The calculator does NOT produce a default imputed amount; it captures
// the figure the asserting party proposes and blends it with the actual
// figure via a 0–100% application slider for scenario modeling.
// =================================================================

export type MSAgiBasis = "actual" | "imputed";

export type MSImputationAsserter = "" | "obligor" | "obligee";

export interface MSImputationFactors {
  /** Obligated parent's assets. */
  assets: string;
  /** Obligated parent's residence. */
  residence: string;
  /** Obligated parent's job skills. */
  jobSkills: string;
  /** Obligated parent's educational attainment. */
  educational: string;
  /** Obligated parent's literacy. */
  literacy: string;
  /** Obligated parent's age. */
  age: string;
  /** Obligated parent's health. */
  health: string;
  /** Obligated parent's criminal record and other employment barriers. */
  criminalBarriers: string;
  /** Obligated parent's record of seeking work. */
  workSeeking: string;
  /** The local job market. */
  localJobMarket: string;
  /** The availability of employers willing to hire the obligated parent. */
  employersWilling: string;
  /** Prevailing earnings level in the local community. */
  prevailingLocal: string;
}

export interface MSImputationBasis {
  /** Twelve enumerated factors per § 43-19-101(5). Free-text per factor. */
  factors: MSImputationFactors;
  /** Free-text catch-all note for context that doesn't fit the twelve. */
  note: string;
  /** Party-asserter — drives the audit-trail label and worksheet attribution. */
  assertedBy: MSImputationAsserter;
  /**
   * Asserting party's proposed imputed annual gross income. Used in the
   * blended-AGI computation only when agiBasis === "imputed".
   */
  imputedAnnualGross: number;
  /**
   * Scenario slider 0..100. 0 = actual gross only; 100 = imputed gross only;
   * intermediate values blend linearly. Chancellors rarely impute the full
   * proposed figure; the slider quantifies the partial-imputation range
   * for negotiation and scenario modeling.
   */
  applicationPct: number;
}

export function defaultMSImputationFactors(): MSImputationFactors {
  return {
    assets: "",
    residence: "",
    jobSkills: "",
    educational: "",
    literacy: "",
    age: "",
    health: "",
    criminalBarriers: "",
    workSeeking: "",
    localJobMarket: "",
    employersWilling: "",
    prevailingLocal: "",
  };
}

export function defaultMSImputationBasis(): MSImputationBasis {
  return {
    factors: defaultMSImputationFactors(),
    note: "",
    assertedBy: "",
    imputedAnnualGross: 0,
    applicationPct: 100,
  };
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

  /**
   * Optional per-child carve-out roster per Miss. Code Ann. § 93-11-65(8).
   * When present, supersedes `childAges` for reconciliation projections.
   * `childAges` is kept in sync for backward-compatible decode/encode.
   */
  children?: MSChild[];

  /**
   * §1.9 chancellor decision surface. Per-factor decision record keyed by
   * letter; persists across re-renders and into the URL share payload so
   * the chancellor's most recent ruling is the current case state. The
   * audit-trail captures the decision (and timestamp), not just the
   * derived contribution — see chancellor-decisions.ts for the contract.
   * Optional on legacy URLs; default-initialized to all "none".
   */
  chancellorDecisions?: Record<MSFactorLetter, import("./chancellor-decisions").MSChancellorDecision>;
}

// =================================================================
// § 93-11-65(8) early-emancipation carve-outs
// =================================================================

export type MSEmancipationStatus =
  | "none"
  | "marriage"
  | "military_service"
  | "qualifying_felony" // sentence of 2+ years
  | "school_discontinuance"; // full-time enrollment ended (absent disability)

export interface MSChild {
  /** Optional display label ("Child 1", "A.B.", etc.). */
  label?: string;
  /** Current age in years. */
  age: number;
  /** Asserted early-emancipation status; "none" = age-21 default applies. */
  emancipationStatus: MSEmancipationStatus;
  /**
   * ISO date (YYYY-MM-DD). Required only when emancipation has not yet
   * occurred but is asserted on the horizon. Empty when the event has
   * already occurred (treat as already-emancipated, 0 months remaining).
   */
  projectedEmancipationDate?: string;
  /** Free-text supporting note (e.g. enlistment unit, school name). */
  note?: string;
}

export function defaultMSChild(age = 0): MSChild {
  return { age, emancipationStatus: "none" };
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

  // ----- § 43-19-101(5) imputation scenario surface -----
  /** True when AGI basis is "imputed" AND a positive imputed gross is set. */
  imputationActive: boolean;
  /** Slider 0..100 actually applied to the blend (clamped). */
  imputationApplicationPct: number;
  /** Imputed annual gross used in the blend (0 when inactive). */
  imputedAnnualGross: number;
  /** The actual gross figure, surfaced for side-by-side display. */
  actualAnnualGross: number;
  /** actualGross × (1 − pct/100) + imputed × (pct/100). Equals actualGross when inactive. */
  blendedAnnualGross: number;
}

// =================================================================
// Two-attorney handoff (frontend + URL only — no auth, no server
// storage). Lives on the share payload, not on MSInputs, so calc /
// reconciliation stay untouched. Slate A/B carry NO obligor/obligee
// semantics: caption.obligorLabel/obligeeLabel plus
// HandoffState.originatingSide drive every label and PDF attribution.
// =================================================================

export type HandoffStatus = "none" | "originated" | "in_progress" | "completed";
export type HandoffSide = "A" | "B";

export interface HandoffAttorney {
  name: string;
  firm: string;
}

export interface HandoffState {
  status: HandoffStatus;
  /** Which slate (A or B) the originating attorney filled in. */
  originatingSide: HandoffSide;
  originatingAttorney: HandoffAttorney | null;
  receivingAttorney: HandoffAttorney | null;
  /** ISO timestamp set when the originator generates the handoff URL. */
  createdAt: string | null;
  /** ISO timestamp bumped on each receiving-side edit. */
  lastReceivingEditAt: string | null;
  /** ISO timestamp set when status flips to completed (incl. PDF auto-flip). */
  completedAt: string | null;
  /**
   * Stable case identity for round-trip origin detection. 16-byte / 128-bit
   * hex token generated once at first Send and preserved verbatim on every
   * subsequent re-generate. Null on legacy URLs predating this field; in
   * that case origin detection falls back to fingerprint(inputs+caption).
   */
  caseId: string | null;
  /**
   * §1.5 audit-trail counter. Round 1 = originator's initial send;
   * round 2 = receiver's first amendments; round 3+ = subsequent re-sends.
   * Bumped via `bumpHandoffRound` at URL generation / receiver edit time.
   * Default 0 on a brand-new state (no handoff initiated yet).
   */
  handoffRound: number;
}

export function defaultHandoffState(): HandoffState {
  return {
    status: "none",
    originatingSide: "A",
    originatingAttorney: null,
    receivingAttorney: null,
    createdAt: null,
    lastReceivingEditAt: null,
    completedAt: null,
    caseId: null,
    handoffRound: 0,
  };
}
