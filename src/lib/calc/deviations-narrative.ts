/**
 * buildDeviationsNarrative — shared composer.
 *
 * Returns the discretionary-deviations narrative as an ordered list of
 * structured blocks. Two consumers compose the same source:
 *
 *   - AOC overlay renderer (Phase C): uses `flattenForCommentsBlock(blocks)`
 *     to fit the AOC form's Comments cell (brief, concatenated prose).
 *   - Annotated PDF (Phase D, Appendix on deviations): renders the same
 *     blocks with full per-block headings, citation lines, and rule
 *     factor lists. No string re-derivation across consumers.
 *
 * Per Phase A v2.1 approval: the helper always returns the structured
 * shape; the flattener is a small adapter consumed only where a single
 * paragraph is required. Composition lives in one place; per-consumer
 * format adapters live next to their consumers.
 */
import type { CalcInputs, CalcOutputs } from "./types";
import type { CitationKey } from "./citations";
import { specialExpensesThresholdLine } from "./citations";

function fmtAbs(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

export interface WDMDeviationBlock {
  /** Section heading, e.g. "Private school deviation". */
  heading: string;
  /** Prose body. Self-contained sentence(s); no leading heading. */
  body: string;
  /** Controlling rule citation key. */
  citation: CitationKey;
}

export interface WDMDeviationsNarrative {
  blocks: WDMDeviationBlock[];
}

export function buildDeviationsNarrative(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMDeviationsNarrative {
  const blocks: WDMDeviationBlock[] = [];
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  if (inputs.includePrivateSchool) {
    const monthly = outputs.privateSchoolMonthlyTotal;
    const netA = outputs.privateSchoolDeviationFromA;
    const payer =
      inputs.privateSchoolPaidBy === "parent_a"
        ? a
        : inputs.privateSchoolPaidBy === "parent_b"
          ? b
          : null;
    const payerClause = payer ? ` Paid directly by ${payer}.` : "";
    blocks.push({
      heading: "Private school deviation",
      body: `$${fmtAbs(monthly)}/mo private-school tuition allocated pro rata under Rule .07(2)(d). ${a} net transfer ${fmtAbs(netA)}.${payerClause}`,
      citation: "private_school",
    });
  }

  if (inputs.includeSpecialExpenses) {
    // Reuse the canonical threshold-line phrasing so the AOC overlay
    // and the on-screen worksheet print byte-identical prose.
    const thresholdLine = specialExpensesThresholdLine({
      monthly: (inputs.specialExpensesAnnual || 0) / 12,
      threshold: outputs.specialExpensesThresholdAmount,
      basis: outputs.specialExpensesIncludedAsDeviation,
    });
    blocks.push({
      heading: "Extracurriculars / special expenses",
      body: thresholdLine,
      citation: "special_expenses",
    });
  }

  // Net-transfer summary line — only emitted when at least one deviation
  // is in play AND the engine resolves a non-zero net transfer on the
  // deviations line. Refers to the AOC worksheet's Line 14 (deviations
  // total) so the prose anchors back to the structured row.
  if (blocks.length > 0) {
    const net =
      (inputs.includePrivateSchool ? outputs.privateSchoolDeviationFromA : 0) +
      (inputs.includeSpecialExpenses ? outputs.specialExpensesDeviationFromA : 0);
    if (Number.isFinite(net) && Math.abs(net) > 0) {
      const direction = net > 0 ? `${b} pays ${a}` : `${a} pays ${b}`;
      blocks.push({
        heading: "Net deviation transfer",
        body: `Net deviation transfer on Line 14: $${fmtAbs(net)}/mo (${direction}).`,
        citation: "fcso",
      });
    }
  }

  return { blocks };
}

/**
 * Brief-mode adapter for the AOC Comments cell. Concatenates each
 * block's body with a single space; headings are dropped (the Comments
 * cell has no room for headings, and the bodies are self-introducing).
 * Returns an empty string when there are no blocks.
 */
export function flattenForCommentsBlock(
  narrative: WDMDeviationsNarrative,
): string {
  return narrative.blocks.map((b) => b.body).join(" ");
}

/**
 * Ultra-brief AOC-form adapter. Returns at most one short sentence
 * summarizing the deviation footprint and pointing the reader to the
 * annotated worksheet for the full breakdown. Designed to fit on a
 * single underline row of the AOC Comments block.
 *
 * AOC boundary: numbers + structural cells only — no rule citations.
 * The pointer "See annotated worksheet for methodology." is permitted
 * (a pointer, not a citation).
 *
 * When no deviations are in play, returns null (caller drops the line).
 */
export function flattenForCommentsBriefAOC(
  narrative: WDMDeviationsNarrative,
  parentALabel: string,
  parentBLabel: string,
  netDeviationFromA: number,
): string | null {
  if (narrative.blocks.length === 0) return null;
  const a = parentALabel || "Mother";
  const b = parentBLabel || "Father";
  const abs = Math.abs(netDeviationFromA);
  if (!(abs > 0)) {
    return `Deviations applied. See annotated worksheet for methodology.`;
  }
  const direction = netDeviationFromA > 0 ? `${a} → ${b}` : `${b} → ${a}`;
  const dollars = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return `Deviations applied, net Line 14 transfer $${dollars}/mo (${direction}). See annotated worksheet for methodology.`;
}
