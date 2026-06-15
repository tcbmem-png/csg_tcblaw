import { describe, expect, it } from "vitest";
import { incomeShares } from "../income-shares";
import type { IncomeSharesInputs } from "../types";
import { AR_INCOME_SHARES_SPEC } from "../../states/ar/spec";
import { FL_INCOME_SHARES_SPEC } from "../../states/fl/spec";

/**
 * The income_shares_net gross→net pre-step is now implemented (FL). It must
 * compute (not throw), and income_shares_gross states must be unaffected.
 */
describe("income_shares_net gross→net pre-step", () => {
  const inputs: IncomeSharesInputs = {
    parentAGrossMonthly: 6000,
    parentBGrossMonthly: 4000,
    parentANetDeductions: [1000, 500],
    parentBNetDeductions: [600],
    numChildren: 1,
    parentingType: "custom",
    arpForStandard: "parent_a",
    parentADays: 60,
    parentBDays: 305,
  };

  it("nets gross by summing the supplied deductions", () => {
    const out = incomeShares(FL_INCOME_SHARES_SPEC, inputs);
    expect(out.errors).toEqual([]);
    // A net = 6000 - 1500 = 4500; B net = 4000 - 600 = 3400; combined 7900
    expect(out.parentAAGI).toBe(4500);
    expect(out.parentBAGI).toBe(3400);
    expect(out.combinedAGI).toBe(7900);
  });

  it("does not affect income_shares_gross states (AR)", () => {
    expect(() =>
      incomeShares(AR_INCOME_SHARES_SPEC, {
        parentAGrossMonthly: 5000,
        parentBGrossMonthly: 3000,
        numChildren: 2,
        parentingType: "standard",
        arpForStandard: "parent_a",
      } satisfies IncomeSharesInputs as IncomeSharesInputs),
    ).not.toThrow();
  });
});
