import { describe, expect, it } from "vitest";
import { loadFixtures } from "../fixtures";
import { incomeShares } from "../income-shares";
import { grossToNetMonthly, grossToNetSteps } from "../net-income";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../types";
import { FL_INCOME_SHARES_SPEC } from "../../states/fl/spec";

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

describe("FL net pre-step (user-supplied deduction summation)", () => {
  // FL-grossToNet-running-total fixture: § 61.30(3) ordered deductions.
  const items = [
    { id: "federal_income_tax", amount: 1000 },
    { id: "fica_or_self_employment_tax", amount: 535.5 },
    { id: "mandatory_union_dues", amount: 50 },
    { id: "mandatory_retirement", amount: 200 },
    { id: "health_insurance_obligor_not_children", amount: 150 },
    { id: "court_ordered_support_other_children_actually_paid", amount: 400 },
    { id: "spousal_support_paid", amount: 0 },
  ];

  it("sums to net 4664.5", () => {
    expect(grossToNetMonthly(7000, items.map((i) => i.amount))).toBeCloseTo(
      4664.5,
      2,
    );
  });

  it("running total matches the per-step fixture", () => {
    const { steps, net } = grossToNetSteps(7000, items);
    expect(net).toBeCloseTo(4664.5, 2);
    expect(steps[1].runningNet).toBeCloseTo(6000, 2); // after federal tax
    expect(steps[2].runningNet).toBeCloseTo(5464.5, 2); // after FICA
    expect(steps[steps.length - 1].runningNet).toBeCloseTo(4664.5, 2);
  });
});

describe("FL fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/fl/fixtures.json", import.meta.url),
  );

  it("loaded all 10 FL calc fixtures", () => {
    expect(fixtures.length).toBe(10);
  });

  for (const fx of fixtures) {
    it(`${fx.id}`, () => {
      const out = incomeShares(
        FL_INCOME_SHARES_SPEC,
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
