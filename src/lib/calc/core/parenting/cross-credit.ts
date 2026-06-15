/**
 * GA parenting-time model — O.C.G.A. § 19-6-15(g) (mandatory eff. 1/1/2026).
 *
 * A continuous cross-credit on a power-of-2.5 day curve (no threshold, no
 * cliff). The literal Schedule C steps (statute (g)):
 *   i.   ncDays^2.5
 *   ii.  cpDays^2.5
 *   iii. (i) × custodial parent's BCSO share $
 *   iv.  (ii) × noncustodial parent's BCSO share $
 *   v.   (iii) − (iv)
 *   vi.  (v) / ((i) + (ii))
 *   vii. (vi) + noncustodial parent's BCSO share $  ← the NC parent's PTA share
 *
 * The credit is aggressively large at low NC day-counts and that is CORRECT
 * (oracle-validated to the cent against the statutory arithmetic) — it is not
 * softened. (vii) may go negative, in which case the custodial parent pays.
 * With no court-ordered parenting time, no adjustment applies and the NC parent
 * pays their full BCSO share. The noncustodial parent is designated via
 * arpForStandard (equal time → higher earner, set by the caller).
 */
import type {
  ParentingInput,
  ParentingResult,
  ParentingStrategy,
} from "./types";

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
  const ncDaysRaw = equal
    ? 182.5
    : ncIsA
      ? (input.parentADays ?? 0)
      : (input.parentBDays ?? 0);
  const cpDays = equal
    ? 182.5
    : ncIsA
      ? (input.parentBDays ?? 0)
      : (input.parentADays ?? 0);
  const ncDays = Math.min(p.ceilingNoncustodialDays, ncDaysRaw);

  const i = Math.pow(ncDays, p.exponent);
  const ii = Math.pow(cpDays, p.exponent);
  const iii = i * cpBcso;
  const iv = ii * ncBcso;
  const v = iii - iv;
  const vi = i + ii === 0 ? 0 : v / (i + ii);
  const ptAdjusted = vi + ncBcso; // noncustodial parent's PTA-adjusted share

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
