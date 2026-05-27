/**
 * Overlay renderer — fills the v2 fillable AcroForm template at
 * `src/lib/pdf/assets/tn-cs-worksheet-fillable.pdf` from the WDM,
 * regenerates appearance streams against the embedded DejaVu font
 * (so §, →, en-dash render correctly across all viewers), and
 * flattens to a filing-ready PDF.
 *
 * Architecture
 * ------------
 * The field map (`aoc-field-map.ts`) is the single source of truth for
 * "what value goes into which AcroForm field". This module is a pure
 * pipeline:
 *   1. Load fillable template + DejaVu fonts.
 *   2. For each AocField → resolve value via field.source(wdm, inputs, outputs).
 *   3. Apply to the AcroForm:
 *        - kind === "text"   → form.getTextField(name).setText(value)
 *        - kind === "choice" → form.getRadioGroup(name).select(value)
 *   4. form.updateFieldAppearances(dejaVuRegular) — rebuilds appearance
 *      streams against the Unicode font so every glyph renders, including
 *      ↑ / → / § / en-dash in the equal_parenting_annotation, comments,
 *      and deviation_specify multiline fields.
 *   5. form.flatten() — bakes the appearances into the page content
 *      streams and removes the editable widgets. Result is a static,
 *      filing-ready PDF.
 *   6. Set Author/Producer/Creator metadata to TCB Law branding.
 */

import { PDFDocument, PDFDict, PDFName, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { CalcInputs, CalcOutputs } from "../calc/types";
import type { WDM } from "../calc/wdm/types";
import { AOC_FIELD_MAP } from "./aoc-field-map";

void rgb; // reserved for future overlay-on-top draws (none in v2 path)

/**
 * Strip the fillable-mode field-highlight background (/MK /BG) from every
 * widget annotation in the form. The v2 fillable template tags each text
 * widget with `/MK /BG = [0.93, 0.97, 1]` (light blue) so fillers can see
 * the editable region — but pdf-lib's `updateFieldAppearances` honors that
 * BG when rebuilding the appearance stream, and `flatten()` then bakes the
 * tint into the page content. For filing-ready output we want clean white
 * cells, so we drop the BG entry (and any empty /MK dict) before
 * regenerating appearances.
 */
function stripFieldHighlightBackgrounds(form: ReturnType<PDFDocument["getForm"]>) {
  const MK = PDFName.of("MK");
  const BG = PDFName.of("BG");
  for (const field of form.getFields()) {
    for (const widget of field.acroField.getWidgets()) {
      const dict = widget.dict;
      const mk = dict.lookup(MK);
      if (mk instanceof PDFDict) {
        mk.delete(BG);
        if (mk.keys().length === 0) dict.delete(MK);
      }
    }
  }
}

export interface OverlayAssets {
  /** v2 fillable AcroForm PDF (tn-cs-worksheet-fillable.pdf). */
  blankPdf: Uint8Array;
  /** DejaVu Sans Regular — used to regenerate appearance streams with
   *  full Unicode coverage prior to flatten. */
  regularFont: Uint8Array;
  /** DejaVu Sans Bold — embedded for symmetry; currently unused at
   *  appearance-regeneration time (form.updateFieldAppearances takes a
   *  single font) but kept on the asset shape for future use (e.g.
   *  any post-flatten overlay text). */
  boldFont: Uint8Array;
}

export interface RenderOptions {
  authorMetadata?: string;
  titleMetadata?: string;
  subjectMetadata?: string;
  /** When false, skip form.flatten() and leave the PDF editable. Default true. */
  flatten?: boolean;
}

const DEFAULT_AUTHOR =
  "TCB Law — TN Child Support Calculator (csg.tcblaw.org/tn)";

export async function renderOverlay(
  wdm: WDM,
  inputs: CalcInputs,
  outputs: CalcOutputs,
  assets: OverlayAssets,
  opts: RenderOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(assets.blankPdf);
  pdf.registerFontkit(fontkit);

  // Embed DejaVu for appearance regeneration. Subsetting keeps the output
  // small while preserving every glyph actually written into a field.
  const dejaVu = await pdf.embedFont(assets.regularFont, { subset: true });
  // Bold is embedded so it ships in the resource dictionary; not passed to
  // updateFieldAppearances (which takes a single fallback font).
  await pdf.embedFont(assets.boldFont, { subset: true });

  const form = pdf.getForm();

  const missing: string[] = [];
  const failed: string[] = [];

  for (const field of AOC_FIELD_MAP) {
    let value: string | null;
    try {
      value = field.source(wdm, inputs, outputs);
    } catch (err) {
      console.warn(
        `[overlay] source threw for "${field.fieldName}" (${field.description}):`,
        err,
      );
      value = null;
    }
    if (value == null || value === "") continue;

    try {
      if (field.kind === "text") {
        const widget = form.getTextField(field.fieldName);
        widget.setText(value);
      } else {
        const group = form.getRadioGroup(field.fieldName);
        group.select(value);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/no field/i.test(msg) || /does not exist/i.test(msg)) {
        missing.push(field.fieldName);
      } else {
        failed.push(`${field.fieldName}: ${msg}`);
      }
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[overlay] ${missing.length} fields not found in template:`,
      missing.join(", "),
    );
  }
  if (failed.length > 0) {
    console.warn(`[overlay] ${failed.length} fields failed to set:`);
    for (const f of failed) console.warn("  -", f);
  }

  // Regenerate every appearance stream against DejaVu so all Unicode
  // glyphs render under flatten() (and in viewers that ignore
  // NeedAppearances).
  form.updateFieldAppearances(dejaVu);

  if (opts.flatten !== false) {
    form.flatten();
  }

  pdf.setAuthor(opts.authorMetadata ?? DEFAULT_AUTHOR);
  pdf.setProducer(opts.authorMetadata ?? DEFAULT_AUTHOR);
  pdf.setCreator(opts.authorMetadata ?? DEFAULT_AUTHOR);
  if (opts.titleMetadata) pdf.setTitle(opts.titleMetadata);
  if (opts.subjectMetadata) pdf.setSubject(opts.subjectMetadata);

  return await pdf.save();
}
