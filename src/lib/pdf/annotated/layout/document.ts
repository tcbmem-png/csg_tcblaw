/**
 * pdfmake bootstrap. Loads DejaVu Sans (so § / → / ↑ render the same as
 * the AOC overlay), materializes the TTFs to disk for pdfmake's local
 * font resolver, and exposes the singleton + a typed `createPdf` helper.
 *
 * The annotated-PDF renderer in ../index.ts builds the doc definition
 * directly from the WDM. This module owns only the renderer boundary.
 */

import { createRequire } from "node:module";
import type {
  TDocumentDefinitions,
  TFontDictionary,
} from "pdfmake/interfaces";

const nodeRequire = createRequire(import.meta.url);

interface PdfMakeServer {
  setFonts: (fonts: TFontDictionary) => void;
  setLocalAccessPolicy: (cb: (path: string) => boolean) => void;
  createPdf: (doc: TDocumentDefinitions) => { getBuffer: () => Promise<Buffer> };
}

const pdfMake = nodeRequire("pdfmake") as PdfMakeServer;

export interface AnnotatedPdfAssets {
  /** DejaVu Sans Regular TTF bytes. */
  regularFont: Uint8Array;
  /** DejaVu Sans Bold TTF bytes. */
  boldFont: Uint8Array;
}

async function materializeFonts(
  assets: AnnotatedPdfAssets,
): Promise<{ regularPath: string; boldPath: string }> {
  const { promises: fs } = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tn-annot-fonts-"));
  const regularPath = path.join(dir, "DejaVuSans.ttf");
  const boldPath = path.join(dir, "DejaVuSans-Bold.ttf");
  await fs.writeFile(regularPath, Buffer.from(assets.regularFont));
  await fs.writeFile(boldPath, Buffer.from(assets.boldFont));
  return { regularPath, boldPath };
}

function buildFonts(regularPath: string, boldPath: string): TFontDictionary {
  return {
    DejaVu: {
      normal: regularPath,
      bold: boldPath,
      italics: regularPath,
      bolditalics: boldPath,
    },
  };
}

/** Render a fully-formed pdfmake doc to a PDF byte buffer. */
export async function renderDocToPdf(
  doc: TDocumentDefinitions,
  assets: AnnotatedPdfAssets,
): Promise<Uint8Array> {
  const { regularPath, boldPath } = await materializeFonts(assets);
  pdfMake.setFonts(buildFonts(regularPath, boldPath));
  pdfMake.setLocalAccessPolicy(() => true);
  const buf = await pdfMake.createPdf(doc).getBuffer();
  return new Uint8Array(buf);
}
