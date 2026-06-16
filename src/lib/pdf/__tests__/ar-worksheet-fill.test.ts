import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { incomeShares } from "@/lib/calc/core/income-shares";
import { AR_INCOME_SHARES_SPEC } from "@/lib/calc/states/ar/spec";
import type { IncomeSharesInputs } from "@/lib/calc/core/types";
import { fillAcroForm, type AcroFormData } from "@/lib/pdf/acroform-fill";
import { buildArWorksheetData } from "@/lib/calc/states/ar/worksheet-field-map";

/**
 * AR Worksheet fill gate: fill the official AcroForm with the AR baseline
 * fixture, read the printed values back, and assert they equal the engine
 * output + the live AOC calculator values. Pins the obligor -> Non-Custodial
 * column binding (a wrong column inverts the order on paper).
 */
const TEMPLATE = readFileSync(
  join(process.cwd(), "public/forms/AR_Worksheet_ChildSupport_2020.pdf"),
);

// AR baseline: payor A 5000 / payee B 3000, 2 children, health 200 + childcare
// 400 paid by the residential (custodial) parent B. Engine order 1246 (round-down).
const BASELINE: IncomeSharesInputs = {
  parentAGrossMonthly: 5000,
  parentBGrossMonthly: 3000,
  numChildren: 2,
  parentingType: "standard",
  arpForStandard: "parent_a",
  addOns: [
    { id: "health_insurance", monthly: 200, paidBy: "parent_b" },
    { id: "work_related_childcare", monthly: 400, paidBy: "parent_b" },
  ],
};

const L = {
  inc: (s: string) => `Line 1 Child support guidelines income${s}`,
  share5: (s: string) =>
    `Line 5 Each parents share of the basic childsupport obligation each parents line 3 multiplied by combined Line 4${s}`,
  add9: (s: string) => `Line 9 Total additional childrearing expenses sum of line 6 7  8${s}`,
  order13: (s: string) =>
    `Line 13 Presumed childsupport order Line 11 minus line 12 for obligor only${s}`,
};

async function fillAndReadBack(data: AcroFormData): Promise<Record<string, string>> {
  const bytes = await fillAcroForm(TEMPLATE, data, { flatten: false });
  const form = (await PDFDocument.load(bytes)).getForm();
  const out: Record<string, string> = {};
  for (const f of form.getFields()) {
    if (f.constructor.name === "PDFTextField") {
      out[f.getName()] = (form.getTextField(f.getName()).getText() ?? "").trim();
    }
  }
  return out;
}

describe("AR Worksheet — fill gate", () => {
  it("engine reproduces the AOC order (round-down 1246)", () => {
    const o = incomeShares(AR_INCOME_SHARES_SPEC, BASELINE);
    expect(o.errors).toEqual([]);
    expect(o.bcso).toBe(1395);
    expect(o.allInMonthly).toBe(1246);
    expect(o.allInDirection).toBe("parent_a_to_b");
  });

  it("printed values match the engine + AOC (Line 5 871.88, Line 9 600, Line 13 1246)", async () => {
    const o = incomeShares(AR_INCOME_SHARES_SPEC, BASELINE);
    const printed = await fillAndReadBack(
      buildArWorksheetData(BASELINE, o, { county: "Pulaski", docket: "DR-26-1" }),
    );
    // Line 4 combined BCSO lives in the unnamed Text1 field (located by position).
    expect(printed["Text1"]).toBe("1395.00");
    // Line 5 non-custodial (obligor) share of BCSO.
    expect(printed[L.share5("-2")]).toBe("871.88");
    // Line 9 combined additional expenses.
    expect(printed[L.add9("-3")]).toBe("600.00");
    // Line 13 presumed order — obligor only, round-down.
    expect(printed[L.order13("-2")]).toBe("1246");
    expect(printed["COUNTY ARKANSAS"]).toBe("Pulaski");
  });

  it("payor prints in the NON-CUSTODIAL column, not the custodial one", async () => {
    const o = incomeShares(AR_INCOME_SHARES_SPEC, BASELINE); // obligor = parent_a
    const printed = await fillAndReadBack(buildArWorksheetData(BASELINE, o));
    // Obligor A gross (5000) in non-custodial (-2); payee B (3000) in custodial (-1).
    expect(printed[L.inc("-2")]).toBe("5000.00");
    expect(printed[L.inc("-1")]).toBe("3000.00");
    // The order is the obligor's only — non-custodial filled, custodial blank.
    expect(printed[L.order13("-2")]).toBe("1246");
    expect(printed[L.order13("-1")]).toBe("");
  });

  it("flattens to a non-editable filed copy", async () => {
    const o = incomeShares(AR_INCOME_SHARES_SPEC, BASELINE);
    const data = buildArWorksheetData(BASELINE, o);
    const flat = await fillAcroForm(TEMPLATE, data, { flatten: true });
    expect((await PDFDocument.load(flat)).getForm().getFields().length).toBe(0);
  });

  it("refuses shared/split custody (sole/primary worksheet only)", () => {
    const shared: IncomeSharesInputs = { ...BASELINE, parentingType: "equal" };
    const o = incomeShares(AR_INCOME_SHARES_SPEC, shared);
    expect(() => buildArWorksheetData(shared, o)).toThrow(/sole\/primary/i);
  });
});
