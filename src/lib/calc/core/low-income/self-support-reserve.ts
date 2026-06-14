/**
 * Self-Support Reserve strategy — TN Rule .02(25) + .09 shaded area.
 *
 * The shaded-cell test keys off the OBLIGOR's own AGI (a combined-AGI cell
 * can clear the threshold while the obligor-alone lookup is shaded). When the
 * obligor-only BCSO is shaded and lower than the pro-rata BCSO, the order is
 * limited to the lesser of (obligor-only BCSO, obligorAGI - reserve), so the
 * obligor keeps the reserve.
 *
 * Extracted verbatim from the legacy TN engine; single home of the SSR metric.
 * The reserve amount, cap, schedule lookup, and the human-readable note are
 * passed in so the strategy carries no state-specific data or prose.
 */
import type {
  LowIncomeInput,
  LowIncomeResult,
  LowIncomeStrategy,
} from "./types";

export interface SsrParams {
  /** Monthly self-support reserve the obligor must retain. (TN: 957) */
  reserve: number;
  /** Combined-income cap above which the obligor-only lookup is skipped. */
  cap: number;
  /** Obligor-only schedule lookup (returns the shaded flag + amount). */
  lookup: (agi: number, numChildren: number) => {
    bcso: number;
    isShaded: boolean;
  };
  /** Builds the per-application note. Keeps state prose out of core. */
  noteBuilder: (altBcso: number, reserve: number) => string;
}

export const selfSupportReserve: LowIncomeStrategy<SsrParams> = (input, p) => {
  const { presumptiveFromA, aAGI, bAGI, numChildren } = input;

  let applied = false;
  let note: string | null = null;
  let collapsedToZero = false;
  let obligorIsA = false;
  let presumptiveAfter = presumptiveFromA;

  if (Math.abs(presumptiveFromA) > 0) {
    const obIsA = presumptiveFromA > 0;
    const obligorAgi = obIsA ? aAGI : bAGI;
    if (obligorAgi > 0 && obligorAgi <= p.cap) {
      const alt = p.lookup(obligorAgi, numChildren);
      if (alt.isShaded) {
        const proRataObligor = Math.abs(presumptiveFromA);
        const altBcso = alt.bcso;
        if (altBcso < proRataObligor) {
          const allowed = Math.max(0, obligorAgi - p.reserve);
          const final = Math.min(altBcso, allowed);
          presumptiveAfter = obIsA ? final : -final;
          applied = true;
          note = p.noteBuilder(altBcso, p.reserve);
          if (final < 1) {
            collapsedToZero = true;
            obligorIsA = obIsA;
          }
        }
      }
    }
  }

  return {
    presumptiveAfterAdjustment: presumptiveAfter,
    applied,
    note,
    collapsedToZero,
    obligorIsA,
  };
};
