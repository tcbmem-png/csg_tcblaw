/**
 * Reusable AcroForm fill pipeline for official, already-fillable court PDFs
 * (AR / AL / FL — the states whose forms ship named form fields, unlike TN's
 * flat form). One generic step shared by every per-state field map:
 *
 *   load template -> set named fields from a {fieldName: value} map ->
 *   regenerate appearances with an embedded font (so $ and % render) ->
 *   set NeedAppearances (viewers re-render if needed) -> optionally flatten.
 *
 * Flatten = the print-final, non-editable filed copy. Leave unflattened for an
 * editable copy whose values can be read back (used by the verification gate).
 *
 * Font: defaults to Helvetica (a Standard-14 font that covers the worksheet
 * glyph set — digits, "$", "%", "." "," "-" and ASCII names). Pass `fontBytes`
 * (a TTF/OTF) for full Unicode coverage of accented names/counties; that path
 * dynamically loads @pdf-lib/fontkit, which must be installed when used.
 */
import { PDFDocument, PDFName, PDFBool, StandardFonts, type PDFFont } from "pdf-lib";

/** Keys are EXACT AcroForm field names. Text fields take string|number; checkboxes take boolean. */
export type AcroFormData = Partial<Record<string, string | number | boolean>>;

export interface FillOptions {
  /** Flatten to a non-editable filed copy. Default true. */
  flatten?: boolean;
  /** Optional embedded Unicode font bytes (TTF/OTF). Requires @pdf-lib/fontkit. */
  fontBytes?: Uint8Array;
}

/**
 * Fill an AcroForm template from a {fieldName: value} map. Unknown field names
 * are skipped (keeps maps forward-compatible across form revisions); empty
 * values are skipped (never blank-out a pre-filled field with "").
 */
export async function fillAcroForm(
  templateBytes: Uint8Array | ArrayBuffer,
  data: AcroFormData,
  opts: FillOptions = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  const form = doc.getForm();

  let font: PDFFont;
  if (opts.fontBytes) {
    // Optional peer dep, loaded only when a custom Unicode font is supplied.
    // Non-literal specifier so tsc/Vite don't require it to be installed for the
    // default (Helvetica) path; install @pdf-lib/fontkit to use `fontBytes`.
    const fontkitModule = "@pdf-lib/fontkit";
    const fontkit = (await import(/* @vite-ignore */ fontkitModule)).default;
    doc.registerFontkit(fontkit);
    font = await doc.embedFont(opts.fontBytes, { subset: true });
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  for (const [name, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    try {
      if (typeof value === "boolean") {
        const cb = form.getCheckBox(name);
        if (value) cb.check();
        else cb.uncheck();
      } else {
        form.getTextField(name).setText(String(value));
      }
    } catch {
      // field not present in this template revision — skip
    }
  }

  // Regenerate appearance streams with the embedded font so "$"/"%"/digits
  // render in every viewer, and flag NeedAppearances for viewers that prefer to
  // render lazily (matters for the unflattened, editable copy).
  form.updateFieldAppearances(font);
  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);

  if (opts.flatten ?? true) form.flatten();
  return doc.save();
}

/** Convenience: fetch a template by URL (browser/app runtime), then fill. */
export async function fillAcroFormFromUrl(
  url: string,
  data: AcroFormData,
  opts: FillOptions = {},
): Promise<Uint8Array> {
  const bytes = await fetch(url).then((r) => r.arrayBuffer());
  return fillAcroForm(bytes, data, opts);
}

/** Fill from URL and trigger a browser download of the filed copy. */
export async function downloadFilledAcroForm(
  url: string,
  data: AcroFormData,
  filename: string,
  opts: FillOptions = {},
): Promise<void> {
  const bytes = await fillAcroFormFromUrl(url, data, opts);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
