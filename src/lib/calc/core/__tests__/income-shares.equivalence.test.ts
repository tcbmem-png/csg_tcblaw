import { describe, expect, it } from "vitest";
import { calculate, defaultInputs } from "../../states/tn/calc";
import type { CalcInputs } from "../../states/tn/types";
import {
  TN_INCOME_SHARES_SPEC,
  calcInputsToIncomeShares,
} from "../../states/tn/spec";
import { incomeShares } from "../income-shares";
import { calculateMS, defaultMSInputs } from "../../ms/calc";
import type { MSInputs } from "../../ms/types";
import { MS_PERCENTAGE_SPEC, msInputsToPercentage } from "../../ms/spec";
import { percentageObligor } from "../percentage";

/**
 * The generic cores must reproduce the live engines on the shared pipeline.
 * The live engine is the oracle, so no hand-derived numbers are needed. Cases
 * deliberately avoid TN-only extras (federal benefit, means-tested,
 * special-expenses threshold, SSR collapse) that the generic core does not
 * model — those stay layered in the state engine.
 */

const tnCases: Array<{ name: string; inputs: Partial<CalcInputs> }> = [
  {
    name: "baseline 1 child, standard parenting",
    inputs: {
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "standard",
      arpForStandard: "parent_b",
    },
  },
  {
    name: "3 children, standard, parent A is ARP",
    inputs: {
      parentAGrossMonthly: 8000,
      parentBGrossMonthly: 5000,
      numChildren: 3,
      parentingType: "standard",
      arpForStandard: "parent_a",
    },
  },
  {
    name: "3 children, equal 50/50, mid income",
    inputs: {
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
    },
  },
  {
    name: "custom reduction band (ARP 100 days)",
    inputs: {
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 265,
      parentBDays: 100,
    },
  },
  {
    name: "custom increase band (ARP 60 days)",
    inputs: {
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 1,
      parentingType: "custom",
      parentADays: 305,
      parentBDays: 60,
    },
  },
  {
    name: "above-cap equal parenting",
    inputs: {
      parentAGrossMonthly: 51250,
      parentBGrossMonthly: 28167,
      numChildren: 3,
      parentingType: "equal",
    },
  },
  {
    name: "add-ons heavy (health, childcare, uninsured medical)",
    inputs: {
      parentAGrossMonthly: 8000,
      parentBGrossMonthly: 4000,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_b",
      healthPremiumMonthly: 300,
      healthPaidBy: "parent_a",
      childcareMonthly: 500,
      childcarePaidBy: "parent_b",
      uninsuredMedicalMonthly: 200,
      uninsuredMedicalPaidBy: "parent_a",
    },
  },
  {
    name: "private-school deviation, 50/50",
    inputs: {
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
      includePrivateSchool: true,
      privateSchoolAnnual: 4500 * 12,
      privateSchoolPaidBy: "parent_b",
    },
  },
];

describe("income-shares core reproduces the TN engine (shared pipeline)", () => {
  for (const c of tnCases) {
    it(c.name, () => {
      const full: CalcInputs = { ...defaultInputs(), ...c.inputs };
      const legacy = calculate(full);
      const generic = incomeShares(
        TN_INCOME_SHARES_SPEC,
        calcInputsToIncomeShares(full),
      );

      expect(generic.parentAAGI).toBe(legacy.parentAAGI);
      expect(generic.parentBAGI).toBe(legacy.parentBAGI);
      expect(generic.combinedAGI).toBe(legacy.combinedAGI);
      expect(generic.piA).toBeCloseTo(legacy.piA, 6);
      expect(generic.piB).toBeCloseTo(legacy.piB, 6);
      expect(generic.bcso).toBe(legacy.bcso);
      expect(generic.bcsoSource).toBe(legacy.bcsoSource);
      expect(generic.scheduleIsShaded).toBe(legacy.scheduleIsShaded);
      expect(generic.parentingBand).toBe(legacy.parentingTimeBand);
      expect(generic.arpIdentity).toBe(legacy.arpIdentity);
      expect(generic.netPresumptiveSupport).toBe(legacy.netPresumptiveSupport);
      expect(generic.presumptiveDirection).toBe(legacy.presumptiveDirection);
      expect(generic.addOnsTotalFromA).toBe(legacy.addOnsTotalFromA);
      expect(generic.allInMonthly).toBe(legacy.allInMonthly);
      expect(generic.allInDirection).toBe(legacy.allInDirection);
    });
  }
});

const msCases: Array<{ name: string; inputs: Partial<MSInputs> }> = [
  { name: "1 child, $60k gross", inputs: { obligorAnnualGross: 60000, numChildren: 1 } },
  { name: "2 children, $60k gross", inputs: { obligorAnnualGross: 60000, numChildren: 2 } },
  {
    name: "1 child with deductions",
    inputs: {
      obligorAnnualGross: 80000,
      obligorAnnualTaxes: 16000,
      numChildren: 1,
    },
  },
  {
    name: "1 child, obligee-provided health add-on",
    inputs: {
      obligorAnnualGross: 60000,
      numChildren: 1,
      healthInsuranceProvidedBy: "obligee",
      healthInsuranceMonthly: 200,
    },
  },
];

describe("percentage core reproduces the MS engine (base obligation)", () => {
  for (const c of msCases) {
    it(c.name, () => {
      const full: MSInputs = { ...defaultMSInputs(), ...c.inputs };
      const legacy = calculateMS(full);
      const generic = percentageObligor(
        MS_PERCENTAGE_SPEC,
        msInputsToPercentage(full),
      );

      expect(generic.monthlyAGI).toBeCloseTo(legacy.monthlyAGI, 4);
      expect(generic.statutoryPercentage).toBe(legacy.statutoryPercentage);
      expect(generic.presumptiveMonthly).toBeCloseTo(
        legacy.presumptiveMonthly,
        4,
      );
      expect(generic.finalMonthly).toBeCloseTo(legacy.proposedFinalMonthly, 4);
    });
  }
});
