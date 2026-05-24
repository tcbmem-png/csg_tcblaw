import type { MSInputs, MSOutputs, MSFactorLetter } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  SimplePdf,
  MARGIN,
  PAGE_W,
  PAGE_H,
  INK,
  MUTED,
  RULE,
  HEAD_BG,
  EMPH_BG,
  cleanText,
  trimToWidth,
  widthOfText,
  wrapText,
  type Color,
} from "./simple-pdf";

const ROW_W = PAGE_W - MARGIN * 2;
const COL_NUM_X = MARGIN;
const COL_LABEL_X = MARGIN + 24;
const COL_TOTAL_RIGHT = PAGE_W - MARGIN;
const LABEL_MAX_W = COL_TOTAL_RIGHT - COL_LABEL_X - 90;

const FACTOR_TITLES: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of obligee, obligor, and child",
  i: "Payment by obligee of child care expenses for employment or disability",
  j: "Any other adjustment needed to achieve an equitable result",
};

function fmt(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function fmt2(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
}

interface Ctx {
  pdf: SimplePdf;
  y: number;
}

function newPage(ctx: Ctx) {
  ctx.pdf.newPage();
  ctx.y = PAGE_H - MARGIN;
}

function ensure(ctx: Ctx, need: number) {
  if (ctx.y - need < MARGIN) newPage(ctx);
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color; maxWidth?: number } = {},
) {
  const size = opts.size ?? 10;
  const str = opts.maxWidth ? trimToWidth(text, size, opts.maxWidth) : cleanText(text);
  ctx.pdf.text(str, x, y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function drawTextRight(
  ctx: Ctx,
  text: string,
  rightX: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color } = {},
) {
  const size = opts.size ?? 10;
  const str = cleanText(text);
  ctx.pdf.text(str, rightX - widthOfText(str, size), y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function h1(ctx: Ctx, t: string) {
  ensure(ctx, 24);
  drawText(ctx, t, MARGIN, ctx.y - 14, { size: 16, bold: true });
  ctx.y -= 20;
}

function h2(ctx: Ctx, t: string) {
  ensure(ctx, 22);
  ctx.y -= 8;
  drawText(ctx, t, MARGIN, ctx.y - 10, { size: 12, bold: true });
  ctx.y -= 14;
}

function small(ctx: Ctx, t: string) {
  ensure(ctx, 12);
  drawText(ctx, t, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
  ctx.y -= 12;
}

interface RowOpts {
  n?: string;
  label: string;
  total?: string;
  emphasis?: boolean;
  header?: boolean;
}

function row(ctx: Ctx, r: RowOpts) {
  const h = 16;
  ensure(ctx, h);
  const top = ctx.y;
  if (r.header) ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, HEAD_BG);
  else if (r.emphasis) ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, EMPH_BG);
  ctx.pdf.line(MARGIN, top - h, PAGE_W - MARGIN, top - h, RULE, 0.5);
  const textY = top - h + 5;
  if (r.n) drawText(ctx, r.n, COL_NUM_X, textY, { size: 8, color: MUTED });
  drawText(ctx, r.label, COL_LABEL_X, textY, {
    bold: r.emphasis || r.header,
    maxWidth: LABEL_MAX_W,
  });
  if (r.total) drawTextRight(ctx, r.total, COL_TOTAL_RIGHT, textY, { bold: !!r.emphasis });
  ctx.y -= h;
}

function captionLine(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 12);
  drawText(ctx, label, MARGIN + 6, ctx.y - 9, { bold: true, size: 9 });
  drawText(ctx, value, MARGIN + 96, ctx.y - 9, { size: 9, maxWidth: ROW_W - 106 });
  ctx.y -= 12;
}

function paragraph(ctx: Ctx, text: string, opts: { size?: number; color?: Color } = {}) {
  const size = opts.size ?? 9;
  const lines = wrapText(text, size, ROW_W);
  const lh = size + 2;
  for (const line of lines) {
    ensure(ctx, lh);
    drawText(ctx, line, MARGIN, ctx.y - size, { size, color: opts.color ?? INK });
    ctx.y -= lh;
  }
}

function footerNote(ctx: Ctx, text: string) {
  paragraph(ctx, text, { size: 8, color: MUTED });
  ctx.y -= 2;
}

function calloutBox(ctx: Ctx, title: string, body: string) {
  const size = 9;
  const lines = wrapText(body, size, ROW_W - 16);
  const lh = size + 2;
  const h = 18 + lines.length * lh + 8;
  ensure(ctx, h);
  const top = ctx.y;
  ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, EMPH_BG);
  ctx.pdf.strokeRect(MARGIN, top - h, ROW_W, h, RULE, 0.75);
  drawText(ctx, title, MARGIN + 8, top - 13, { size: 10, bold: true });
  let y = top - 13 - 8;
  for (const line of lines) {
    drawText(ctx, line, MARGIN + 8, y - size, { size });
    y -= lh;
  }
  ctx.y = top - h - 6;
}

export async function renderMSWorksheetPdf(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
}): Promise<Uint8Array> {
  const { inputs, outputs, caption } = args;
  const obligor = inputs.obligorLabel || "Obligor";
  const obligee = inputs.obligeeLabel || "Obligee";

  const pdf = new SimplePdf(caption.matterName || "MS Child Support Worksheet");
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN };

  h1(ctx, "Mississippi Child Support Worksheet");
  small(
    ctx,
    `Miss. Code Ann. § 43-19-101 (presumptive guideline) and § 43-19-103 (deviation criteria). Guidelines effective ${outputs.guidelinesEffectiveDate}.`,
  );

  // Caption block
  const boxTop = ctx.y;
  ctx.y -= 6;
  if (caption.matterName) captionLine(ctx, "Matter:", caption.matterName);
  if (caption.docketNumber) captionLine(ctx, "Cause No.:", caption.docketNumber);
  if (caption.court) captionLine(ctx, "Court:", caption.court);
  if (caption.preparedBy) captionLine(ctx, "Prepared by:", caption.preparedBy);
  if (caption.client) captionLine(ctx, "Client:", caption.client);
  captionLine(ctx, "Obligor:", obligor);
  captionLine(ctx, "Obligee:", obligee);
  captionLine(ctx, "Children:", String(inputs.numChildren));
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 4;

  // I. AGI computation
  h2(ctx, "I. Adjusted Gross Income (§ 43-19-101(3))");
  row(ctx, { n: "#", label: "Item (annual unless noted)", total: "Amount", header: true });
  row(ctx, { n: "1", label: "Obligor's gross income from all sources", total: fmt(inputs.obligorAnnualGross) });
  row(ctx, { n: "2", label: "Less: federal, state, and local taxes (actual liability)", total: `(${fmt(inputs.obligorAnnualTaxes)})` });
  row(ctx, { n: "3", label: "Less: Social Security contributions", total: `(${fmt(inputs.obligorAnnualSocialSecurity)})` });
  row(ctx, { n: "4", label: "Less: mandatory retirement / disability contributions", total: `(${fmt(inputs.obligorAnnualMandatoryRetirement)})` });
  row(ctx, { n: "5", label: "Less: pre-existing court-ordered support (other children)", total: `(${fmt(inputs.preexistingSupportAnnual)})` });
  row(ctx, { n: "6", label: "Annual Adjusted Gross Income", total: fmt(outputs.annualAGI), emphasis: true });
  if (inputs.inHomeChildrenDeductionMonthly > 0) {
    row(ctx, { n: "7", label: "Less: discretionary in-home other-children deduction (monthly)", total: `(${fmt(inputs.inHomeChildrenDeductionMonthly)})` });
  }
  row(ctx, { n: "8", label: "Monthly Adjusted Gross Income", total: fmt2(outputs.monthlyAGI), emphasis: true });

  // Threshold callouts
  if (outputs.requiresFindingHighIncome) {
    calloutBox(
      ctx,
      "Written finding required — § 43-19-101(4)",
      "Annual AGI exceeds $100,000. The chancellor must make a written finding as to whether the guideline percentage is reasonable in this case. The presumptive figure below may be adjusted upward, downward, or affirmed.",
    );
  }
  if (outputs.requiresFindingLowIncome) {
    calloutBox(
      ctx,
      "Written finding required — § 43-19-101(4)",
      "Annual AGI is below $10,000. The chancellor must make a written finding as to whether the guideline percentage is reasonable in this case. Low-income obligors are often eligible for downward deviation.",
    );
  }

  // II. Presumptive
  h2(ctx, "II. Presumptive Monthly Award (§ 43-19-101(1))");
  row(ctx, { n: "9", label: `Statutory percentage (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"})`, total: `${(outputs.statutoryPercentage * 100).toFixed(0)}%` });
  row(ctx, { n: "10", label: "Presumptive monthly support  =  Monthly AGI × percentage", total: fmt2(outputs.presumptiveMonthly), emphasis: true });

  // III. Health insurance
  h2(ctx, "III. Health Insurance (§ 43-19-101(6))");
  if (inputs.healthInsuranceProvidedBy === "obligee" && inputs.healthInsuranceMonthly > 0) {
    row(ctx, { n: "11", label: "Children's portion of monthly premium (obligee provides — added to award)", total: fmt2(outputs.healthInsuranceAddOnMonthly) });
  } else if (inputs.healthInsuranceProvidedBy === "obligor" && inputs.healthInsuranceMonthly > 0) {
    row(ctx, { n: "11", label: "Children's portion of monthly premium (obligor provides — informational)", total: fmt2(inputs.healthInsuranceMonthly) });
    small(ctx, "Court may adjust the support obligation to reflect a share of the obligor-paid premium.");
  } else {
    row(ctx, { n: "11", label: "Children's portion of monthly premium", total: "-" });
  }

  // IV. Deviations
  const applicable = inputs.deviations.filter((d) => d.applicable);
  h2(ctx, "IV. Proposed Deviations (§ 43-19-103)");
  if (applicable.length === 0) {
    small(ctx, "No statutory deviation factors marked applicable. Presumptive amount stands.");
  } else {
    row(ctx, { n: "#", label: "Factor — description", total: "Proposed monthly", header: true });
    for (const d of applicable) {
      const label = `(${d.letter}) ${FACTOR_TITLES[d.letter]}${d.description ? ` — ${d.description}` : ""}`;
      row(ctx, { label, total: fmt2(d.proposedMonthly) });
    }
    row(ctx, { label: "Total proposed deviations", total: fmt2(outputs.totalDeviationsMonthly), emphasis: true });
    small(ctx, "Proposed by user — the court has final discretion. § 43-19-103 requires written findings.");
  }

  // V. Final
  h2(ctx, "V. Proposed Final Monthly Award");
  row(ctx, { label: "Presumptive amount", total: fmt2(outputs.presumptiveMonthly) });
  if (outputs.healthInsuranceAddOnMonthly > 0) {
    row(ctx, { label: "Plus: health insurance add-on", total: fmt2(outputs.healthInsuranceAddOnMonthly) });
  }
  if (outputs.totalDeviationsMonthly !== 0) {
    row(ctx, { label: `${outputs.totalDeviationsMonthly >= 0 ? "Plus" : "Less"}: net deviations`, total: fmt2(outputs.totalDeviationsMonthly) });
  }
  row(ctx, { label: "Proposed final monthly support", total: fmt2(outputs.proposedFinalMonthly), emphasis: true });

  // Notes
  if (outputs.warnings.length > 0) {
    h2(ctx, "Notes");
    for (const w of outputs.warnings) {
      paragraph(ctx, `• ${w}`, { size: 9 });
    }
  }

  ctx.y -= 8;
  footerNote(
    ctx,
    "This worksheet is a calculation aid produced by TCB Law's Mississippi child support calculator. It is not legal advice and is not an official MDHS form. Authority: Miss. Code Ann. §§ 43-19-101 and 43-19-103. Verify all inputs and consult counsel before filing.",
  );

  return pdf.save();
}
