/**
 * Single inspectable WDM → prose contract.
 *
 * Each entry registers an annotated-PDF section as either:
 *   - a single-WDM builder: gate(wdm) → boolean, build(wdm) → Block[]
 *   - a compare-mode builder: gate(primary, alternative) → boolean,
 *     build(primary, alternative) → Block[]
 *
 * Compare-mode is the only deviation from the uniform pure-function
 * signature. Justification: plan §1.5 — scenario comparison passes two
 * WDM instances; the appendix builder consumes both.
 *
 * Reviewer instruction: this file is the canonical map of what
 * appears on the annotated PDF and under which condition. If a
 * reader can't trace a paragraph in the PDF to an entry here, the
 * pipeline has drifted.
 */

import type { WDM } from "@/lib/calc/wdm/types";
import type { Block } from "./layout/flow";

import { build as buildParentingTime } from "./builders/05-parenting-time";
import { build as buildDeviations } from "./builders/07-deviations";
import { build as buildStatutoryCap } from "./builders/08-statutory-cap";

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

/**
 * Step-3 (sample-prose) registry. Only the three sample sections are
 * registered. The remaining sections register in step 4 once the
 * sample-prose checkpoint signs off.
 */
export const SECTIONS: SectionEntry[] = [
  {
    id: "v.parenting_time",
    title: "V. Parenting Time and Net Presumptive Support",
    mode: "single",
    gate: () => true,
    build: buildParentingTime,
  },
  {
    id: "vii.deviations",
    title: "VII. Discretionary Deviations under Rule .07(2)(d)",
    mode: "single",
    // §3 conditional rule — render only when at least one deviation block exists.
    gate: (wdm) => wdm.panels.deviationsNarrative.blocks.length > 0,
    build: buildDeviations,
  },
  {
    id: "viii.statutory_cap",
    title: "VIII. Statutory Cap Analysis",
    mode: "single",
    // Always rendered (§4); text branches on panel.engaged.
    gate: () => true,
    build: buildStatutoryCap,
  },
];

/** Flatten the registry against a WDM (and optional alternative). */
export function renderRegistry(
  primary: WDM,
  alternative: WDM | null = null,
): Block[] {
  const out: Block[] = [];
  for (const section of SECTIONS) {
    if (section.mode === "single") {
      if (!section.gate(primary)) continue;
      out.push(...section.build(primary));
    } else {
      if (!section.gate(primary, alternative)) continue;
      out.push(...section.build(primary, alternative));
    }
  }
  return out;
}
