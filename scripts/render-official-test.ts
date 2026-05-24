import { renderOfficialWorksheetPdf } from "@/lib/pdf/official-worksheet-pdf";
import { calculate } from "@/lib/calc/calc";
import type { CalcInputs } from "@/lib/calc/types";
import { writeFileSync } from "fs";

const inputs: CalcInputs = {
  parentALabel: "Taylor",
  parentBLabel: "Heather",
  parentAGrossMonthly: 6000,
  parentBGrossMonthly: 2000,
  useImputationForA: false,
  useImputationForB: false,
  youngestChildAge: 10,
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
  numChildren: 3,
  parentingType: "standard",
  arpForStandard: "parent_a",
  healthPremiumMonthly: 75,
  healthPaidBy: "parent_b",
  uninsuredMedicalMonthly: 0,
  uninsuredMedicalPaidBy: "parent_b",
  childcareMonthly: 0,
  childcarePaidBy: "parent_b",
  childcarePayrollDeducted: false,
  includePrivateSchool: false,
  privateSchoolAnnual: 0,
  privateSchoolPaidBy: "parent_b",
  includeSpecialExpenses: false,
  specialExpensesMonthly: 0,
  specialExpensesWaiveThreshold: false,
  specialExpensesPaidBy: "parent_b",
};

const outputs = calculate(inputs);
const bytes = await renderOfficialWorksheetPdf({
  inputs,
  outputs,
  caption: {
    matterName: "Test Matter",
    docketNumber: "TEST-001",
    court: "Test Chancery Court",
    preparedBy: "tcb",
    comments: "",
  } as any,
});
writeFileSync("/tmp/official-new.pdf", bytes);
console.log("wrote /tmp/official-new.pdf bytes=" + bytes.length);
