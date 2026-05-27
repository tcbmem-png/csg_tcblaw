/**
 * Annotated PDF entry point. See ./registry.ts for the WDM → prose
 * contract and ./layout/document.ts for the pdfmake shell.
 *
 * This module is intentionally thin: load fonts → walk the registry →
 * render. All section logic lives in builders/.
 */

import type { WDM } from "@/lib/calc/wdm/types";
import { renderRegistry } from "./registry";
import {
  renderBlocksToPdf,
  type AnnotatedPdfAssets,
  type AnnotatedPdfMeta,
} from "./layout/document";

export interface RenderAnnotatedPdfOpts {
  /** Optional alternative-scenario WDM for compare-mode appendices. */
  alternative?: WDM | null;
  assets: AnnotatedPdfAssets;
  meta: AnnotatedPdfMeta;
}

export async function renderAnnotatedPdf(
  primary: WDM,
  opts: RenderAnnotatedPdfOpts,
): Promise<Uint8Array> {
  const blocks = renderRegistry(primary, opts.alternative ?? null);
  return renderBlocksToPdf(blocks, opts.meta, opts.assets);
}

export { SECTIONS, renderRegistry } from "./registry";
export type { Block } from "./layout/flow";
