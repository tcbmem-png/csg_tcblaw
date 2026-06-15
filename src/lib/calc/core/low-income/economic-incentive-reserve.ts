/**
 * AL self-support reserve — Rule 32(C)(5), Ala. R. Jud. Admin.
 *
 * Distinct from TN's shaded-cell SSR and AR's payor-gross recompute, so it is
 * its own registered strategy. The CS-42 SSR flow caps the obligor's order at
 * the income they have available after a reserve, discounted by an
 * economic-incentive factor:
 *   line11 = max(0, obligorMonthlyAGI − reserve)        ($981)
 *   line12 = incentivePct × line11                       (0.85 — ~15% payroll tax)
 *   order  = min(presumptive obligation, line12)
 * If line12 < the minimum ($50), a rebuttable $50 minimum applies. (The
 * zero-dollar provision for no-income obligors is not modeled here.)
 *
 * When the SSR binds, add-ons are suppressed: the order is already limited to
 * what the obligor can pay. On CS-42-S (shared custody) the whole SSR flow is
 * suppressed upstream by the parenting strategy (Rule 32(C)(7)(e)).
 */
import type {
  LowIncomeInput,
  LowIncomeResult,
  LowIncomeStrategy,
} from "./types";

export interface EconomicIncentiveReserveParams {
  /** Monthly self-support reserve. AL: 981. */
  reserve: number;
  /** Economic-incentive multiplier on income-available-after-reserve. AL: 0.85. */
  incentivePct: number;
  /** Rebuttable minimum order when the SSR floors available income. AL: 50. */
  minimumOrder: number;
  /** Builds the per-application note. */
  noteBuilder: (cappedTo: number, reserve: number) => string;
}

export const economicIncentiveReserve: LowIncomeStrategy<
  EconomicIncentiveReserveParams
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
  const obligorAgi = obligorIsA ? aAGI : bAGI;
  const line11 = Math.max(0, obligorAgi - p.reserve);
  const line12 = p.incentivePct * line11;

  // SSR only bites if it would reduce the obligation below the presumptive.
  if (line12 >= absPresumptive) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA,
    };
  }

  let finalAbs = line12;
  let minimumApplied = false;
  if (finalAbs < p.minimumOrder) {
    finalAbs = p.minimumOrder;
    minimumApplied = true;
  }

  return {
    presumptiveAfterAdjustment: obligorIsA ? finalAbs : -finalAbs,
    applied: true,
    note: p.noteBuilder(finalAbs, p.reserve),
    collapsedToZero: finalAbs < 1,
    obligorIsA,
    suppressAddOns: true,
    minimumApplied,
  };
};
