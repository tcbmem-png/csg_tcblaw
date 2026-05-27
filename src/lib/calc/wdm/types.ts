/**
 * Worksheet Data Model (WDM) — Phase A
 *
 * A single, normalized, render-agnostic representation of the AOC
 * Income-Shares worksheet. Both the on-screen worksheet
 * (`src/components/calculator/official-worksheet.tsx`) and the AOC PDF
 * generator (Phase B rewire) consume this same model so the two surfaces
 * cannot drift.
 *
 * Phase A scope: data model + builder + unit tests. No consumer is
 * rewired in this phase — the screen worksheet and PDF still derive
 * directly from CalcOutputs. Phase B0 will lock screenshot baselines,
 * Phase B will switch the consumers over.
 *
 * Conventions
 * -----------
 * - `screenLineNo` reflects the line numbering used today by the
 *   on-screen worksheet (e.g. "1", "3a", "8c"). `aocLineNo` is
 *   reserved for Phase C's AOC PDF mapping and left undefined here.
 * - Money is exposed both as a pre-formatted display string (`display`)
 *   and as the raw numeric value (`amount`) so PDF consumers can apply
 *   their own formatting.
 * - `annotation` carries a short margin note (e.g. the Equal-50/50
 *   cross-credit explainer at Line 6 per Rule .04(7)(b)(2)(i)).
 * - `subSource` carries the income-source sub-line that appears beneath
 *   the gross-income row.
 * - `citation` is the same CitationKey used by the rest of the engine;
 *   downstream renderers resolve the rule text.
 */

import type { CitationKey } from "../citations";

export interface WDMValue {
  /** Pre-formatted display string (already includes "$" / "%" / "(...)" if applicable). */
  display: string;
  /** Raw numeric value when meaningful (dollars, percent, multiplier). Null for non-numeric cells. */
  amount: number | null;
}

export interface WDMLine {
  /** Line number as rendered on the on-screen worksheet today. */
  screenLineNo?: string;
  /**
   * Line number on the AOC PDF form. Reserved for Phase C mapping; left
   * undefined in Phase A so we can add it later without breaking shape.
   */
  aocLineNo?: string;
  label: string;
  citation?: CitationKey;
  /** Optional pre-formatted citation string when no CitationKey applies. */
  cite?: string;
  a?: WDMValue;
  b?: WDMValue;
  total?: WDMValue;
  /** Visual emphasis (subtotal / final row). */
  emphasis?: boolean;
  /** Short margin note printed below or beside the line. */
  annotation?: string;
  /** Income-source sub-line (replaces the existing SourceLine in the renderer). */
  subSource?: { a: string; b: string };
}

export interface WDMSection {
  id: string;
  title: string;
  lines: WDMLine[];
}

export interface WDMCaption {
  matterName: string;
  docketNumber: string;
  court: string;
  client: string;
  preparedBy: string;
  comments: string;
  parentARole: "mother" | "father";
}

export interface WDMHeader {
  jurisdiction: string;
  formTitle: string;
  /** ISO-ish "YYYY-MM-DD" of the schedule effective date (carried verbatim from outputs). */
  scheduleEffectiveDate: string;
  /** Locale-formatted prepared-on date string (en-US). */
  preparedOnDisplay: string;
}

export interface WDMStatutoryCapPanel {
  calculatedPCSO: number;
  statutoryMax: number;
  excessOverCap: number;
  numChildren: number;
  /** Neutral guideline note (from outputs.pcsoCapNote). */
  capNote: string | null;
  /** Optional case-law footnote sourced from CITATIONS.pcso_max.caseNote. */
  caseNote: string | null;
}

export interface WDMPanels {
  /** Rendered when PCSO exceeds the §36-5-101(e)(1)(B) cap. */
  statutoryCap: WDMStatutoryCapPanel | null;
  /** Reassurance note shown when PCSO is at or below the cap. */
  pcsoBelowCapNote: string | null;
  /** "Why is this support amount so low?" explainer for Equal 50/50. */
  equalParentingLowSupportNote: string | null;
  /** Rule .04(7)(f) — non-earner ARP explainer. */
  nonEarnerArpNote: string | null;
  /** Zero-presumptive / floor-does-not-apply explainer. */
  zeroPresumptiveNote: string | null;
  /** Deviation-methodology footnote (shown when any deviation is in play). */
  deviationMethodologyNote: string | null;
}

/**
 * Top-level container. A WDM is a pure data structure — no JSX, no
 * PDF objects, no React refs. Serializable in principle.
 */
export interface WDM {
  header: WDMHeader;
  caption: WDMCaption;
  /** True when any caption field is populated; lets renderers skip the caption block. */
  hasCaption: boolean;
  parentALabel: string;
  parentBLabel: string;
  numChildren: number;
  sections: WDMSection[];
  panels: WDMPanels;
  /** Warnings surfaced by the calc engine (not yet rendered as boundary notes). */
  warnings: string[];
  /** Hard errors surfaced by the calc engine. */
  errors: string[];
}
