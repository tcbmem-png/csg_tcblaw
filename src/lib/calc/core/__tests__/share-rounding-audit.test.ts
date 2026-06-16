import { describe, expect, it } from "vitest";
import { incomeShares } from "../income-shares";
import { TN_INCOME_SHARES_SPEC } from "../../states/tn/spec";
import { FL_INCOME_SHARES_SPEC } from "../../states/fl/spec";
import type { IncomeSharesInputs } from "../types";

/**
 * Share-rounding audit — FL + TN (the two states left unverified after the
 * AR/GA/LA/AL pass).
 *
 * Each parent's income share (their % of combined income) may be rounded
 * before it drives the obligation, and the mode shifts the final order by a
 * dollar or two — the GA/LA 0.01% behavior the engine models explicitly via
 * `rounding.incomeShare`. The documented conventions for these two states are:
 *
 *   - TN: full-precision PI, nearest-dollar order (Tenn. Comp. R. & Regs.
 *     .04(11)(a)). Also locked by the legacy-equivalence test.
 *   - FL: full-precision PI *by design*. Florida publishes no official
 *     calculator to match, so we carry the unrounded percentage and disclose it
 *     on the page rather than invent a 0.01% round Florida doesn't have
 *     (CSG/06_State_Forms/FL/FL_convention_findings.md).
 *
 * Both specs therefore omit `rounding.incomeShare`. This pins that the omission
 * means FULL PRECISION (not some default round): a discriminating ratio
 * 5000 / 8100 = 0.617283950…, which a 0.01% round would collapse to 0.6173.
 *
 * NOTE (separate finding, out of scope for the share-round axis): FL's spec
 * uses `finalOrder: "nearest_dollar"`, while FL_convention_findings.md states
 * the FL order carries cents. That is a final-order question, not a share-round
 * one, and is flagged for Taylor — this audit does not change it.
 */
const RATIO: IncomeSharesInputs = {
  parentAGrossMonthly: 5000,
  parentBGrossMonthly: 3100,
  numChildren: 1,
  parentingType: "standard",
  arpForStandard: "parent_a",
};
const FULL_A = 5000 / 8100; // 0.6172839506…
const FULL_B = 3100 / 8100; // 0.3827160493…
const ROUNDED_0_01PCT = Math.round(FULL_A * 10000) / 10000; // 0.6173

describe("share-rounding audit — FL + TN carry full-precision PI", () => {
  it("the ratio actually discriminates full precision from a 0.01% round", () => {
    expect(FULL_A).not.toBe(ROUNDED_0_01PCT);
    expect(Math.abs(FULL_A - ROUNDED_0_01PCT)).toBeGreaterThan(1e-5);
  });

  for (const [name, spec] of [
    ["TN", TN_INCOME_SHARES_SPEC],
    ["FL", FL_INCOME_SHARES_SPEC],
  ] as const) {
    it(`${name}: piA/piB are unrounded (a 0.01% round would break this)`, () => {
      const o = incomeShares(spec, RATIO);
      expect(o.errors).toEqual([]);
      expect(o.piA).toBeCloseTo(FULL_A, 8);
      expect(o.piB).toBeCloseTo(FULL_B, 8);
      // Guard: adding `incomeShare: "nearest_0.01pct"` to either spec would
      // round piA to 0.6173 and fail here.
      expect(Math.abs(o.piA - ROUNDED_0_01PCT)).toBeGreaterThan(1e-5);
    });
  }
});
