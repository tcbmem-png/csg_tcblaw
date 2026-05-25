import { calculate } from "../src/lib/calc/calc";
import type { CalcInputs } from "../src/lib/calc/types";

const base = (overrides: Partial<CalcInputs>): CalcInputs => ({
  parentALabel: "Parent A",
  parentBLabel: "Parent B",
  parentAGrossMonthly: 0,
  parentBGrossMonthly: 0,
  useImputationForA: false,
  useImputationForB: false,
  youngestChildAge: 9,
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
  numChildren: 1,
  parentingType: "standard",
  arpForStandard: "parent_b",
  healthPremiumMonthly: 0,
  healthPaidBy: "parent_a",
  uninsuredMedicalMonthly: 0,
  uninsuredMedicalPaidBy: "split_pro_rata",
  childcareMonthly: 0,
  childcarePaidBy: "parent_a",
  childcarePayrollDeducted: false,
  includePrivateSchool: false,
  privateSchoolAnnual: 0,
  privateSchoolPaidBy: "split_pro_rata",
  includeSpecialExpenses: false,
  specialExpensesAnnual: 0,
  specialExpensesWaiveThreshold: false,
  specialExpensesPaidBy: "split_pro_rata",
  ...overrides,
});

const stories: { name: string; claim: Record<string, number | string>; inputs: CalcInputs }[] = [
  {
    name: "Story 1 — Single-Earner",
    claim: { bcso: 2374, presumptive: 2374 },
    inputs: base({
      parentAGrossMonthly: 20000,
      parentBGrossMonthly: 0,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_a",
    }),
  },
  {
    name: "Story 2 standard — High/Mod, A as ARP @ 80d",
    claim: { bcso: 6043, topOfSched: 2954, addition: 3089, piA: 0.735, piB: 0.265,
             proRata: 4442, healthNet: 229, presumptive: 4671, excessOverCap: 571 },
    inputs: base({
      parentAGrossMonthly: 50000,
      parentBGrossMonthly: 18000,
      numChildren: 3,
      parentingType: "standard",
      arpForStandard: "parent_a",
      healthPremiumMonthly: 311, // calibrate later; article gives net $229
      healthPaidBy: "parent_b",
    }),
  },
  {
    name: "Story 2 50/50",
    claim: { bcso: 6043, crossCredit: 2840, presumptive: 3069, belowCapBy: 1031 },
    inputs: base({
      parentAGrossMonthly: 50000,
      parentBGrossMonthly: 18000,
      numChildren: 3,
      parentingType: "equal",
      healthPremiumMonthly: 311,
      healthPaidBy: "parent_b",
    }),
  },
  {
    name: "Story 3 — Two high earners 50/50",
    claim: { bcso: 5962, topOfSched: 2803, excess: 43750, addition: 3159,
             crossCredit: 2313, healthAddon: 347, presumptive: 2660 },
    inputs: base({
      parentAGrossMonthly: 50000,
      parentBGrossMonthly: 22000,
      numChildren: 2,
      parentingType: "equal",
      healthPremiumMonthly: 471,
      healthPaidBy: "parent_b",
    }),
  },
  {
    name: "Story 4 — Near-parity 50/50",
    claim: { bcso: 5673, crossCredit: 170, total: 937 },
    inputs: base({
      parentAGrossMonthly: 35000,
      parentBGrossMonthly: 33000,
      numChildren: 2,
      parentingType: "equal",
    }),
  },
  {
    name: "Story 5 — Ultra-high, A as ARP @ 80d",
    claim: { bcso: 10471, topOfSched: 2954, addition: 7517, piA: 0.80,
             proRata: 8377, healthNet: 480, presumptive: 8857, excessOverCap: 4757 },
    inputs: base({
      parentAGrossMonthly: 100000,
      parentBGrossMonthly: 25000,
      numChildren: 3,
      parentingType: "standard",
      arpForStandard: "parent_a",
      healthPremiumMonthly: 600,
      healthPaidBy: "parent_b",
    }),
  },
];

const fmt = (n: number) => Math.round(n).toString();

for (const s of stories) {
  const o = calculate(s.inputs);
  console.log("===", s.name, "===");
  console.log("  claim:", s.claim);
  console.log("  computed:", {
    bcso: fmt(o.bcso),
    piA: o.piA.toFixed(3),
    piB: o.piB.toFixed(3),
    aShare: fmt(o.parentABcsoShare),
    bShare: fmt(o.parentBBcsoShare),
    presumptiveFromA: fmt(o.netPresumptiveSupport),
    direction: o.presumptiveDirection,
    addOnsFromA: fmt(o.addOnsTotalFromA),
    allInMonthly: fmt(o.allInMonthly),
    allInDirection: o.allInDirection,
    pcsoExcess: fmt(o.pcsoExcessOverCap),
    pcsoMax: o.pcsoStatutoryMax,
    aboveCap: o.bcsoAboveCapBreakdown,
    multiplier: o.variableMultiplier,
  });
  console.log("");
}
