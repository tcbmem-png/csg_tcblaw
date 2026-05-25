import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  SimplePdf,
  MARGIN,
  PAGE_W,
  PAGE_H,
  INK,
  MUTED,
  RULE,
  cleanText,
  trimToWidth,
  widthOfText,
  wrapText,
  type Color,
} from "./simple-pdf";

/**
 * Renders the State of Tennessee – Child Support Worksheet in the official
 * AOC layout: a narrow left gutter for guidance text, a # / Label / Mother /
 * Father / Caretaker grid on the right, hatched "N/A" cells, and the AOC's
 * line numbering verbatim. Fields we do not collect (per-child names/DOBs,
 * federal-benefit line 1a, not-in-home credit, modification 13a–c) render as
 * blanks for the clerk or attorney to complete by hand.
 */

// ---------- Layout constants ----------
const ROW_W = PAGE_W - MARGIN * 2; // 540

const GUTTER_X = MARGIN;        // 36
const GUTTER_W = 108;
const GUTTER_TEXT_W = GUTTER_W - 4;

const NUM_X = MARGIN + GUTTER_W;     // 144
const NUM_W = 18;
const LBL_X = NUM_X + NUM_W;         // 162
const LBL_W = 224;
const A_X = LBL_X + LBL_W;           // 362
const CELL_W = (PAGE_W - MARGIN - A_X) / 3; // ~71.33
const B_X = A_X + CELL_W;
const C_X = B_X + CELL_W;
const END_X = PAGE_W - MARGIN;       // 576

const HATCH: Color = [0.78, 0.78, 0.78];
const PART_BAR: Color = [0.15, 0.15, 0.15];

// ---------- Formatting ----------
function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}
function dollar(n: number | undefined | null) {
  const v = fmt(n);
  return v === "" ? "$" : `$ ${v}`;
}
function pct(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "%";
  return `${(n * 100).toFixed(1)} %`;
}

// ---------- Drawing primitives ----------
interface Ctx {
  pdf: SimplePdf;
  y: number;
  pageNum: number;
}

function newPage(ctx: Ctx) {
  ctx.pdf.newPage();
  ctx.pageNum += 1;
  ctx.y = PAGE_H - MARGIN;
  pageHeader(ctx);
}

function pageHeader(ctx: Ctx) {
  draw(ctx, "State of Tennessee \u2013 Child Support Worksheet", MARGIN, ctx.y - 11, {
    size: 11,
    bold: true,
  });
  draw(ctx, `Page ${ctx.pageNum}`, END_X - 36, ctx.y - 11, { size: 8, color: MUTED });
  ctx.pdf.line(MARGIN, ctx.y - 14, END_X, ctx.y - 14, RULE, 0.5);
  ctx.y -= 20;
}

function ensure(ctx: Ctx, need: number) {
  if (ctx.y - need < MARGIN + 12) newPage(ctx);
}

function draw(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color; maxWidth?: number } = {},
) {
  const size = opts.size ?? 9;
  const str = opts.maxWidth ? trimToWidth(text, size, opts.maxWidth) : cleanText(text);
  ctx.pdf.text(str, x, y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function drawCenter(
  ctx: Ctx,
  text: string,
  cx: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color } = {},
) {
  const size = opts.size ?? 9;
  const str = cleanText(text);
  ctx.pdf.text(str, cx - widthOfText(str, size) / 2, y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function drawRight(ctx: Ctx, text: string, rx: number, y: number, opts: { size?: number; bold?: boolean; color?: Color } = {}) {
  const size = opts.size ?? 9;
  const str = cleanText(text);
  ctx.pdf.text(str, rx - widthOfText(str, size), y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function partHead(ctx: Ctx, t: string) {
  ensure(ctx, 22);
  ctx.y -= 4;
  // Heavy underline rule across the full width
  ctx.pdf.line(MARGIN, ctx.y - 1, END_X, ctx.y - 1, PART_BAR, 1.0);
  draw(ctx, t, MARGIN, ctx.y - 12, { size: 10, bold: true });
  ctx.pdf.line(MARGIN, ctx.y - 15, END_X, ctx.y - 15, PART_BAR, 0.4);
  ctx.y -= 18;
}

/** Renders a wrapped block of italic-ish guidance text in the left gutter,
 *  anchored to the current cursor y (top). Does NOT advance ctx.y. */
function gutter(ctx: Ctx, text: string) {
  const lines = wrapText(text, 8, GUTTER_TEXT_W);
  let yy = ctx.y - 9;
  for (const line of lines) {
    draw(ctx, line, GUTTER_X, yy, { size: 8, color: MUTED });
    yy -= 10;
  }
}

// ---------- Three-column value row (A / B / C) ----------
interface ValueRow {
  n: string;
  label: string;
  a?: string;      // empty string = blank cell, undefined = hatched (N/A)
  b?: string;
  c?: string;
  bold?: boolean;
  height?: number;
}

function valueRow(ctx: Ctx, r: ValueRow) {
  const h = r.height ?? 14;
  ensure(ctx, h);
  const yTop = ctx.y;
  const yBot = ctx.y - h;
  // Three bordered value cells
  const cells: Array<{ x: number; v: string | undefined }> = [
    { x: A_X, v: r.a },
    { x: B_X, v: r.b },
    { x: C_X, v: r.c },
  ];
  for (const cell of cells) {
    if (cell.v === undefined) {
      ctx.pdf.hatchRect(cell.x, yBot, CELL_W, h, HATCH, 3, 0.3);
    }
    ctx.pdf.strokeRect(cell.x, yBot, CELL_W, h, RULE, 0.4);
  }
  const ty = yBot + 4;
  draw(ctx, r.n, NUM_X, ty, { size: 8, bold: true, color: MUTED });
  draw(ctx, r.label, LBL_X, ty, { size: 9, bold: r.bold, maxWidth: LBL_W - 4 });
  for (const cell of cells) {
    if (cell.v !== undefined && cell.v !== "") {
      drawRight(ctx, cell.v, cell.x + CELL_W - 4, ty, { size: 9, bold: r.bold });
    }
  }
  ctx.y -= h;
  void yTop;
}

/** A row with a single merged value cell spanning A+B+C (or A+B). */
function spanRow(
  ctx: Ctx,
  r: { n: string; label: string; value?: string; from?: number; to?: number; bold?: boolean },
) {
  const h = 14;
  ensure(ctx, h);
  const yBot = ctx.y - h;
  const x1 = r.from ?? A_X;
  const x2 = r.to ?? END_X;
  ctx.pdf.strokeRect(x1, yBot, x2 - x1, h, RULE, 0.4);
  const ty = yBot + 4;
  draw(ctx, r.n, NUM_X, ty, { size: 8, bold: true, color: MUTED });
  draw(ctx, r.label, LBL_X, ty, { size: 9, bold: r.bold, maxWidth: LBL_W - 4 });
  if (r.value !== undefined && r.value !== "") {
    drawRight(ctx, r.value, x2 - 4, ty, { size: 9, bold: r.bold });
  }
  ctx.y -= h;
}

// ---------- Section: Part I header rows (parent/caretaker status) ----------
function identTable(
  ctx: Ctx,
  motherName: string,
  fatherName: string,
  arp: { motherIsArp: boolean; fatherIsArp: boolean; isEqual: boolean },
) {
  // Three columns: PRP / ARP / SPLIT — anchored to A_X..END_X
  const colW = CELL_W;
  const colHdrH = 12;
  ensure(ctx, colHdrH);
  drawCenter(ctx, "PRP", A_X + colW / 2, ctx.y - 9, { size: 8, bold: true });
  drawCenter(ctx, "ARP", B_X + colW / 2, ctx.y - 9, { size: 8, bold: true });
  drawCenter(ctx, "SPLIT", C_X + colW / 2, ctx.y - 9, { size: 8, bold: true });
  ctx.y -= colHdrH;

  const labelLeftX = NUM_X;
  const valueLeftX = NUM_X + 154;
  const valueRightX = A_X - 4;

  const drawNameRow = (label: string, value: string, isPrp: boolean, isArp: boolean) => {
    const h = 14;
    ensure(ctx, h);
    const yBot = ctx.y - h;
    ctx.pdf.line(valueLeftX, yBot, valueRightX, yBot, RULE, 0.5);
    draw(ctx, label, labelLeftX, yBot + 4, { size: 9, bold: true, maxWidth: valueLeftX - labelLeftX - 2 });
    draw(ctx, value, valueLeftX + 2, yBot + 4, { size: 9, maxWidth: valueRightX - valueLeftX - 4 });
    [A_X, B_X, C_X].forEach((x) => {
      ctx.pdf.strokeRect(x, yBot, colW, h, RULE, 0.4);
    });
    if (isPrp) drawCenter(ctx, "X", A_X + colW / 2, yBot + 4, { size: 10, bold: true });
    if (isArp) drawCenter(ctx, "X", B_X + colW / 2, yBot + 4, { size: 10, bold: true });
    ctx.y -= h;
  };

  drawNameRow("Name of Mother:", motherName, !arp.motherIsArp && !arp.isEqual, arp.motherIsArp);
  drawNameRow("Name of Father:", fatherName, !arp.fatherIsArp && !arp.isEqual, arp.fatherIsArp);
  drawNameRow("Name of non-parent Caretaker:", "", false, false);
}

function captionLine(ctx: Ctx, label: string, value: string) {
  const h = 13;
  ensure(ctx, h);
  const yBot = ctx.y - h;
  draw(ctx, label, NUM_X, yBot + 4, { size: 9, bold: true });
  const lineX1 = NUM_X + 80;
  const lineX2 = END_X;
  ctx.pdf.line(lineX1, yBot, lineX2, yBot, RULE, 0.4);
  draw(ctx, value, lineX1 + 2, yBot + 4, { size: 9, maxWidth: lineX2 - lineX1 - 4 });
  ctx.y -= h;
}

// ---------- Section: Part I child(ren) sub-table ----------
interface ChildRowData {
  name: string;
  dob: string;
  daysMother: number;
  daysFather: number;
}
function childrenSubtable(ctx: Ctx, numChildren: number, children: ChildRowData[]) {
  const h = 14;
  const cols = [
    { label: "Name(s) of Child(ren)", x: NUM_X, w: 170 },
    { label: "Date of Birth", x: NUM_X + 170, w: 80 },
    { label: "Days with Mother", x: NUM_X + 250, w: 55 },
    { label: "Days with Father", x: NUM_X + 305, w: 55 },
    { label: "Days with Caretaker", x: NUM_X + 360, w: 56 },
  ];
  ensure(ctx, h);
  let yBot = ctx.y - h;
  cols.forEach((c) => {
    ctx.pdf.strokeRect(c.x, yBot, c.w, h, RULE, 0.4);
    drawCenter(ctx, c.label, c.x + c.w / 2, yBot + 4, { size: 7, bold: true });
  });
  ctx.y -= h;
  const rows = Math.max(5, numChildren);
  for (let i = 0; i < rows; i += 1) {
    ensure(ctx, h);
    yBot = ctx.y - h;
    cols.forEach((c) => {
      ctx.pdf.strokeRect(c.x, yBot, c.w, h, RULE, 0.4);
    });
    const data = children[i];
    if (data) {
      if (data.name) draw(ctx, data.name, cols[0].x + 4, yBot + 4, { size: 9, maxWidth: cols[0].w - 8 });
      if (data.dob) draw(ctx, data.dob, cols[1].x + 4, yBot + 4, { size: 9, maxWidth: cols[1].w - 8 });
      if (data.daysMother) drawRight(ctx, String(data.daysMother), cols[2].x + cols[2].w - 4, yBot + 4, { size: 9 });
      if (data.daysFather) drawRight(ctx, String(data.daysFather), cols[3].x + cols[3].w - 4, yBot + 4, { size: 9 });
    }
    ctx.y -= h;
  }
}

// ---------- Section: column header row for value tables ----------
function columnHeader(ctx: Ctx, opts: { mergeAB?: boolean; mergeABLabel?: string } = {}) {
  const h = 22;
  ensure(ctx, h);
  const yBot = ctx.y - h;
  if (opts.mergeAB) {
    // Single merged header over A+B, separate C header
    ctx.pdf.strokeRect(A_X, yBot, CELL_W * 2, h, RULE, 0.4);
    drawCenter(ctx, opts.mergeABLabel ?? "Obligation Column", A_X + CELL_W, yBot + h - 9, { size: 9, bold: true });
    ctx.pdf.strokeRect(C_X, yBot, CELL_W, h, RULE, 0.4);
    drawCenter(ctx, "Non-parent", C_X + CELL_W / 2, yBot + h - 8, { size: 8, bold: true });
    drawCenter(ctx, "Caretaker / Col C", C_X + CELL_W / 2, yBot + h - 17, { size: 8, bold: true });
  } else {
    [
      { x: A_X, l1: "Mother /", l2: "Column A" },
      { x: B_X, l1: "Father /", l2: "Column B" },
      { x: C_X, l1: "Non-parent", l2: "Caretaker / Col C" },
    ].forEach((c) => {
      ctx.pdf.strokeRect(c.x, yBot, CELL_W, h, RULE, 0.4);
      drawCenter(ctx, c.l1, c.x + CELL_W / 2, yBot + h - 8, { size: 8, bold: true });
      drawCenter(ctx, c.l2, c.x + CELL_W / 2, yBot + h - 17, { size: 8, bold: true });
    });
  }
  ctx.y -= h;
}

// ---------- Page 2 footer blocks ----------
function blankBox(ctx: Ctx, label: string, height: number, content?: string) {
  ensure(ctx, height + 16);
  draw(ctx, label, MARGIN, ctx.y - 10, { size: 9, bold: true });
  ctx.y -= 12;
  const yBot = ctx.y - height;
  ctx.pdf.strokeRect(MARGIN, yBot, ROW_W, height, RULE, 0.5);
  // Horizontal ruling inside the box for handwriting
  const lineH = 12;
  for (let yy = yBot + lineH; yy < ctx.y - 2; yy += lineH) {
    ctx.pdf.line(MARGIN + 4, yy, END_X - 4, yy, RULE, 0.3);
  }
  if (content && content.trim()) {
    const lines = wrapText(content.trim(), 9, ROW_W - 12);
    let yy = ctx.y - 10;
    for (const line of lines) {
      if (yy < yBot + 4) break;
      draw(ctx, line, MARGIN + 6, yy, { size: 9 });
      yy -= lineH;
    }
  }
  ctx.y = yBot - 4;
}

// ---------- Main render ----------
export async function renderOfficialWorksheetPdf(args: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
}): Promise<Uint8Array> {
  const { inputs, outputs, caption } = args;

  // Mother/Father swap. The AOC worksheet hardcodes "Mother / Column A" and
  // "Father / Column B" headers; our calculator only knows Parent A / Parent B.
  // caption.parentARole tells us which calculator parent fills the Mother row.
  // When parentARole === "father", Column A receives Parent B's data and vice
  // versa, so the printed worksheet matches the form's labels.
  const aIsMother = (caption.parentARole ?? "mother") !== "father";
  const motherName = (aIsMother ? inputs.parentALabel : inputs.parentBLabel) || (aIsMother ? "Parent A" : "Parent B");
  const fatherName = (aIsMother ? inputs.parentBLabel : inputs.parentALabel) || (aIsMother ? "Parent B" : "Parent A");
  /** Pick the value for column A (Mother). */
  const mV = <T>(av: T, bv: T): T => (aIsMother ? av : bv);
  /** Pick the value for column B (Father). */
  const fV = <T>(av: T, bv: T): T => (aIsMother ? bv : av);

  const motherKey: "parent_a" | "parent_b" = aIsMother ? "parent_a" : "parent_b";
  const fatherKey: "parent_a" | "parent_b" = aIsMother ? "parent_b" : "parent_a";
  const motherIsArp = outputs.arpIdentity === motherKey;
  const fatherIsArp = outputs.arpIdentity === fatherKey;
  const isEqualArp = outputs.arpIdentity === "equal";

  const pdf = new SimplePdf(caption.matterName || "TN Child Support Worksheet (Official)");
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN, pageNum: 1 };
  pageHeader(ctx);

  // -----------------------------------------------------------------
  // Part I — Identification
  // -----------------------------------------------------------------
  partHead(ctx, "Part I.  Identification");
  const partITop = ctx.y;
  gutter(
    ctx,
    "Indicate the status of each parent or caretaker by placing an \"X\" in the appropriate column.",
  );
  ctx.y = partITop;
  identTable(ctx, motherName, fatherName, { motherIsArp, fatherIsArp, isEqual: isEqualArp });
  ctx.y -= 4;
  captionLine(ctx, "TCSES case #:", "");
  captionLine(ctx, "Docket #:", caption.docketNumber || "");
  captionLine(ctx, "Court name:", caption.court || "");
  ctx.y -= 6;
  // Map per-child days from A/B-relative to mother/father-relative.
  const childRows: ChildRowData[] = (caption.children ?? []).map((c) => ({
    name: c.name ?? "",
    dob: c.dob ?? "",
    daysMother: aIsMother ? c.daysWithA ?? 0 : c.daysWithB ?? 0,
    daysFather: aIsMother ? c.daysWithB ?? 0 : c.daysWithA ?? 0,
  }));
  childrenSubtable(ctx, inputs.numChildren, childRows);

  // -----------------------------------------------------------------
  // Part II — Adjusted Gross Income
  // -----------------------------------------------------------------
  partHead(ctx, "Part II.  Adjusted Gross Income");
  const partIITop = ctx.y;
  gutter(ctx, "Use Credit Worksheet to calculate line items 1d and 1e.");
  ctx.y = partIITop;
  columnHeader(ctx);

  valueRow(ctx, {
    n: "1",
    label: "Monthly Gross Income",
    a: dollar(mV(inputs.parentAGrossMonthly, inputs.parentBGrossMonthly)),
    b: dollar(fV(inputs.parentAGrossMonthly, inputs.parentBGrossMonthly)),
    c: undefined,
  });
  valueRow(ctx, {
    n: "1a",
    label: "Federal benefit for child",
    a: `+ ${fmt(mV(inputs.parentAFederalBenefit, inputs.parentBFederalBenefit))}`,
    b: `+ ${fmt(fV(inputs.parentAFederalBenefit, inputs.parentBFederalBenefit))}`,
    c: undefined,
  });
  valueRow(ctx, {
    n: "1b",
    label: "Self-employment tax paid",
    a: `- ${fmt(mV(inputs.parentASECredit, inputs.parentBSECredit))}`,
    b: `- ${fmt(fV(inputs.parentASECredit, inputs.parentBSECredit))}`,
    c: undefined,
  });
  const subA = inputs.parentAGrossMonthly + (inputs.parentAFederalBenefit || 0) - (inputs.parentASECredit || 0);
  const subB = inputs.parentBGrossMonthly + (inputs.parentBFederalBenefit || 0) - (inputs.parentBSECredit || 0);
  valueRow(ctx, {
    n: "1c",
    label: "Subtotal",
    a: dollar(mV(subA, subB)),
    b: dollar(fV(subA, subB)),
    c: undefined,
  });
  valueRow(ctx, {
    n: "1d",
    label: "Credit for In-Home Children",
    a: `- ${fmt(mV(inputs.parentAInhomeCredit, inputs.parentBInhomeCredit))}`,
    b: `- ${fmt(fV(inputs.parentAInhomeCredit, inputs.parentBInhomeCredit))}`,
    c: undefined,
  });
  valueRow(ctx, {
    n: "1e",
    label: "Credit for Not In Home Children",
    a: `- ${fmt(mV(inputs.parentAPriorSupport, inputs.parentBPriorSupport))}`,
    b: `- ${fmt(fV(inputs.parentAPriorSupport, inputs.parentBPriorSupport))}`,
    c: undefined,
  });
  valueRow(ctx, {
    n: "2",
    label: "Adjusted Gross Income (AGI)",
    a: dollar(mV(outputs.parentAAGI, outputs.parentBAGI)),
    b: dollar(fV(outputs.parentAAGI, outputs.parentBAGI)),
    c: undefined,
    bold: true,
  });
  spanRow(ctx, {
    n: "2a",
    label: "Combined Adjusted Gross Income",
    value: dollar(outputs.combinedAGI),
    from: A_X,
    to: B_X + CELL_W,
    bold: true,
  });
  {
    const yBot = ctx.y;
    pdf.hatchRect(C_X, yBot, CELL_W, 14, HATCH, 3, 0.3);
    pdf.strokeRect(C_X, yBot, CELL_W, 14, RULE, 0.4);
  }
  valueRow(ctx, {
    n: "3",
    label: "Percentage Share of Income (PI)",
    a: pct(mV(outputs.piA, outputs.piB)),
    b: pct(fV(outputs.piA, outputs.piB)),
    c: undefined,
  });

  // -----------------------------------------------------------------
  // Part III — Parents' Share of BCSO
  // -----------------------------------------------------------------
  partHead(ctx, "Part III.  Parents' Share of BCSO");
  columnHeader(ctx);

  valueRow(ctx, {
    n: "4",
    label: "BCSO allotted to primary parent's household",
    a: undefined,
    b: undefined,
    c: dollar(outputs.bcso),
  });
  valueRow(ctx, {
    n: "4a",
    label: "Share of BCSO owed to primary parent",
    a: dollar(mV(outputs.parentABcsoShare, outputs.parentBBcsoShare)),
    b: dollar(fV(outputs.parentABcsoShare, outputs.parentBBcsoShare)),
    c: undefined,
  });
  const arpDays =
    outputs.arpIdentity === "parent_a"
      ? inputs.parentADays ?? null
      : outputs.arpIdentity === "parent_b"
        ? inputs.parentBDays ?? null
        : null;
  valueRow(ctx, {
    n: "5",
    label: "ARP parent's average parenting time",
    a: motherIsArp ? (arpDays !== null ? String(arpDays) : "") : undefined,
    b: fatherIsArp ? (arpDays !== null ? String(arpDays) : "") : undefined,
    c: undefined,
  });
  const ptAdjFromArp = Math.max(
    0,
    outputs.parentABcsoShare + outputs.parentBBcsoShare - Math.abs(outputs.netPresumptiveSupport),
  );
  const arpAdj = outputs.parentingTimeBand === "standard" ? 0 : ptAdjFromArp;
  valueRow(ctx, {
    n: "6",
    label: "Parenting time adjustment",
    a: motherIsArp ? dollar(arpAdj) : undefined,
    b: fatherIsArp ? dollar(arpAdj) : undefined,
    c: undefined,
  });
  // Line 7 — Adjusted BCSO after parenting-time multiplier collapses to net.
  // For equal parenting (Rule .04(7)(b)(2)(i)) the variable multiplier
  // produces a single net presumptive cross-credit; render that as the
  // obligor parent's Adjusted BCSO with 0 in the other column so the
  // line 7 → line 12 path is mechanical on the face of the form.
  let adjA: number;
  let adjB: number;
  if (outputs.parentingTimeBand === "equal") {
    const netAbs = Math.abs(outputs.netPresumptiveSupport);
    if (outputs.presumptiveDirection === "parent_a_to_b") {
      adjA = netAbs;
      adjB = 0;
    } else if (outputs.presumptiveDirection === "parent_b_to_a") {
      adjA = 0;
      adjB = netAbs;
    } else {
      adjA = 0;
      adjB = 0;
    }
  } else {
    adjA = outputs.parentABcsoShare - (outputs.arpIdentity === "parent_a" ? arpAdj : 0);
    adjB = outputs.parentBBcsoShare - (outputs.arpIdentity === "parent_b" ? arpAdj : 0);
  }
  valueRow(ctx, {
    n: "7",
    label: "Adjusted BCSO",
    a: dollar(mV(adjA, adjB)),
    b: dollar(fV(adjA, adjB)),
    c: undefined,
    bold: true,
  });

  // -----------------------------------------------------------------
  // Part IV — Additional Expenses
  // -----------------------------------------------------------------
  partHead(ctx, "Part IV.  Additional Expenses");
  columnHeader(ctx);
  const hpA = inputs.healthPaidBy === "parent_a" ? inputs.healthPremiumMonthly : 0;
  const hpB = inputs.healthPaidBy === "parent_b" ? inputs.healthPremiumMonthly : 0;
  const ccA = inputs.childcarePaidBy === "parent_a" ? inputs.childcareMonthly : 0;
  const ccB = inputs.childcarePaidBy === "parent_b" ? inputs.childcareMonthly : 0;
  const umedIsSplit = inputs.uninsuredMedicalPaidBy === "split_pro_rata";
  const umedA = !umedIsSplit && inputs.uninsuredMedicalPaidBy === "parent_a" ? inputs.uninsuredMedicalMonthly : 0;
  const umedB = !umedIsSplit && inputs.uninsuredMedicalPaidBy === "parent_b" ? inputs.uninsuredMedicalMonthly : 0;
  valueRow(ctx, {
    n: "8a",
    label: "Children's portion of health insurance premium",
    a: dollar(mV(hpA, hpB)),
    b: dollar(fV(hpA, hpB)),
    c: undefined,
  });
  valueRow(ctx, {
    n: "8b",
    label: "Recurring Uninsured Medical Expenses",
    a: dollar(mV(umedA, umedB)),
    b: dollar(fV(umedA, umedB)),
    c: undefined,
  });
  valueRow(ctx, {
    n: "8c",
    label: "Work-related childcare",
    a: dollar(mV(ccA, ccB)),
    b: dollar(fV(ccA, ccB)),
    c: undefined,
  });
  const totalExpA = hpA + ccA + umedA;
  const totalExpB = hpB + ccB + umedB;
  const totalExpAll = totalExpA + totalExpB;
  valueRow(ctx, {
    n: "9",
    label: "Total expenses",
    a: dollar(mV(totalExpA, totalExpB)),
    b: dollar(fV(totalExpA, totalExpB)),
    c: undefined,
    bold: true,
  });
  const shareA = outputs.piA * totalExpAll;
  const shareB = outputs.piB * totalExpAll;
  valueRow(ctx, {
    n: "10",
    label: "Share of additional expenses owed",
    a: dollar(mV(shareA, shareB)),
    b: dollar(fV(shareA, shareB)),
    c: undefined,
  });
  const asoA = adjA + (shareA - totalExpA);
  const asoB = adjB + (shareB - totalExpB);
  valueRow(ctx, {
    n: "11",
    label: "Adjusted Support Obligation (ASO)",
    a: dollar(mV(asoA, asoB)),
    b: dollar(fV(asoA, asoB)),
    c: undefined,
    bold: true,
  });

  // -----------------------------------------------------------------
  // Part V — Presumptive Child Support / Modification of Current Support
  // -----------------------------------------------------------------
  partHead(ctx, "Part V.  Presumptive Child Support / Modification of Current Support");
  columnHeader(ctx, { mergeAB: true, mergeABLabel: "Obligation Column" });
  const obligorIsParentA =
    outputs.arpIdentity === "parent_a" ||
    (outputs.arpIdentity === "equal" && outputs.allInDirection === "parent_a_to_b");
  const obligorIsParentB =
    outputs.arpIdentity === "parent_b" ||
    (outputs.arpIdentity === "equal" && outputs.allInDirection === "parent_b_to_a");
  const obligorIsMother = aIsMother ? obligorIsParentA : obligorIsParentB;
  const obligorIsFather = aIsMother ? obligorIsParentB : obligorIsParentA;
  const pcsoA = obligorIsMother ? dollar(outputs.allInMonthly) : "";
  const pcsoB = obligorIsFather ? dollar(outputs.allInMonthly) : "";
  valueRow(ctx, {
    n: "12",
    label: "Presumptive Child Support Order (PCSO)",
    a: pcsoA,
    b: pcsoB,
    c: undefined,
    bold: true,
  });
  ensure(ctx, 12);
  draw(
    ctx,
    "* Enter the difference between the greater and smaller numbers from Line 11, except in non-parent caretaker situations.",
    LBL_X,
    ctx.y - 8,
    { size: 7, color: MUTED, maxWidth: END_X - LBL_X },
  );
  ctx.y -= 12;
  ensure(ctx, 14);
  draw(ctx, "Low Income?", LBL_X, ctx.y - 9, { size: 9 });
  ctx.pdf.line(LBL_X + 72, ctx.y - 10, LBL_X + 120, ctx.y - 10, RULE, 0.5);
  draw(ctx, "(N = 15%   Y = 7.5%)", LBL_X + 130, ctx.y - 9, { size: 8, color: MUTED });
  ctx.y -= 14;
  ensure(ctx, 14);
  draw(ctx, "Current Order Flat %", LBL_X, ctx.y - 9, { size: 9 });
  ctx.pdf.line(LBL_X + 110, ctx.y - 10, LBL_X + 158, ctx.y - 10, RULE, 0.5);
  draw(ctx, "(N / Y)", LBL_X + 168, ctx.y - 9, { size: 8, color: MUTED });
  ctx.y -= 14;

  const modTop = ctx.y;
  gutter(ctx, "Modification of Current Child Support Order");
  ctx.y = modTop;
  valueRow(ctx, { n: "13a", label: "Current child support order amount, obligor parent", a: "", b: "", c: undefined });
  valueRow(ctx, { n: "13b", label: "Amount required for significant variance to exist", a: "", b: "", c: undefined });
  valueRow(ctx, { n: "13c", label: "Actual variance vs PCSO / BCSO", a: "", b: "", c: undefined });

  // -----------------------------------------------------------------
  // Part VI — Deviations and Final Child Support Order
  // -----------------------------------------------------------------
  partHead(ctx, "Part VI.  Deviations and Final Child Support Order");
  const partVITop = ctx.y;
  gutter(
    ctx,
    "Deviations must be substantiated by written findings in the Child Support Order.",
  );
  ctx.y = partVITop;
  columnHeader(ctx);

  // devTotal is signed from Parent A's perspective; flip if A is the father.
  const devFromA = outputs.privateSchoolDeviationFromA + outputs.specialExpensesDeviationFromA;
  const devFromMother = aIsMother ? devFromA : -devFromA;
  valueRow(ctx, {
    n: "14",
    label: "Deviations (Specify):",
    a: devFromMother > 0 ? dollar(devFromMother) : "",
    b: devFromMother < 0 ? dollar(-devFromMother) : "",
    c: undefined,
  });
  // Up to 3 narrative rows — populated from caption.deviationNarrative.
  const narrativeLines = caption.deviationNarrative
    ? wrapText(caption.deviationNarrative.trim(), 9, END_X - LBL_X - 8)
    : [];
  for (let i = 0; i < 3; i += 1) {
    ensure(ctx, 14);
    const yBot = ctx.y - 14;
    ctx.pdf.strokeRect(LBL_X, yBot, END_X - LBL_X, 14, RULE, 0.35);
    if (narrativeLines[i]) {
      draw(ctx, narrativeLines[i], LBL_X + 4, yBot + 4, { size: 9, maxWidth: END_X - LBL_X - 8 });
    }
    ctx.y -= 14;
  }
  const fbApplied = Math.abs(outputs.federalBenefitOffsetFromA);
  const fcsoBeforeFb = outputs.allInMonthly + fbApplied;
  valueRow(ctx, {
    n: "15",
    label: "Final Child Support Order (FCSO)",
    a: obligorIsMother ? dollar(fcsoBeforeFb) : "",
    b: obligorIsFather ? dollar(fcsoBeforeFb) : "",
    c: undefined,
    bold: true,
  });
  valueRow(ctx, {
    n: "16",
    label: "FCSO adjusted for federal benefit (Line 1a)",
    a: obligorIsMother ? dollar(outputs.allInMonthly) : "",
    b: obligorIsFather ? dollar(outputs.allInMonthly) : "",
    c: undefined,
    bold: true,
  });


  // -----------------------------------------------------------------
  // High-income / statutory-cap explainers (Part VI footer notes)
  // -----------------------------------------------------------------
  if (outputs.pcsoExceedsStatutoryMax) {
    ctx.y -= 8;
    ensure(ctx, 14);
    draw(ctx, "Statutory Presumptive Cap \u2014 Tenn. Code Ann. \u00a736-5-101(e)(1)(B)", MARGIN, ctx.y - 9, {
      size: 9,
      bold: true,
    });
    ctx.y -= 12;
    const rows: Array<[string, string]> = [
      ["Calculated PCSO", `$ ${fmt(outputs.allInMonthly + Math.abs(outputs.federalBenefitOffsetFromA))} /mo`],
      [
        `Statutory cap (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"})`,
        `$ ${fmt(outputs.pcsoStatutoryMax)} /mo`,
      ],
      [
        "Excess subject to recipient's burden",
        `$ ${fmt(outputs.pcsoExcessOverCap)} /mo  \u00b7  $ ${fmt(outputs.pcsoExcessOverCap * 12)} /yr`,
      ],
    ];
    for (const [label, value] of rows) {
      ensure(ctx, 12);
      draw(ctx, label, MARGIN + 8, ctx.y - 9, { size: 9 });
      drawRight(ctx, value, END_X - 4, ctx.y - 9, { size: 9, bold: label.startsWith("Excess") });
      ctx.y -= 12;
    }
    if (outputs.pcsoCapNote) {
      ctx.y -= 2;
      const lines = wrapText(outputs.pcsoCapNote, 8, ROW_W - 12);
      for (const line of lines) {
        ensure(ctx, 10);
        draw(ctx, line, MARGIN + 6, ctx.y - 8, { size: 8, color: MUTED });
        ctx.y -= 10;
      }
    }
  } else if (outputs.pcsoBelowCapNote) {
    ctx.y -= 6;
    const lines = wrapText(outputs.pcsoBelowCapNote, 8, ROW_W - 12);
    for (const line of lines) {
      ensure(ctx, 10);
      draw(ctx, line, MARGIN + 6, ctx.y - 8, { size: 8, color: MUTED });
      ctx.y -= 10;
    }
  }

  if (outputs.equalParentingLowSupportNote) {
    ctx.y -= 8;
    ensure(ctx, 12);
    draw(ctx, "Why this 50/50 obligation is low", MARGIN, ctx.y - 9, { size: 9, bold: true });
    ctx.y -= 12;
    const lines = wrapText(outputs.equalParentingLowSupportNote, 8, ROW_W - 12);
    for (const line of lines) {
      ensure(ctx, 10);
      draw(ctx, line, MARGIN + 6, ctx.y - 8, { size: 8, color: MUTED });
      ctx.y -= 10;
    }
  }

  // -----------------------------------------------------------------
  // Comments + Preparer's Use Only
  // -----------------------------------------------------------------
  ctx.y -= 8;
  blankBox(ctx, "Comments, Calculations, or Rebuttals to Schedule:", 56, caption.comments);


  ensure(ctx, 50);
  ctx.y -= 4;
  draw(ctx, "Preparer's Use Only", MARGIN, ctx.y - 10, { size: 9, bold: true });
  ctx.y -= 16;
  // Name + Date row
  draw(ctx, "Name:", MARGIN, ctx.y - 8, { size: 9, bold: true });
  ctx.pdf.line(MARGIN + 40, ctx.y - 10, MARGIN + 280, ctx.y - 10, RULE, 0.6);
  draw(ctx, caption.preparedBy || "", MARGIN + 44, ctx.y - 8, { size: 9 });
  draw(ctx, "Date:", MARGIN + 310, ctx.y - 8, { size: 9, bold: true });
  ctx.pdf.line(MARGIN + 348, ctx.y - 10, END_X, ctx.y - 10, RULE, 0.6);
  ctx.y -= 18;
  draw(ctx, "Title:", MARGIN, ctx.y - 8, { size: 9, bold: true });
  ctx.pdf.line(MARGIN + 40, ctx.y - 10, MARGIN + 280, ctx.y - 10, RULE, 0.6);
  ctx.y -= 14;

  // Disclaimer
  const disc = wrapText(
    "Generated by TN Child Support Helper. This is a calculation aid that mirrors the AOC Child Support Worksheet layout; verify all inputs and consult counsel before filing.",
    7,
    ROW_W,
  );
  for (const line of disc) {
    ensure(ctx, 9);
    draw(ctx, line, MARGIN, ctx.y - 7, { size: 7, color: MUTED });
    ctx.y -= 9;
  }

  return pdf.save();
}
