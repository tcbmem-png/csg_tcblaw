/**
 * Authority Block.
 *
 * Gathered reference list of every CITATIONS[key] referenced anywhere in
 * the rendered document. Grouped by type (rules / statutes / cases). No
 * editorial annotations.
 *
 * The block-walk runs against the SAME registry the body of the document
 * does, so the authority list is derived — not authored — from what
 * actually printed. This is the §0.2 closure: a reader can audit every
 * citation that appears in the document by reading this single block.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { CITATIONS, type CitationKey } from "@/lib/calc/citations";
import { authorityLine, bullets, cite, h, p, t, type Block } from "../layout/flow";
import { collectCitationKeys } from "../layout/document";
import { renderRegistry, SECTIONS } from "../registry";

function classify(key: CitationKey): "case" | "statute" | "rule" {
  if (key.startsWith("case.")) return "case";
  const rule = CITATIONS[key].rule;
  if (rule.startsWith("Tenn. Code Ann.")) return "statute";
  return "rule";
}

export function build(wdm: WDM, alternative: WDM | null = null): Block[] {
  // Re-walk everything that will print. Self-reference avoided by
  // excluding the authority-block section itself from SECTIONS when
  // this builder runs (registry orders authority-block LAST).
  void SECTIONS;
  const documentBlocks = renderRegistry(wdm, alternative);
  const keys = Array.from(new Set(collectCitationKeys(documentBlocks)));

  const groups = {
    rule: [] as CitationKey[],
    statute: [] as CitationKey[],
    case: [] as CitationKey[],
  };
  for (const k of keys) groups[classify(k)].push(k);

  const blocks: Block[] = [];
  blocks.push(h(1, "Authorities"));
  blocks.push(
    p(
      t(
        "Every rule, statute, and case cited in this annotated worksheet is listed below. The list is derived mechanically from the references that actually printed in the body — no entry appears here that was not relied on above.",
      ),
    ),
  );

  if (groups.statute.length > 0) {
    blocks.push(h(3, "Statutes"));
    blocks.push(bullets(groups.statute.map((k) => [cite(k)])));
  }
  if (groups.rule.length > 0) {
    blocks.push(h(3, "Rules"));
    blocks.push(bullets(groups.rule.map((k) => [cite(k)])));
  }
  if (groups.case.length > 0) {
    blocks.push(h(3, "Cases"));
    blocks.push(bullets(groups.case.map((k) => [cite(k)])));
  }
  return blocks;
}
