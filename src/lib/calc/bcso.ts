import { BCSO_SCHEDULE, SCHEDULE_EFFECTIVE_DATE } from "./data/schedule-2022";
import { ABOVE_CAP, COMBINED_AGI_CAP } from "./data/constants";

export { SCHEDULE_EFFECTIVE_DATE };

export interface BcsoLookup {
  bcso: number;
  source: "schedule" | "above_cap";
  scheduleAgiUsed: number | null;
  isShaded: boolean;
}

/**
 * Look up BCSO per Rule 1240-02-04-.09.
 * - Combined AGI ≤ cap: round UP to next schedule line.
 * - Combined AGI > cap: top-of-schedule + (excess × rate).
 */
export function lookupBcso(combinedAgi: number, numChildren: number): BcsoLookup {
  if (numChildren < 1 || numChildren > 5) {
    throw new Error("numChildren must be 1-5");
  }
  if (combinedAgi <= COMBINED_AGI_CAP) {
    // Binary search for smallest schedule AGI >= combinedAgi
    let lo = 0;
    let hi = BCSO_SCHEDULE.length - 1;
    let foundIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const rowAgi = BCSO_SCHEDULE[mid][0];
      if (rowAgi >= combinedAgi) {
        foundIdx = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    // If combinedAgi is below the smallest schedule row, clamp to first row.
    if (foundIdx === -1) foundIdx = 0;
    const row = BCSO_SCHEDULE[foundIdx];
    const bcso = row[numChildren]; // index 1..5 = bcso for that child count
    const mask = row[6];
    const isShaded = ((mask >> (numChildren - 1)) & 1) === 1;
    return {
      bcso,
      source: "schedule",
      scheduleAgiUsed: row[0],
      isShaded,
    };
  }
  const cfg = ABOVE_CAP[numChildren as 1 | 2 | 3 | 4 | 5];
  const excess = combinedAgi - COMBINED_AGI_CAP;
  const bcso = cfg.bcsoAtCap + excess * cfg.rate;
  return {
    bcso,
    source: "above_cap",
    scheduleAgiUsed: null,
    isShaded: false,
  };
}
