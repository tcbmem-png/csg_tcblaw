import { describe, expect, it } from "vitest";
import { calculateMS, defaultMSInputs } from "../calc";
import type { MSInputs } from "../types";

function withDefaults(patch: Partial<MSInputs>): MSInputs {
  return { ...defaultMSInputs(), ...patch };
}

describe("MS calc — § 43-19-101 verification tests", () => {
  it("Test 1: $30K / 2 kids / no special items = $402.33/mo", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 30000,
      obligorAnnualTaxes: 4000,
      obligorAnnualSocialSecurity: 1860,
    });
    const out = calculateMS(inputs);
    expect(out.annualAGI).toBe(24140);
    expect(out.monthlyAGI).toBeCloseTo(2011.67, 2);
    expect(out.statutoryPercentage).toBe(0.2);
    expect(out.presumptiveMonthly).toBeCloseTo(402.33, 2);
    expect(out.proposedFinalMonthly).toBeCloseTo(402.33, 2);
    expect(out.requiresFindingHighIncome).toBe(false);
    expect(out.requiresFindingLowIncome).toBe(false);
    expect(out.suspensionApplies).toBe(false);
  });

  it("Test 2: $250K / 3 kids triggers high-income finding flag", () => {
    const inputs = withDefaults({
      numChildren: 3,
      obligorAnnualGross: 250000,
      obligorAnnualTaxes: 60000,
      obligorAnnualSocialSecurity: 9114,
    });
    const out = calculateMS(inputs);
    expect(out.requiresFindingHighIncome).toBe(true);
    expect(out.warnings.some((w) => w.includes("$100,000"))).toBe(true);
  });

  it("Test 3: $14K + $2,400 pre-existing / 1 kid triggers low-income finding", () => {
    const inputs = withDefaults({
      numChildren: 1,
      obligorAnnualGross: 14000,
      obligorAnnualTaxes: 1000,
      obligorAnnualSocialSecurity: 868,
      preexistingSupportAnnual: 2400,
    });
    const out = calculateMS(inputs);
    expect(out.requiresFindingLowIncome).toBe(true);
    expect(out.warnings.some((w) => w.includes("$10,000"))).toBe(true);
  });

  it("Test 4: $80K / 2 kids + $300/mo health by obligee = $1,300.67/mo", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 80000,
      obligorAnnualTaxes: 15000,
      obligorAnnualSocialSecurity: 4960,
      healthInsuranceMonthly: 300,
      healthInsuranceProvidedBy: "obligee",
    });
    const out = calculateMS(inputs);
    expect(out.healthInsuranceAddOnMonthly).toBe(300);
    expect(out.proposedFinalMonthly).toBeCloseTo(1300.67, 2);
  });
});

describe("MS calc — additional invariants", () => {
  it("caps statutory percentage at 26% for 6+ children", () => {
    const out = calculateMS(
      withDefaults({ numChildren: 8, obligorAnnualGross: 60000 }),
    );
    expect(out.statutoryPercentage).toBe(0.26);
  });

  it("applicable deviations sum and apply (signed)", () => {
    const base = defaultMSInputs();
    const inputs: MSInputs = {
      ...base,
      numChildren: 2,
      obligorAnnualGross: 60000,
      obligorAnnualTaxes: 10000,
      obligorAnnualSocialSecurity: 3720,
      deviationsA: base.deviationsA.map((d) => {
        if (d.letter === "a") return { ...d, applicable: true, description: "Orthodontia", proposedMonthly: 150 };
        if (d.letter === "g") return { ...d, applicable: true, description: "50/50 schedule", proposedMonthly: -200 };
        return d;
      }),
    };
    const out = calculateMS(inputs);
    expect(out.totalDeviationsMonthly).toBe(-50);
    expect(out.proposedFinalMonthly).toBeCloseTo(out.presumptiveMonthly - 50, 2);
  });

  it("never produces a negative final award", () => {
    const base = defaultMSInputs();
    const inputs: MSInputs = {
      ...base,
      numChildren: 1,
      obligorAnnualGross: 20000,
      obligorAnnualTaxes: 2000,
      obligorAnnualSocialSecurity: 1240,
      deviationsA: base.deviationsA.map((d) =>
        d.letter === "j"
          ? { ...d, applicable: true, description: "Massive offset", proposedMonthly: -10000 }
          : d,
      ),
    };
    const out = calculateMS(inputs);
    expect(out.proposedFinalMonthly).toBe(0);
  });

  it("shared custody flag emits a Factor (g) note", () => {
    const out = calculateMS(
      withDefaults({ obligorAnnualGross: 50000, sharedCustodyFlag: true }),
    );
    expect(out.warnings.some((w) => w.includes("§ 43-19-103(g)"))).toBe(true);
    // Guard against regression to the (i)-mapped variant shipped briefly in v6.
    expect(out.warnings.some((w) => w.includes("§ 43-19-103(i)"))).toBe(false);
  });
});

// =============================================================
// Spec §9 — verification tests for the v2 upgrade
// =============================================================

describe("MS calc — § 43-19-36 incarceration suspension (Test D)", () => {
  it("incarceration > 180 days, no carve-out, no means → suspension short-circuits to $0", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 30000,
      obligorAnnualTaxes: 4000,
      obligorAnnualSocialSecurity: 1860,
      incarceration: {
        status: "over_180",
        reasons: { domesticViolence: false, childAbuse: false, criminalNonpayment: false },
        hasMeansToPay: false,
      },
    });
    const out = calculateMS(inputs);
    expect(out.suspensionApplies).toBe(true);
    expect(out.proposedFinalMonthly).toBe(0);
    expect(out.suspensionReason).toContain("§ 43-19-36");
    expect(out.warnings.some((w) => w.includes("§ 43-19-36"))).toBe(true);
  });
});

describe("MS calc — § 43-19-36 carve-out (Test E)", () => {
  it("domestic violence carve-out preserves the full obligation", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 30000,
      obligorAnnualTaxes: 4000,
      obligorAnnualSocialSecurity: 1860,
      incarceration: {
        status: "over_180",
        reasons: { domesticViolence: true, childAbuse: false, criminalNonpayment: false },
        hasMeansToPay: false,
      },
    });
    const out = calculateMS(inputs);
    expect(out.suspensionApplies).toBe(false);
    expect(out.proposedFinalMonthly).toBeCloseTo(402.33, 2);
    expect(out.warnings.some((w) => w.includes("§ 43-19-36(2)(b)"))).toBe(true);
  });

  it("means-to-pay exception preserves the full obligation", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 30000,
      obligorAnnualTaxes: 4000,
      obligorAnnualSocialSecurity: 1860,
      incarceration: {
        status: "over_180",
        reasons: { domesticViolence: false, childAbuse: false, criminalNonpayment: false },
        hasMeansToPay: true,
      },
    });
    const out = calculateMS(inputs);
    expect(out.suspensionApplies).toBe(false);
    expect(out.proposedFinalMonthly).toBeGreaterThan(0);
    expect(out.warnings.some((w) => w.includes("§ 43-19-36(2)(a)"))).toBe(true);
  });
});

describe("MS calc — imputation basis flag (Test F)", () => {
  it("imputed AGI emits a § 43-19-101(5) note", () => {
    const inputs = withDefaults({
      numChildren: 1,
      obligorAnnualGross: 40000,
      obligorAnnualTaxes: 5000,
      obligorAnnualSocialSecurity: 2480,
      agiBasis: "imputed",
      imputationBasis: {
        pastEarnings: true,
        jobSkills: true,
        localMarket: false,
        availableEmployers: false,
        other: false,
        note: "",
      },
    });
    const out = calculateMS(inputs);
    expect(out.warnings.some((w) => w.includes("§ 43-19-101(5)"))).toBe(true);
  });
});

describe("MS calc — side-by-side comparison (Test C)", () => {
  it("computes position A and position B independently with the same presumptive base", () => {
    const base = defaultMSInputs();
    const inputs: MSInputs = {
      ...base,
      numChildren: 2,
      obligorAnnualGross: 80000,
      obligorAnnualTaxes: 15000,
      obligorAnnualSocialSecurity: 4960,
      comparisonMode: "side_by_side",
      deviationsA: base.deviationsA.map((d) =>
        d.letter === "a" ? { ...d, applicable: true, proposedMonthly: 300, description: "A's position" } : d,
      ),
      deviationsB: base.deviationsA.map((d) =>
        d.letter === "a" ? { ...d, applicable: true, proposedMonthly: 100, description: "B's position" } : d,
      ),
    };
    const out = calculateMS(inputs);
    expect(out.totalDeviationsMonthly).toBe(300);
    expect(out.positionB?.totalMonthly).toBe(100);
    const gap = (out.proposedFinalMonthly - (out.positionB?.proposedFinalMonthly ?? 0));
    expect(gap).toBeCloseTo(200, 2);
  });
});

describe("MS — sole custody is the default presumption", () => {
  it("custody arrangement is not an input to the formula", () => {
    const base = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 60000,
      obligorAnnualTaxes: 10000,
      obligorAnnualSocialSecurity: 3720,
    });
    const sole = calculateMS({ ...base, sharedCustodyFlag: false });
    const shared = calculateMS({ ...base, sharedCustodyFlag: true });
    expect(shared.presumptiveMonthly).toBe(sole.presumptiveMonthly);
    expect(shared.proposedFinalMonthly).toBe(sole.proposedFinalMonthly);
  });
});
