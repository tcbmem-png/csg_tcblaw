/**
 * Arkansas Worksheet — Child Support (req. 7/1/2020) field map.
 *
 * The official PDF is a fillable AcroForm (45 named fields). Maps the generic
 * income-shares engine output to those names; filled + flattened via the shared
 * acroform-fill pipeline. STANDARD (sole/primary) custody only — the shared
 * offset (141-182 discretionary band) and split custody are not wired here.
 *
 * Columns are suffixed -1 / -2 / -3. Working hypothesis (per
 * AR_convention_findings.md / Court_Forms_Fill_Plan.md), still pending a render
 * eyeball: -1 = Custodial, -2 = Non-Custodial (obligor), -3 = Combined. The
 * obligor is the non-custodial parent in a sole-custody worksheet, derived from
 * the engine direction — so the order always lands in the -2 column. If a render
 * shows -1/-2 are physically swapped, flip the two suffix constants below.
 *
 * Line 4 (combined BCSO) is the unnamed field "Text1" — identified by widget
 * position (between Line 3 and Line 5, combined column), not by name.
 *
 * Line 13 uses the engine's final order (AR rounds the order DOWN to the dollar,
 * AO 10 § III — already applied by the engine), authoritative over the displayed
 * cents intermediates.
 */
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../../core/types";
import type { AcroFormData } from "@/lib/pdf/acroform-fill";

export const AR_WORKSHEET_TEMPLATE_URL = "/forms/AR_Worksheet_ChildSupport_2020.pdf";

const CUSTODIAL = "-1";
const NONCUSTODIAL = "-2";
const COMBINED = "-3";

export interface ArWorksheetUi {
  county?: string;
  division?: string;
  docket?: string;
  plaintiffName?: string;
  defendantName?: string;
}

const money = (n: number): string | undefined => (Number.isNaN(n) ? undefined : n.toFixed(2));
const moneyNZ = (n: number): string | undefined =>
  Math.round(n * 100) === 0 ? undefined : n.toFixed(2);
const pct = (frac: number): string => `${(frac * 100).toFixed(2)}%`;

export function buildArWorksheetData(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: ArWorksheetUi = {},
): AcroFormData {
  if (i.parentingType !== "standard" || i.splitCustody) {
    throw new Error(
      "AR Worksheet fill is sole/primary-custody only; the shared offset and " +
        "split custody are not wired.",
    );
  }

  // Obligor = non-custodial parent (engine direction). Map each party to its
  // worksheet column suffix.
  const obligorIsA = o.allInDirection !== "parent_b_to_a";
  const ncSuffix = NONCUSTODIAL;
  const cuSuffix = CUSTODIAL;
  // Value of the non-custodial (obligor) party, and of the custodial party.
  const nc = <T>(a: T, b: T): T => (obligorIsA ? a : b);
  const cu = <T>(a: T, b: T): T => (obligorIsA ? b : a);

  const bcso = o.bcso;
  const grossA = i.parentAGrossMonthly;
  const grossB = i.parentBGrossMonthly;
  const dedA = i.parentADeductionsMonthly ?? 0;
  const dedB = i.parentBDeductionsMonthly ?? 0;

  const addonCost = (party: "parent_a" | "parent_b", match: (id: string) => boolean) =>
    (i.addOns ?? [])
      .filter((a) => a.paidBy === party && match(a.id))
      .reduce((t, a) => t + (a.monthly || 0), 0);
  const isHealth = (id: string) => /health/i.test(id);
  const isMed = (id: string) => /medical|uninsured/i.test(id);
  const isCare = (id: string) => /child\s*care|childcare/i.test(id);

  const health = { a: addonCost("parent_a", isHealth), b: addonCost("parent_b", isHealth) };
  const med = { a: addonCost("parent_a", isMed), b: addonCost("parent_b", isMed) };
  const care = { a: addonCost("parent_a", isCare), b: addonCost("parent_b", isCare) };
  const addCombined = health.a + health.b + med.a + med.b + care.a + care.b; // Line 9 combined

  // Per-party line values (A / B).
  const bcsoShare = { a: o.piA * bcso, b: o.piB * bcso }; // Line 5
  const line9 = { a: health.a + med.a + care.a, b: health.b + med.b + care.b };
  const line10 = { a: o.piA * addCombined, b: o.piB * addCombined };
  const line11 = { a: bcsoShare.a + line10.a, b: bcsoShare.b + line10.b };
  // Line 12 — credit for the obligor's own directly-paid additional expenses.
  const obligorPaidAddons = nc(line9.a, line9.b);

  const data: AcroFormData = {
    // Caption
    "COUNTY ARKANSAS": ui.county,
    Division: ui.division,
    DR: ui.docket,
    Plaintiff: ui.plaintiffName,
    Defendant: ui.defendantName,

    // Line 1 — guidelines income
    [`Line 1 Child support guidelines income${cuSuffix}`]: money(cu(grossA, grossB)),
    [`Line 1 Child support guidelines income${ncSuffix}`]: money(nc(grossA, grossB)),
    [`Line 1 Child support guidelines income${COMBINED}`]: money(grossA + grossB),

    // Line 1a / 1b — permissible deductions (blank when zero)
    [`Line 1a Permissible deduction from income${cuSuffix}`]: moneyNZ(cu(dedA, dedB)),
    [`Line 1a Permissible deduction from income${ncSuffix}`]: moneyNZ(nc(dedA, dedB)),

    // Line 2 — income available for support (= adjusted gross)
    [`Line 2 Income available for support Line 1 minus Line 1a minus Line 1b${cuSuffix}`]: money(
      cu(o.parentAAGI, o.parentBAGI),
    ),
    [`Line 2 Income available for support Line 1 minus Line 1a minus Line 1b${ncSuffix}`]: money(
      nc(o.parentAAGI, o.parentBAGI),
    ),
    [`Line 2 Income available for support Line 1 minus Line 1a minus Line 1b${COMBINED}`]: money(
      o.combinedAGI,
    ),

    // Line 3 — each parent's pro-rata share
    [`Line 3 Each parents share of income available for support Each parents line 2 divided by combined line 2${cuSuffix}`]:
      pct(cu(o.piA, o.piB)),
    [`Line 3 Each parents share of income available for support Each parents line 2 divided by combined line 2${ncSuffix}`]:
      pct(nc(o.piA, o.piB)),
    [`Line 3 Each parents share of income available for support Each parents line 2 divided by combined line 2${COMBINED}`]:
      "100.00%",

    // Line 4 — combined BCSO (the unnamed "Text1" field, identified by position)
    Text1: money(bcso),

    // Line 5 — each parent's share of BCSO
    [`Line 5 Each parents share of the basic childsupport obligation each parents line 3 multiplied by combined Line 4${cuSuffix}`]:
      money(cu(bcsoShare.a, bcsoShare.b)),
    [`Line 5 Each parents share of the basic childsupport obligation each parents line 3 multiplied by combined Line 4${ncSuffix}`]:
      money(nc(bcsoShare.a, bcsoShare.b)),

    // Line 6 — health insurance cost (per payer)
    [`Line 6 Cost of the childs health insurance${cuSuffix}`]: moneyNZ(cu(health.a, health.b)),
    [`Line 6 Cost of the childs health insurance${ncSuffix}`]: moneyNZ(nc(health.a, health.b)),
    [`Line 6 Cost of the childs health insurance${COMBINED}`]: moneyNZ(health.a + health.b),

    // Line 7 — extraordinary medical
    [`Line 7 Cost of the childs extraordinary medical expenses${cuSuffix}`]: moneyNZ(
      cu(med.a, med.b),
    ),
    [`Line 7 Cost of the childs extraordinary medical expenses${ncSuffix}`]: moneyNZ(
      nc(med.a, med.b),
    ),
    [`Line 7 Cost of the childs extraordinary medical expenses${COMBINED}`]: moneyNZ(med.a + med.b),

    // Line 8 — work-related child care
    [`Line 8 Cost of workrelated child care expenses${cuSuffix}`]: moneyNZ(cu(care.a, care.b)),
    [`Line 8 Cost of workrelated child care expenses${ncSuffix}`]: moneyNZ(nc(care.a, care.b)),
    [`Line 8 Cost of workrelated child care expenses${COMBINED}`]: moneyNZ(care.a + care.b),

    // Line 9 — total additional childrearing expenses
    [`Line 9 Total additional childrearing expenses sum of line 6 7  8${cuSuffix}`]: moneyNZ(
      cu(line9.a, line9.b),
    ),
    [`Line 9 Total additional childrearing expenses sum of line 6 7  8${ncSuffix}`]: moneyNZ(
      nc(line9.a, line9.b),
    ),
    [`Line 9 Total additional childrearing expenses sum of line 6 7  8${COMBINED}`]:
      moneyNZ(addCombined),

    // Line 10 — each parent's share of additional expenses
    [`Line 10 Each parents share of additional childrearing expenses each parents line 3 multiplied by combined Line 9${cuSuffix}`]:
      moneyNZ(cu(line10.a, line10.b)),
    [`Line 10 Each parents share of additional childrearing expenses each parents line 3 multiplied by combined Line 9${ncSuffix}`]:
      moneyNZ(nc(line10.a, line10.b)),

    // Line 11 — total child-support obligation (Line 5 + Line 10)
    [`Line 11 Total childsupport obligation each parents line 5 plus line 10${cuSuffix}`]: money(
      cu(line11.a, line11.b),
    ),
    [`Line 11 Total childsupport obligation each parents line 5 plus line 10${ncSuffix}`]: money(
      nc(line11.a, line11.b),
    ),

    // Line 12 — credit for the obligor's own directly-paid additional expenses
    [`Line 12 Credit for additional childrearing expenses obligors line 9 only${ncSuffix}`]:
      moneyNZ(obligorPaidAddons),

    // Line 13 — presumed order (obligor only), AR round-down already applied by engine
    [`Line 13 Presumed childsupport order Line 11 minus line 12 for obligor only${ncSuffix}`]:
      String(Math.round(o.allInMonthly)),
  };

  return data;
}
