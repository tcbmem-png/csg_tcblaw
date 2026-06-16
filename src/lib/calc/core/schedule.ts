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

/** Between-rows convention. TN = round_up; AR = round_down; WA = nearest_100. */
export type ScheduleLookupConvention =
  | "round_up"
  | "round_down"
  | "nearest_50"
  | "nearest_100"
  | "interpolate_linear"
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
  /**
   * The table cell is the PER-CHILD basic obligation, not the total for N
   * children (WA RCW 26.19.020: header "MONTHLY BASIC SUPPORT OBLIGATION PER
   * CHILD"). When true the total BCSO = cell × N. The per-child column still
   * varies by N (economies of scale). Omit/false => cell is already the total
   * for N children (TN/AR/AL/GA/LA/FL).
   */
  valuesArePerChild?: boolean;
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
  if (convention === "round_down" || convention === "nearest_50" || convention === "nearest_100") {
    // nearest_50/nearest_100: snap to the nearest $50/$100 mark first, then
    // locate the row. The WA economic table is tabulated at $100 increments
    // (RCW 26.19.020, eff 1/1/2026) with the EHB 1014 half-rule "round down if
    // the last two digits are 49 or less, round up if 50 or more" — exactly
    // Math.round at a $100 grain (5,025 -> 5,000; 5,050 -> 5,100). round_down:
    // locate the bracket directly.
    const snap = convention === "nearest_50" ? 50 : convention === "nearest_100" ? 100 : 1;
    const target = snap === 1 ? income : Math.round(income / snap) * snap;
    // Largest row whose income <= target (clamp to first row if below).
    let lo = 0;
    let hi = rows.length - 1;
    let foundIdx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid][0] <= target) {
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
  throw new Error(`Schedule lookup convention "${convention}" is not implemented yet.`);
}

export function lookupScheduleAmount(
  cfg: IncomeShareScheduleConfig,
  combinedAgi: number,
  numChildren: number,
): ScheduleLookupResult {
  if (numChildren < 1 || numChildren > cfg.maxChildren) {
    throw new Error(`numChildren must be 1-${cfg.maxChildren}`);
  }
  // WA's table cell is per-child; the total basic obligation is cell × N. Every
  // tabulated/above-cap amount below is scaled by this. Other states leave the
  // flag off and the factor is 1 (cell is already the N-child total).
  const perChild = cfg.valuesArePerChild ? numChildren : 1;
  if (combinedAgi <= cfg.cap) {
    // interpolate_linear (FL § 61.30(6)): proportionally interpolate the
    // obligation between the bracketing $50 rows. Exact-$50 incomes return the
    // tabulated value unchanged; only between-row incomes are interpolated.
    if (cfg.convention === "interpolate_linear") {
      const rows = cfg.rows;
      // floor = largest rowIncome <= income (clamp to first row if below).
      let lo = 0;
      let hi = rows.length - 1;
      let floorIdx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (rows[mid][0] <= combinedAgi) {
          floorIdx = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      const floorRow = rows[floorIdx];
      const ceilRow = rows[floorIdx + 1];
      let bcso = floorRow[numChildren];
      if (ceilRow && combinedAgi > floorRow[0]) {
        const frac = (combinedAgi - floorRow[0]) / (ceilRow[0] - floorRow[0]);
        bcso = floorRow[numChildren] + frac * (ceilRow[numChildren] - floorRow[numChildren]);
      }
      return {
        bcso: bcso * perChild,
        source: "schedule",
        scheduleAgiUsed: combinedAgi,
        isShaded: false,
      };
    }
    const idx = findRowIndex(cfg.rows, combinedAgi, cfg.convention);
    const row = cfg.rows[idx];
    const bcso = row[numChildren]; // index 1..maxChildren = amount for k children
    const mask = row[cfg.maxChildren + 1] ?? 0;
    const isShaded = mask ? ((mask >> (numChildren - 1)) & 1) === 1 : false;
    return {
      bcso: bcso * perChild,
      source: "schedule",
      scheduleAgiUsed: row[0],
      isShaded,
    };
  }
  // Above the chart.
  if (cfg.aboveCap.behavior === "marginal_percent") {
    const entry = cfg.aboveCap.byChildren[numChildren];
    const excess = combinedAgi - cfg.cap;
    return {
      bcso: (entry.bcsoAtCap + excess * entry.rate) * perChild,
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
    bcso: topRow[numChildren] * perChild,
    source: "above_cap",
    scheduleAgiUsed: null,
    isShaded: false,
  };
}
