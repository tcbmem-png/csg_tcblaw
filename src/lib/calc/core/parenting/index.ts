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
import { sharedCustodyCrossMultiply } from "./shared-custody-cross-multiply";
import { crossCredit } from "./cross-credit";
import { noneParenting } from "./none";

export const PARENTING_STRATEGIES = {
  tn_variable_multiplier: tnVariableMultiplier,
  offset_dual_worksheet: offsetDualWorksheet,
  shared_custody_cross_multiply: sharedCustodyCrossMultiply,
  cross_credit: crossCredit,
  // WA: no residential-time formula; obligor pays straight income share.
  none: noneParenting,
} as const;

export type ParentingModel = keyof typeof PARENTING_STRATEGIES;

export * from "./types";
export { tnVariableMultiplier } from "./tn-variable-multiplier";
export type { TnVariableMultiplierParams } from "./tn-variable-multiplier";
export { offsetDualWorksheet } from "./offset-dual-worksheet";
export type { OffsetDualWorksheetParams } from "./offset-dual-worksheet";
export { sharedCustodyCrossMultiply } from "./shared-custody-cross-multiply";
export type { SharedCustodyCrossMultiplyParams } from "./shared-custody-cross-multiply";
export { crossCredit } from "./cross-credit";
export type { CrossCreditParams } from "./cross-credit";
export { noneParenting } from "./none";
export type { NoneParentingParams } from "./none";
