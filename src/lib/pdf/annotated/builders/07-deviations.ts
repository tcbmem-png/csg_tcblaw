/**
 * §VII — Discretionary Deviations under Rule .07(2)(d).
 *
 * Pure: (WDM) => Block[]. Consumes wdm.panels.deviationsNarrative
 * verbatim — the prose composer lives in src/lib/calc/deviations-narrative.ts
 * and is the single authoring point shared with the AOC's Comments
 * pointer. No re-derivation here.
 *
 * Gating: registry only invokes this builder when blocks.length > 0
 * (§3 conditional rule). Defensive empty-state still rendered so the
 * builder is safe to call directly in unit tests.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import {
  authorityLine,
  cite,
  h,
  money,
  p,
  spacer,
  t,
  userQuote,
  type Block,
} from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "VII. Discretionary Deviations under Rule .07(2)(d)"));

  const narrative = wdm.panels.deviationsNarrative;
  if (narrative.blocks.length === 0) {
    blocks.push(
      p(
        t(`No discretionary deviations were elected on this worksheet. The presumptive child support order under `),
        cite("fcso"),
        t(` controls.`),
      ),
    );
    return blocks;
  }

  // Methodology preface — verbatim from CITATIONS' shared methodology note.
  if (wdm.panels.deviationMethodologyNote) {
    blocks.push(
      p(
        t(`Methodology: `),
        t(wdm.panels.deviationMethodologyNote, { italic: true }),
      ),
    );
    blocks.push(authorityLine("deviation_general"));
  }

  // Walk each shared narrative block. Heading + body + authority line
  // per §4. Body is the verbatim composer output — no editorial gloss.
  for (const block of narrative.blocks) {
    blocks.push(h(2, block.heading));
    blocks.push(p(t(block.body)));
    blocks.push(authorityLine(block.citation));
    blocks.push(spacer(2));
  }

  // Surface judgment-tagged deviation rows from the WDM so the reader
  // can audit each user election with its rule-verbatim factor list.
  const devSection = wdm.sections.find((s) => s.id === "deviations");
  if (devSection) {
    blocks.push(h(3, "Deviation elections and rule factors"));
    for (const line of devSection.lines) {
      const value = line.total ?? line.a ?? line.b;
      if (!value || value.category !== "judgment") continue;
      blocks.push(
        p(
          t(`${line.label}: `),
          t(value.display, { bold: true }),
          t(`.`),
        ),
      );
      if (value.userElection?.rationale) {
        blocks.push(
          p(t(`User-entered rationale: `), userQuote(value.userElection.rationale)),
        );
      }
      if (value.factors && value.factors.length > 0) {
        blocks.push(
          p(
            t(`Rule factors weighed in this election: `),
            t(value.factors.join("; "), { italic: true }),
            t(`.`),
          ),
        );
      }
      if (value.rule) blocks.push(authorityLine(value.rule));
    }
  }

  return blocks;
}
