/**
 * Shared SimplePdf layout kit for "reproduce" worksheets (GA, LA — and the same
 * pattern TN uses inline in worksheet-pdf.ts). A per-state renderer builds a
 * model of labeled lines and hands them to these helpers; this keeps GA and LA
 * one consistent reproduce build instead of two bespoke layouts.
 *
 * Three value columns: col1 / col2 (the two parents) and combined. Money is
 * shown to the cent (the State worksheets carry cents); use fmtWhole for the
 * whole-dollar final line where a State form rounds it.
 */
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

export const ROW_W = PAGE_W - MARGIN * 2;
const COL_NUM_X = MARGIN;
const COL_LABEL_X = MARGIN + 22;
export const COL3_RIGHT = PAGE_W - MARGIN; // combined
export const COL2_RIGHT = COL3_RIGHT - 90; // col2 parent
export const COL1_RIGHT = COL2_RIGHT - 90; // col1 parent
const LABEL_MAX_W = COL1_RIGHT - COL_LABEL_X - 90;

/** Money to the cent, e.g. 1073.89 -> "$1,073.89"; negative -> "-$129.11". */
export function fmtCents(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-$" : "$"}${abs}`;
}

/** Whole dollars, e.g. 652.35 -> "$652". */
export function fmtWhole(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return `${n < 0 ? "-$" : "$"}${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}

export function fmtPct(frac: number): string {
  return `${(frac * 100).toFixed(2)}%`;
}

export interface Ctx {
  pdf: SimplePdf;
  y: number;
}

export function startDoc(title: string): Ctx {
  const pdf = new SimplePdf(title);
  return { pdf, y: PAGE_H - MARGIN };
}

export function newPage(ctx: Ctx) {
  ctx.pdf.newPage();
  ctx.y = PAGE_H - MARGIN;
}

export function ensure(ctx: Ctx, need: number) {
  if (ctx.y - need < MARGIN) newPage(ctx);
}

export function drawText(
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

export function drawTextRight(
  ctx: Ctx,
  text: string,
  rightX: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color } = {},
) {
  const size = opts.size ?? 10;
  const str = cleanText(text);
  ctx.pdf.text(
    str,
    rightX - widthOfText(str, size),
    y,
    size,
    opts.bold ? "F2" : "F1",
    opts.color ?? INK,
  );
}

export function h1(ctx: Ctx, t: string) {
  ensure(ctx, 24);
  drawText(ctx, t, MARGIN, ctx.y - 14, { size: 15, bold: true });
  ctx.y -= 20;
}

export function h2(ctx: Ctx, t: string) {
  ensure(ctx, 22);
  ctx.y -= 8;
  drawText(ctx, t, MARGIN, ctx.y - 10, { size: 12, bold: true });
  ctx.y -= 14;
}

export function small(ctx: Ctx, t: string) {
  for (const line of wrapText(t, 8, ROW_W)) {
    ensure(ctx, 11);
    drawText(ctx, line, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
    ctx.y -= 11;
  }
}

export interface WorksheetLine {
  n?: string;
  label: string;
  col1?: string;
  col2?: string;
  combined?: string;
  emphasis?: boolean;
  header?: boolean;
}

export function row(ctx: Ctx, r: WorksheetLine) {
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
  if (r.col1) drawTextRight(ctx, r.col1, COL1_RIGHT, textY, { bold: r.header });
  if (r.col2) drawTextRight(ctx, r.col2, COL2_RIGHT, textY, { bold: r.header });
  if (r.combined)
    drawTextRight(ctx, r.combined, COL3_RIGHT, textY, {
      bold: r.emphasis || r.header,
    });
  ctx.y -= h;
}

const COL_W = COL3_RIGHT - COL2_RIGHT; // per-parent column width (~90pt)
const HEADER_PAD = 6;

/**
 * Header row for reproduce worksheets. Column labels (parent names) can be
 * wider than their ~90pt column, so — unlike a data row — we wrap each label
 * within its column and bottom-align the lines, right-anchored to match the
 * data cells below. Prevents adjacent headers from colliding (e.g. the
 * "Custodial Pare" + "Non-Custodial Parent" overrun on LA Worksheet A).
 */
export function headerRow(ctx: Ctx, r: WorksheetLine) {
  const size = 9;
  const lineH = 11;
  const cells = [
    { text: r.col1, right: COL1_RIGHT },
    { text: r.col2, right: COL2_RIGHT },
    { text: r.combined, right: COL3_RIGHT },
  ]
    .filter((c) => c.text)
    .map((c) => ({ right: c.right, lines: wrapText(c.text as string, size, COL_W - HEADER_PAD) }));
  const maxLines = Math.max(1, ...cells.map((c) => c.lines.length));
  const h = maxLines * lineH + 5;
  ensure(ctx, h);
  const top = ctx.y;
  ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, HEAD_BG);
  ctx.pdf.line(MARGIN, top - h, PAGE_W - MARGIN, top - h, RULE, 0.5);
  const bottom = top - h + 5; // baseline of the bottom line
  if (r.label) drawText(ctx, r.label, COL_LABEL_X, bottom, { bold: true });
  for (const c of cells) {
    c.lines.forEach((ln, idx) => {
      drawTextRight(ctx, ln, c.right, bottom + (c.lines.length - 1 - idx) * lineH, {
        size,
        bold: true,
      });
    });
  }
  ctx.y -= h;
}

export function captionLine(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 12);
  drawText(ctx, label, MARGIN + 6, ctx.y - 9, { bold: true, size: 9 });
  drawText(ctx, value, MARGIN + 110, ctx.y - 9, {
    size: 9,
    maxWidth: ROW_W - 120,
  });
  ctx.y -= 12;
}

export function footerNote(ctx: Ctx, text: string) {
  for (const line of wrapText(text, 8, ROW_W)) {
    ensure(ctx, 10);
    drawText(ctx, line, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
    ctx.y -= 10;
  }
}
