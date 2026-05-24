import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
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
const COL_B_RIGHT = COL_TOTAL_RIGHT - 80;
const COL_A_RIGHT = COL_B_RIGHT - 80;
const LABEL_MAX_W = COL_A_RIGHT - COL_LABEL_X - 80;

function fmt(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function dirLabel(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} -> ${b}`;
  if (d === "parent_b_to_a") return `${b} -> ${a}`;
  return "-";
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
  a?: string;
  b?: string;
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
  if (r.a) drawTextRight(ctx, r.a, COL_A_RIGHT, textY);
  if (r.b) drawTextRight(ctx, r.b, COL_B_RIGHT, textY);
  if (r.total) drawTextRight(ctx, r.total, COL_TOTAL_RIGHT, textY, { bold: !!r.emphasis });
  ctx.y -= h;
}

function captionLine(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 12);
  drawText(ctx, label, MARGIN + 6, ctx.y - 9, { bold: true, size: 9 });
  drawText(ctx, value, MARGIN + 96, ctx.y - 9, { size: 9, maxWidth: ROW_W - 106 });
  ctx.y -= 12;
}

function footerNote(ctx: Ctx, text: string) {
  const lines = wrapText(text, 8, ROW_W);
  for (const line of lines) {
    ensure(ctx, 10);
    drawText(ctx, line, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
    ctx.y -= 10;
  }
}

export async function renderWorksheetPdf(args: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
}): Promise<Uint8Array> {
  const { inputs, outputs, caption } = args;
  const a = inputs.parentALabel || "Parent A";
  const b = inputs.parentBLabel || "Parent B";

  const pdf = new SimplePdf(caption.matterName || "TN Child Support Worksheet");
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN };

  h1(ctx, "Tennessee Child Support Worksheet");
  small(
    ctx,
    `Income Shares Model - Tenn. Comp. R. & Regs. 1240-02-04 (schedule effective ${outputs.scheduleEffectiveDate}).`,
  );

  const boxTop = ctx.y;
  ctx.y -= 6;
  if (caption.matterName) captionLine(ctx, "Matter:", caption.matterName);
  if (caption.docketNumber) captionLine(ctx, "Docket No.:", caption.docketNumber);
  if (caption.court) captionLine(ctx, "Court:", caption.court);
  if (caption.preparedBy) captionLine(ctx, "Prepared by:", caption.preparedBy);
  if (caption.client) captionLine(ctx, "Client:", caption.client);
  captionLine(ctx, "Children:", `${inputs.numChildren} (youngest age ${inputs.youngestChildAge})`);
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 4;

  h2(ctx, "I. Adjusted Gross Income");
  row(ctx, { n: "#", label: "Item", a, b, total: "Combined", header: true });
  row(ctx, { n: "1", label: "Monthly gross income", a: fmt(inputs.parentAGrossMonthly), b: fmt(inputs.parentBGrossMonthly) });
  row(ctx, { n: "2", label: "Self-employment tax credit", a: fmt(inputs.parentASECredit), b: fmt(inputs.parentBSECredit) });
  row(ctx, { n: "3", label: "Credit: prior support", a: fmt(inputs.parentAPriorSupport), b: fmt(inputs.parentBPriorSupport) });
  row(ctx, { n: "4", label: "Credit: in-home children", a: fmt(inputs.parentAInhomeCredit), b: fmt(inputs.parentBInhomeCredit) });
  row(ctx, { n: "5", label: "Adjusted Gross Income", a: fmt(outputs.parentAAGI), b: fmt(outputs.parentBAGI), total: fmt(outputs.combinedAGI), emphasis: true });
  row(ctx, { n: "6", label: "Pro-rata share (PI)", a: `${(outputs.piA * 100).toFixed(1)}%`, b: `${(outputs.piB * 100).toFixed(1)}%` });

  h2(ctx, "II. Basic Child Support Obligation");
  row(ctx, { n: "7", label: "BCSO from schedule", total: fmt(outputs.bcso), emphasis: true });
  row(ctx, { n: "8", label: "Each parent's BCSO share", a: fmt(outputs.parentABcsoShare), b: fmt(outputs.parentBBcsoShare) });

  h2(ctx, "III. Parenting Time Adjustment");
  row(ctx, { n: "9", label: `ARP: ${outputs.arpIdentity.replace("_", " ")} - band: ${outputs.parentingTimeBand}` });
  row(ctx, { n: "10", label: "Net presumptive support", total: fmt(outputs.netPresumptiveSupport), emphasis: true });

  h2(ctx, "IV. Add-Ons");
  row(ctx, { n: "11", label: "Health insurance (from A perspective)", total: fmt(outputs.addOnHealthFromA) });
  row(ctx, { n: "12", label: "Uninsured medical", total: fmt(outputs.addOnMedicalFromA) });
  row(ctx, { n: "13", label: "Work-related childcare", total: fmt(outputs.addOnChildcareFromA) });
  row(ctx, { n: "14", label: "Total add-ons (from A)", total: fmt(outputs.addOnsTotalFromA), emphasis: true });

  if (outputs.privateSchoolDeviationFromA || outputs.specialExpensesDeviationFromA) {
    h2(ctx, "V. Deviations");
    row(ctx, { n: "15", label: "Private school", total: fmt(outputs.privateSchoolDeviationFromA) });
    row(ctx, { n: "16", label: "Special expenses", total: fmt(outputs.specialExpensesDeviationFromA) });
  }

  h2(ctx, "VI. Final Monthly Order");
  row(ctx, { label: "Direction", total: dirLabel(outputs.allInDirection, a, b), emphasis: true });
  row(ctx, { label: "Monthly amount", total: fmt(outputs.allInMonthly), emphasis: true });
  row(ctx, { label: "Annualized", total: fmt(outputs.allInAnnual) });

  ctx.y -= 8;
  if (outputs.ssrApplied) footerNote(ctx, `Self-support reserve applied: ${outputs.ssrNote}`);
  if (outputs.warnings?.length) footerNote(ctx, `Notes: ${outputs.warnings.join(" * ")}`);
  footerNote(
    ctx,
    "This worksheet is a calculation aid produced by TN Child Support Helper and implements the Tennessee Income Shares Model. It is not legal advice and is not the official AOC form. Verify all inputs and consult counsel before filing.",
  );

  return pdf.save();
}
