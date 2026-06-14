/**
 * Generic income-shares schedule lookup.
 *
 * The single implementation of "given combined income + number of children,
 * read the basic obligation off the state's schedule." States supply their
 * digitized schedule (tuple form), cap, above-cap formula, and the
 * between-rows convention; the metric logic lives only here.
 *
 * Tuple row form (the compiled/runtime shape — author as JSON, compile to this):
 *   [combinedAgi, ch1, ch2, ch3, ch4, ch5, shadedBitmask]
 *   shadedBitmask: bit i (1<<i) set => the cell for (i+1) children is shaded.
 */

export type BcsoRow = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Between-rows convention. TN = round_up (to the next schedule row). */
export type ScheduleLookupConvention =
  | "round_up"
  | "round_down"
  | "nearest_bracket";

export interface AboveCapEntry {
  rate: number;
  bcsoAtCap: number;
}

export interface IncomeShareScheduleConfig {
  rows: readonly BcsoRow[];
  /** Combined income above which the above-cap formula applies. */
  cap: number;
  /** Per-child-count above-cap marginal rate + top-of-schedule value. */
  aboveCap: Record<number, AboveCapEntry>;
  convention: ScheduleLookupConvention;
}

export interface ScheduleLookupResult {
  bcso: number;
  source: "schedule" | "above_cap";
  scheduleAgiUsed: number | null;
  isShaded: boolean;
}

/** Resolve the schedule row index for `combinedAgi` under the given convention. */
function findRowIndex(
  rows: readonly BcsoRow[],
  combinedAgi: number,
  convention: ScheduleLookupConvention,
): number {
  if (convention === "round_up") {
    // Smallest row whose AGI >= combinedAgi (clamp to first row if below).
    let lo = 0;
    let hi = rows.length - 1;
    let foundIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid][0] >= combinedAgi) {
        foundIdx = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return foundIdx === -1 ? 0 : foundIdx;
  }
  // round_down and nearest_bracket are real conventions used by other states
  // (e.g. AR rounds down to the $50 row). They are added — with their own
  // fixtures — when the first state that needs them lands. Fail loud rather
  // than silently using the wrong convention.
  throw new Error(
    `Schedule lookup convention "${convention}" is not implemented yet.`,
  );
}

export function lookupScheduleAmount(
  cfg: IncomeShareScheduleConfig,
  combinedAgi: number,
  numChildren: number,
): ScheduleLookupResult {
  if (numChildren < 1 || numChildren > 5) {
    throw new Error("numChildren must be 1-5");
  }
  if (combinedAgi <= cfg.cap) {
    const idx = findRowIndex(cfg.rows, combinedAgi, cfg.convention);
    const row = cfg.rows[idx];
    const bcso = row[numChildren]; // index 1..5 = bcso for that child count
    const mask = row[6];
    const isShaded = ((mask >> (numChildren - 1)) & 1) === 1;
    return { bcso, source: "schedule", scheduleAgiUsed: row[0], isShaded };
  }
  const entry = cfg.aboveCap[numChildren];
  const excess = combinedAgi - cfg.cap;
  return {
    bcso: entry.bcsoAtCap + excess * entry.rate,
    source: "above_cap",
    scheduleAgiUsed: null,
    isShaded: false,
  };
}
