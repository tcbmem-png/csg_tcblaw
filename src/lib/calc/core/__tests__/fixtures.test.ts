import { describe, expect, it } from "vitest";
import { loadFixtures } from "../fixtures";
import { calculate, defaultInputs } from "../../states/tn/calc";
import type { CalcInputs, CalcOutputs } from "../../states/tn/types";
import {
  TN_INCOME_SHARES_SPEC,
  calcInputsToIncomeShares,
} from "../../states/tn/spec";
import { incomeShares } from "../income-shares";
import { calculateMS, defaultMSInputs } from "../../ms/calc";
import type { MSInputs, MSOutputs } from "../../ms/types";

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

describe("TN fixtures reproduce through the TN engine AND the generic core", () => {
  const fixtures = loadFixtures<CalcInputs, CalcOutputs>(
    new URL("../../states/tn/fixtures.json", import.meta.url),
  );

  it("loaded TN fixtures", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fx of fixtures) {
    const full: CalcInputs = { ...defaultInputs(), ...fx.inputs };

    it(`${fx.id} — TN engine`, () => {
      assertExpected(
        calculate(full) as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
      );
    });

    it(`${fx.id} — generic income-shares core`, () => {
      const generic = incomeShares(
        TN_INCOME_SHARES_SPEC,
        calcInputsToIncomeShares(full),
      );
      assertExpected(
        generic as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
      );
    });
  }
});

describe("MS fixtures reproduce through the MS engine", () => {
  const fixtures = loadFixtures<MSInputs, MSOutputs>(
    new URL("../../ms/fixtures.json", import.meta.url),
  );

  it("loaded MS fixtures", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fx of fixtures) {
    it(`${fx.id} — MS engine`, () => {
      const full: MSInputs = { ...defaultMSInputs(), ...fx.inputs };
      assertExpected(
        calculateMS(full) as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
      );
    });
  }
});
