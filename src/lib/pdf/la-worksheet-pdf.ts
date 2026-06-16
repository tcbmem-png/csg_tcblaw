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
  headerRow,
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

  const lines: WorksheetLine[] = [
    { header: true, label: "", col1: obligorName, col2: custodialName, combined: "Combined" },
    {
      n: "1",
      label: "Monthly Gross Income",
      col1: M(grossO),
      col2: M(grossC),
      combined: M(grossO + grossC),
    },
    ...(dedO || dedC
      ? [
          {
            n: "1a/1b",
            label: "Less preexisting child/spousal support paid",
            col1: M(dedO),
            col2: M(dedC),
          } as WorksheetLine,
        ]
      : []),
    {
      n: "2",
      label: "Monthly Adjusted Gross Income",
      col1: M(agiO),
      col2: M(agiC),
      combined: M(o.combinedAGI),
    },
    {
      n: "3",
      label: "Percentage Share of Income",
      col1: fmtPct(piO),
      col2: fmtPct(piC),
      combined: "100.00%",
    },
    { n: "4", label: "Basic Child Support Obligation (from schedule)", combined: M(bcso) },
    {
      n: "5",
      label: "Net child care / health insurance / extraordinary expenses",
      combined: M(addCombined),
    },
    {
      n: "6",
      label: "Total Child Support Obligation (Line 4 + Line 5)",
      combined: M(total),
      emphasis: true,
    },
    {
      n: "7",
      label: "Each parent's share of the total obligation",
      col1: M(share7O),
      col2: M(share7C),
    },
    {
      n: "8",
      label: "Direct payments / credit for support paid",
      col1: paidO ? M(paidO) : "",
      col2: paidC ? M(paidC) : "",
    },
    { n: "9", label: "Recommended Child Support Order", col1: M(order), emphasis: true },
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

  for (const l of m.lines) (l.header ? headerRow : row)(ctx, l);
  ctx.y -= 8;
  drawText(ctx, m.summary, MARGIN, ctx.y - 12, { size: 13, bold: true });
  ctx.y -= 18;

  footerNote(
    ctx,
    "Reproduced by CSG Helper to mirror Louisiana Obligation Worksheet A (La. R.S. 9:315.20). Verify all inputs and consult counsel before filing.",
  );
  return ctx.pdf.save();
}
