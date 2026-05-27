/**
 * §1.9 — Chancellor Decision Surface (pure logic).
 *
 * Per canonical §1.9, each § 43-19-103 factor row carries a chancellor
 * decision recorded as { factorLetter, decision, customAmount, decidedAt }.
 * The audit trail captures the *decision*, not just the resulting
 * contribution; the contribution is derivable from the decision plus the
 * underlying obligor / obligee positions on that factor.
 *
 * Scope per build spec: this module is the decision-contribution function
 * and the running-total aggregator. It does NOT touch calculateMS, the
 * worksheet PDF, or any persistence beyond the in-state record. The
 * chancellor's "current ruling" is simply the most recent decision map.
 *
 * Decision enum:
 *   - "none"           — no chancellor decision yet (pending)
 *   - "adopt_obligor"  — adopt obligor's proposed amount on this factor
 *   - "adopt_obligee"  — adopt obligee's proposed amount on this factor
 *   - "split"          — average of the two applicable positions
 *   - "custom"         — chancellor-set amount (uses customAmount)
 *   - "decline"        — no deviation on this factor (ruled out)
 *   - "accept_agreed"  — accept the stipulated amount on an `agree` row
 *
 * The `accept_agreed` decision exists so the `both_agreed` reconciliation
 * case collapses the row to two buttons (Accept Agreed + Decline) instead
 * of rendering five degenerate options.
 */
import type { MSFactorLetter } from "./types";
import type { FactorInPlay, ReconciliationRow } from "./reconciliation";

export type MSChancellorDecisionKind =
  | "none"
  | "adopt_obligor"
  | "adopt_obligee"
  | "split"
  | "custom"
  | "decline"
  | "accept_agreed";

export interface MSChancellorDecision {
  /** Factor letter for round-trip / audit-trail clarity. */
  factorLetter: MSFactorLetter;
  decision: MSChancellorDecisionKind;
  /** Signed monthly. Only meaningful when decision === "custom". */
  customAmount: number;
  /** ISO timestamp of the most recent change. Null when still "none". */
  decidedAt: string | null;
}

/** Hard bounds for custom amount input — catches obvious typos. */
export const CUSTOM_AMOUNT_MIN = -50_000;
export const CUSTOM_AMOUNT_MAX = 50_000;

export function defaultChancellorDecision(
  letter: MSFactorLetter,
): MSChancellorDecision {
  return { factorLetter: letter, decision: "none", customAmount: 0, decidedAt: null };
}

/**
 * Build the default decision map for a fresh case. All ten factors start
 * as "none". The map is keyed by factor letter for O(1) lookup from the
 * reconciliation row and is stable across re-renders.
 */
export function defaultChancellorDecisions(): Record<
  MSFactorLetter,
  MSChancellorDecision
> {
  return {
    a: defaultChancellorDecision("a"),
    b: defaultChancellorDecision("b"),
    c: defaultChancellorDecision("c"),
    d: defaultChancellorDecision("d"),
    e: defaultChancellorDecision("e"),
    f: defaultChancellorDecision("f"),
    g: defaultChancellorDecision("g"),
    h: defaultChancellorDecision("h"),
    i: defaultChancellorDecision("i"),
    j: defaultChancellorDecision("j"),
  };
}

/**
 * Pure projection: given a reconciliation row + chancellor decision,
 * return the signed monthly contribution the chancellor's ruling adds to
 * the order. Returns 0 when the decision is pending or declined.
 */
export function decisionContribution(
  row: ReconciliationRow,
  decision: MSChancellorDecision,
): number {
  switch (decision.decision) {
    case "none":
    case "decline":
      return 0;
    case "accept_agreed":
      // Only valid on `agree` rows; defensively fall back to obligor amount
      // (== obligee amount on agree rows). On non-agree rows this returns
      // whatever obligor has, but the UI never offers this option there.
      return row.obligor.applicable ? row.obligor.amount : row.obligee.amount;
    case "adopt_obligor":
      return row.obligor.applicable ? row.obligor.amount : 0;
    case "adopt_obligee":
      return row.obligee.applicable ? row.obligee.amount : 0;
    case "split": {
      const a = row.obligor.applicable ? row.obligor.amount : null;
      const b = row.obligee.applicable ? row.obligee.amount : null;
      if (a !== null && b !== null) return (a + b) / 2;
      if (a !== null) return a / 2;
      if (b !== null) return b / 2;
      return 0;
    }
    case "custom":
      return clampCustomAmount(decision.customAmount);
  }
}

export function clampCustomAmount(n: number): number {
  const x = Number(n) || 0;
  return Math.min(CUSTOM_AMOUNT_MAX, Math.max(CUSTOM_AMOUNT_MIN, x));
}

/**
 * Which decision options are offered for a given row's in-play state.
 *
 *   agree         → [accept_agreed, decline]            (collapsed)
 *   both          → [adopt_obligor, adopt_obligee, split, custom, decline]
 *   obligor_only  → [adopt_obligor, custom, decline]
 *   obligee_only  → [adopt_obligee, custom, decline]
 *   neither       → []                                  (row is not active)
 */
export function availableDecisions(
  inPlay: FactorInPlay,
): MSChancellorDecisionKind[] {
  switch (inPlay) {
    case "neither":
      return [];
    case "agree":
      return ["accept_agreed", "decline"];
    case "both":
      return ["adopt_obligor", "adopt_obligee", "split", "custom", "decline"];
    case "obligor_only":
      return ["adopt_obligor", "custom", "decline"];
    case "obligee_only":
      return ["adopt_obligee", "custom", "decline"];
  }
}

export interface ChancellorTotals {
  /** Per-factor contribution after applying the chancellor's decision. */
  perFactor: Record<MSFactorLetter, number>;
  /** Σ contributions across all factors with a non-"none" decision. */
  totalMonthly: number;
  /** Count of factors still pending (decision === "none" on an active row). */
  pendingCount: number;
  /** Count of active rows total (rows where a decision is required). */
  activeCount: number;
}

export function computeChancellorTotals(
  rows: ReconciliationRow[],
  decisions: Record<MSFactorLetter, MSChancellorDecision>,
): ChancellorTotals {
  const perFactor = {} as Record<MSFactorLetter, number>;
  let totalMonthly = 0;
  let pendingCount = 0;
  let activeCount = 0;
  for (const row of rows) {
    const dec = decisions[row.letter] ?? defaultChancellorDecision(row.letter);
    const contribution = decisionContribution(row, dec);
    perFactor[row.letter] = contribution;
    totalMonthly += contribution;
    if (row.inPlay !== "neither") {
      activeCount += 1;
      if (dec.decision === "none") pendingCount += 1;
    }
  }
  return { perFactor, totalMonthly, pendingCount, activeCount };
}

/**
 * Recorder helper — produces an updated decision with `decidedAt` set to
 * `now`. Centralizing the timestamp here keeps the audit-trail contract
 * in one place (decision change → timestamp stamp, always).
 *
 * When the chancellor toggles back to "none" we clear `decidedAt` so the
 * row reads as pending again.
 */
export function recordDecision(
  prev: MSChancellorDecision,
  next: { decision: MSChancellorDecisionKind; customAmount?: number },
  now: Date = new Date(),
): MSChancellorDecision {
  return {
    factorLetter: prev.factorLetter,
    decision: next.decision,
    customAmount:
      next.decision === "custom"
        ? clampCustomAmount(next.customAmount ?? prev.customAmount)
        : 0,
    decidedAt: next.decision === "none" ? null : now.toISOString(),
  };
}
