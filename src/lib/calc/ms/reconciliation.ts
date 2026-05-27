/**
 * Pure aggregator for the § 43-19-103 reconciliation view + PDF.
 *
 * Given an MSInputs (with optional Position B slate) and the case's child
 * ages, produces a per-factor table plus monthly + cumulative totals.
 *
 * The math here is display-only: it does NOT influence calculateMS or any
 * worksheet result. The chancellor weighs the evidence; we only show gaps.
 */
import type { MSChild, MSDeviation, MSFactorLetter, MSInputs } from "./types";

// Letters match Miss. Code Ann. § 43-19-103 verbatim (2024 codification).
// Verified against MDHS-published statute, Justia 2024, FindLaw, and the
// legislature's bill history: (g) parental arrangement, (h) assets,
// (i) obligee's child-care expenses. Do not reorder without re-verifying
// against the statute itself — letter-mapping.test.ts enforces this.
export const FACTOR_TITLES: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of the obligee, obligor, and the child",
  i: "Payment by the obligee of child care expenses (employment or disability)",
  j: "Any other adjustment needed to achieve an equitable result",
};

export const FACTOR_STATUTORY_TEXT: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational or dental expenses.",
  b: "Independent income of the child.",
  c: "The payment of both child support and spousal support to the obligee.",
  d: "Seasonal variations in one or both parents' incomes or expenses.",
  e: "The age of the child, taking into account the greater needs of older children.",
  f: "Special needs that have traditionally been met within the family budget even though the fulfilling of those needs will cause a deviation from the guidelines.",
  g: "The particular shared parental arrangement, such as where the noncustodial parent has physical access to the child for substantial portions of time as a result of joint custody or visitation rights, or the refusal of the noncustodial parent to become involved in the activities of the child.",
  h: "Total available assets of the obligee, obligor and the child.",
  i: "Payment by the obligee of child care expenses in order that the obligee may seek or retain employment, or because of the disability of the obligee.",
  j: "Any other adjustment which is needed to achieve an equitable result which may include, but not be limited to, a reasonable and necessary existing expense or debt.",
};

export type FactorInPlay =
  | "neither"
  | "obligor_only"
  | "obligee_only"
  | "both"
  | "agree";

export interface ReconciliationRow {
  letter: MSFactorLetter;
  title: string;
  inPlay: FactorInPlay;
  obligor: { applicable: boolean; amount: number; entry?: MSDeviation };
  obligee: { applicable: boolean; amount: number; entry?: MSDeviation };
  /** obligor amount − obligee amount (only meaningful when at least one is applicable). */
  gapMonthly: number;
}

export interface ReconciliationTotals {
  obligorMonthly: number;
  obligeeMonthly: number;
  netDifferenceMonthly: number;
  /**
   * Average months of remaining child support across the listed children,
   * computed as mean(max(0, 21 − age_i)) × 12. Null when childAges is empty.
   */
  avgMonthsRemaining: number | null;
  /** netDifferenceMonthly × avgMonthsRemaining, or null when ages missing. */
  cumulativeNetDifference: number | null;
}

export interface ReconciliationReport {
  rows: ReconciliationRow[];
  /** Only the rows where at least one side asserts the factor. */
  activeRows: ReconciliationRow[];
  totals: ReconciliationTotals;
}

function rowInPlay(
  obligorApplicable: boolean,
  obligeeApplicable: boolean,
  obligorAmt: number,
  obligeeAmt: number,
): FactorInPlay {
  if (!obligorApplicable && !obligeeApplicable) return "neither";
  if (obligorApplicable && obligeeApplicable) {
    if (obligorAmt === obligeeAmt) return "agree";
    return "both";
  }
  return obligorApplicable ? "obligor_only" : "obligee_only";
}

export function buildReconciliation(inputs: MSInputs): ReconciliationReport {
  const slateA = inputs.deviationsA;
  const slateB = inputs.deviationsB;

  const rows: ReconciliationRow[] = slateA.map((dA, i) => {
    const dB = slateB ? slateB[i] : undefined;
    const aAmt = dA.applicable ? Number(dA.proposedMonthly) || 0 : 0;
    const bAmt = dB && dB.applicable ? Number(dB.proposedMonthly) || 0 : 0;
    return {
      letter: dA.letter,
      title: FACTOR_TITLES[dA.letter],
      inPlay: rowInPlay(dA.applicable, !!(dB && dB.applicable), aAmt, bAmt),
      obligor: { applicable: dA.applicable, amount: aAmt, entry: dA },
      obligee: {
        applicable: !!(dB && dB.applicable),
        amount: bAmt,
        entry: dB,
      },
      gapMonthly: aAmt - bAmt,
    };
  });

  const obligorMonthly = rows.reduce((s, r) => s + r.obligor.amount, 0);
  const obligeeMonthly = rows.reduce((s, r) => s + r.obligee.amount, 0);

  const avgMonthsRemaining = computeAvgMonthsRemainingFromInputs(inputs);
  const netDifferenceMonthly = obligorMonthly - obligeeMonthly;

  return {
    rows,
    activeRows: rows.filter((r) => r.inPlay !== "neither"),
    totals: {
      obligorMonthly,
      obligeeMonthly,
      netDifferenceMonthly,
      avgMonthsRemaining,
      cumulativeNetDifference:
        avgMonthsRemaining === null
          ? null
          : netDifferenceMonthly * avgMonthsRemaining,
    },
  };
}

/**
 * Prefers `inputs.children` (carve-out aware) when present and non-empty;
 * otherwise falls back to the flat `inputs.childAges` list.
 */
export function computeAvgMonthsRemainingFromInputs(
  inputs: Pick<MSInputs, "children" | "childAges">,
  now: Date = new Date(),
): number | null {
  if (inputs.children && inputs.children.length > 0) {
    return computeAvgMonthsRemainingForChildren(inputs.children, now);
  }
  return computeAvgMonthsRemaining(inputs.childAges ?? []);
}

/**
 * Per-child months-remaining honoring § 93-11-65(8) early-emancipation
 * carve-outs (marriage, military service, qualifying felony 2y+, full-time
 * school discontinuance):
 *
 *  - status === "none"                          → max(0, 21 − age) × 12
 *  - status !== "none", no projected date       → already emancipated, 0
 *  - status !== "none", projected date in past  → already emancipated, 0
 *  - status !== "none", projected date future   → monthsBetween(now, date),
 *    capped by the age-21 default for that child (never EXCEEDS age-21).
 */
export function computeAvgMonthsRemainingForChildren(
  children: MSChild[],
  now: Date = new Date(),
): number | null {
  if (children.length === 0) return null;
  const perChild = children.map((c) => monthsRemainingForChild(c, now));
  const mean = perChild.reduce((s, m) => s + m, 0) / perChild.length;
  return Math.min(21 * 12, Math.max(0, Math.round(mean)));
}

export function monthsRemainingForChild(child: MSChild, now: Date = new Date()): number {
  const ageMonths = Math.max(0, Math.round((21 - Number(child.age || 0)) * 12));
  if (child.emancipationStatus === "none") return ageMonths;
  // Carve-out asserted.
  if (!child.projectedEmancipationDate) return 0; // already occurred
  const target = new Date(child.projectedEmancipationDate);
  if (Number.isNaN(target.getTime())) return ageMonths; // unparseable → ignore carve-out
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  const months = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
  return Math.min(ageMonths, Math.max(0, months));
}

/**
 * Legacy flat-list helper. Retained for backward-compatible call sites
 * (older URLs and tests). Prefer `computeAvgMonthsRemainingFromInputs`.
 *
 * mean(max(0, 21 − age_i)) × 12, capped at 21 years (252 months).
 * Returns null when there are no ages to average.
 */
export function computeAvgMonthsRemaining(ages: number[]): number | null {
  const cleaned = ages
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (cleaned.length === 0) return null;
  const years =
    cleaned.reduce((s, age) => s + Math.max(0, 21 - age), 0) / cleaned.length;
  const months = Math.round(years * 12);
  return Math.min(21 * 12, Math.max(0, months));
}

/** Human-readable summary line for the real-time per-factor comparison row. */
export function summarizeRow(
  row: ReconciliationRow,
  obligorLabel: string,
  obligeeLabel: string,
): string {
  const fmt = (n: number) => {
    const a = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
    return n < 0 ? `($${a})` : `$${a}`;
  };
  switch (row.inPlay) {
    case "neither":
      return "Neither party asserts this factor.";
    case "agree": {
      const dir =
        row.obligor.amount > 0
          ? "upward"
          : row.obligor.amount < 0
            ? "downward"
            : "no monetary effect";
      return `Parties agree: factor applies, adjustment of ${fmt(row.obligor.amount)}/mo. Net effect: ${dir}.`;
    }
    case "both":
      return `Parties agree this factor applies but differ on the amount. ${obligorLabel} proposes ${fmt(row.obligor.amount)}; ${obligeeLabel} proposes ${fmt(row.obligee.amount)}. Magnitude of disagreement: ${fmt(Math.abs(row.gapMonthly))}/mo.`;
    case "obligor_only":
      return `Asserted by ${obligorLabel}; opposed by ${obligeeLabel}. Magnitude if granted: ${fmt(row.obligor.amount)}/mo.`;
    case "obligee_only":
      return `Asserted by ${obligeeLabel}; opposed by ${obligorLabel}. Magnitude if granted: ${fmt(row.obligee.amount)}/mo.`;
  }
}
