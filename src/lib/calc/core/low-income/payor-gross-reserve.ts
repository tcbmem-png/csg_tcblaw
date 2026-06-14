/**
 * AR self-support reserve — Administrative Order No. 10 § II(3).
 *
 * Doctrinally this is AR's "self-support reserve," but mechanically it is a
 * distinct algorithm from TN's shaded-cell variant, so it is registered as its
 * own strategy. When the payor's monthly gross is below the trigger threshold
 * ($900):
 *   - the BCSO is recomputed from the PAYOR's gross ALONE (not combined) at the
 *     corresponding chart row;
 *   - the three pro-rata add-ons are dropped (not entered as worksheet lines);
 *   - a presumptive minimum order ($125) floors the result.
 * Below $900 the lookup lands in the shaded first row (= the minimum), so the
 * SSR calc and the minimum coincide — but both are modeled explicitly.
 */
import type {
  LowIncomeInput,
  LowIncomeResult,
  LowIncomeStrategy,
} from "./types";

export interface PayorGrossReserveParams {
  /** Payor monthly gross below which the SSR mechanic triggers. AR: 900. */
  triggerThreshold: number;
  /** Presumptive minimum order when triggered. AR: 125. */
  minimumOrder: number;
  /** Schedule lookup on a single income (the payor's gross alone). */
  lookup: (income: number, numChildren: number) => number;
  /** Builds the per-application note. Keeps state prose out of core. */
  noteBuilder: (base: number, threshold: number) => string;
}

export const payorGrossReserve: LowIncomeStrategy<PayorGrossReserveParams> = (
  input,
  p,
) => {
  const { presumptiveFromA, aAGI, bAGI, numChildren } = input;

  if (Math.abs(presumptiveFromA) === 0) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA: false,
    };
  }

  const obligorIsA = presumptiveFromA > 0;
  const payorGross = obligorIsA ? aAGI : bAGI;

  if (payorGross >= p.triggerThreshold) {
    return {
      presumptiveAfterAdjustment: presumptiveFromA,
      applied: false,
      note: null,
      collapsedToZero: false,
      obligorIsA,
    };
  }

  // Triggered: recompute base from payor gross alone, floor at the minimum.
  const fromPayorGross = p.lookup(payorGross, numChildren);
  const base = Math.max(p.minimumOrder, fromPayorGross);
  return {
    presumptiveAfterAdjustment: obligorIsA ? base : -base,
    applied: true,
    note: p.noteBuilder(base, p.triggerThreshold),
    collapsedToZero: false,
    obligorIsA,
    suppressAddOns: true,
    minimumApplied: true,
    overrideBcso: base,
  };
};
