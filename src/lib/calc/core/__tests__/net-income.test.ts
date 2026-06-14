import { describe, expect, it } from "vitest";
import { incomeShares } from "../income-shares";
import type { IncomeSharesSpec } from "../spec";
import type { IncomeSharesInputs } from "../types";
import { AR_INCOME_SHARES_SPEC } from "../../states/ar/spec";

/**
 * The income_shares_net gross→net pre-step (FL) is named but stubbed
 * fail-loud. Any attempt to run an income_shares_net state must throw with a
 * clear message until the FL pack lands — and income_shares_gross states must
 * be completely unaffected.
 */
describe("income_shares_net pre-step is fail-loud until implemented", () => {
  const inputs: IncomeSharesInputs = {
    parentAGrossMonthly: 5000,
    parentBGrossMonthly: 3000,
    numChildren: 1,
    parentingType: "standard",
    arpForStandard: "parent_a",
  };

  it("throws for an income_shares_net spec", () => {
    const netSpec: IncomeSharesSpec = {
      ...AR_INCOME_SHARES_SPEC,
      code: "FL_STUB",
      model: "income_shares_net",
      netIncome: { deductions: ["federal_income_tax", "fica"] },
    };
    expect(() => incomeShares(netSpec, inputs)).toThrow(/income_shares_net/);
  });

  it("does not affect income_shares_gross states", () => {
    expect(() => incomeShares(AR_INCOME_SHARES_SPEC, inputs)).not.toThrow();
  });
});
