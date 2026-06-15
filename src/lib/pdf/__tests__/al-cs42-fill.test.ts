import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { incomeShares } from "@/lib/calc/core/income-shares";
import { AL_INCOME_SHARES_SPEC } from "@/lib/calc/states/al/spec";
import type { IncomeSharesInputs } from "@/lib/calc/core/types";
import { fillAcroForm, type AcroFormData } from "@/lib/pdf/acroform-fill";
import { buildAlCs42Data, type AlCs42Ui } from "@/lib/calc/states/al/cs42-field-map";

/**
 * FORM-LEVEL VERIFICATION GATE (the ship gate for AL CS-42 standard).
 *
 * Fills the OFFICIAL fillable PDF with the AL baseline fixture, reads the
 * printed field values back, and asserts they equal both the engine output and
 * the official-schedule math. Also pins the Plaintiff/Defendant column binding
 * both ways (a wrong column inverts the order on paper) and confirms nothing is
 * auto-signed and the flattened copy is non-editable.
 */
const TEMPLATE = readFileSync(
  join(process.cwd(), "public/forms/AL_CS-42_ChildSupportGuidelines_STANDARD_2022.pdf"),
);

// AL baseline (Mini-Treatise Example A): obligor A 5000 / custodial B 3000,
// 2 children, health 133 + childcare 400 paid by the custodial parent.
const BASELINE: IncomeSharesInputs = {
  parentAGrossMonthly: 5000,
  parentBGrossMonthly: 3000,
  numChildren: 2,
  parentingType: "standard",
  arpForStandard: "parent_a",
  addOns: [
    { id: "health_insurance", monthly: 133, paidBy: "parent_b" },
    { id: "work_related_childcare", monthly: 400, paidBy: "parent_b" },
  ],
};

const BCSO = 1519;
const COMBINED_TOTAL = BCSO + 400 + 133; // 2052
// Official-schedule math, independent of the engine: obligor share of the total
// at the Rule 32(C)(3) rounded 63% = round(0.63 * 2052) = 1293.
const SCHEDULE_ORDER = Math.round(0.63 * COMBINED_TOTAL); // 1293

/** Fill (unflattened) and read every text field's printed value back. */
async function fillAndReadBack(data: AcroFormData): Promise<Record<string, string>> {
  const bytes = await fillAcroForm(TEMPLATE, data, { flatten: false });
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const out: Record<string, string> = {};
  for (const f of form.getFields()) {
    if (f.constructor.name === "PDFTextField") {
      out[f.getName()] = (form.getTextField(f.getName()).getText() ?? "").trim();
    }
  }
  return out;
}

describe("AL CS-42 standard — form-level verification gate", () => {
  it("engine reproduces the official schedule order (1293)", () => {
    const o = incomeShares(AL_INCOME_SHARES_SPEC, BASELINE);
    expect(o.errors).toEqual([]);
    expect(o.bcso).toBe(BCSO);
    expect(Math.round(o.allInMonthly)).toBe(SCHEDULE_ORDER);
    expect(o.allInMonthly).toBe(1293);
    expect(o.allInDirection).toBe("parent_a_to_b");
  });

  it("printed numbers (read back from the filled PDF) equal the engine output", async () => {
    const o = incomeShares(AL_INCOME_SHARES_SPEC, BASELINE);
    const ui: AlCs42Ui = {
      plaintiff: "parent_a", // obligor A occupies the Plaintiff column
      plaintiffName: "Pat Payor",
      defendantName: "Riley Recipient",
      county: "Madison",
      caseNumber: "DR-2026-001",
    };
    const printed = await fillAndReadBack(buildAlCs42Data(BASELINE, o, ui));

    // Core income / shares / BCSO / add-ons.
    expect(printed["PGI"]).toBe("5000");
    expect(printed["DGI"]).toBe("3000");
    expect(printed["P%"]).toBe("63");
    expect(printed["D%"]).toBe("37");
    expect(printed["CBCSA"]).toBe(String(BCSO));
    expect(Number(printed["PBCSO"]) + Number(printed["DBCSO"])).toBe(BCSO);
    expect(printed["CWRCC"]).toBe("400");
    expect(printed["CHCCC"]).toBe("133");
    expect(printed["CCSO"]).toBe(String(COMBINED_TOTAL));

    // The recommended order — engine == schedule math == printed.
    expect(printed["Plaintiff Recommended Child Support AMount"]).toBe(String(SCHEDULE_ORDER));
    expect(printed["Combined Recommended Child Support Amount"]).toBe(String(SCHEDULE_ORDER));

    // SSR line (Rule 32(C)(5)) for the obligor: income available 5000-981=4019,
    // max after SSR 0.85*4019=3416 (does not bind; 1293 < 3416).
    expect(printed["Plaintiff Income Available"]).toBe("4019");
    expect(printed["Plaintiff Max Recommended Child Support After SSR"]).toBe("3416");

    // Caption carried.
    expect(printed["Name of County"]).toBe("Madison");
    expect(printed["Number of Children"]).toBe("2");
  });

  it("column binding is not inverted — obligor's order prints in the obligor's column", async () => {
    const o = incomeShares(AL_INCOME_SHARES_SPEC, BASELINE); // obligor = parent_a

    // Binding 1: A is the Plaintiff -> 1293 in the Plaintiff column, Defendant blank.
    const asPlaintiff = await fillAndReadBack(
      buildAlCs42Data(BASELINE, o, { plaintiff: "parent_a" }),
    );
    expect(asPlaintiff["Plaintiff Recommended Child Support AMount"]).toBe(String(SCHEDULE_ORDER));
    expect(asPlaintiff["Defendant Recommended Child Support Amount"]).toBe("");
    expect(asPlaintiff["Plaintiff Income Available"]).toBe("4019");
    expect(asPlaintiff["Defendant Income Available"]).toBe("");

    // Binding 2: A is the Defendant -> 1293 in the Defendant column, Plaintiff blank.
    const asDefendant = await fillAndReadBack(
      buildAlCs42Data(BASELINE, o, { plaintiff: "parent_b" }),
    );
    expect(asDefendant["Defendant Recommended Child Support Amount"]).toBe(String(SCHEDULE_ORDER));
    expect(asDefendant["Plaintiff Recommended Child Support AMount"]).toBe("");
    // The obligor's gross (5000) follows the obligor's column too.
    expect(asDefendant["DGI"]).toBe("5000");
    expect(asDefendant["PGI"]).toBe("3000");
  });

  it("never auto-signs and flattens to a non-editable filed copy", async () => {
    const o = incomeShares(AL_INCOME_SHARES_SPEC, BASELINE);
    const data = buildAlCs42Data(BASELINE, o, { plaintiff: "parent_a" });

    // No signature field exists on CS-42, and we never write Prepared By/Date
    // unless the caller supplies them.
    expect(data["Prepared By"]).toBeUndefined();
    expect(data["Date"]).toBeUndefined();

    const flattened = await fillAcroForm(TEMPLATE, data, { flatten: true });
    const doc = await PDFDocument.load(flattened);
    expect(doc.getForm().getFields().length).toBe(0); // flattened: no editable fields
  });

  it("refuses to fill the standard form for shared/split custody (CS-42-S not wired)", () => {
    const shared: IncomeSharesInputs = {
      ...BASELINE,
      parentingType: "equal",
      parentADays: 182,
      parentBDays: 183,
    };
    const o = incomeShares(AL_INCOME_SHARES_SPEC, shared);
    expect(() => buildAlCs42Data(shared, o, { plaintiff: "parent_a" })).toThrow(
      /standard-custody only/i,
    );
  });
});
