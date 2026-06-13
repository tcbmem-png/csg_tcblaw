import { PDFDocument } from "pdf-lib";

/** Keys are the EXACT AcroForm field names. Text fields take string|number; status_* are booleans. */
export type WorksheetData = Partial<Record<string, string | number | boolean>>;

const TEMPLATE_URL = "/forms/TN_Child_Support_Worksheet_fillable.pdf";

export async function fillOfficialWorksheet(
  data: WorksheetData,
  opts: { flatten?: boolean } = { flatten: true },
): Promise<Uint8Array> {
  const bytes = await fetch(TEMPLATE_URL).then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();

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
      // field not in template — skip (keeps the map forward-compatible)
    }
  }

  if (opts.flatten) form.flatten(); // print-final, not re-editable
  return doc.save();
}

/** Fill + trigger a browser download. */
export async function downloadOfficialWorksheet(
  data: WorksheetData,
  filename = "TN-Child-Support-Worksheet-AOC.pdf",
) {
  const bytes = await fillOfficialWorksheet(data);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
