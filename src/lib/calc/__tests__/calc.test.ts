import { describe, expect, it } from "vitest";
import { calculate, defaultInputs } from "../calc";
import { lookupBcso } from "../bcso";

describe("BCSO lookup", () => {
  it("rounds AGI UP to the next $50 schedule line", () => {
    // $4,025 should use the $4,050 row per .04(6)(b).
    const r = lookupBcso(4025, 3);
    expect(r.scheduleAgiUsed).toBe(4050);
    expect(r.source).toBe("schedule");
  });
  it("returns schedule BCSO for $12,500 / 3 children = $1,933", () => {
    const r = lookupBcso(12500, 3);
    expect(r.bcso).toBe(1933);
  });
  it("returns top-of-schedule cap at $28,250 / 3 children = $2,954", () => {
    const r = lookupBcso(28250, 3);
    expect(r.bcso).toBe(2954);
  });
  it("uses above-cap formula above $28,250", () => {
    const r = lookupBcso(79417, 3);
    expect(r.source).toBe("above_cap");
    // $2,954 + (79417 - 28250) × 7.77% = $2,954 + $3,975.68 ≈ $6,930
    expect(Math.round(r.bcso)).toBe(6930);
  });
});

describe("Verification Test 1 — Mid-income 50/50 (CSV scenario)", () => {
  const inputs = {
    ...defaultInputs(),
    parentAGrossMonthly: 8333.33,
    parentBGrossMonthly: 4166.67,
    numChildren: 3,
    parentingType: "equal" as const,
  };

  it("matches schedule lookup at $12,500 combined", () => {
    const out = calculate(inputs);
    expect(out.combinedAGI).toBe(12500);
    expect(out.bcso).toBe(1933);
  });

  it("net presumptive ≈ $644/mo, A → B", () => {
    const out = calculate(inputs);
    expect(out.netPresumptiveSupport).toBe(644);
    expect(out.presumptiveDirection).toBe("parent_a_to_b");
  });

  it("with $300 health (A pays) and $4,500/mo private school (B pays) → ~$3,544 A→B", () => {
    const out = calculate({
      ...inputs,
      healthPremiumMonthly: 300,
      healthPaidBy: "parent_a",
      includePrivateSchool: true,
      privateSchoolAnnual: 4500 * 12,
      privateSchoolPaidBy: "parent_b",
    });
    expect(out.allInDirection).toBe("parent_a_to_b");
    // $644 + ($4500 × 66.67% = $3,000 owed to B) − ($300 × 33.33% = $100 owed to A) = ~$3,544
    expect(Math.abs(out.allInMonthly - 3544)).toBeLessThanOrEqual(2);
  });
});

describe("Verification Test 2 — Above-cap 50/50", () => {
  it("net presumptive ≈ $2,014/mo, A → B (no add-ons)", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 51250,
      parentBGrossMonthly: 28167,
      numChildren: 3,
      parentingType: "equal",
    });
    expect(out.bcsoSource).toBe("above_cap");
    expect(out.bcso).toBe(6930);
    expect(out.netPresumptiveSupport).toBeGreaterThanOrEqual(2010);
    expect(out.netPresumptiveSupport).toBeLessThanOrEqual(2018);
    expect(out.presumptiveDirection).toBe("parent_a_to_b");
  });

  it("flags PCSO over the statutory max when applicable", () => {
    // Same as above but add $7,083/mo private school paid by A → A's share massive
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 51250,
      parentBGrossMonthly: 28167,
      numChildren: 3,
      parentingType: "equal",
      includePrivateSchool: true,
      privateSchoolAnnual: 85000,
      privateSchoolPaidBy: "parent_a",
    });
    // Statutory max for 3 children = $4,100.
    expect(out.pcsoStatutoryMax).toBe(4100);
    if (out.pcsoExceedsStatutoryMax) {
      expect(out.pcsoCapNote).not.toBeNull();
      expect(out.pcsoCapNote).toMatch(/private-school/);
    } else {
      expect(out.pcsoCapNote).toBeNull();
    }
    // The old wording must not appear anywhere in warnings.
    expect(out.warnings.some((w) => /exceeds the statutory maximum/i.test(w))).toBe(false);
  });
});

describe("Standard parenting (default 80-day ARP)", () => {
  it("ARP pays full pro-rata BCSO with no adjustment", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 8000,
      parentBGrossMonthly: 4000,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_b",
    });
    // Parent B is ARP, so B pays A their pro-rata share of BCSO.
    expect(out.presumptiveDirection).toBe("parent_b_to_a");
    expect(out.parentingTimeBand).toBe("standard");
  });
});

describe("Custom parenting bands", () => {
  it("ARP with 100 days → reduction band", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 265,
      parentBDays: 100,
    });
    expect(out.parentingTimeBand).toBe("reduction");
    expect(out.variableMultiplier).toBeCloseTo(100 * (2 / 182.5), 4);
  });

  it("ARP with 80 days → neutral band", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 285,
      parentBDays: 80,
    });
    expect(out.parentingTimeBand).toBe("neutral");
  });

  it("ARP with 60 days → increase band", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 305,
      parentBDays: 60,
    });
    expect(out.parentingTimeBand).toBe("increase");
  });
});

describe("Special Expenses 7% threshold", () => {
  it("monthly special expenses below 7% of BCSO → no deviation", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
      includeSpecialExpenses: true,
      specialExpensesAnnual: 100 * 12, // 7% of $1,933 = $135.31/mo
      specialExpensesPaidBy: "parent_a",
    });
    expect(out.specialExpensesIncludedAsDeviation).toBe(0);
  });

  it("monthly special expenses above 7% → deviation = excess", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
      includeSpecialExpenses: true,
      specialExpensesAnnual: 500 * 12, // 500/mo - 135.31 = ~365
      specialExpensesPaidBy: "parent_a",
    });
    expect(out.specialExpensesIncludedAsDeviation).toBeGreaterThanOrEqual(364);
    expect(out.specialExpensesIncludedAsDeviation).toBeLessThanOrEqual(366);
  });

  it("waive threshold → full amount is deviation", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
      includeSpecialExpenses: true,
      specialExpensesAnnual: 100 * 12,
      specialExpensesWaiveThreshold: true,
      specialExpensesPaidBy: "parent_a",
    });
    expect(out.specialExpensesIncludedAsDeviation).toBe(100);
  });
});

describe("Means-tested only", () => {
  it("zeros out the order", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 8000,
      parentBGrossMonthly: 4000,
      numChildren: 2,
      parentBMeansTestedOnly: true,
      parentingType: "standard",
    });
    expect(out.allInMonthly).toBe(0);
  });
});

describe("Sole / near-sole custody (TN)", () => {
  const base = {
    ...defaultInputs(),
    parentAGrossMonthly: 6000,
    parentBGrossMonthly: 4000,
    numChildren: 2,
  };

  it("365/0 puts ARP in the 'increase' band with a ~18.9% bump", () => {
    const out = calculate({
      ...base,
      parentingType: "custom",
      parentADays: 0,
      parentBDays: 365,
    });
    // A has 0 days → A is ARP → A pays B.
    expect(out.presumptiveDirection).toBe("parent_a_to_b");
    // Expected: proRataA × (1 + 69/365)
    const expected = out.bcso * out.piA * (1 + 69 / 365);
    expect(out.netPresumptiveSupport).toBe(Math.round(expected));
  });

  it("is symmetric when flipped 0/365 with equal incomes", () => {
    const equalIncome = { ...base, parentAGrossMonthly: 5000, parentBGrossMonthly: 5000 };
    const a = calculate({
      ...equalIncome,
      parentingType: "custom",
      parentADays: 0,
      parentBDays: 365,
    });
    const b = calculate({
      ...equalIncome,
      parentingType: "custom",
      parentADays: 365,
      parentBDays: 0,
    });
    expect(a.presumptiveDirection).toBe("parent_a_to_b");
    expect(b.presumptiveDirection).toBe("parent_b_to_a");
    expect(b.netPresumptiveSupport).toBe(a.netPresumptiveSupport);
  });

  it("standard 285/80 preset matches custom 285/80", () => {
    const std = calculate({
      ...base,
      parentingType: "standard",
      arpForStandard: "parent_b",
    });
    const cus = calculate({
      ...base,
      parentingType: "custom",
      parentADays: 285,
      parentBDays: 80,
    });
    expect(cus.netPresumptiveSupport).toBe(std.netPresumptiveSupport);
    expect(cus.presumptiveDirection).toBe(std.presumptiveDirection);
  });

  it("low-income obligor at 0 days still respects the $100 minimum floor", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 500,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 0,
      parentBDays: 365,
    });
    expect(out.allInMonthly).toBeGreaterThanOrEqual(100);
  });
});
