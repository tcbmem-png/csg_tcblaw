/**
 * Washington cited-worksheet MODEL — pure transform from the engine output into
 * the per-line worksheet a self-represented parent can read: for every line,
 * the computed number, HOW it was derived, and the governing authority
 * (RCW / WAC / verified case law). This is WA's deliverable — not a calculator
 * clone (the State's own open WSCSS tool is good) but the cited, independently
 * recomputed worksheet the State tool never shows.
 *
 * MATH is taken straight from the merged, byte-checked engine (WA_INCOME_SHARES_SPEC,
 * 11/11 fixtures vs the live open WSCSS calculator, 2026-06-16): per-child × N
 * (RCW 26.19.020 table is per child), nearest_100 lookup, 3-decimal income share,
 * SSR $2,394, whole-dollar order. This module only EXPOSES the per-line
 * intermediates the engine already computes; it never re-derives or forces a value.
 *
 * AUTHORITY comes verbatim from ./authority.json (verified 2026-06-16). A line
 * whose authority note carries a "[VERIFY …]" tag is surfaced as statute-only /
 * pending confirmation — never silently presented as settled. Per the WA rule,
 * a citation never sits next to a number we haven't independently recomputed.
 */
import authorityData from "./authority.json";
import { WA_INCOME_SHARES_SPEC } from "./spec";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../../core/types";

export interface WaAuthorityCase {
  cite: string;
  parenthetical: string;
  pin: string;
  /** "verified" | "cite_confirmed_quote_pending". */
  status: string;
}
export interface WaAuthority {
  line: string;
  label: string;
  rcw: string[];
  wac: string[];
  cases: WaAuthorityCase[];
  note?: string;
}

export interface WaWorksheetLine {
  /** Worksheet line id, e.g. "5", "8 (SSR)". */
  line: string;
  label: string;
  /** Parent-1 / Parent-2 column values (single-value lines use `combined`). */
  col1?: string;
  col2?: string;
  combined?: string;
  /** How the number was computed, in plain words. */
  derivation: string;
  /** Governing authority for this line (verbatim from authority.json). */
  authority: { rcw: string[]; wac: string[]; cases: WaAuthorityCase[]; note?: string };
  /** Verbatim "[VERIFY …]" label when the authority is statute-only / pending. */
  verify?: string;
  /** Informational limit (lines 18/19), not part of the transfer total. */
  informational?: boolean;
}

export interface WaWorksheetModel {
  obligor: "parent_a" | "parent_b";
  /** Standard calculation / presumptive transfer (Line 17), whole dollars. */
  transfer: number;
  summary: string;
  lines: WaWorksheetLine[];
  /** Verbatim caveat from the verified authority pack. */
  authorityCaveat: string;
}

const AUTH = authorityData as { caveat: string; lines: WaAuthority[] };
const authFor = (line: string): WaAuthority | undefined => AUTH.lines.find((l) => l.line === line);

// Self-support reserve from the verified spec (180% of the 2026 one-person FPG).
const WA_SSR =
  (WA_INCOME_SHARES_SPEC.lowIncome?.params as { reserve?: number } | undefined)?.reserve ?? 2394;

const money = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
/** Income share as the worksheet shows it: a 3-decimal proportion (e.g. 0.667). */
const share3 = (f: number): string => f.toFixed(3);

/** Pull the verbatim "[VERIFY …]" tag out of an authority note, if present. */
function verifyTag(note?: string): string | undefined {
  const m = note?.match(/\[VERIFY[^\]]*\]/);
  return m ? m[0] : undefined;
}

function attach(
  line: string,
  base: Omit<WaWorksheetLine, "authority" | "verify" | "label" | "line">,
): WaWorksheetLine {
  const a = authFor(line);
  return {
    line,
    ...base,
    label: a?.label ?? line,
    authority: { rcw: a?.rcw ?? [], wac: a?.wac ?? [], cases: a?.cases ?? [], note: a?.note },
    verify: verifyTag(a?.note),
  };
}

/**
 * Build the cited worksheet model from engine inputs + outputs. Pure; the
 * numbers are exactly the engine's (the byte-checked oracle), only re-exposed
 * per line. Throws on split custody (not a WA path).
 */
export function buildWaWorksheetModel(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
): WaWorksheetModel {
  if (i.splitCustody) {
    throw new Error("WA cited worksheet does not model split custody.");
  }
  const obligorIsA = o.allInDirection !== "parent_b_to_a";
  const obligor: "parent_a" | "parent_b" = obligorIsA ? "parent_a" : "parent_b";

  const N = i.numChildren;
  // Line 5 — the table is PER CHILD; total = per-child × N. Exact (bcso is the integer total).
  const perChild = N > 0 ? o.bcso / N : 0;
  const capNote =
    o.bcsoSource === "above_cap"
      ? " Combined net is above the $50,000 economic-table ceiling; the $50,000-row amount is the presumptive floor (a court may exceed it only on written findings — McCausland/Graham)."
      : "";

  // Line 7 — each parent's basic obligation = 3-decimal share × total, whole dollars.
  const l7a = Math.round(o.piA * o.bcso);
  const l7b = Math.round(o.piB * o.bcso);

  const lines: WaWorksheetLine[] = [
    attach("3", {
      derivation: "Each parent's gross monthly income minus the RCW 26.19.071(5) deductions.",
      col1: money(o.parentAAGI),
      col2: money(o.parentBAGI),
    }),
    attach("4", {
      derivation: "Line 3 (Parent 1) + Line 3 (Parent 2).",
      combined: money(o.combinedAGI),
    }),
    attach("5", {
      derivation:
        `Economic table (combined net rounded to the nearest $100 row) = ${money(perChild)} per child ` +
        `× ${N} ${N === 1 ? "child" : "children"} = ${money(o.bcso)}.${capNote}`,
      combined: money(o.bcso),
    }),
    attach("6", {
      derivation: "Each parent's Line 3 net ÷ Line 4 combined net, rounded to 3 decimals.",
      col1: share3(o.piA),
      col2: share3(o.piB),
    }),
    attach("7", {
      derivation: "Line 6 proportional share × Line 5 basic obligation, to the whole dollar.",
      col1: money(l7a),
      col2: money(l7b),
    }),
    attach("8 (SSR)", {
      derivation:
        `${money(WA_SSR)} (180% of the 2026 one-person federal poverty guideline). ` +
        (o.ssrApplied
          ? "This reserve limited the obligor's basic obligation (reflected in Line 17)."
          : o.minimumOrderApplied
            ? "The obligor's net is at/under the reserve, so the $50-per-child presumptive minimum applies (Line 17)."
            : "Did not bind on these incomes."),
      combined: money(WA_SSR),
    }),
  ];

  // Add-on lines only when the case has work-related child care / health / etc.
  const combinedAddOns = (i.addOns ?? []).reduce((t, a) => t + (a.monthly || 0), 0);
  if (combinedAddOns > 0) {
    lines.push(
      attach("13", {
        derivation: "Combined monthly health care + day care + special child-rearing expenses.",
        combined: money(combinedAddOns),
      }),
      attach("14", {
        derivation: "Line 6 proportional share × Line 13 combined add-ons, to the whole dollar.",
        col1: money(Math.round(o.piA * combinedAddOns)),
        col2: money(Math.round(o.piB * combinedAddOns)),
      }),
    );
  }

  lines.push(
    attach("17", {
      derivation:
        "Obligor's basic obligation (after the low-income limitations) plus their proportional " +
        "share of add-ons, less credit for add-on amounts the obligor pays directly. " +
        "This is the presumptive transfer payment.",
      combined: `${money(o.allInMonthly)} (${obligorIsA ? "Parent 1 → Parent 2" : "Parent 2 → Parent 1"})`,
    }),
    attach("18", {
      derivation:
        "45% of each parent's Line 3 net income — an informational ceiling, not added to the transfer.",
      col1: money(0.45 * o.parentAAGI),
      col2: money(0.45 * o.parentBAGI),
      informational: true,
    }),
    attach("19", {
      derivation:
        "25% of each parent's Line 7 basic obligation — informational; the reasonable-cost ceiling for required health-coverage.",
      col1: money(0.25 * l7a),
      col2: money(0.25 * l7b),
      informational: true,
    }),
  );

  const summary =
    o.allInMonthly > 0
      ? `${obligorIsA ? "Parent 1" : "Parent 2"} pays ${obligorIsA ? "Parent 2" : "Parent 1"} ${money(o.allInMonthly)} per month (standard calculation, Line 17).`
      : "No transfer payment on these inputs.";

  return { obligor, transfer: o.allInMonthly, summary, lines, authorityCaveat: AUTH.caveat };
}
