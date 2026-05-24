import { describe, expect, it } from "vitest";
import { calculateMS, defaultMSInputs } from "../calc";
import type { MSInputs } from "../types";

function withDefaults(patch: Partial<MSInputs>): MSInputs {
  return { ...defaultMSInputs(), ...patch };
}

describe("MS calc — § 43-19-101 verification tests", () => {
  // Spec §7 Test 1 — Simple median case
  it("Test 1: $30K / 2 kids / no special items = $402.33/mo", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 30000,
      obligorAnnualTaxes: 4000,
      obligorAnnualSocialSecurity: 1860,
      obligorAnnualMandatoryRetirement: 0,
    });
    const out = calculateMS(inputs);
    expect(out.annualAGI).toBe(24140);
    expect(out.monthlyAGI).toBeCloseTo(2011.67, 2);
    expect(out.statutoryPercentage).toBe(0.2);
    expect(out.presumptiveMonthly).toBeCloseTo(402.33, 2);
    expect(out.proposedFinalMonthly).toBeCloseTo(402.33, 2);
    expect(out.requiresFindingHighIncome).toBe(false);
    expect(out.requiresFindingLowIncome).toBe(false);
  });

  // Spec §7 Test 2 — High income, above $100K finding threshold
  it("Test 2: $250K / 3 kids triggers high-income finding flag", () => {
    const inputs = withDefaults({
      numChildren: 3,
      obligorAnnualGross: 250000,
      obligorAnnualTaxes: 60000,
      obligorAnnualSocialSecurity: 9114,
      obligorAnnualMandatoryRetirement: 0,
    });
    const out = calculateMS(inputs);
    expect(out.annualAGI).toBe(180886);
    expect(out.monthlyAGI).toBeCloseTo(15073.83, 2);
    expect(out.statutoryPercentage).toBe(0.22);
    expect(out.presumptiveMonthly).toBeCloseTo(3316.24, 1);
    expect(out.requiresFindingHighIncome).toBe(true);
    expect(out.requiresFindingLowIncome).toBe(false);
    expect(out.warnings.some((w) => w.includes("$100,000"))).toBe(true);
  });

  // Spec §7 Test 3 — Low income, below $10K finding threshold
  it("Test 3: $14K + $2,400 pre-existing / 1 kid triggers low-income finding", () => {
    const inputs = withDefaults({
      numChildren: 1,
      obligorAnnualGross: 14000,
      obligorAnnualTaxes: 1000,
      obligorAnnualSocialSecurity: 868,
      obligorAnnualMandatoryRetirement: 0,
      preexistingSupportAnnual: 2400,
    });
    const out = calculateMS(inputs);
    expect(out.annualAGI).toBe(9732);
    expect(out.monthlyAGI).toBeCloseTo(811, 0);
    expect(out.statutoryPercentage).toBe(0.14);
    expect(out.presumptiveMonthly).toBeCloseTo(113.54, 1);
    expect(out.requiresFindingHighIncome).toBe(false);
    expect(out.requiresFindingLowIncome).toBe(true);
    expect(out.warnings.some((w) => w.includes("$10,000"))).toBe(true);
  });

  // Spec §7 Test 4 — Health insurance provided by obligee adds to award
  it("Test 4: $80K / 2 kids + $300/mo health by obligee = $1,300.67/mo", () => {
    const inputs = withDefaults({
      numChildren: 2,
      obligorAnnualGross: 80000,
      obligorAnnualTaxes: 15000,
      obligorAnnualSocialSecurity: 4960,
      obligorAnnualMandatoryRetirement: 0,
      healthInsuranceMonthly: 300,
      healthInsuranceProvidedBy: "obligee",
    });
    const out = calculateMS(inputs);
    expect(out.annualAGI).toBe(60040);
    expect(out.presumptiveMonthly).toBeCloseTo(1000.67, 2);
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
      deviations: base.deviations.map((d) => {
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
      deviations: base.deviations.map((d) =>
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
  });
});
