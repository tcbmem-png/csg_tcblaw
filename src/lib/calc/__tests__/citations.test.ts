/**
 * Mechanical verification of the article's "every formula annotated" claim.
 *
 * Walks the shared worksheet manifest (the single source of truth that both
 * the in-app worksheet and the PDF consume) over a curated fixture set and
 * asserts every numeric line carries a CITATIONS-registered key. CI fails
 * if a new worksheet line is added without a corresponding citation entry —
 * the same class of mechanical check that would have caught the MS factor
 * letter regression.
 */
import { describe, it, expect } from "vitest";
import { calculate as calc } from "@/lib/calc/calc";
import { CITATIONS, TN_CHAPTER_URL } from "@/lib/calc/citations";
import { manifestFor } from "@/lib/calc/citation-resolvers";
import type { CalcInputs } from "@/lib/calc/types";

function baseInputs(over: Partial<CalcInputs> = {}): CalcInputs {
  return {
    parentALabel: "Parent A",
    parentBLabel: "Parent B",
    parentAGrossMonthly: 5000,
    parentBGrossMonthly: 4000,
    useImputationForA: false,
    useImputationForB: false,
    youngestChildAge: 8,
    parentAMeansTestedOnly: false,
    parentBMeansTestedOnly: false,
    parentASECredit: 0,
    parentBSECredit: 0,
    parentAPriorSupport: 0,
    parentBPriorSupport: 0,
    parentAInhomeCredit: 0,
    parentBInhomeCredit: 0,
    parentAFederalBenefit: 0,
    parentBFederalBenefit: 0,
    numChildren: 2,
    parentingType: "standard",
    arpForStandard: "parent_b",
    healthPremiumMonthly: 0,
    healthPaidBy: "parent_a",
    uninsuredMedicalMonthly: 0,
    uninsuredMedicalPaidBy: "parent_a",
    childcareMonthly: 0,
    childcarePaidBy: "parent_a",
    childcarePayrollDeducted: false,
    includePrivateSchool: false,
    privateSchoolAnnual: 0,
    privateSchoolPaidBy: "parent_a",
    includeSpecialExpenses: false,
    specialExpensesAnnual: 0,
    specialExpensesWaiveThreshold: false,
    specialExpensesPaidBy: "parent_a",
    ...over,
  };
}

const FIXTURES: Record<string, CalcInputs> = {
  "standard, mid-income": baseInputs(),
  "above-cap": baseInputs({
    parentAGrossMonthly: 25000,
    parentBGrossMonthly: 10000,
    numChildren: 3,
  }),
  "equal parenting 50/50": baseInputs({
    parentingType: "equal",
    arpForStandard: undefined,
  }),
  "ssr engaged (low-income obligor)": baseInputs({
    parentAGrossMonthly: 8000,
    parentBGrossMonthly: 1100,
    arpForStandard: "parent_b",
  }),
  "means-tested only": baseInputs({
    parentBGrossMonthly: 0,
    parentBMeansTestedOnly: true,
  }),
  "with add-ons + deviations": baseInputs({
    healthPremiumMonthly: 250,
    childcareMonthly: 800,
    uninsuredMedicalMonthly: 75,
    includePrivateSchool: true,
    privateSchoolAnnual: 12000,
    includeSpecialExpenses: true,
    specialExpensesAnnual: 6000,
  }),
};

describe("citation framework — mechanical verification", () => {
  it("every CITATIONS entry uses a recognized rule or statute prefix", () => {
    // Accept TN rule paragraphs ("1240-02-04-.04(3)(a)2.(iv)" or "...-.04(7)(a), (h), (i)")
    // and statutory cites starting "Tenn. Code Ann. §".
    const ruleShape = /^1240-02-04-\.\d+(\([0-9a-zA-Z]+\)|\d+\.|,\s|\s)*$|^Tenn\. Code Ann\. §/;
    for (const [key, c] of Object.entries(CITATIONS)) {
      expect(ruleShape.test(c.rule), `${key} → ${c.rule}`).toBe(true);
    }
  });

  it("every CITATIONS entry has a non-empty name and plain-English explanation", () => {
    for (const [key, c] of Object.entries(CITATIONS)) {
      expect(c.name.length, key).toBeGreaterThan(0);
      expect(c.plain.length, key).toBeGreaterThan(20);
    }
  });

  it("TN-rule citations link to the chapter PDF; statutory citations may omit URL", () => {
    for (const [key, c] of Object.entries(CITATIONS)) {
      if (c.rule.startsWith("1240-02-04-")) {
        expect(c.url, `${key} should link to TN chapter PDF`).toBe(
          TN_CHAPTER_URL,
        );
      }
    }
  });

  describe.each(Object.entries(FIXTURES))("fixture: %s", (_name, inputs) => {
    const outputs = calc(inputs);
    const manifest = manifestFor(inputs, outputs);

    it("emits at least one manifest entry", () => {
      expect(manifest.length).toBeGreaterThan(0);
    });

    it("every numeric line has a citation key registered in CITATIONS", () => {
      const offenders: string[] = [];
      for (const entry of manifest) {
        if (!entry.numeric) continue;
        if (entry.citation === null) {
          offenders.push(`${entry.label} (numeric line with null citation)`);
          continue;
        }
        if (!(entry.citation in CITATIONS)) {
          offenders.push(
            `${entry.label} → unknown CITATIONS key "${entry.citation}"`,
          );
        }
      }
      expect(offenders, offenders.join("\n")).toEqual([]);
    });

    it("every cited entry resolves to a paragraph-specific or statutory rule string", () => {
      for (const entry of manifest) {
        if (!entry.citation) continue;
        const c = CITATIONS[entry.citation];
        expect(c, `missing CITATIONS["${entry.citation}"]`).toBeDefined();
        expect(/^1240-02-04-\.\d+|^Tenn\. Code Ann\./.test(c.rule)).toBe(true);
      }
    });
  });

  it("statutory cap citation carries the case-law footnote", () => {
    expect(CITATIONS.pcso_max.caseNote).toMatch(/Nash v\. Mulle/);
    expect(CITATIONS.pcso_max.caseNote).toMatch(/Richardson v\. Spanos/);
    expect(CITATIONS.pcso_max.caseNote).toMatch(/Smallman v\. Smallman/);
  });

  it("imputation sub-paragraphs are distinct paragraph-level citations", () => {
    // Post-P1.5 audit: rule uses arabic+period for the 3rd level (2.) and
    // lowercase roman in parens for the 4th level. Each entry must reach
    // at least one fourth-level subpart.
    expect(CITATIONS.income_imputed_prior_earnings.rule).toContain("2.(ii)");
    expect(CITATIONS.income_imputed_vocational.rule).toContain("2.(iii)");
    expect(CITATIONS.income_imputed_assets.rule).toContain("2.(i)(III)");
    expect(CITATIONS.income_carveout_incarceration.rule).toContain("2.(ii)(I)II.");
    expect(CITATIONS.income_carveout_means_tested.rule).toContain("(3)(c)2.");
  });
});
