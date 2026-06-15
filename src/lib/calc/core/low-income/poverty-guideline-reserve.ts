/**
 * FL low-income adjustment — Fla. Stat. § 61.30(6)(a)1-2.
 *
 * The obligor's order is the LESSER of (i) the obligor's income-share amount
 * and (ii) pct × (obligor monthly net − the single-person federal poverty
 * guideline). If (ii) is negative it floors at $0 and the court enters a
 * nominal case-by-case "principle of payment" order — Florida has NO flat
 * dollar floor (contrast AR $125 / AL $50). Registered as its own strategy
 * (doctrine model "self_support_reserve", FL mechanic).
 *
 * The poverty guideline updates annually (HHS, each January) — it is stored as
 * a dated constant in the FL spec and must be re-pinned each year.
 */
import type {
  LowIncomeInput,
  LowIncomeResult,
  LowIncomeStrategy,
} from "./types";

export interface PovertyGuidelineReserveParams {
  /** Single-person federal poverty guideline, monthly. FL 2026: 1330. */
  povertyGuidelineMonthly: number;
  /** Fraction of net-above-poverty available for support. FL: 0.90. */
  pct: number;
  noteBuilder: (cappedTo: number, poverty: number) => string;
}

export const povertyGuidelineReserve: LowIncomeStrategy<
  PovertyGuidelineReserveParams
> = (input, p) => {
  const { presumptiveFromA, aAGI, bAGI } = input;
  const absPresumptive = Math.abs(presumptiveFromA);

  if (absPresumptive === 0) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA: false,
    };
  }

  const obligorIsA = presumptiveFromA > 0;
  const obligorNet = obligorIsA ? aAGI : bAGI;
  const prongII = Math.max(0, p.pct * (obligorNet - p.povertyGuidelineMonthly));

  // The lesser-of only bites when prong (ii) is below the income-share amount.
  if (prongII >= absPresumptive) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA,
    };
  }

  return {
    presumptiveAfterAdjustment: obligorIsA ? prongII : -prongII,
    applied: true,
    note: p.noteBuilder(prongII, p.povertyGuidelineMonthly),
    collapsedToZero: prongII < 1,
    obligorIsA,
    suppressAddOns: true,
    // prong (ii) at/below zero => nominal principle-of-payment order.
    minimumApplied: prongII <= 0,
  };
};
