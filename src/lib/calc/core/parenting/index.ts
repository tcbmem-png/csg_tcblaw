/**
 * Parenting-time strategy registry. A state's spec selects one by id.
 *
 * Registered:
 *   tn_variable_multiplier — TN (Rule .04(7))
 *
 * To add per state as they land (each with fixtures):
 *   threshold_bands        — multiplier by overnight band
 *   cross_credit           — GA (days^2.5, continuous)
 *   gross_up_1_5           — FL (>=20% overnights => x1.5, then cross-multiply)
 *   offset_dual_worksheet  — AR (two worksheets, straight offset, no 1.5x)
 */
import { tnVariableMultiplier } from "./tn-variable-multiplier";
import { offsetDualWorksheet } from "./offset-dual-worksheet";

export const PARENTING_STRATEGIES = {
  tn_variable_multiplier: tnVariableMultiplier,
  offset_dual_worksheet: offsetDualWorksheet,
} as const;

export type ParentingModel = keyof typeof PARENTING_STRATEGIES;

export * from "./types";
export { tnVariableMultiplier } from "./tn-variable-multiplier";
export type { TnVariableMultiplierParams } from "./tn-variable-multiplier";
export { offsetDualWorksheet } from "./offset-dual-worksheet";
export type { OffsetDualWorksheetParams } from "./offset-dual-worksheet";
