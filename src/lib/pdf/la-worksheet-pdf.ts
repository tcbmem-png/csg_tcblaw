/**
 * Louisiana Obligation Worksheet A — reproduce (not fill).
 *
 * The paper SES 330 is stamped obsolete (Rev. 09/14), so we reproduce the
 * current statutory Worksheet A (La. R.S. 9:315.20) from the engine output,
 * mirroring the TN/GA SimplePdf reproduce pattern. Nine-line structure;
 * Worksheet B (shared custody) is deferred with split custody.
 *
 * The model (buildLaWorksheetModel) is pure and gated (la-worksheet.test.ts)
 * against the engine output, which is itself live-confirmed against the DCFS
 * OBWS calculator. The renderer is presentation and wants a human eyeball vs a
 * live OBWS worksheet before go-live.
 */
import type { IncomeSharesInputs, IncomeSharesOutputs } from "@/lib/calc/core/types";
import {
  startDoc,
  h1,
  small,
  row,
  captionLine,
  footerNote,
  drawText,
  fmtCents,
  fmtPct,
  ROW_W,
  type WorksheetLine,
} from "./worksheet-render-kit";
import { MARGIN, RULE } from "./simple-pdf";

export interface LaWorksheetUi {
  obligorName?: string;
  custodialName?: string;
  parish?: string;
  caseNumber?: string;
}

interface LaModel {
  obligorName: string;
  custodialName: string;
  bcso: number;
  /** Recommended order (Line 9), to the cent — equals engine allInMonthly. */
  order: number;
  summary: string;
  lines: WorksheetLine[];
}

export function buildLaWorksheetModel(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: LaWorksheetUi = {},
): LaModel {
  if (i.splitCustody) {
    throw new Error(
      "LA Worksheet A reproduce is standard/shared custody only; split custody " +
        "(Worksheet C, R.S. 9:315.10) is deferred.",
    );
  }
  const obligorIsA = o.allInDirection !== "parent_b_to_a";
  const pick = <T>(a: T, b: T) => (obligorIsA ? a : b);
  const obligorName = ui.obligorName || "Obligor (Non-Domiciliary)";
  const custodialName = ui.custodialName || "Domiciliary Party";

  const grossO = pick(i.parentAGrossMonthly, i.parentBGrossMonthly);
  const grossC = pick(i.parentBGrossMonthly, i.parentAGrossMonthly);
  const dedO = pick(i.parentADeductionsMonthly ?? 0, i.parentBDeductionsMonthly ?? 0);
  const dedC = pick(i.parentBDeductionsMonthly ?? 0, i.parentADeductionsMonthly ?? 0);
  const agiO = pick(o.parentAAGI, o.parentBAGI);
  const agiC = pick(o.parentBAGI, o.parentAAGI);
  const piO = pick(o.piA, o.piB);
  const piC = pick(o.piB, o.piA);
  const bcso = o.bcso;

  // Add-on components (Line 5 sub-rows). The LA engine carries net child care,
  // health insurance, and uninsured/extraordinary medical; extraordinary
  // expenses (.6) and optional adjustments (.7) are structural rows, blank here.
  const bucket = (m: (id: string) => boolean) =>
    (i.addOns ?? []).filter((a) => m(a.id)).reduce((t, a) => t + (a.monthly || 0), 0);
  const netChildCare = bucket((id) => /child\s*care|childcare/i.test(id)); // R.S. 9:315.3
  const healthIns = bucket((id) => /health/i.test(id)); // R.S. 9:315.4
  const extMedical = bucket((id) => /medical|uninsured/i.test(id)); // R.S. 9:315.5
  const addCombined = (i.addOns ?? []).reduce((t, a) => t + (a.monthly || 0), 0);
  const total = bcso + addCombined; // Line 6
  const share7O = Math.round(piO * total * 100) / 100; // Line 7 each parent
  const share7C = Math.round(piC * total * 100) / 100;
  const paid = (party: "parent_a" | "parent_b") =>
    (i.addOns ?? []).filter((a) => a.paidBy === party).reduce((t, a) => t + (a.monthly || 0), 0);
  const paidO = pick(paid("parent_a"), paid("parent_b")); // Line 8 direct payments
  const paidC = pick(paid("parent_b"), paid("parent_a"));

  // Line 9 recommended order (obligor) — engine final order, OBWS-confirmed.
  const order = o.allInMonthly;
  const M = (n: number) => fmtCents(n);
  const MZ = (n: number) => (Math.round(n * 100) === 0 ? "" : fmtCents(n));

  // Column order matches the live DCFS OBWS: Custodial | Non-Custodial | Combined.
  const lines: WorksheetLine[] = [
    { header: true, label: "", col1: custodialName, col2: obligorName, combined: "Combined" },
    {
      n: "1",
      label: "Monthly Gross Income — R.S. 9:315.2(A)",
      col1: M(grossC),
      col2: M(grossO),
      combined: M(grossO + grossC),
    },
    {
      n: "1A",
      label: "Pre-existing Child Support / Spousal Support paid",
      col1: MZ(dedC),
      col2: MZ(dedO),
      combined: M(dedO + dedC),
    },
    {
      n: "2",
      label: "Monthly Adjusted Gross Income — R.S. 9:315.2(B)",
      col1: M(agiC),
      col2: M(agiO),
      combined: M(o.combinedAGI),
    },
    {
      n: "3",
      label: "Percent Share of Income — R.S. 9:315.2(C)",
      col1: fmtPct(piC),
      col2: fmtPct(piO),
      combined: "100.00%",
    },
    { n: "4", label: "Basic Child Support Obligation — R.S. 9:315.2(D)", combined: M(bcso) },
    {
      n: "5",
      label: "Adjustments to the obligation:",
      combined: addCombined ? M(addCombined) : "",
    },
    { n: "5(a)", label: "Net Child Care Cost — R.S. 9:315.3", combined: MZ(netChildCare) },
    {
      n: "5(b)",
      label: "Child's Health Insurance Premium — R.S. 9:315.4",
      combined: MZ(healthIns),
    },
    { n: "5(c)", label: "Extraordinary Medical Expenses — R.S. 9:315.5", combined: MZ(extMedical) },
    { n: "5(d)", label: "Extraordinary Expenses — R.S. 9:315.6", combined: "" },
    { n: "5(e)", label: "Optional Extraordinary Adjustments — R.S. 9:315.7", combined: "" },
    {
      n: "6",
      label: "Total Child Support Obligation — R.S. 9:315.8",
      combined: M(total),
      emphasis: true,
    },
    {
      n: "7",
      label: "Each parent's share of the total obligation",
      col1: M(share7C),
      col2: M(share7O),
    },
    {
      n: "8",
      label: "Verified direct payments / credit for support paid",
      col1: MZ(paidC),
      col2: MZ(paidO),
    },
    {
      n: "9",
      label: "Recommended Child Support Order (Non-Custodial) — R.S. 9:315.20",
      combined: M(order),
      emphasis: true,
    },
  ];

  return {
    obligorName,
    custodialName,
    bcso,
    order,
    summary: `${obligorName} pays ${custodialName} ${fmtCents(order)} a month`,
    lines,
  };
}

export function renderLaWorksheetPdf(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: LaWorksheetUi = {},
): Uint8Array {
  const m = buildLaWorksheetModel(i, o, ui);
  const ctx = startDoc("Louisiana Child Support Obligation Worksheet A");

  h1(ctx, "Louisiana Obligation Worksheet A");
  small(
    ctx,
    "Income Shares Model — La. R.S. 9:315.20. Reproduced from the calculation engine (2025 DCFS schedule); not the official SES form.",
  );

  const boxTop = ctx.y;
  ctx.y -= 6;
  if (ui.parish) captionLine(ctx, "Parish:", ui.parish);
  if (ui.caseNumber) captionLine(ctx, "Docket No.:", ui.caseNumber);
  captionLine(ctx, "Obligor:", m.obligorName);
  captionLine(ctx, "Domiciliary Party:", m.custodialName);
  captionLine(ctx, "Number of Children:", String(i.numChildren));
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 6;

  for (const l of m.lines) row(ctx, l);
  ctx.y -= 8;
  drawText(ctx, m.summary, MARGIN, ctx.y - 12, { size: 13, bold: true });
  ctx.y -= 18;

  footerNote(
    ctx,
    "Reproduced by CSG Helper to mirror Louisiana Obligation Worksheet A (La. R.S. 9:315.20). Verify all inputs and consult counsel before filing.",
  );
  return ctx.pdf.save();
}
