/**
 * Phase 4 — Slice 3
 * Sensitivity HTML generator for the MS § 43-19-103 deviation worksheet.
 *
 * Produces a single-file, standalone HTML analysis that varies two
 * independent axes across the current case state and shows the final
 * monthly order + cumulative through emancipation under each scenario:
 *
 *   1. Chancellor decision sweep (always shown). Four columns:
 *        - Current decisions (chancellor's actual ruling on the case)
 *        - All-adopt-obligor   (what if every contested factor goes
 *          obligor's way?)
 *        - All-adopt-obligee   (every factor goes obligee's way?)
 *        - All-split           (every factor split 50/50?)
 *
 *      Agreed rows collapse to "Accept agreed" in every sweep column —
 *      agreement is not a contested decision and shouldn't disappear when
 *      we model alternative chancellor outcomes. Non-asserted rows
 *      contribute zero across all columns.
 *
 *   2. Imputation application sweep (only when outputs.imputationActive).
 *      Columns at 40 / 50 / 60 / 75 / 100% imputation application,
 *      holding the chancellor's current decisions fixed. For non-imputation
 *      cases (like Williams) this whole section is omitted — see
 *      Slice 3 scoping note: imputation alone would collapse to identical
 *      columns on Williams.
 *
 * Both sweeps use the canonical §5.4 transaction-and-rollback pattern:
 * we deep-clone inputs before mutating the chancellor decision map (or
 * imputation %) for the sweep, recompute, and discard the clone. The
 * caller's MSInputs is never mutated.
 *
 * Bundle discipline (D-007): dynamic-imported from worksheet-preview.tsx,
 * no React, no DOM at module scope, no network. Pure string render.
 */
import type {
  MSInputs,
  MSOutputs,
  MSFactorLetter,
  HandoffState,
  MSChild,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  buildReconciliation,
  FACTOR_TITLES,
  type ReconciliationRow,
} from "@/lib/calc/ms/reconciliation";
import {
  computeChancellorTotals,
  decisionContribution,
  defaultChancellorDecisions,
  type MSChancellorDecision,
  type MSChancellorDecisionKind,
} from "@/lib/calc/ms/chancellor-decisions";
import { calculateMS } from "@/lib/calc/ms/calc";

// ───────────────────────────── helpers ─────────────────────────────

function esc(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtMoney(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  if (n === 0) return "$0";
  return n < 0 ? `\u2212$${abs}` : `+$${abs}`;
}

function fmtMoneyPlain(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  return n < 0 ? `\u2212$${abs}` : `$${abs}`;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function slugMatter(name: string | undefined): string {
  const base = (name || "MS_Deviation").trim();
  return (
    base
      .replace(/[^a-zA-Z0-9\s_-]+/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 64) || "MS_Deviation"
  );
}

export function sensitivityFilename(caption: CaseCaption): string {
  return `MS_Deviation_Sensitivity_${slugMatter(caption.matterName)}_${todayISO()}.html`;
}

// ───────────────────────────── sweep math ──────────────────────────

type SweepKind = "current" | "adopt_obligor" | "adopt_obligee" | "split";

/**
 * Project a single factor row's contribution under a sweep kind. Honors
 * the "agreed rows always accept agreed" rule so agreement doesn't
 * silently vanish when we model alternative chancellor outcomes.
 *
 * For "current" the caller passes the chancellor's actual decision map.
 */
function projectRow(
  row: ReconciliationRow,
  kind: Exclude<SweepKind, "current">,
): number {
  if (row.inPlay === "neither") return 0;
  if (row.inPlay === "agree") {
    // Agreed amount stands across all sweep columns.
    return decisionContribution(row, {
      factorLetter: row.letter,
      decision: "accept_agreed",
      customAmount: 0,
      decidedAt: null,
    });
  }
  return decisionContribution(row, {
    factorLetter: row.letter,
    decision: kind,
    customAmount: 0,
    decidedAt: null,
  });
}

interface ScenarioColumn {
  id: string;
  label: string;
  sub: string;
  presumptive: number;
  perFactor: Record<MSFactorLetter, number>;
  deviationTotal: number;
  finalMonthly: number;
  cumulative: number | null;
}

function buildChancellorColumns(args: {
  rows: ReconciliationRow[];
  presumptive: number;
  avgMonths: number | null;
  currentDecisions: Record<MSFactorLetter, MSChancellorDecision>;
}): ScenarioColumn[] {
  const { rows, presumptive, avgMonths, currentDecisions } = args;

  const finalFor = (per: Record<MSFactorLetter, number>): number => {
    return (
      presumptive +
      (Object.values(per) as number[]).reduce((s, n) => s + n, 0)
    );
  };

  // Column 1 — chancellor's current ruling
  const currentTotals = computeChancellorTotals(rows, currentDecisions);
  const currentCol: ScenarioColumn = {
    id: "current",
    label: "Current ruling",
    sub: "Chancellor's decisions as recorded",
    presumptive,
    perFactor: currentTotals.perFactor,
    deviationTotal: currentTotals.totalMonthly,
    finalMonthly: presumptive + currentTotals.totalMonthly,
    cumulative:
      avgMonths !== null
        ? (presumptive + currentTotals.totalMonthly) * avgMonths
        : null,
  };

  // Columns 2-4 — sweeps
  const sweep = (
    id: Exclude<SweepKind, "current">,
    label: string,
    sub: string,
  ): ScenarioColumn => {
    const per = {} as Record<MSFactorLetter, number>;
    for (const r of rows) per[r.letter] = projectRow(r, id);
    const final = finalFor(per);
    const devTotal = (Object.values(per) as number[]).reduce(
      (s, n) => s + n,
      0,
    );
    return {
      id,
      label,
      sub,
      presumptive,
      perFactor: per,
      deviationTotal: devTotal,
      finalMonthly: final,
      cumulative: avgMonths !== null ? final * avgMonths : null,
    };
  };

  return [
    currentCol,
    sweep(
      "adopt_obligor",
      "All-adopt-obligor",
      "Every contested factor adopts obligor's position",
    ),
    sweep(
      "adopt_obligee",
      "All-adopt-obligee",
      "Every contested factor adopts obligee's position",
    ),
    sweep(
      "split",
      "All-split",
      "Every contested factor split 50/50",
    ),
  ];
}

function buildImputationColumns(args: {
  inputs: MSInputs;
  rows: ReconciliationRow[];
  avgMonths: number | null;
  currentDecisions: Record<MSFactorLetter, MSChancellorDecision>;
}): ScenarioColumn[] | null {
  const { inputs, currentDecisions } = args;
  // Build base report once for factor decisions; factor amounts are
  // independent of imputation %.
  const PCTS = [40, 50, 60, 75, 100];
  const cols: ScenarioColumn[] = [];
  for (const pct of PCTS) {
    // §5.4 transaction-and-rollback: deep-clone before mutating.
    const clone: MSInputs = JSON.parse(JSON.stringify(inputs));
    clone.imputationBasis = {
      ...clone.imputationBasis,
      applicationPct: pct,
    };
    const sweptOutputs = calculateMS(clone);
    const sweptRows = buildReconciliation(clone).rows;
    const sweptAvgMonths = avgMonthsFromChildren(clone.childAges);
    const totals = computeChancellorTotals(sweptRows, currentDecisions);
    const final = sweptOutputs.presumptiveMonthly + totals.totalMonthly;
    cols.push({
      id: `imp-${pct}`,
      label: `${pct}%`,
      sub: `Presumptive $${Math.round(sweptOutputs.presumptiveMonthly).toLocaleString("en-US")}/mo`,
      presumptive: sweptOutputs.presumptiveMonthly,
      perFactor: totals.perFactor,
      deviationTotal: totals.totalMonthly,
      finalMonthly: final,
      cumulative: sweptAvgMonths !== null ? final * sweptAvgMonths : null,
    });
  }
  return cols;
}

function avgMonthsFromChildren(ages: number[] | undefined): number | null {
  if (!ages || ages.length === 0) return null;
  const months = ages.map((a) => Math.max(0, 21 - (a ?? 0)) * 12);
  const sum = months.reduce((s, n) => s + n, 0);
  return Math.round(sum / months.length);
}

// ───────────────────────────── CSS ─────────────────────────────────

const CSS = `
:root {
  --ink: #1a1a1a;
  --ink-soft: #444;
  --ink-muted: #6b6b6b;
  --paper: #faf8f3;
  --paper-card: #ffffff;
  --rule: #d8d3c4;
  --accent: #5a3a14;
  --highlight: #fff6dc;
  --obligor: #2b5d8f;
  --obligee: #7a3a8f;
  --amber: #d4843a;
  --green: #2e7d32;
  --red: #c62828;
  --statute-bg: #f4f0e5;
  --neutral-bg: #f8f6f1;
  --col-current: #fff6dc;
  --col-obligor: #eaf1f8;
  --col-obligee: #f4ebf7;
  --col-split: #fef0e2;
  --col-imp: #f0f4ec;
}
* { box-sizing: border-box; }
body { font-family: Georgia, "Times New Roman", serif; color: var(--ink); background: var(--paper); margin: 0; padding: 2rem 1.25rem 4rem; line-height: 1.55; font-size: 14px; }
.page { max-width: 1180px; margin: 0 auto; }
header.case-header { border-bottom: 3px solid var(--accent); padding-bottom: 1.1rem; margin-bottom: 1.25rem; }
header.case-header h1 { margin: 0 0 .25rem 0; font-size: 1.55rem; color: var(--accent); letter-spacing: -.01em; }
header.case-header .subtitle { color: var(--ink-muted); font-style: italic; font-size: .9rem; }
.case-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: .35rem 1.25rem; margin-top: .85rem; font-size: .82rem; }
.case-meta .label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: .05em; font-size: .65rem; display: block; margin-bottom: .1rem; }
.intro { background: var(--statute-bg); border-left: 4px solid var(--accent); padding: .85rem 1rem; margin: 1rem 0 1.5rem; font-size: .9rem; color: var(--ink-soft); border-radius: 0 4px 4px 0; }
.intro strong { color: var(--accent); }
section.sweep { background: var(--paper-card); border: 1px solid var(--rule); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.5rem; }
section.sweep > h2 { margin: 0 0 .65rem 0; font-size: 1.1rem; color: var(--accent); border-bottom: 1px dashed var(--rule); padding-bottom: .4rem; }
section.sweep > h2 .module-tag { display: inline-block; background: var(--statute-bg); color: var(--accent); padding: .12rem .5rem; border-radius: 3px; font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; margin-right: .55rem; vertical-align: middle; font-family: -apple-system, "Helvetica Neue", sans-serif; font-weight: 600; }
section.sweep .blurb { color: var(--ink-soft); font-size: .87rem; margin: 0 0 .85rem 0; }
table.sweep { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: .85rem; }
table.sweep th, table.sweep td { padding: .45rem .55rem; border-bottom: 1px solid var(--rule); text-align: right; vertical-align: top; }
table.sweep th:first-child, table.sweep td:first-child { text-align: left; }
table.sweep thead th { background: var(--statute-bg); color: var(--accent); font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; border-bottom: 2px solid var(--accent); }
table.sweep thead th .col-sub { display: block; font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--ink-muted); font-size: .68rem; margin-top: .15rem; font-style: italic; }
table.sweep td.col-current { background: var(--col-current); font-weight: 600; }
table.sweep td.col-adopt_obligor, table.sweep th.col-adopt_obligor { background: var(--col-obligor); }
table.sweep td.col-adopt_obligee, table.sweep th.col-adopt_obligee { background: var(--col-obligee); }
table.sweep td.col-split, table.sweep th.col-split { background: var(--col-split); }
table.sweep th.col-current { background: var(--col-current); }
table.sweep td.col-imp, table.sweep th.col-imp { background: var(--col-imp); }
table.sweep tr.section-header td { background: var(--neutral-bg); font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-muted); padding: .35rem .55rem; }
table.sweep tr.totals td { border-top: 2px solid var(--accent); border-bottom: 2px solid var(--accent); background: var(--highlight); font-weight: 700; }
table.sweep tr.cumulative td { font-size: .82rem; color: var(--ink-soft); }
table.sweep .factor-label { color: var(--ink); }
table.sweep .factor-letter { display: inline-block; background: var(--accent); color: white; width: 1.25rem; height: 1.25rem; border-radius: 50%; text-align: center; line-height: 1.25rem; font-family: -apple-system, "Helvetica Neue", sans-serif; font-weight: 700; font-size: .7rem; margin-right: .45rem; }
.delta { display: inline-block; font-size: .72rem; color: var(--ink-muted); margin-left: .35rem; font-style: italic; }
.delta.positive { color: var(--red); }
.delta.negative { color: var(--green); }
.empty-msg { color: var(--ink-muted); font-style: italic; font-size: .87rem; padding: .55rem 0; }
.takeaway { margin-top: 1rem; padding: .8rem 1rem; background: var(--neutral-bg); border-left: 4px solid var(--accent); font-size: .87rem; color: var(--ink-soft); border-radius: 0 4px 4px 0; }
.takeaway strong { color: var(--accent); }
footer.notes { margin-top: 1.5rem; padding-top: .85rem; border-top: 2px solid var(--accent); font-size: .8rem; color: var(--ink-muted); }
footer.notes p { margin: .35rem 0; }
@page { size: letter landscape; margin: 0.5in; }
@media print {
  body { background: white; padding: 0; font-size: 9pt; }
  section.sweep { border: none; padding: .35rem 0; page-break-inside: avoid; }
  .intro { page-break-inside: avoid; }
}
`;

// ───────────────────────────── renderer ────────────────────────────

function renderSweepTable(args: {
  rows: ReconciliationRow[];
  columns: ScenarioColumn[];
  avgMonths: number | null;
  comparisonId: "current" | string;
}): string {
  const { rows, columns, avgMonths, comparisonId } = args;
  // Index lookup of comparison column for delta annotations
  const cmp = columns.find((c) => c.id === comparisonId);

  const headerCells = columns
    .map(
      (c) =>
        `<th class="col-${c.id}">${esc(c.label)}<span class="col-sub">${esc(c.sub)}</span></th>`,
    )
    .join("");

  const factorRows = rows
    .map((r) => {
      const cells = columns
        .map((c) => {
          const v = c.perFactor[r.letter] ?? 0;
          const txt = r.inPlay === "neither" ? "\u2014" : fmtMoney(v);
          return `<td class="col-${c.id}">${txt}</td>`;
        })
        .join("");
      return `<tr><td class="factor-label"><span class="factor-letter">${r.letter}</span>${esc(r.title)}</td>${cells}</tr>`;
    })
    .join("");

  const presumptiveCells = columns
    .map(
      (c) =>
        `<td class="col-${c.id}">${fmtMoneyPlain(c.presumptive)}</td>`,
    )
    .join("");

  const devTotalCells = columns
    .map((c) => `<td class="col-${c.id}">${fmtMoney(c.deviationTotal)}</td>`)
    .join("");

  const finalCells = columns
    .map((c) => {
      const delta =
        cmp && c.id !== cmp.id
          ? c.finalMonthly - cmp.finalMonthly
          : null;
      const deltaTxt =
        delta !== null && delta !== 0
          ? `<span class="delta ${delta > 0 ? "positive" : "negative"}">${fmtMoney(delta)}</span>`
          : "";
      return `<td class="col-${c.id}">${fmtMoneyPlain(c.finalMonthly)}/mo${deltaTxt}</td>`;
    })
    .join("");

  const cumulativeCells =
    avgMonths !== null
      ? columns
          .map(
            (c) =>
              `<td class="col-${c.id}">${c.cumulative !== null ? fmtMoneyPlain(c.cumulative) : "\u2014"}</td>`,
          )
          .join("")
      : "";

  const cumulativeRow =
    avgMonths !== null
      ? `<tr class="cumulative"><td>Cumulative through emancipation (${avgMonths} mo avg)</td>${cumulativeCells}</tr>`
      : "";

  return `
    <table class="sweep">
      <thead>
        <tr>
          <th>Component</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        <tr><td>Presumptive (\u00a7 43-19-101)</td>${presumptiveCells}</tr>
        <tr class="section-header"><td colspan="${columns.length + 1}">Per-factor chancellor contribution</td></tr>
        ${factorRows}
        <tr><td><em>Total deviations</em></td>${devTotalCells}</tr>
        <tr class="totals"><td>Final monthly order</td>${finalCells}</tr>
        ${cumulativeRow}
      </tbody>
    </table>`;
}

export function renderMSSensitivityHtml(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  handoff?: HandoffState;
}): string {
  const { inputs, outputs, caption, handoff } = args;
  const report = buildReconciliation(inputs);
  const decisions =
    inputs.chancellorDecisions ?? defaultChancellorDecisions();
  const avgMonths = report.totals.avgMonthsRemaining;
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";

  const chancellorCols = buildChancellorColumns({
    rows: report.rows,
    presumptive: outputs.presumptiveMonthly,
    avgMonths,
    currentDecisions: decisions,
  });

  const chancellorTable = renderSweepTable({
    rows: report.rows,
    columns: chancellorCols,
    avgMonths,
    comparisonId: "current",
  });

  // Compact takeaway summarizing the envelope around the current ruling.
  const current = chancellorCols[0];
  const oblCol = chancellorCols[1];
  const oblEeCol = chancellorCols[2];
  const splitCol = chancellorCols[3];
  const envelope = [
    oblCol.finalMonthly,
    oblEeCol.finalMonthly,
    splitCol.finalMonthly,
  ];
  const lo = Math.min(...envelope);
  const hi = Math.max(...envelope);
  const takeaway = `<div class="takeaway"><strong>Settlement envelope.</strong> Under the three pure sweeps, the chancellor's final monthly order would fall between <strong>${fmtMoneyPlain(lo)}/mo</strong> and <strong>${fmtMoneyPlain(hi)}/mo</strong>. The current ruling lands at <strong>${fmtMoneyPlain(current.finalMonthly)}/mo</strong>${avgMonths !== null ? ` — cumulative <strong>${fmtMoneyPlain(current.cumulative ?? 0)}</strong> over an average of ${avgMonths} months remaining.` : "."}</div>`;

  // Imputation sweep — only when active.
  let imputationSection = "";
  if (outputs.imputationActive) {
    const impCols = buildImputationColumns({
      inputs,
      rows: report.rows,
      avgMonths,
      currentDecisions: decisions,
    });
    if (impCols && impCols.length > 0) {
      const taggedCols: ScenarioColumn[] = impCols.map((c) => ({
        ...c,
        id: "imp",
      }));
      const impTable = renderSweepTable({
        rows: report.rows,
        columns: taggedCols,
        avgMonths,
        comparisonId: "imp",
      });
      imputationSection = `
<section class="sweep">
  <h2><span class="module-tag">Sweep 2</span>Imputation application sweep — \u00a7 43-19-101(5)</h2>
  <p class="blurb">Holding the chancellor's current decisions fixed, the table below varies the imputation application from 40% to 100%. Only the presumptive amount changes across columns; per-factor decisions are held constant.</p>
  ${impTable}
</section>`;
    }
  } else {
    imputationSection = `
<section class="sweep">
  <h2><span class="module-tag">Sweep 2</span>Imputation application sweep</h2>
  <p class="empty-msg">Not applicable to this case — neither party's income is imputed under \u00a7 43-19-101(5). The imputation axis collapses to identical columns when no imputation is in play and is omitted here.</p>
</section>`;
  }

  const childCount = inputs.numChildren;
  const childAgesStr =
    inputs.childAges.length > 0 ? ` (ages ${inputs.childAges.map((c) => c.age).join(", ")})` : "";

  const title = caption.matterName
    ? `${caption.matterName} \u2014 MS \u00a7 43-19-103 Deviation Sensitivity Analysis`
    : "MS \u00a7 43-19-103 Deviation Sensitivity Analysis";

  const handoffFooter =
    handoff && handoff.status !== "none"
      ? `<p>Two-attorney handoff \u2014 round ${handoff.handoffRound}. Originating counsel: ${esc(handoff.originatingAttorney?.name || "(unnamed)")}${handoff.originatingAttorney?.firm ? ` (${esc(handoff.originatingAttorney.firm)})` : ""}. Receiving counsel: ${esc(handoff.receivingAttorney?.name || "(unnamed)")}${handoff.receivingAttorney?.firm ? ` (${esc(handoff.receivingAttorney.firm)})` : ""}.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">

<header class="case-header">
  <h1>\u00a7 43-19-103 Deviation \u2014 Sensitivity Analysis</h1>
  <div class="subtitle">${esc(caption.matterName || "Mississippi child support deviation \u2014 scenario envelope")} \u2014 final monthly order across alternative chancellor rulings.</div>
  <div class="case-meta">
    ${caption.docketNumber ? `<div><span class="label">Docket no.</span>${esc(caption.docketNumber)}</div>` : ""}
    <div><span class="label">Computation date</span>${todayISO()}</div>
    <div><span class="label">Children</span>${childCount}${esc(childAgesStr)}</div>
    ${caption.court ? `<div><span class="label">Court</span>${esc(caption.court)}</div>` : ""}
    <div><span class="label">Obligor</span>${esc(obligorRole)}</div>
    <div><span class="label">Obligee</span>${esc(obligeeRole)}</div>
    ${caption.preparedBy ? `<div><span class="label">Prepared by</span>${esc(caption.preparedBy)}</div>` : ""}
    <div><span class="label">Statutory framework</span>Miss. Code Ann. \u00a7 43-19-101, -103</div>
  </div>
</header>

<div class="intro">
  <strong>Reading this document.</strong> Each table column models an alternative chancellor outcome. Per-factor cells show the signed monthly contribution that decision would add to the order. Agreed factors are held at the agreed amount across all columns \u2014 agreement is not a contested decision. The bottom row shows the final monthly order, with the delta against the comparison column in parentheses; the cumulative row projects through the average emancipation horizon.
</div>

<section class="sweep">
  <h2><span class="module-tag">Sweep 1</span>Chancellor decision sweep</h2>
  <p class="blurb">Holding the case facts and presumptive amount fixed, the table below sweeps the chancellor's decisions across three pure outcomes plus the current ruling. The settlement envelope below the table is the high\u2013low range across the three pure sweeps.</p>
  ${chancellorTable}
  ${takeaway}
</section>

${imputationSection}

<footer class="notes">
  <p>Sensitivity analysis produced by the Mississippi deviation calculator at csg.tcblaw.org/ms. The presumptive amount and the per-decision contribution math are mechanical; the chancellor's actual ruling is a matter of judgment. This document is a planning tool, not legal advice, and not an official MDHS form.</p>
  ${handoffFooter}
</footer>

</div>
</body>
</html>`;
}

/** Browser-side helper \u2014 trigger download of the Sensitivity HTML. */
export function downloadMSSensitivityHtml(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  handoff?: HandoffState;
  filename?: string;
}) {
  const html = renderMSSensitivityHtml(args);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = args.filename ?? sensitivityFilename(args.caption);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
