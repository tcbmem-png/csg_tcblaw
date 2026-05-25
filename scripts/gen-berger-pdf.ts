import { writeFileSync } from "node:fs";
import { calculate, defaultInputs } from "../src/lib/calc/calc";
import { renderOfficialWorksheetPdf } from "../src/lib/pdf/official-worksheet-pdf";
import { defaultCaption } from "../src/lib/calc/share";

const inputs = {
  ...defaultInputs(),
  parentALabel: "Jennifer",
  parentBLabel: "Jonathan",
  parentAGrossMonthly: 29490,
  parentBGrossMonthly: 56902,
  numChildren: 3,
  parentingType: "equal" as const,
  healthPremiumMonthly: 300,
  healthPaidBy: "parent_b" as const,
  includePrivateSchool: true,
  privateSchoolAnnual: 4500 * 12,
  privateSchoolPaidBy: "parent_b" as const,
  includeSpecialExpenses: true,
  specialExpensesAnnual: 2167 * 12,
};

const outputs = calculate(inputs);
const caption = {
  ...defaultCaption(),
  matterName: "In re Berger v. Berger",
  court: "Chancery Court of Shelby County, TN",
  parentARole: "mother" as const,
};

console.log({
  bcso: outputs.bcso,
  netPresumptive: outputs.netPresumptiveSupport,
  direction: outputs.presumptiveDirection,
  allIn: outputs.allInMonthly,
  warnings: outputs.warnings.length,
});

const buf = await renderOfficialWorksheetPdf({ inputs, outputs, caption });
const out = "/mnt/documents/Berger_TN_Child_Support_Worksheet_2026-05-25.pdf";
writeFileSync(out, buf);
console.log("wrote", out, buf.byteLength, "bytes");
