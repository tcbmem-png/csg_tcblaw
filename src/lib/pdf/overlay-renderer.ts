/**
 * Overlay renderer — draws calculated values onto the official blank
 * AOC/DHS Child Support Worksheet PDF using pdf-lib + fontkit + DejaVu Sans.
 *
 * Architecture
 * ------------
 * The field map (`aoc-field-map.ts`) is the single source of truth for
 * "what value goes where". This module is a pure pipeline:
 *   1. Load blank PDF + DejaVu fonts.
 *   2. For each AocField → resolve text via `field.source(wdm, inputs, outputs)`.
 *   3. Apply fit policy (`shrink` / `wrap` / `fixed`) and draw.
 *   4. Coord conversion: pdfplumber top-down → pdf-lib bottom-up.
 *   5. Append overflow (truncated wrap fields) to a "(continued)" tail in
 *      the Comments block on page 2.
 *   6. Set Author metadata: "TCB Law — TN Child Support Calculator
 *      (csg.tcblaw.org/tn)".
 *
 * DejaVu Sans is embedded for full Unicode coverage so the § and →
 * cleanText fallbacks from the legacy renderer are unnecessary.
 */

import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { CalcInputs, CalcOutputs } from "../calc/types";
import type { WDM } from "../calc/wdm/types";
import { AOC_FIELD_MAP, type AocField, type FieldFit } from "./aoc-field-map";

const PAGE_HEIGHT_FALLBACK = 792; // letter; computed per-page at draw time
const INK = rgb(0.07, 0.07, 0.07);

export interface OverlayAssets {
  blankPdf: Uint8Array;
  regularFont: Uint8Array;
  boldFont: Uint8Array;
}

export interface RenderOptions {
  authorMetadata?: string;
  titleMetadata?: string;
  subjectMetadata?: string;
}

const DEFAULT_AUTHOR = "TCB Law — TN Child Support Calculator (csg.tcblaw.org/tn)";

// -------------------------------------------------------------------
// text measurement / fit
// -------------------------------------------------------------------

function measure(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

function shrinkToFit(
  text: string,
  font: PDFFont,
  startSize: number,
  maxWidth: number,
  floor = 7,
): number {
  let s = startSize;
  while (s > floor && measure(text, font, s) > maxWidth) {
    s -= 0.5;
  }
  return s;
}

function wrapTextToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (measure(candidate, font, size) <= maxWidth) {
        cur = candidate;
      } else {
        if (cur) lines.push(cur);
        // Single word longer than width? Hard-break.
        if (measure(w, font, size) > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            if (measure(chunk + ch, font, size) <= maxWidth) chunk += ch;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          cur = chunk;
        } else {
          cur = w;
        }
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

// -------------------------------------------------------------------
// draw helpers (pdfplumber top-down → pdf-lib bottom-up)
// -------------------------------------------------------------------

interface DrawCtx {
  page: PDFPage;
  pageHeight: number;
  regular: PDFFont;
  bold: PDFFont;
}

function drawSingleLine(
  ctx: DrawCtx,
  text: string,
  field: AocField,
) {
  const { rect, fit } = field;
  const font = field.font === "bold" ? ctx.bold : ctx.regular;
  const size =
    fit.policy === "shrink"
      ? shrinkToFit(text, font, fit.size, rect.w)
      : fit.size;
  const w = measure(text, font, size);
  let x = rect.x;
  if (fit.align === "right") x = rect.x + rect.w - w;
  else if (fit.align === "center") x = rect.x + (rect.w - w) / 2;
  const vPad = fit.vPad ?? 2;
  // baseline at bottom of rect minus vPad, in pdf-lib coords
  const yTopDown = rect.y + rect.h - vPad;
  const yBottomUp = ctx.pageHeight - yTopDown;
  ctx.page.drawText(text, { x, y: yBottomUp, size, font, color: INK });
}

interface WrapOverflow {
  fieldDescription: string;
  remainingLines: string[];
}

function drawWrap(
  ctx: DrawCtx,
  text: string,
  field: AocField,
): WrapOverflow | null {
  const { rect, fit } = field;
  const font = field.font === "bold" ? ctx.bold : ctx.regular;
  const size = fit.size;
  const lines = wrapTextToWidth(text, font, size, rect.w);

  // Two layout modes:
  //  - explicit per-line baselines (pdfplumber top-down y), used by the
  //    Comments block to sit text ABOVE each pre-printed underline.
  //  - default: even line-height inside the rect.
  const baselines = fit.lineBaselines;
  let drawn: string[];
  let overflow: string[];
  if (baselines && baselines.length > 0) {
    drawn = lines.slice(0, baselines.length);
    overflow = lines.slice(baselines.length);
    for (let i = 0; i < drawn.length; i += 1) {
      const ln = drawn[i];
      const baseTopDown = baselines[i] - (fit.baselineOffset ?? 1);
      const yBottomUp = ctx.pageHeight - baseTopDown;
      let x = rect.x;
      if (fit.align === "right") x = rect.x + rect.w - measure(ln, font, size);
      else if (fit.align === "center")
        x = rect.x + (rect.w - measure(ln, font, size)) / 2;
      ctx.page.drawText(ln, { x, y: yBottomUp, size, font, color: INK });
    }
  } else {
    const lineHeight = size * 1.18;
    const maxLines = Math.max(1, Math.floor(rect.h / lineHeight));
    drawn = lines.slice(0, maxLines);
    overflow = lines.slice(maxLines);
    let y = rect.y + size;
    for (const ln of drawn) {
      const yBottomUp = ctx.pageHeight - y;
      let x = rect.x;
      if (fit.align === "right") x = rect.x + rect.w - measure(ln, font, size);
      else if (fit.align === "center")
        x = rect.x + (rect.w - measure(ln, font, size)) / 2;
      ctx.page.drawText(ln, { x, y: yBottomUp, size, font, color: INK });
      y += lineHeight;
    }
  }

  if (overflow.length === 0) return null;
  return { fieldDescription: field.description, remainingLines: overflow };
}

// -------------------------------------------------------------------
// public API
// -------------------------------------------------------------------

export async function renderOverlay(
  wdm: WDM,
  inputs: CalcInputs,
  outputs: CalcOutputs,
  assets: OverlayAssets,
  opts: RenderOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(assets.blankPdf);
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(assets.regularFont, { subset: true });
  const bold = await pdf.embedFont(assets.boldFont, { subset: true });

  const pages = pdf.getPages();
  const page1 = pages[0];
  const page2 = pages[1] ?? page1;

  const overflows: WrapOverflow[] = [];

  for (const field of AOC_FIELD_MAP) {
    let raw: string | null;
    try {
      raw = field.source(wdm, inputs, outputs);
    } catch (err) {
      console.warn(`[overlay] source failed for "${field.description}":`, err);
      raw = null;
    }
    if (raw == null || raw === "") continue;

    const page = field.page === 2 ? page2 : page1;
    const pageHeight = page.getHeight() || PAGE_HEIGHT_FALLBACK;
    const ctx: DrawCtx = { page, pageHeight, regular, bold };

    const policy: FieldFit["policy"] = field.fit.policy;
    if (policy === "wrap") {
      const o = drawWrap(ctx, raw, field);
      if (o) overflows.push(o);
    } else {
      drawSingleLine(ctx, raw, field);
    }
  }

  // Overflow handling — when any wrap field overflows its rect, add a
  // dedicated continuation page (NOT a stray block hanging off the bottom
  // of page 2) with a proper header. The AOC brief-mode Comments block
  // shouldn't overflow on typical fixtures; if it does, this surfaces a
  // legible appendix instead of crashing into the form footer.
  if (overflows.length > 0) {
    const continuationPage = pdf.addPage([page2.getWidth(), page2.getHeight()]);
    const cPageHeight = continuationPage.getHeight();
    // Header
    continuationPage.drawText("Worksheet — Continuation Page", {
      x: 54,
      y: cPageHeight - 54,
      size: 14,
      font: bold,
      color: INK,
    });
    continuationPage.drawText(
      "Overflow from the Comments / Rebuttals / Calculations block of the AOC worksheet.",
      { x: 54, y: cPageHeight - 72, size: 9, font: regular, color: INK },
    );
    const bodyField: AocField = {
      aocLine: "",
      description: "Continuation body",
      page: 2,
      rect: { x: 54, y: 96, w: page2.getWidth() - 108, h: cPageHeight - 160 },
      fit: { policy: "wrap", size: 10, align: "left" },
      source: () => null,
    };
    const ctx: DrawCtx = {
      page: continuationPage,
      pageHeight: cPageHeight,
      regular,
      bold,
    };
    const text = overflows
      .map((o) => `${o.fieldDescription}:\n${o.remainingLines.join(" ")}`)
      .join("\n\n");
    drawWrap(ctx, text, bodyField);
  }

  pdf.setAuthor(opts.authorMetadata ?? DEFAULT_AUTHOR);
  pdf.setProducer(opts.authorMetadata ?? DEFAULT_AUTHOR);
  pdf.setCreator(opts.authorMetadata ?? DEFAULT_AUTHOR);
  if (opts.titleMetadata) pdf.setTitle(opts.titleMetadata);
  if (opts.subjectMetadata) pdf.setSubject(opts.subjectMetadata);

  return await pdf.save();
}
