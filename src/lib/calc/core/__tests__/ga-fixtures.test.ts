import { describe, expect, it } from "vitest";
import { loadFixtures } from "../fixtures";
import { incomeShares } from "../income-shares";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../types";
import { GA_INCOME_SHARES_SPEC } from "../../states/ga/spec";

/**
 * GA assertions allow ±$0.05 on dollar fields: the cross_credit power-of-2.5
 * arithmetic carries cents and the pack's worked figures are to 2 decimals.
 * Shares are checked to 4 decimals. The PTA fixtures are oracle-validated.
 */
function assertExpected(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
) {
  for (const [key, want] of Object.entries(expected)) {
    const got = actual[key];
    if (typeof want === "number") {
      const prec = key === "piA" || key === "piB" ? 3 : 1;
      expect(got, key).toBeCloseTo(want, prec);
    } else {
      expect(got, key).toBe(want);
    }
  }
}

describe("GA fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/ga/fixtures.json", import.meta.url),
  );

  it("loaded all 10 GA fixtures", () => {
    expect(fixtures.length).toBe(10);
  });

  for (const fx of fixtures) {
    it(`${fx.id}`, () => {
      const out = incomeShares(
        GA_INCOME_SHARES_SPEC,
        fx.inputs as IncomeSharesInputs,
      );
      expect(out.errors, "errors").toEqual([]);
      assertExpected(
        out as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
      );
    });
  }
});
