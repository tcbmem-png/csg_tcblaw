/**
 * Generic income-shares schedule lookup.
 *
 * The single implementation of "given combined income + number of children,
 * read the basic obligation off the state's schedule." States supply their
 * digitized schedule (tuple form), max children, cap, above-cap behavior, and
 * the between-rows convention; the metric logic lives only here.
 *
 * Tuple row form (the compiled/runtime shape — author as JSON, compile to this):
 *   [rowIncome, ch1, ch2, ..., chMaxChildren, shadedBitmask?]
 *   - rowIncome: the row's income value (combinedMin). round_up matches the
 *     row >= income; round_down matches the row <= income.
 *   - amount for k children = row[k].
 *   - shadedBitmask is OPTIONAL and only used by states with shaded cells
 *     (TN SSR). It sits at index maxChildren+1; absent => no shading.
 */

export type BcsoRow = readonly number[];

/** Between-rows convention. TN = round_up; AR = round_down. */
export type ScheduleLookupConvention =
  | "round_up"
  | "round_down"
  | "nearest_bracket";

/** Above-the-chart behavior. */
export type AboveCapConfig =
  | {
      /** Top-of-schedule value + marginal % of the excess (TN). */
      behavior: "marginal_percent";
      byChildren: Record<number, { rate: number; bcsoAtCap: number }>;
    }
  | {
      /** Highest tabulated row is a floor; anything above is discretionary (AR). */
      behavior: "discretionary_floor";
    }
  | {
      /** Flat: use the highest tabulated row, no addition. */
      behavior: "flat_top_row";
    };

export interface IncomeShareScheduleConfig {
  rows: readonly BcsoRow[];
  /** Highest child-count column in the table (TN: 5, AR: 6). */
  maxChildren: number;
  /** Income above which the above-cap behavior applies. */
  cap: number;
  aboveCap: AboveCapConfig;
  convention: ScheduleLookupConvention;
}

export interface ScheduleLookupResult {
  bcso: number;
  source: "schedule" | "above_cap";
  scheduleAgiUsed: number | null;
  isShaded: boolean;
}

/** Resolve the schedule row index for `income` under the given convention. */
function findRowIndex(
  rows: readonly BcsoRow[],
  income: number,
  convention: ScheduleLookupConvention,
): number {
  if (convention === "round_up") {
    // Smallest row whose income >= target (clamp to first row if below).
    let lo = 0;
    let hi = rows.length - 1;
    let foundIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid][0] >= income) {
        foundIdx = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return foundIdx === -1 ? 0 : foundIdx;
  }
  if (convention === "round_down") {
    // Largest row whose income <= target (clamp to first row if below).
    let lo = 0;
    let hi = rows.length - 1;
    let foundIdx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid][0] <= income) {
        foundIdx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return foundIdx;
  }
  // nearest_bracket and any other convention are added — with their own
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
  if (numChildren < 1 || numChildren > cfg.maxChildren) {
    throw new Error(`numChildren must be 1-${cfg.maxChildren}`);
  }
  if (combinedAgi <= cfg.cap) {
    const idx = findRowIndex(cfg.rows, combinedAgi, cfg.convention);
    const row = cfg.rows[idx];
    const bcso = row[numChildren]; // index 1..maxChildren = amount for k children
    const mask = row[cfg.maxChildren + 1] ?? 0;
    const isShaded = mask ? ((mask >> (numChildren - 1)) & 1) === 1 : false;
    return { bcso, source: "schedule", scheduleAgiUsed: row[0], isShaded };
  }
  // Above the chart.
  if (cfg.aboveCap.behavior === "marginal_percent") {
    const entry = cfg.aboveCap.byChildren[numChildren];
    const excess = combinedAgi - cfg.cap;
    return {
      bcso: entry.bcsoAtCap + excess * entry.rate,
      source: "above_cap",
      scheduleAgiUsed: null,
      isShaded: false,
    };
  }
  // discretionary_floor / flat_top_row: the highest tabulated amount at this
  // child count is the floor; any increment above is discretionary (not
  // formulaic — see AR / Parnell). Do not fabricate a marginal formula.
  const topRow = cfg.rows[cfg.rows.length - 1];
  return {
    bcso: topRow[numChildren],
    source: "above_cap",
    scheduleAgiUsed: null,
    isShaded: false,
  };
}
