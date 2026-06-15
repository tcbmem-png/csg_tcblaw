/**
 * GA parenting-time model — O.C.G.A. § 19-6-15(g) (mandatory eff. 1/1/2026).
 *
 * A continuous cross-credit on a power-of-2.5 day curve (no threshold, no
 * cliff). Schedule C (statute (g)):
 *   i.   ncDays^2.5
 *   ii.  cpDays^2.5
 *   vi.  Parenting-time adjustment = −[ (i) / ((i) + (ii)) ] × BCSO
 *          (the NC parent's share of total day-weight applied to the whole
 *           BCSO; always a credit ≤ 0, growing as NC time grows)
 *   vii. (vi) + noncustodial parent's BCSO share $  ← the NC parent's PTA share
 *
 * Validated to the cent against the live GA Commission calculator across a
 * 60→182 overnight sweep (Worksheet 698904, 1 child / $8,000): e.g. 90 NC
 * nights → adjustment −$66.40, PTA share $652.35. An earlier transcription
 * cross-multiplied each day-power by the OTHER parent's BCSO share, which
 * transposed the adjustment and the order (it emitted $66.40 as the order).
 * The adjustment is equivalently (ii·ncBcso − i·cpBcso) / (i + ii).
 * (vii) may go negative, in which case the custodial parent pays.
 * With no court-ordered parenting time, no adjustment applies and the NC parent
 * pays their full BCSO share. The noncustodial parent is designated via
 * arpForStandard (equal time → higher earner, set by the caller).
 */
import type { ParentingInput, ParentingResult, ParentingStrategy } from "./types";

export interface CrossCreditParams {
  exponent: number; // 2.5
  ceilingNoncustodialDays: number; // 182.5
}

export const crossCredit: ParentingStrategy<CrossCreditParams> = (input, p) => {
  const { bcso, piA, piB } = input;
  const ncIsA = (input.arpForStandard ?? "parent_a") === "parent_a";
  const ncShare = ncIsA ? piA : piB;
  const cpShare = ncIsA ? piB : piA;
  const ncBcso = bcso * ncShare;
  const cpBcso = bcso * cpShare;

  // No court-ordered parenting time ("standard"): no adjustment — NC pays the
  // full BCSO share. Equal time is the cross-credit with 182.5 days each.
  if (input.parentingType === "standard") {
    return {
      netFromA: ncIsA ? ncBcso : -ncBcso,
      multiplier: null,
      arpIdentity: ncIsA ? "parent_a" : "parent_b",
      band: "no_parenting_adjustment",
      arpDays: 0,
      warnings: [],
    };
  }

  const equal = input.parentingType === "equal";
  const ncDaysRaw = equal ? 182.5 : ncIsA ? (input.parentADays ?? 0) : (input.parentBDays ?? 0);
  const cpDays = equal ? 182.5 : ncIsA ? (input.parentBDays ?? 0) : (input.parentADays ?? 0);
  const ncDays = Math.min(p.ceilingNoncustodialDays, ncDaysRaw);

  const i = Math.pow(ncDays, p.exponent);
  const ii = Math.pow(cpDays, p.exponent);
  const denom = i + ii;
  // Parenting-time adjustment (Schedule C step vi): the NC parent's share of
  // total day-weight applied to the whole BCSO, as a credit. Equivalently
  // (ii·ncBcso − i·cpBcso) / denom. Always ≤ 0; grows with NC time.
  const ptAdjustment = denom === 0 ? 0 : -(i / denom) * bcso;
  const ptAdjusted = ncBcso + ptAdjustment; // noncustodial parent's PTA-adjusted share

  return {
    // Signed from A's perspective. ncIsA: A pays ptAdjusted (negative => CP pays).
    netFromA: ncIsA ? ptAdjusted : -ptAdjusted,
    multiplier: null,
    arpIdentity: ncIsA ? "parent_a" : "parent_b",
    band: "cross_credit",
    arpDays: ncDays,
    warnings: [],
  };
};
