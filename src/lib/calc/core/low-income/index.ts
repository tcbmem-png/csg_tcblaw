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
import { payorGrossReserve } from "./payor-gross-reserve";
import { economicIncentiveReserve } from "./economic-incentive-reserve";
import { povertyGuidelineReserve } from "./poverty-guideline-reserve";

export const LOW_INCOME_STRATEGIES = {
  // TN's shaded-cell SSR.
  self_support_reserve: selfSupportReserve,
  // AR's payor-gross-alone SSR + minimum (AO 10 § II(3)) — doctrinally also
  // "self_support_reserve" but a distinct mechanic.
  payor_gross_reserve: payorGrossReserve,
  // AL's economic-incentive SSR + $50 minimum (Rule 32(C)(5)).
  economic_incentive_reserve: economicIncentiveReserve,
  // FL's lesser-of poverty-guideline cap + principle of payment (§ 61.30(6)(a)).
  poverty_guideline_reserve: povertyGuidelineReserve,
} as const;

export type LowIncomeModel = keyof typeof LOW_INCOME_STRATEGIES;

export * from "./types";
export { selfSupportReserve } from "./self-support-reserve";
export type { SsrParams } from "./self-support-reserve";
export { payorGrossReserve } from "./payor-gross-reserve";
export type { PayorGrossReserveParams } from "./payor-gross-reserve";
export { economicIncentiveReserve } from "./economic-incentive-reserve";
export type { EconomicIncentiveReserveParams } from "./economic-incentive-reserve";
export { povertyGuidelineReserve } from "./poverty-guideline-reserve";
export type { PovertyGuidelineReserveParams } from "./poverty-guideline-reserve";
