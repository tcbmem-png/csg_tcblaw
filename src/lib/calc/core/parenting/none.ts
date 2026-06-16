/**
 * No-formula parenting model — Washington (RCW 26.19).
 *
 * Washington has NO formulaic residential-time adjustment and NO cross-credit.
 * The standard calculation is simply the obligor's income share of the basic
 * support obligation; a residential-schedule credit is a purely DISCRETIONARY
 * deviation (RCW 26.19.075(1)(d)) handled outside the formula (and barred where
 * it leaves the receiving household short of the child's basic needs or the
 * child receives TANF). So the strategy ignores day-counts entirely: the
 * designated obligor pays their straight pro-rata share, every time.
 *
 * The obligor is the worksheet-designated payor (arpForStandard, default
 * parent_a) — not income-derived, since in WA the payor is set by residential
 * designation, which is why the obligor can be the lower earner.
 *
 * Registered as `none`.
 */
import type { ParentingInput, ParentingResult, ParentingStrategy } from "./types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NoneParentingParams = {};

export const noneParenting: ParentingStrategy<NoneParentingParams> = (input) => {
  const { bcso, piA, piB } = input;
  const payor = input.arpForStandard ?? "parent_a";
  if (payor === "parent_b") {
    return {
      netFromA: -(bcso * piB),
      multiplier: null,
      arpIdentity: "parent_b",
      band: "standard_no_adjustment",
      arpDays: 0,
      warnings: [],
    };
  }
  return {
    netFromA: bcso * piA,
    multiplier: null,
    arpIdentity: "parent_a",
    band: "standard_no_adjustment",
    arpDays: 0,
    warnings: [],
  };
};
