import { renderWorksheetPdf } from "./src/lib/pdf/worksheet-pdf";
import { renderOfficialWorksheetPdf } from "./src/lib/pdf/official-worksheet-pdf";
import { writeFileSync } from "node:fs";

const inputs: any = {
  parentALabel: "Jane Smith",
  parentBLabel: "John Smith",
  parentAGrossMonthly: 6500,
  parentBGrossMonthly: 4200,
  useImputationForA: false,
  useImputationForB: false,
  youngestChildAge: 4,
  parentAMeansTestedOnly: false,
  parentBMeansTestedOnly: false,
  parentASECredit: 0,
  parentBSECredit: 0,
  parentAPriorSupport: 0,
  parentBPriorSupport: 0,
  parentAInhomeCredit: 0,
  parentBInhomeCredit: 0,
  numChildren: 2,
  parentingType: "standard",
  arpForStandard: "parent_b",
  parentADays: 285,
  parentBDays: 80,
  healthPremiumMonthly: 220,
  healthPaidBy: "parent_a",
  uninsuredMedicalMonthly: 50,
  childcareMonthly: 600,
  childcarePaidBy: "parent_a",
  includePrivateSchool: false,
  privateSchoolAnnual: 0,
  privateSchoolPaidBy: "parent_a",
  includeSpecialExpenses: false,
  specialExpensesMonthly: 0,
  specialExpensesWaiveThreshold: false,
  specialExpensesPaidBy: "parent_a",
};

const outputs: any = {
  parentAAGI: 6500, parentBAGI: 4200, combinedAGI: 10700,
  piA: 0.6075, piB: 0.3925,
  bcso: 1815, bcsoSource: "schedule", scheduleAgiUsed: 10700, scheduleIsShaded: false,
  parentABcsoShare: 1102.6, parentBBcsoShare: 712.4,
  arpIdentity: "parent_b", parentingTimeBand: "standard", variableMultiplier: null,
  netPresumptiveSupport: 712.4, presumptiveDirection: "parent_b_to_a",
  ssrApplied: false, ssrNote: null,
  addOnHealthFromA: -86, addOnMedicalFromA: -19, addOnChildcareFromA: -235,
  addOnsTotalFromA: -340,
  privateSchoolMonthlyTotal: 0, privateSchoolDeviationFromA: 0,
  specialExpensesThresholdAmount: 0, specialExpensesIncludedAsDeviation: 0, specialExpensesDeviationFromA: 0,
  allInMonthlyFromA: -1052, allInMonthly: 1052, allInDirection: "parent_b_to_a", allInAnnual: 12624,
  warnings: [], pcsoExceedsStatutoryMax: false, pcsoStatutoryMax: 3200,
  scheduleEffectiveDate: "2022-05-01", errors: [],
};

const caption: any = {
  matterName: "Smith v. Smith",
  docketNumber: "23-CV-12345",
  court: "Chancery Court of Davidson County",
  preparedBy: "Tim Blasdel, Esq.",
  client: "Jane Smith",
};

const a = await renderWorksheetPdf({ inputs, outputs, caption });
writeFileSync("/tmp/branded.pdf", a);
const b = await renderOfficialWorksheetPdf({ inputs, outputs, caption });
writeFileSync("/tmp/official.pdf", b);
console.log("done", a.length, b.length);
