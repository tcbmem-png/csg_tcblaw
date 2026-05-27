/**
 * Worksheet Data Model (WDM) — Phase A v2
 *
 * A single, normalized, render-agnostic representation of the AOC
 * Income-Shares worksheet. Both the on-screen worksheet
 * (`src/components/calculator/official-worksheet.tsx`) and the AOC PDF
 * generator (Phase B rewire) consume this same model so the two surfaces
 * cannot drift. Phase D's narrative + advocacy-denylist builder consumes
 * the same model and relies on the judgment-call metadata defined below.
 *
 * Phase A scope: data model + builder + unit tests. No consumer is
 * rewired in this phase — the screen worksheet and PDF still derive
 * directly from CalcOutputs. Phase B0 will lock screenshot baselines,
 * Phase B will switch the consumers over.
 *
 * Value classification (drives narrative routing + advocacy audit):
 *   - "mechanical"  Pure arithmetic over other WDM values. No judgment.
 *                   No quoting required.
 *   - "structural"  Rule-driven categorical or rule-prescribed lookup
 *                   (parenting band, BCSO schedule cell). Cite the rule;
 *                   no advocacy risk.
 *   - "judgment"    User election or court-discretion call. Phase D
 *                   narrative MUST route the user's contribution through
 *                   userQuote() — see Refinement 1 of the denylist v2.
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
import type { IncomeMethodology } from "../types";
import type { WDMDeviationsNarrative } from "../deviations-narrative";
export type { WDMDeviationBlock, WDMDeviationsNarrative } from "../deviations-narrative";

/** Refinement 1 (approved): drop A_/B_/C_ prefixes. */
export type WDMValueCategory = "mechanical" | "structural" | "judgment";

/**
 * A user election or judgment call captured against a WDM value.
 *
 * Refinement 2 (approved): `value: unknown` is fine for v2. TIGHTEN
 * this to a discriminated union (likely keyed by `field`) once Phase D
 * narrative builders settle the shape of judgment-surfaced value types.
 * The narrative-audit pipeline currently treats `value` opaquely and
 * routes only the `rationale` string through userQuote().
 */
export interface WDMUserElection {
  /** Dot-path into CalcInputs identifying the elected field
   *  (e.g. "parentAIncomeMethodology", "includePrivateSchool",
   *  "specialExpensesWaiveThreshold"). */
  field: string;
  /** Raw user-supplied value. TIGHTEN: see note above. */
  value: unknown;
  /** Verbatim user-entered rationale, if the input flow captured one. */
  rationale?: string;
  /** Sentinel for Phase D userQuote() routing. */
  source: "user_input";
}

export interface WDMValue {
  /** Pre-formatted display string (already includes "$" / "%" / "(...)" if applicable). */
  display: string;
  /** Raw numeric value when meaningful (dollars, percent, multiplier). Null for non-numeric cells. */
  amount: number | null;
  /** Value classification — see file header. */
  category: WDMValueCategory;
  /** Controlling rule citation. Required for category === "judgment". */
  rule?: CitationKey;
  /** Rule-enumerated factors the court must weigh. Required for category === "judgment". */
  factors?: string[];
  /** User election metadata. Required iff category === "judgment". The
   *  Phase A test suite enforces this invariant in both directions
   *  (see Refinement 5). */
  userElection?: WDMUserElection;
}

/** Above-cap BCSO formula breakdown (Rule .09(2)(d)). Surfaced as a
 *  structured object on the BCSO section's Line 6 so Phase D narrative
 *  builders can render the formula without parsing display strings. */
export interface WDMBcsoAboveCap {
  topOfSchedule: number;
  excessAGI: number;
  rate: number;
  addition: number;
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
  /** Structured above-cap breakdown (only set on Line 6 when bcsoSource === "above_cap"). */
  bcsoAboveCap?: WDMBcsoAboveCap;
  /** Full income methodology pass-through on Line 3 — both sides
   *  independent. Refinement 3 (approved): parentA AND parentB are
   *  both populated from the corresponding CalcInputs fields. Phase B
   *  Appendix B renders path-specific sub-tables from these objects
   *  without re-reading CalcInputs. */
  methodology?: {
    parentA?: IncomeMethodology;
    parentB?: IncomeMethodology;
  };
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

/**
 * Statutory cap panel — Refinement 4 (approved): one structured shape
 * feeds BOTH narrative branches. `engaged` discriminates; both
 * branches receive `calculatedPCSO`, `statutoryMax`, `numChildren`,
 * `capNote`, `caseLaw`.
 *
 *   - Engaged (calculatedPCSO > statutoryMax):
 *       excessOverCap > 0, factors populated with the burden-shift
 *       factor list, userElectedPCSO populated when the user has
 *       entered an above-cap election (Fixture #11 input — wiring lands
 *       when the input flow ships; null until then).
 *
 *   - Not engaged (calculatedPCSO ≤ statutoryMax):
 *       headroom = statutoryMax − calculatedPCSO. Feeds the below-cap
 *       reassurance narrative ("$X/mo below the §36-5-101(e)(1)(B)
 *       cap"). excessOverCap = 0, factors = [], userElectedPCSO = null.
 */
export interface WDMStatutoryCapPanel {
  engaged: boolean;
  calculatedPCSO: number;
  statutoryMax: number;
  numChildren: number;
  /** Engaged: dollars above the cap. Not-engaged: 0. */
  excessOverCap: number;
  /** Not-engaged: dollars below the cap. Engaged: 0. */
  headroom: number;
  /** Neutral guideline note (from outputs.pcsoCapNote / pcsoBelowCapNote). */
  capNote: string | null;
  /** Case-law footnote sourced from CITATIONS.pcso_max.caseNote (Nash/Richardson/Smallman lineage). */
  caseLaw: string | null;
  /** Engaged: burden-shift factor list per Nash v. Mulle progeny. Not-engaged: []. */
  factors: string[];
  /** Engaged: user's elected PCSO when the above-cap input flow has captured one. Null otherwise. */
  userElectedPCSO: {
    amount: number;
    rationale?: string;
    source: "user_input";
  } | null;
}

/**
 * PRP / ARP / SPLIT checkbox panel state for the AOC form's identification
 * row. Phase A v2.1 addition: the overlay renderer reads this directly
 * instead of re-deriving from inputs. `marginNote` carries the
 * Equal-50/50 explainer when no boxes are checked under Rule .04(7)(b)(2)(i).
 *
 * SPLIT is reserved for true split-custody scenarios (different children
 * residing with different parents). The current calc engine does not
 * model split custody; the field is always false today and is kept on
 * the shape so the overlay form can render the unchecked box without a
 * branch.
 */
export interface WDMParentRoleCheckboxes {
  parentA: { prp: boolean; arp: boolean; split: boolean };
  parentB: { prp: boolean; arp: boolean; split: boolean };
  marginNote: string | null;
}

import type { WDMDeviationsNarrative } from "../deviations-narrative";
export type { WDMDeviationBlock, WDMDeviationsNarrative } from "../deviations-narrative";

export interface WDMPanels {
  /** Always present (Refinement 4). Use `engaged` to discriminate. */
  statutoryCap: WDMStatutoryCapPanel;
  /** "Why is this support amount so low?" explainer for Equal 50/50. */
  equalParentingLowSupportNote: string | null;
  /** Rule .04(7)(f) — non-earner ARP explainer. */
  nonEarnerArpNote: string | null;
  /** Zero-presumptive / floor-does-not-apply explainer. */
  zeroPresumptiveNote: string | null;
  /** Deviation-methodology footnote (shown when any deviation is in play). */
  deviationMethodologyNote: string | null;
  /** Phase A v2.1: PRP/ARP/SPLIT checkbox state for AOC form identification row. */
  parentRoleCheckboxes: WDMParentRoleCheckboxes;
  /** Phase A v2.1: structured deviations narrative; consumed by AOC
   *  overlay (via flattenForCommentsBlock) and Phase D annotated PDF. */
  deviationsNarrative: WDMDeviationsNarrative;
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
