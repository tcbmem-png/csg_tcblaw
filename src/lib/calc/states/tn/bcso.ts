import {
  lookupScheduleAmount,
  type IncomeShareScheduleConfig,
} from "../../core/schedule";
import { BCSO_SCHEDULE, SCHEDULE_EFFECTIVE_DATE } from "./data/schedule-2022";
import { ABOVE_CAP, COMBINED_AGI_CAP } from "./data/constants";

export { SCHEDULE_EFFECTIVE_DATE };

export interface BcsoLookup {
  bcso: number;
  source: "schedule" | "above_cap";
  scheduleAgiUsed: number | null;
  isShaded: boolean;
}

/** TN schedule config consumed by the generic core lookup. */
export const TN_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: BCSO_SCHEDULE,
  cap: COMBINED_AGI_CAP,
  aboveCap: ABOVE_CAP,
  convention: "round_up",
};

/**
 * Look up BCSO per Rule 1240-02-04-.09.
 * - Combined AGI ≤ cap: round UP to next schedule line.
 * - Combined AGI > cap: top-of-schedule + (excess × rate).
 *
 * Thin TN adapter over the generic core schedule lookup; the metric logic
 * lives in src/lib/calc/core/schedule.ts.
 */
export function lookupBcso(combinedAgi: number, numChildren: number): BcsoLookup {
  return lookupScheduleAmount(TN_SCHEDULE_CONFIG, combinedAgi, numChildren);
}
