import { describe, expect, it } from "vitest";
import { loadFixtures } from "../fixtures";
import { incomeShares } from "../income-shares";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../types";
import { AR_INCOME_SHARES_SPEC } from "../../states/ar/spec";

/** Assert each present field in `expected` matches `actual` (money-tolerant). */
function assertExpected(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
) {
  for (const [key, want] of Object.entries(expected)) {
    const got = actual[key];
    if (typeof want === "number") {
      expect(got, key).toBeCloseTo(want, 2);
    } else {
      expect(got, key).toBe(want);
    }
  }
}

describe("AR fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/ar/fixtures.json", import.meta.url),
  );

  it("loaded all 9 AR fixtures", () => {
    expect(fixtures.length).toBe(9);
  });

  for (const fx of fixtures) {
    it(`${fx.id}`, () => {
      const out = incomeShares(
        AR_INCOME_SHARES_SPEC,
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
