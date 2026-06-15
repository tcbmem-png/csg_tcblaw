/**
 * GA low-income adjustment — O.C.G.A. § 19-6-15(i.1) + table (p) (eff. 1/1/2026).
 *
 * The (p) value is a CAP, never the obligation itself: the order is the LESSER
 * of the presumptive amount (as changed by deviations) and the (p) cap. The cap
 * is keyed to the OBLIGOR's monthly adjusted gross income for the number of
 * children:
 *   - AGI ≤ $1,500: cap = percentOfIncome(numChildren) × AGI.
 *   - $1,500 < AGI < columnTerminationAgi(numChildren): cap = the (p) table row
 *     (smallest agiAtOrBelow ≥ AGI that has a value for that child count).
 *   - AGI ≥ columnTerminationAgi: the adjustment does not apply (not low-income).
 *
 * There is NO self-support-reserve subtraction (the treatise was wrong); the
 * mechanic is purely the lesser-of cap.
 */
import type {
  LowIncomeInput,
  LowIncomeResult,
  LowIncomeStrategy,
} from "./types";

export interface LowIncomeDeviationTableRow {
  agiAtOrBelow: number;
  byChildren: Record<number, number>;
}

export interface LowIncomeDeviationTableParams {
  belowFloorAgi: number; // 1500
  belowFloorPctByChildren: Record<number, number>;
  columnTerminationAgi: Record<number, number>;
  table: LowIncomeDeviationTableRow[];
}

export const lowIncomeDeviationTable: LowIncomeStrategy<
  LowIncomeDeviationTableParams
> = (input, p) => {
  const { presumptiveFromA, aAGI, bAGI, numChildren } = input;
  const absPresumptive = Math.abs(presumptiveFromA);
  const noop: LowIncomeResult = {
    presumptiveAfterAdjustment: presumptiveFromA,
    applied: false,
    note: null,
    collapsedToZero: false,
    obligorIsA: presumptiveFromA > 0,
  };
  if (absPresumptive === 0) return noop;

  const obligorIsA = presumptiveFromA > 0;
  const obligorAGI = obligorIsA ? aAGI : bAGI;

  const term = p.columnTerminationAgi[numChildren] ?? 0;
  if (obligorAGI >= term) return noop; // not low-income for this child count

  let cap: number;
  if (obligorAGI <= p.belowFloorAgi) {
    cap = (p.belowFloorPctByChildren[numChildren] ?? 0) * obligorAGI;
  } else {
    const row = p.table.find(
      (r) => r.byChildren[numChildren] != null && r.agiAtOrBelow >= obligorAGI,
    );
    if (!row) return noop;
    cap = row.byChildren[numChildren];
  }

  // Lesser-of: only reduces when the cap is below the presumptive.
  if (cap >= absPresumptive) return noop;

  return {
    presumptiveAfterAdjustment: obligorIsA ? cap : -cap,
    applied: true,
    note: `Low-income adjustment (O.C.G.A. § 19-6-15(i.1)): order capped at the (p) table amount ($${Math.round(cap)}), the lesser of the presumptive amount and the low-income cap.`,
    collapsedToZero: cap < 1,
    obligorIsA,
  };
};
