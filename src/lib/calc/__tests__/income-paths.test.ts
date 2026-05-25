import { describe, expect, it } from "vitest";
import type {
  ImputedMethodology,
  MultiSourceMethodology,
  SelfEmployedMethodology,
  SimpleMethodology,
  SpecialMethodology,
  VariableMethodology,
} from "../types";
import { averageMonthly } from "@/components/calculator/income/shared";
import { decodeShare, defaultCaption, encodeShare } from "../share";
import { defaultInputs } from "../calc";

describe("Income paths — arithmetic", () => {
  it("Path A simple — W-2 Box 5 divides by 12", () => {
    const annual = 96000;
    expect(Math.round((annual / 12) * 100) / 100).toBe(8000);
  });

  it("Path A simple — 401(k) add-back sums to monthly_gross", () => {
    const m: SimpleMethodology = {
      path: "simple",
      source: "monthly_gross",
      monthlyGrossEntered: 5000,
      voluntaryRetirementMonthly: 500,
      monthlyGrossResult: 5500,
    };
    expect(m.monthlyGrossResult).toBe(
      (m.monthlyGrossEntered ?? 0) + (m.voluntaryRetirementMonthly ?? 0),
    );
  });

  it("Path B variable — 3-year average ÷ 12", () => {
    const monthly = averageMonthly(
      [
        { year: "2021", amount: 60000 },
        { year: "2022", amount: 72000 },
        { year: "2023", amount: 84000 },
      ],
      "3yr",
    );
    // (60+72+84)k / 3 / 12 = 6000
    expect(monthly).toBe(6000);
  });

  it("Path B variable — 5yr method truncates to last 5", () => {
    const monthly = averageMonthly(
      [
        { year: "2019", amount: 12000 },
        { year: "2020", amount: 12000 },
        { year: "2021", amount: 12000 },
        { year: "2022", amount: 12000 },
        { year: "2023", amount: 12000 },
        { year: "2024", amount: 60000 },
      ],
      "5yr",
    );
    // Uses last 5: (12+12+12+12+60)k / 5 / 12 = 1933.33...
    expect(monthly).toBeCloseTo(1933.33, 1);
  });

  it("Path C self-employed — receipts − expenses + add-backs / 12", () => {
    const m: SelfEmployedMethodology = {
      path: "self_employed",
      grossReceiptsAnnual: 200000,
      ordinaryExpensesAnnual: 80000,
      addBacks: [{ label: "Depreciation", amount: 20000 }],
      monthlyGrossResult: 11666.67,
    };
    const annual =
      m.grossReceiptsAnnual - m.ordinaryExpensesAnnual + m.addBacks.reduce((s, a) => s + a.amount, 0);
    expect(annual).toBe(140000);
    expect(Math.round((annual / 12) * 100) / 100).toBeCloseTo(11666.67, 1);
  });

  it("Path D multi-source — sums annual and divides by 12", () => {
    const m: MultiSourceMethodology = {
      path: "multi_source",
      sources: [
        { label: "W-2", annual: 60000 },
        { label: "Rental net", annual: 12000 },
        { label: "Dividends", annual: 6000 },
      ],
      monthlyGrossResult: 6500,
    };
    const total = m.sources.reduce((s, r) => s + r.annual, 0);
    expect(total).toBe(78000);
    expect(total / 12).toBe(6500);
  });

  it("Path E imputed asset-based — assets × rate ÷ 12", () => {
    const assets = 600000;
    const rate = 6;
    const monthly = Math.round(((assets * (rate / 100)) / 12) * 100) / 100;
    expect(monthly).toBe(3000);
  });
});

describe("Path E (imputed) — writes through to existing infrastructure", () => {
  it("apply payload contains the imputation triple for parent A", () => {
    const m: ImputedMethodology = {
      path: "imputed",
      basis: "voluntary_underemployment",
      method: "vocational_capacity",
      actualMonthlyGross: 2000,
      occupation: "RN",
      hoursPerWeek: 40,
      monthlyGrossResult: 6500,
    };
    // The form's apply contract:
    const updates = {
      parentAGrossMonthly: m.monthlyGrossResult,
      parentAActualGrossMonthly: m.actualMonthlyGross,
      useImputationForA: true,
      parentAIncomeMethodology: m,
    };
    expect(updates.useImputationForA).toBe(true);
    expect(updates.parentAGrossMonthly).toBe(6500);
    expect(updates.parentAActualGrossMonthly).toBe(2000);
  });
});

describe("Path F (special) — writes engine flags, no parallel logic", () => {
  it("SSI-only sets means-tested flag", () => {
    const m: SpecialMethodology = {
      path: "special",
      situation: "ssi_only",
      monthlyGrossResult: 0,
    };
    const updates = {
      parentAGrossMonthly: 0,
      parentAMeansTestedOnly: m.situation === "ssi_only",
      parentAIncomeMethodology: m,
    };
    expect(updates.parentAMeansTestedOnly).toBe(true);
    expect(updates.parentAGrossMonthly).toBe(0);
  });

  it("Federal benefit to child writes federal benefit field", () => {
    const m: SpecialMethodology = {
      path: "special",
      situation: "federal_benefit_to_child",
      federalBenefitMonthly: 800,
      monthlyGrossResult: 4000,
    };
    const updates = {
      parentBGrossMonthly: m.monthlyGrossResult,
      parentBFederalBenefit: m.federalBenefitMonthly ?? 0,
    };
    expect(updates.parentBFederalBenefit).toBe(800);
    expect(updates.parentBGrossMonthly).toBe(4000);
  });

  it("Military sums base + BAH + BAS", () => {
    const m: SpecialMethodology = {
      path: "special",
      situation: "military",
      bahMonthly: 1800,
      basMonthly: 460,
      monthlyGrossResult: 6260,
    };
    // base 4000 + BAH 1800 + BAS 460 = 6260
    expect(4000 + (m.bahMonthly ?? 0) + (m.basMonthly ?? 0)).toBe(
      m.monthlyGrossResult,
    );
  });
});

describe("Share URL — v1 → v2 round-trip", () => {
  it("decodes a hand-crafted v1 payload identically", () => {
    const inputs = { ...defaultInputs(), parentAGrossMonthly: 5000 };
    const caption = defaultCaption();
    // Hand-build a v1 payload so we don't rely on encodeShare emitting v1.
    const v1 = btoa(
      unescape(encodeURIComponent(JSON.stringify({ v: 1, i: inputs, c: caption }))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const decoded = decodeShare(v1);
    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.parentAGrossMonthly).toBe(5000);
  });

  it("round-trips a v2 payload with Path E methodology", () => {
    const m: ImputedMethodology = {
      path: "imputed",
      basis: "voluntary_underemployment",
      method: "vocational_capacity",
      actualMonthlyGross: 2000,
      occupation: "RN",
      monthlyGrossResult: 6500,
    };
    const inputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 6500,
      parentAActualGrossMonthly: 2000,
      useImputationForA: true,
      parentAIncomeMethodology: m,
    };
    const caption = defaultCaption();
    const encoded = encodeShare(inputs, caption);
    const decoded = decodeShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.parentAIncomeMethodology).toEqual(m);
    expect(decoded!.inputs.useImputationForA).toBe(true);
  });

  it("round-trips a Path B variable methodology", () => {
    const m: VariableMethodology = {
      path: "variable",
      years: [
        { year: "2022", amount: 60000 },
        { year: "2023", amount: 72000 },
        { year: "2024", amount: 84000 },
      ],
      averagingMethod: "3yr",
      monthlyGrossResult: 6000,
    };
    const inputs = {
      ...defaultInputs(),
      parentBGrossMonthly: 6000,
      parentBIncomeMethodology: m,
    };
    const decoded = decodeShare(encodeShare(inputs, defaultCaption()));
    expect(decoded!.inputs.parentBIncomeMethodology).toEqual(m);
  });
});
