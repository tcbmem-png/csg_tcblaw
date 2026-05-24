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
  HEAD_BG,
  cleanText,
  trimToWidth,
  widthOfText,
  wrapText,
  type Color,
} from "./simple-pdf";

/**
 * Renders the State of Tennessee – Child Support Worksheet in the official
 * AOC line-number layout. Fields the calculator does not collect (Line 1a
 * federal benefit, Line 1e not-in-home credit, Part V modification 13a/b/c,
 * Non-parent Caretaker Column C) render as blanks so a clerk or attorney
 * can fill them in by hand.
 */

const ROW_W = PAGE_W - MARGIN * 2;
// 4 columns: # | Label | Mother (A) | Father (B) | Caretaker (C)
const COL_N_W = 28;
const COL_LBL_W = 240;
const COL_VAL_W = (ROW_W - COL_N_W - COL_LBL_W) / 3; // ~80
const X_N = MARGIN;
const X_LBL = X_N + COL_N_W;
const X_A = X_LBL + COL_LBL_W;
const X_B = X_A + COL_VAL_W;
const X_C = X_B + COL_VAL_W;

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function pct(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "";
  return `${(n * 100).toFixed(1)}%`;
}

interface Ctx {
  pdf: SimplePdf;
  y: number;
}

function newPage(ctx: Ctx) {
  ctx.pdf.newPage();
  ctx.y = PAGE_H - MARGIN;
  pageHeader(ctx);
}

function pageHeader(ctx: Ctx) {
  draw(ctx, "State of Tennessee – Child Support Worksheet", MARGIN, ctx.y - 11, { size: 10, bold: true });
  ctx.y -= 16;
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

function drawCenter(ctx: Ctx, text: string, cx: number, y: number, opts: { size?: number; bold?: boolean; color?: Color } = {}) {
  const size = opts.size ?? 9;
  const str = cleanText(text);
  ctx.pdf.text(str, cx - widthOfText(str, size) / 2, y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function h1(ctx: Ctx, t: string) {
  ensure(ctx, 22);
  draw(ctx, t, MARGIN, ctx.y - 13, { size: 14, bold: true });
  ctx.y -= 18;
}

function partHead(ctx: Ctx, t: string) {
  ensure(ctx, 18);
  ctx.y -= 6;
  ctx.pdf.fillRect(MARGIN, ctx.y - 14, ROW_W, 14, HEAD_BG);
  draw(ctx, t, MARGIN + 4, ctx.y - 10, { size: 10, bold: true });
  ctx.y -= 14;
}

function colHeader(ctx: Ctx, labels: { a?: string; b?: string; c?: string }) {
  const h = 16;
  ensure(ctx, h);
  ctx.pdf.fillRect(MARGIN, ctx.y - h, ROW_W, h, HEAD_BG);
  ctx.pdf.line(MARGIN, ctx.y - h, PAGE_W - MARGIN, ctx.y - h, RULE, 0.5);
  drawCenter(ctx, labels.a ?? "Mother / Col A", X_A + COL_VAL_W / 2, ctx.y - h + 5, { size: 8, bold: true });
  drawCenter(ctx, labels.b ?? "Father / Col B", X_B + COL_VAL_W / 2, ctx.y - h + 5, { size: 8, bold: true });
  drawCenter(ctx, labels.c ?? "Caretaker / Col C", X_C + COL_VAL_W / 2, ctx.y - h + 5, { size: 8, bold: true });
  ctx.y -= h;
}

interface OfficialRow {
  n: string;
  label: string;
  a?: string;
  b?: string;
  c?: string;
  bold?: boolean;
}

function row(ctx: Ctx, r: OfficialRow) {
  const h = 14;
  ensure(ctx, h);
  ctx.pdf.line(MARGIN, ctx.y - h, PAGE_W - MARGIN, ctx.y - h, RULE, 0.4);
  // vertical dividers between value columns
  ctx.pdf.line(X_A, ctx.y, X_A, ctx.y - h, RULE, 0.4);
  ctx.pdf.line(X_B, ctx.y, X_B, ctx.y - h, RULE, 0.4);
  ctx.pdf.line(X_C, ctx.y, X_C, ctx.y - h, RULE, 0.4);
  const ty = ctx.y - h + 4;
  draw(ctx, r.n, X_N + 2, ty, { size: 8, color: MUTED, bold: r.bold });
  draw(ctx, r.label, X_LBL, ty, { size: 9, bold: r.bold, maxWidth: COL_LBL_W - 4 });
  if (r.a !== undefined) drawCenter(ctx, r.a, X_A + COL_VAL_W / 2, ty, { size: 9, bold: r.bold });
  if (r.b !== undefined) drawCenter(ctx, r.b, X_B + COL_VAL_W / 2, ty, { size: 9, bold: r.bold });
  if (r.c !== undefined) drawCenter(ctx, r.c, X_C + COL_VAL_W / 2, ty, { size: 9, bold: r.bold });
  ctx.y -= h;
}

function identTable(ctx: Ctx, motherName: string, fatherName: string, arpIs: "parent_a" | "parent_b" | "equal") {
  const h = 14;
  const cw = (ROW_W - 220) / 3; // 3 status cols
  const xName = MARGIN;
  const xPrp = MARGIN + 220;
  const xArp = xPrp + cw;
  const xSplit = xArp + cw;
  // header
  ensure(ctx, h);
  ctx.pdf.fillRect(MARGIN, ctx.y - h, ROW_W, h, HEAD_BG);
  draw(ctx, "Indicate the status of each parent / caretaker (X)", xName + 2, ctx.y - h + 4, { size: 8, bold: true });
  drawCenter(ctx, "PRP", xPrp + cw / 2, ctx.y - h + 4, { size: 8, bold: true });
  drawCenter(ctx, "ARP", xArp + cw / 2, ctx.y - h + 4, { size: 8, bold: true });
  drawCenter(ctx, "SPLIT", xSplit + cw / 2, ctx.y - h + 4, { size: 8, bold: true });
  ctx.y -= h;

  const xRow = (label: string, isPrp: boolean, isArp: boolean) => {
    ensure(ctx, h);
    ctx.pdf.line(MARGIN, ctx.y - h, PAGE_W - MARGIN, ctx.y - h, RULE, 0.4);
    [xPrp, xArp, xSplit, PAGE_W - MARGIN].forEach((x) => ctx.pdf.line(x, ctx.y, x, ctx.y - h, RULE, 0.4));
    draw(ctx, label, xName + 4, ctx.y - h + 4, { size: 9, maxWidth: 210 });
    drawCenter(ctx, isPrp ? "X" : "", xPrp + cw / 2, ctx.y - h + 4, { size: 10, bold: true });
    drawCenter(ctx, isArp ? "X" : "", xArp + cw / 2, ctx.y - h + 4, { size: 10, bold: true });
    drawCenter(ctx, "", xSplit + cw / 2, ctx.y - h + 4);
    ctx.y -= h;
  };

  const motherIsArp = arpIs === "parent_a";
  const fatherIsArp = arpIs === "parent_b";
  xRow(`Name of Mother: ${motherName}`, !motherIsArp && arpIs !== "equal", motherIsArp);
  xRow(`Name of Father: ${fatherName}`, !fatherIsArp && arpIs !== "equal", fatherIsArp);
  xRow("Name of non-parent Caretaker:", false, false);
}

function captionRow(ctx: Ctx, label: string, value: string) {
  const h = 13;
  ensure(ctx, h);
  ctx.pdf.line(MARGIN, ctx.y - h, PAGE_W - MARGIN, ctx.y - h, RULE, 0.3);
  draw(ctx, label, MARGIN + 4, ctx.y - h + 4, { size: 9, bold: true });
  draw(ctx, value, MARGIN + 110, ctx.y - h + 4, { size: 9, maxWidth: ROW_W - 114 });
  ctx.y -= h;
}

function note(ctx: Ctx, text: string) {
  const lines = wrapText(text, 8, ROW_W);
  for (const line of lines) {
    ensure(ctx, 10);
    draw(ctx, line, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
    ctx.y -= 10;
  }
}

function blankBox(ctx: Ctx, label: string, height: number) {
  ensure(ctx, height + 4);
  draw(ctx, label, MARGIN, ctx.y - 9, { size: 9, bold: true });
  ctx.y -= 12;
  ctx.pdf.strokeRect(MARGIN, ctx.y - height, ROW_W, height, RULE, 0.5);
  ctx.y -= height + 2;
}

export async function renderOfficialWorksheetPdf(args: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
}): Promise<Uint8Array> {
  const { inputs, outputs, caption } = args;
  // Map our generic Parent A / Parent B to Mother / Father slots.
  // The user can override labels in the calculator; we trust them.
  const motherName = inputs.parentALabel || "Parent A";
  const fatherName = inputs.parentBLabel || "Parent B";

  const pdf = new SimplePdf(caption.matterName || "TN Child Support Worksheet (Official)");
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN };

  pageHeader(ctx);
  h1(ctx, "Child Support Worksheet");
  note(
    ctx,
    `Tenn. Comp. R. & Regs. 1240-02-04 – Income Shares Model. Schedule effective ${outputs.scheduleEffectiveDate}.`,
  );
  ctx.y -= 4;

  // Part I — Identification
  partHead(ctx, "Part I. Identification");
  identTable(ctx, motherName, fatherName, outputs.arpIdentity);
  ctx.y -= 4;
  captionRow(ctx, "TCSES case #:", "");
  captionRow(ctx, "Docket #:", caption.docketNumber || "");
  captionRow(ctx, "Court name:", caption.court || "");
  captionRow(ctx, "Matter:", caption.matterName || "");
  captionRow(ctx, "Prepared by:", caption.preparedBy || "");
  captionRow(
    ctx,
    "Children:",
    `${inputs.numChildren} child(ren); youngest age ${inputs.youngestChildAge}`,
  );

  // Part II — Adjusted Gross Income
  partHead(ctx, "Part II. Adjusted Gross Income");
  colHeader(ctx, {});
  row(ctx, { n: "1", label: "Monthly Gross Income", a: `$ ${fmt(inputs.parentAGrossMonthly)}`, b: `$ ${fmt(inputs.parentBGrossMonthly)}`, c: "" });
  row(ctx, { n: "1a", label: "Federal benefit for child (+)", a: fmt(inputs.parentAFederalBenefit), b: fmt(inputs.parentBFederalBenefit), c: "" });
  row(ctx, { n: "1b", label: "Self-employment tax paid (-)", a: fmt(inputs.parentASECredit), b: fmt(inputs.parentBSECredit), c: "" });
  // Subtotal 1c — per TN rule, 1a adds back to gross (then 1d/1e subtract).
  const subA = inputs.parentAGrossMonthly + (inputs.parentAFederalBenefit || 0) - (inputs.parentASECredit || 0);
  const subB = inputs.parentBGrossMonthly + (inputs.parentBFederalBenefit || 0) - (inputs.parentBSECredit || 0);
  row(ctx, { n: "1c", label: "Subtotal", a: `$ ${fmt(subA)}`, b: `$ ${fmt(subB)}`, c: "" });
  row(ctx, { n: "1d", label: "Credit for In-Home Children (-)", a: fmt(inputs.parentAInhomeCredit), b: fmt(inputs.parentBInhomeCredit), c: "" });
  row(ctx, { n: "1e", label: "Credit for Not-In-Home Children (-)", a: fmt(inputs.parentAPriorSupport), b: fmt(inputs.parentBPriorSupport), c: "" });
  row(ctx, { n: "2", label: "Adjusted Gross Income (AGI)", a: `$ ${fmt(outputs.parentAAGI)}`, b: `$ ${fmt(outputs.parentBAGI)}`, c: "", bold: true });
  row(ctx, { n: "2a", label: "Combined AGI", a: `$ ${fmt(outputs.combinedAGI)}`, b: "", c: "", bold: true });
  row(ctx, { n: "3", label: "Percentage Share of Income (PI)", a: pct(outputs.piA), b: pct(outputs.piB), c: "" });

  // Part III — Parents' Share of BCSO
  partHead(ctx, "Part III. Parents' Share of BCSO");
  colHeader(ctx, {});
  row(ctx, { n: "4", label: "BCSO (from schedule)", a: "", b: "", c: `$ ${fmt(outputs.bcso)}` });
  row(ctx, { n: "4a", label: "Share of BCSO owed to PRP", a: `$ ${fmt(outputs.parentABcsoShare)}`, b: `$ ${fmt(outputs.parentBBcsoShare)}`, c: "" });
  const arpDays = outputs.arpIdentity === "parent_a"
    ? inputs.parentADays ?? null
    : outputs.arpIdentity === "parent_b"
      ? inputs.parentBDays ?? null
      : null;
  row(ctx, { n: "5", label: "ARP parent's average parenting time (days)", a: "", b: "", c: arpDays !== null ? String(arpDays) : "" });
  // Parenting time adjustment magnitude — apply to the ARP column
  const ptAdjFromArp = Math.max(0, outputs.parentABcsoShare + outputs.parentBBcsoShare - Math.abs(outputs.netPresumptiveSupport));
  const arpAdj = outputs.parentingTimeBand === "standard" ? 0 : ptAdjFromArp;
  row(ctx, {
    n: "6",
    label: "Parenting time adjustment",
    a: outputs.arpIdentity === "parent_a" ? fmt(arpAdj) : "",
    b: outputs.arpIdentity === "parent_b" ? fmt(arpAdj) : "",
    c: "",
  });
  // Adjusted BCSO = each parent's share minus adj on ARP side
  const adjA = outputs.parentABcsoShare - (outputs.arpIdentity === "parent_a" ? arpAdj : 0);
  const adjB = outputs.parentBBcsoShare - (outputs.arpIdentity === "parent_b" ? arpAdj : 0);
  row(ctx, { n: "7", label: "Adjusted BCSO", a: `$ ${fmt(adjA)}`, b: `$ ${fmt(adjB)}`, c: "", bold: true });

  // Part IV — Additional Expenses
  partHead(ctx, "Part IV. Additional Expenses");
  colHeader(ctx, {});
  const hpA = inputs.healthPaidBy === "parent_a" ? inputs.healthPremiumMonthly : 0;
  const hpB = inputs.healthPaidBy === "parent_b" ? inputs.healthPremiumMonthly : 0;
  const ccA = inputs.childcarePaidBy === "parent_a" ? inputs.childcareMonthly : 0;
  const ccB = inputs.childcarePaidBy === "parent_b" ? inputs.childcareMonthly : 0;
  row(ctx, { n: "8a", label: "Children's portion of health insurance premium", a: fmt(hpA), b: fmt(hpB), c: "" });
  row(ctx, { n: "8b", label: "Recurring uninsured medical expenses", a: "", b: "", c: fmt(inputs.uninsuredMedicalMonthly) });
  const payroll = inputs.childcarePayrollDeducted;
  row(ctx, {
    n: "8c",
    label: "Work-related childcare (payroll-deducted)",
    a: payroll ? fmt(ccA) : "",
    b: payroll ? fmt(ccB) : "",
    c: "",
  });
  row(ctx, {
    n: "8d",
    label: "Work-related childcare (non-payroll-deducted)",
    a: payroll ? "" : fmt(ccA),
    b: payroll ? "" : fmt(ccB),
    c: "",
  });
  const totalExpA = hpA + ccA;
  const totalExpB = hpB + ccB;
  const totalExpAll = totalExpA + totalExpB + (inputs.uninsuredMedicalMonthly || 0);
  row(ctx, { n: "9", label: "Total additional expenses", a: fmt(totalExpA), b: fmt(totalExpB), c: fmt(totalExpAll), bold: true });
  // Share owed = each parent's PI × total combined add-ons
  const shareA = outputs.piA * totalExpAll;
  const shareB = outputs.piB * totalExpAll;
  row(ctx, { n: "10", label: "Share of additional expenses owed", a: fmt(shareA), b: fmt(shareB), c: "" });
  // ASO = Adjusted BCSO + (share owed - what they pay directly)
  const asoA = adjA + (shareA - totalExpA);
  const asoB = adjB + (shareB - totalExpB);
  row(ctx, { n: "11", label: "Adjusted Support Obligation (ASO)", a: `$ ${fmt(asoA)}`, b: `$ ${fmt(asoB)}`, c: "", bold: true });

  // Part V — Presumptive Child Support
  partHead(ctx, "Part V. Presumptive Child Support / Modification");
  colHeader(ctx, {});
  // PCSO appears in the ARP column
  const pcso = outputs.netPresumptiveSupport + Math.max(0, shareA - totalExpA, shareB - totalExpB);
  row(ctx, {
    n: "12",
    label: "Presumptive Child Support Order (PCSO)",
    a: outputs.arpIdentity === "parent_a" ? `$ ${fmt(outputs.allInMonthlyFromA > 0 ? outputs.allInMonthly : outputs.allInMonthly)}` : "",
    b: outputs.arpIdentity === "parent_b" ? `$ ${fmt(outputs.allInMonthly)}` : "",
    c: "",
    bold: true,
  });
  note(ctx, "Modification fields (13a, 13b, 13c) left blank — applicable only when modifying an existing order.");
  row(ctx, { n: "13a", label: "Current child support order amount", a: "", b: "", c: "" });
  row(ctx, { n: "13b", label: "Amount required for significant variance", a: "", b: "", c: "" });
  row(ctx, { n: "13c", label: "Actual variance vs PCSO/BCSO", a: "", b: "", c: "" });

  // Part VI — Deviations and Final
  partHead(ctx, "Part VI. Deviations and Final Child Support Order");
  note(ctx, "Deviations must be substantiated by written findings in the Child Support Order.");
  colHeader(ctx, {});
  const devTotal = outputs.privateSchoolDeviationFromA + outputs.specialExpensesDeviationFromA;
  row(ctx, {
    n: "14",
    label: "Deviations (private school, special expenses, other)",
    a: devTotal > 0 ? fmt(devTotal) : "",
    b: devTotal < 0 ? fmt(-devTotal) : "",
    c: "",
  });
  const fbApplied = Math.abs(outputs.federalBenefitOffsetFromA);
  const fcsoBeforeFb = outputs.allInMonthly + fbApplied;
  row(ctx, {
    n: "15",
    label: "Adjusted for Minimum Order (Y/N)",
    a: outputs.minimumOrderApplied ? "Y" : "N",
    b: outputs.minimumOrderApplied ? "Y" : "N",
    c: "",
  });
  row(ctx, {
    n: "16",
    label: "Final Child Support Order (FCSO)",
    a: outputs.arpIdentity === "parent_a" ? `$ ${fmt(fcsoBeforeFb)}` : "",
    b: outputs.arpIdentity === "parent_b" ? `$ ${fmt(fcsoBeforeFb)}` : "",
    c: "",
    bold: true,
  });
  row(ctx, {
    n: "17",
    label: "FCSO adjusted for federal benefit (Line 1a, obligor's column)",
    a: outputs.arpIdentity === "parent_a" ? `$ ${fmt(outputs.allInMonthly)}` : "",
    b: outputs.arpIdentity === "parent_b" ? `$ ${fmt(outputs.allInMonthly)}` : "",
    c: fbApplied > 0 ? `(- $${fmt(fbApplied)})` : "",
    bold: true,
  });

  ctx.y -= 6;
  blankBox(ctx, "Comments, calculations, or rebuttals to schedule:", 56);
  if (caption.comments && caption.comments.trim()) {
    const lines = wrapText(caption.comments.trim(), 9, ROW_W - 8);
    // Re-position cursor inside the blank box we just drew (approx).
    let yy = ctx.y + 56 + 2 - 4;
    for (const line of lines.slice(0, 5)) {
      draw(ctx, line, MARGIN + 4, yy, { size: 9 });
      yy -= 10;
    }
  }

  ensure(ctx, 36);
  draw(ctx, "Preparer's Use Only", MARGIN, ctx.y - 10, { size: 9, bold: true });
  ctx.y -= 14;
  ctx.pdf.line(MARGIN + 40, ctx.y - 2, MARGIN + 240, ctx.y - 2, RULE, 0.6);
  draw(ctx, "Name:", MARGIN, ctx.y - 8, { size: 9, bold: true });
  draw(ctx, caption.preparedBy || "", MARGIN + 42, ctx.y - 8, { size: 9 });
  ctx.pdf.line(MARGIN + 290, ctx.y - 2, MARGIN + 420, ctx.y - 2, RULE, 0.6);
  draw(ctx, "Date:", MARGIN + 260, ctx.y - 8, { size: 9, bold: true });
  ctx.y -= 18;
  ctx.pdf.line(MARGIN + 40, ctx.y - 2, MARGIN + 240, ctx.y - 2, RULE, 0.6);
  draw(ctx, "Title:", MARGIN, ctx.y - 8, { size: 9, bold: true });
  ctx.y -= 16;

  note(
    ctx,
    "Generated by TN Child Support Helper. This is a calculation aid that mirrors the AOC Child Support Worksheet layout; verify all inputs and consult counsel before filing.",
  );

  return pdf.save();
}
