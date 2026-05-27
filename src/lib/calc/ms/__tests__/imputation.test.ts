/**
 * §1.7 Imputation — blended-AGI math, application slider, scenario labels.
 * Authority: Miss. Code Ann. § 43-19-101(5) (HB 1067, 2022-07-01).
 */
import { describe, it, expect } from "vitest";
import { calculateMS, defaultMSInputs } from "../calc";
import { defaultMSImputationBasis } from "../types";
import type { MSInputs } from "../types";

function imputed(overrides: Partial<MSInputs> = {}): MSInputs {
  return {
    ...defaultMSInputs(),
    numChildren: 1,
    obligorAnnualGross: 24000,
    obligorAnnualTaxes: 0,
    obligorAnnualSocialSecurity: 0,
    obligorAnnualMandatoryRetirement: 0,
    agiBasis: "imputed",
    imputationBasis: {
      ...defaultMSImputationBasis(),
      assertedBy: "obligee",
      imputedAnnualGross: 60000,
      applicationPct: 100,
      factors: {
        ...defaultMSImputationBasis().factors,
        jobSkills: "Licensed welder, 12 yrs experience.",
        workSeeking: "Two applications filed in last 6 months.",
      },
    },
    ...overrides,
  };
}

describe("MS §1.7 imputation blending", () => {
  it("100% application uses the imputed figure verbatim", () => {
    const out = calculateMS(imputed());
    expect(out.imputationActive).toBe(true);
    expect(out.imputationApplicationPct).toBe(100);
    expect(out.blendedAnnualGross).toBe(60000);
    expect(out.annualAGI).toBe(60000);
  });

  it("0% application falls back to actual gross", () => {
    const out = calculateMS(
      imputed({
        imputationBasis: {
          ...defaultMSImputationBasis(),
          assertedBy: "obligee",
          imputedAnnualGross: 60000,
          applicationPct: 0,
        },
      }),
    );
    expect(out.blendedAnnualGross).toBe(24000);
    expect(out.annualAGI).toBe(24000);
  });

  it("50% application blends actual and imputed linearly", () => {
    const out = calculateMS(
      imputed({
        imputationBasis: {
          ...defaultMSImputationBasis(),
          assertedBy: "obligee",
          imputedAnnualGross: 60000,
          applicationPct: 50,
        },
      }),
    );
    // 24000 * 0.5 + 60000 * 0.5 = 42000
    expect(out.blendedAnnualGross).toBe(42000);
    expect(out.annualAGI).toBe(42000);
  });

  it("inactive when imputed amount is zero (form not yet filled)", () => {
    const out = calculateMS(
      imputed({
        imputationBasis: {
          ...defaultMSImputationBasis(),
          assertedBy: "obligee",
          imputedAnnualGross: 0,
          applicationPct: 100,
        },
      }),
    );
    expect(out.imputationActive).toBe(false);
    expect(out.blendedAnnualGross).toBe(24000);
  });

  it("emits scenario-modeling label when active", () => {
    const out = calculateMS(imputed());
    expect(
      out.warnings.some((w) =>
        w.includes("Scenario modeling — not a court determination"),
      ) ||
        out.warnings.some((w) =>
          w.includes("scenario modeling — not a court determination"),
        ),
    ).toBe(true);
  });

  it("clamps an out-of-range slider into 0..100", () => {
    const out = calculateMS(
      imputed({
        imputationBasis: {
          ...defaultMSImputationBasis(),
          assertedBy: "obligee",
          imputedAnnualGross: 60000,
          applicationPct: 150 as unknown as number,
        },
      }),
    );
    expect(out.imputationApplicationPct).toBe(100);
  });

  it("actual basis ignores the imputation block entirely", () => {
    const base = defaultMSInputs();
    const out = calculateMS({
      ...base,
      numChildren: 1,
      obligorAnnualGross: 24000,
      imputationBasis: {
        ...defaultMSImputationBasis(),
        imputedAnnualGross: 999999,
        applicationPct: 100,
      },
    });
    expect(out.imputationActive).toBe(false);
    expect(out.annualAGI).toBe(24000);
  });
});
