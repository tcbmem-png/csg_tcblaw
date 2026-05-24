import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";

const MARGIN = 36;
const PAGE_W = 612;
const PAGE_H = 792;
const ROW_W = PAGE_W - MARGIN * 2;
const COL_NUM_X = MARGIN;
const COL_LABEL_X = MARGIN + 24;
const COL_TOTAL_RIGHT = PAGE_W - MARGIN;
const COL_B_RIGHT = COL_TOTAL_RIGHT - 80;
const COL_A_RIGHT = COL_B_RIGHT - 80;
const LABEL_MAX_W = COL_A_RIGHT - COL_LABEL_X - 80;

type FontKey = "F1" | "F2";
type Color = [number, number, number];

const INK: Color = [0.1, 0.1, 0.1];
const MUTED: Color = [0.4, 0.4, 0.4];
const RULE: Color = [0.6, 0.6, 0.6];
const HEAD_BG: Color = [0.94, 0.92, 0.88];
const EMPH_BG: Color = [0.98, 0.965, 0.925];

const FONT_WIDTHS: Record<string, number> = {
  " ": 278,
  "!": 278,
  '"': 355,
  "#": 556,
  "$": 556,
  "%": 889,
  "&": 667,
  "'": 191,
  "(": 333,
  ")": 333,
  "*": 389,
  "+": 584,
  ",": 278,
  "-": 333,
  ".": 278,
  "/": 278,
  "0": 556,
  "1": 556,
  "2": 556,
  "3": 556,
  "4": 556,
  "5": 556,
  "6": 556,
  "7": 556,
  "8": 556,
  "9": 556,
  ":": 278,
  ";": 278,
  "<": 584,
  "=": 584,
  ">": 584,
  "?": 556,
  "@": 1015,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  "[": 278,
  "\\": 278,
  "]": 278,
  "^": 469,
  _: 556,
  "`": 333,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  "{": 334,
  "|": 260,
  "}": 334,
  "~": 584,
};

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

function cleanText(text: string) {
  return (text ?? "")
    .replace(/→/g, "->")
    .replace(/[—–]/g, "-")
    .replace(/•/g, "*")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^	\n\r\x20-\x7E]/g, "?");
}

function escapePdfText(text: string) {
  return cleanText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function widthOfText(text: string, size: number) {
  let total = 0;
  for (const char of cleanText(text)) total += FONT_WIDTHS[char] ?? 556;
  return (total / 1000) * size;
}

function trimToWidth(text: string, size: number, maxWidth: number) {
  let str = cleanText(text);
  while (str && widthOfText(str, size) > maxWidth) str = str.slice(0, -1);
  return str;
}

class SimplePdf {
  private pages: string[] = [];
  private content = "";

  constructor(private title: string) {
    this.newPage();
  }

  newPage() {
    if (this.content) this.pages.push(this.content);
    this.content = "";
  }

  fillRect(x: number, y: number, w: number, h: number, color: Color) {
    this.content += `q ${color.join(" ")} rg ${x} ${y} ${w} ${h} re f Q\n`;
  }

  strokeRect(x: number, y: number, w: number, h: number, color: Color, lineWidth = 1) {
    this.content += `q ${lineWidth} w ${color.join(" ")} RG ${x} ${y} ${w} ${h} re S Q\n`;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth = 0.5) {
    this.content += `q ${lineWidth} w ${color.join(" ")} RG ${x1} ${y1} m ${x2} ${y2} l S Q\n`;
  }

  text(text: string, x: number, y: number, size = 10, font: FontKey = "F1", color: Color = INK) {
    this.content += `BT ${color.join(" ")} rg /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET\n`;
  }

  save(): Uint8Array {
    if (this.content || this.pages.length === 0) this.pages.push(this.content);

    const objects: string[] = [];
    const add = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = add("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = add("");
    const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pageIds: number[] = [];

    for (const page of this.pages) {
      const stream = page;
      const contentId = add(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}endstream`);
      const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    }

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    add(`<< /Title (${escapePdfText(this.title)}) /Author (TN Child Support Helper) /Producer (TN Child Support Helper) >>`);

    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new TextEncoder().encode(pdf);
  }
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
  if (r.header) {
    ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, HEAD_BG);
  } else if (r.emphasis) {
    ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, EMPH_BG);
  }
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

function wrapText(text: string, size: number, maxWidth: number): string[] {
  const words = cleanText(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur ? `${cur} ${word}` : word;
    if (widthOfText(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
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
