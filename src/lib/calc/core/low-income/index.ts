/**
 * Low-income adjustment strategy registry. A state's spec selects one by id.
 *
 * Registered:
 *   self_support_reserve — TN (Rule .02(25))
 *
 * To add per state as they land (each with fixtures):
 *   schedule_floor             — order floored at the schedule minimum
 *   low_income_deviation_table — digitized low-income adjustment table
 */
import { selfSupportReserve } from "./self-support-reserve";

export const LOW_INCOME_STRATEGIES = {
  self_support_reserve: selfSupportReserve,
} as const;

export type LowIncomeModel = keyof typeof LOW_INCOME_STRATEGIES;

export * from "./types";
export { selfSupportReserve } from "./self-support-reserve";
export type { SsrParams } from "./self-support-reserve";
