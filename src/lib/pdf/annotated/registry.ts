/**
 * Single inspectable WDM → prose contract.
 *
 * Each entry registers an annotated-PDF section as either:
 *   - single: gate(wdm) → boolean, build(wdm) → Block[]
 *   - compare: gate(primary, alt) → boolean, build(primary, alt) → Block[]
 *
 * Reviewer instruction: this file is the canonical map of what appears
 * on the annotated PDF and under which condition. If a reader can't
 * trace a paragraph in the PDF to an entry here, the pipeline has drifted.
 *
 * Authority block is registered LAST so its collectCitationKeys() walk
 * sees the body of the document but not itself.
 */

import type { WDM } from "@/lib/calc/wdm/types";
import type { Block } from "./layout/flow";

import { build as buildCaseBackground } from "./builders/00-case-background";
import { build as buildIncomeDetermination } from "./builders/01-income-determination";
import { build as buildAgi } from "./builders/02-agi";
import { build as buildCombinedAgi } from "./builders/03-combined-agi";
import { build as buildBcso } from "./builders/04-bcso";
import { build as buildParentingTime } from "./builders/05-parenting-time";
import { build as buildAddOns } from "./builders/06-mandatory-addons";
import { build as buildDeviations } from "./builders/07-deviations";
import { build as buildStatutoryCap } from "./builders/08-statutory-cap";
import { build as buildFinalOrder } from "./builders/09-final-order";
import { build as buildAppendixA } from "./builders/appendix-a-imputed-vs-actual";
import { build as buildAppendixB } from "./builders/appendix-b-income-methodology";
import { build as buildAuthorityBlock } from "./builders/authority-block";

export type SectionEntry =
  | {
      id: string;
      title: string;
      mode: "single";
      gate: (wdm: WDM) => boolean;
      build: (wdm: WDM) => Block[];
    }
  | {
      id: string;
      title: string;
      mode: "compare";
      gate: (primary: WDM, alternative: WDM | null) => boolean;
      build: (primary: WDM, alternative: WDM | null) => Block[];
    };

export const SECTIONS: SectionEntry[] = [
  { id: "case_background", title: "Case Background", mode: "single", gate: () => true, build: buildCaseBackground },
  { id: "i.income", title: "I. Income Determination", mode: "single", gate: () => true, build: buildIncomeDetermination },
  { id: "ii.agi", title: "II. AGI", mode: "single", gate: () => true, build: buildAgi },
  { id: "iii.combined_agi", title: "III. Combined AGI & Pro-Rata", mode: "single", gate: () => true, build: buildCombinedAgi },
  { id: "iv.bcso", title: "IV. BCSO", mode: "single", gate: () => true, build: buildBcso },
  { id: "v.parenting_time", title: "V. Parenting Time and Net Presumptive Support", mode: "single", gate: () => true, build: buildParentingTime },
  { id: "vi.addons", title: "VI. Mandatory Add-Ons", mode: "single", gate: () => true, build: buildAddOns },
  {
    id: "vii.deviations",
    title: "VII. Discretionary Deviations under Rule .07(2)(d)",
    mode: "single",
    gate: (wdm) => wdm.panels.deviationsNarrative.blocks.length > 0,
    build: buildDeviations,
  },
  { id: "viii.statutory_cap", title: "VIII. Statutory Cap Analysis", mode: "single", gate: () => true, build: buildStatutoryCap },
  { id: "ix.final_order", title: "IX. Final Order Summary", mode: "single", gate: () => true, build: buildFinalOrder },
  {
    id: "appendix_a",
    title: "Appendix A. Imputed vs Actual Comparison",
    mode: "compare",
    gate: (_p, alt) => alt !== null,
    build: buildAppendixA,
  },
  { id: "appendix_b", title: "Appendix B. Income Methodology", mode: "single", gate: () => true, build: buildAppendixB },
  // Authority block LAST so its citation walk sees the full body.
  {
    id: "authority_block",
    title: "Authorities",
    mode: "compare",
    gate: () => true,
    build: buildAuthorityBlock,
  },
];

/** Flatten the registry against a WDM (and optional alternative). */
export function renderRegistry(
  primary: WDM,
  alternative: WDM | null = null,
): Block[] {
  const out: Block[] = [];
  for (const section of SECTIONS) {
    // Skip the authority block on the recursive walk inside its own
    // builder — that walk passes the sentinel section list via the
    // exported renderRegistryExcludingAuthority below.
    if (section.id === "authority_block") continue;
    if (section.mode === "single") {
      if (!section.gate(primary)) continue;
      out.push(...section.build(primary));
    } else {
      if (!section.gate(primary, alternative)) continue;
      out.push(...section.build(primary, alternative));
    }
  }
  // Append authority block last (re-entry safe — its build re-uses this
  // function which skips the authority entry above).
  const auth = SECTIONS.find((s) => s.id === "authority_block");
  if (auth && auth.mode === "compare") {
    out.push(...auth.build(primary, alternative));
  }
  return out;
}
