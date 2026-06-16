/**
 * Obligor-net self-support reserve — Washington (RCW 26.19.065).
 *
 * WA stacks three low-income protections on the obligor's basic support
 * obligation (their income share of the BCSO), applied in order:
 *
 *   1. 45%-of-net ceiling — neither parent's total support obligation may
 *      exceed 45% of their net income except for good cause (RCW 26.19.065(1)).
 *   2. Self-support reserve — the obligation may not reduce the obligor below
 *      180% of the one-person federal poverty guideline ($2,394/mo for 2026);
 *      i.e. the obligation is capped at max(0, obligorNet − reserve)
 *      (RCW 26.19.065(2)(b),(c)).
 *   3. $50/child presumptive minimum — the obligation is never reduced below
 *      $50 per child by the reserve (RCW 26.19.065(2)(a)).
 *
 * The reserve caps bite only when they would LOWER the obligation; a comfortable
 * obligor passes through untouched. Below the $2,200 schedule floor the engine
 * clamps the lookup to the lowest row, the reserve drives the obligation to the
 * floor, and the $50/child minimum sets the order — reproducing the live WSCSS
 * calculator's off-table behavior.
 *
 * Distinct mechanic from TN's shaded-cell SSR, AR's payor-gross recompute, and
 * AL's economic-incentive discount, so it is its own registered strategy. The
 * cap is on the obligor's NET (not gross), and unlike AL there is no incentive
 * discount factor.
 *
 * Registered as `obligor_net_reserve`.
 */
import type { LowIncomeInput, LowIncomeResult, LowIncomeStrategy } from "./types";

export interface ObligorNetReserveParams {
  /** Monthly self-support reserve = 180% FPL one-person. WA 2026: 2394. */
  reserve: number;
  /** Per-child presumptive minimum order. WA: 50. */
  presumptiveMinimumPerChild: number;
  /** Ceiling as a fraction of the obligor's net income. WA: 0.45. */
  netIncomeCapPct: number;
  /** Builds the per-application note. Keeps state prose out of core. */
  noteBuilder: (cappedTo: number, reserve: number) => string;
}

export const obligorNetReserve: LowIncomeStrategy<ObligorNetReserveParams> = (input, p) => {
  const { presumptiveFromA, aAGI, bAGI, numChildren } = input;
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

  let amount = absPresumptive;
  let applied = false;

  // 1. 45%-of-net ceiling.
  const cap45 = p.netIncomeCapPct * obligorNet;
  if (amount > cap45) {
    amount = cap45;
    applied = true;
  }
  // 2. Self-support reserve: keep the obligor at/above the reserve.
  const reserveCeiling = Math.max(0, obligorNet - p.reserve);
  if (amount > reserveCeiling) {
    amount = reserveCeiling;
    applied = true;
  }
  // 3. $50/child presumptive minimum — never reduced below this by the reserve.
  let minimumApplied = false;
  const minimum = p.presumptiveMinimumPerChild * numChildren;
  if (amount < minimum) {
    amount = minimum;
    minimumApplied = true;
  }

  // Nothing bit: pass the original presumptive through unrounded.
  if (!applied && !minimumApplied) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA,
    };
  }

  return {
    presumptiveAfterAdjustment: obligorIsA ? amount : -amount,
    applied,
    note: applied ? p.noteBuilder(amount, p.reserve) : null,
    collapsedToZero: amount < 1,
    obligorIsA,
    minimumApplied,
  };
};
