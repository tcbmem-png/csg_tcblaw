/**
 * Phase 4 — Slice 1
 * Behind the Scenes HTML generator for the MS § 43-19-103 deviation
 * worksheet. Produces a single-file, standalone, interactive HTML
 * document that mirrors the Williams reference (docs/ms-williams-reference.html)
 * bound to the live case context.
 *
 * Acceptance criteria (per D-017 / D-007):
 *   - Williams reproduction: sticky three-line live bar (presumptive,
 *     final-under-current-decisions, cumulative), Module 1/2/3,
 *     factor cards with statute text + per-party blocks, both_agreed
 *     two-button collapsed state, both_disagreed amber-bordered card.
 *   - Per-position attribution (D-017): column header reads
 *       "Per counsel for {role} — {authoredByName}, {authoredByFirm}"
 *     For round-1 entries with empty authoredByName, falls back to
 *     caption.preparedBy. Round > 1 entries surface
 *       "Amended in round N by {name}"
 *     beneath the position narrative.
 *   - Filename: MS_Deviation_Worksheet_[MatterSlug]_[YYYY-MM-DD].html
 *   - Inline CSS + JS only, no network, prints cleanly.
 *
 * This module is renderer-only: no React, no DOM imports, no calc
 * mutation. Math is pulled from buildReconciliation + the chancellor
 * decision state already on MSInputs.
 */
import type {
  MSInputs,
  MSOutputs,
  MSFactorLetter,
  HandoffState,
  MSPartyEntry,
  MSDeviation,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  buildReconciliation,
  FACTOR_STATUTORY_TEXT,
  FACTOR_TITLES,
  type ReconciliationRow,
  type FactorInPlay,
} from "@/lib/calc/ms/reconciliation";
import {
  computeChancellorTotals,
  defaultChancellorDecisions,
  availableDecisions,
  decisionContribution,
  type MSChancellorDecision,
  type MSChancellorDecisionKind,
} from "@/lib/calc/ms/chancellor-decisions";

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
  return n < 0 ? `−$${abs}` : `+$${abs}`;
}

function fmtMoneyPlain(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  return n < 0 ? `−$${abs}` : `$${abs}`;
}

function fmtMoneyCell(n: number, applicable: boolean): string {
  if (!applicable) return "—";
  return fmtMoney(n);
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

export function behindTheScenesFilename(caption: CaseCaption): string {
  return `MS_Deviation_Worksheet_${slugMatter(caption.matterName)}_${todayISO()}.html`;
}

// ───────────────────────────── attribution ─────────────────────────

/**
 * D-017 per-position attribution. Returns the column-header byline plus
 * an optional amendment line for round > 1 entries.
 *
 * Rules:
 *   - When entry is non-applicable and has no party data: returns null
 *     for both (caller renders generic "Per counsel for {role}" header).
 *   - When authoredByName is empty AND handoffRound <= 1: fall back to
 *     caption.preparedBy (originator default).
 *   - When handoffRound >= 2 and authoredByName present: render the
 *     "Amended in round N by {name}" sub-line.
 */
function attributionFor(args: {
  roleLabel: string;
  entry: MSPartyEntry | undefined;
  caption: CaseCaption;
  handoff: HandoffState | undefined;
}): { header: string; amendmentLine: string | null } {
  const { roleLabel, entry, caption } = args;
  const rawName = entry?.authoredByName?.trim() || "";
  const rawFirm = entry?.authoredByFirm?.trim() || "";
  const round = entry?.handoffRound ?? null;

  // Resolve the display name with round-1 preparer fallback.
  const fallbackPreparer = caption.preparedBy?.trim() || "";
  const effectiveName =
    rawName || (round === null || round <= 1 ? fallbackPreparer : "");

  let header: string;
  if (effectiveName && rawFirm) {
    header = `Per counsel for ${roleLabel} — ${effectiveName}, ${rawFirm}`;
  } else if (effectiveName) {
    header = `Per counsel for ${roleLabel} — ${effectiveName}`;
  } else {
    header = `Per counsel for ${roleLabel}`;
  }

  let amendmentLine: string | null = null;
  if (round && round >= 2) {
    const who = rawName || fallbackPreparer || "opposing counsel";
    amendmentLine = `Amended in round ${round} by ${who}`;
  }

  return { header, amendmentLine };
}

// ───────────────────────────── status pill ─────────────────────────

function statusPill(inPlay: FactorInPlay): { cls: string; label: string } {
  switch (inPlay) {
    case "agree":
      return { cls: "agreed", label: "Agreed — same amount" };
    case "both":
      return { cls: "in-dispute", label: "Both assert — different amounts" };
    case "obligor_only":
      return { cls: "obligor-only", label: "Obligor only" };
    case "obligee_only":
      return { cls: "obligee-only", label: "Obligee only" };
    case "neither":
      return { cls: "not-asserted", label: "Not asserted" };
  }
}

function cardClass(inPlay: FactorInPlay): string {
  switch (inPlay) {
    case "both":
      return "factor in-dispute";
    case "agree":
      return "factor agreed";
    case "neither":
      return "factor not-asserted";
    default:
      return "factor partial";
  }
}

// ───────────────────────────── per-party block ─────────────────────

function renderParty(args: {
  side: "obligor" | "obligee";
  roleLabel: string;
  applicable: boolean;
  amount: number;
  entry: MSDeviation | undefined;
  caption: CaseCaption;
  handoff: HandoffState | undefined;
}): string {
  const { side, roleLabel, applicable, amount, entry, caption, handoff } = args;
  const party = entry?.party;
  const { header, amendmentLine } = attributionFor({
    roleLabel,
    entry: party,
    caption,
    handoff,
  });

  const amountCls =
    !applicable ? "neutral" : amount < 0 ? "negative" : amount > 0 ? "positive" : "neutral";
  const amountText = !applicable
    ? "—"
    : amount === 0
      ? "$0"
      : `${fmtMoney(amount)}/mo`;

  if (!applicable) {
    return `
      <div class="position ${side}">
        <div class="position-header">
          <span class="party">${esc(header)}</span>
          <span class="amount neutral">—</span>
        </div>
        <div class="position-narrative empty">Not asserted by this party.</div>
      </div>`;
  }

  const facts = party?.factsAsserted || entry?.description || "";
  const docs = party?.documentationReferenced || "";
  const authority = party?.legalAuthority || "";

  const metaParts: string[] = [];
  if (facts) metaParts.push(`<dt>Supporting facts</dt><dd>${esc(facts)}</dd>`);
  if (docs) metaParts.push(`<dt>Documentation</dt><dd>${esc(docs)}</dd>`);
  if (authority) metaParts.push(`<dt>Legal authority</dt><dd>${esc(authority)}</dd>`);

  const meta =
    metaParts.length > 0
      ? `<dl class="position-meta">${metaParts.join("")}</dl>`
      : "";

  const amendment = amendmentLine
    ? `<div class="amendment-note">${esc(amendmentLine)}</div>`
    : "";

  const narrative = facts
    ? `<div class="position-narrative">${esc(facts)}</div>`
    : `<div class="position-narrative empty">No narrative provided.</div>`;

  return `
    <div class="position ${side}">
      <div class="position-header">
        <span class="party">${esc(header)}</span>
        <span class="amount ${amountCls}">${esc(amountText)}</span>
      </div>
      ${narrative}
      ${amendment}
      ${meta}
    </div>`;
}

// ───────────────────────────── decision surface ────────────────────

const DECISION_LABEL: Record<MSChancellorDecisionKind, string> = {
  none: "Pending",
  adopt_obligor: "Adopt Obligor",
  adopt_obligee: "Adopt Obligee",
  split: "Split difference",
  custom: "Custom",
  decline: "No deviation",
  accept_agreed: "Accept agreed",
};

function decisionButtons(
  row: ReconciliationRow,
  current: MSChancellorDecisionKind,
): string {
  const options = availableDecisions(row.inPlay);
  if (options.length === 0) return "";
  const btns = options
    .map((opt) => {
      const projected = decisionContribution(row, {
        factorLetter: row.letter,
        decision: opt,
        customAmount: 0,
        decidedAt: null,
      });
      const amtLabel =
        opt === "decline" || opt === "custom"
          ? ""
          : ` (${fmtMoneyPlain(projected)})`;
      const sel = opt === current ? " selected" : "";
      return `<button type="button" class="decision-btn decision-${opt}${sel}" data-action="${opt}">${esc(DECISION_LABEL[opt])}${esc(amtLabel)}</button>`;
    })
    .join("");
  return `
    <div class="decision-surface no-print">
      <span class="decision-label">Chancellor's decision</span>
      <div class="decision-options">${btns}</div>
    </div>`;
}

// ───────────────────────────── factor card ─────────────────────────

function renderFactorCard(args: {
  row: ReconciliationRow;
  inputs: MSInputs;
  caption: CaseCaption;
  handoff: HandoffState | undefined;
  decision: MSChancellorDecision;
  avgMonths: number | null;
}): string {
  const { row, inputs, caption, handoff, decision, avgMonths } = args;
  const pill = statusPill(row.inPlay);
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";

  const obligorBlock = renderParty({
    side: "obligor",
    roleLabel: obligorRole,
    applicable: row.obligor.applicable,
    amount: row.obligor.amount,
    entry: row.obligor.entry,
    caption,
    handoff,
  });
  const obligeeBlock = renderParty({
    side: "obligee",
    roleLabel: obligeeRole,
    applicable: row.obligee.applicable,
    amount: row.obligee.amount,
    entry: row.obligee.entry,
    caption,
    handoff,
  });

  const gapAbs = Math.abs(row.gapMonthly);
  let gapBlock = "";
  if (row.inPlay === "both" || row.inPlay === "obligor_only" || row.inPlay === "obligee_only") {
    const label = row.inPlay === "both" ? "Disagreement" : "Magnitude if granted";
    const monthlyAmt =
      row.inPlay === "obligor_only"
        ? Math.abs(row.obligor.amount)
        : row.inPlay === "obligee_only"
          ? Math.abs(row.obligee.amount)
          : gapAbs;
    const cum =
      avgMonths !== null
        ? `<div><span class="gap-label">Cumulative through emancipation</span><span class="gap-cumulative">$${(monthlyAmt * avgMonths).toLocaleString("en-US")} over ${avgMonths} months</span></div>`
        : "";
    gapBlock = `
      <div class="factor-gap">
        <div><span class="gap-label">${esc(label)}</span><span class="gap-monthly">$${monthlyAmt.toLocaleString("en-US")}/mo</span></div>
        ${cum}
      </div>`;
  } else if (row.inPlay === "agree") {
    const amt = row.obligor.amount;
    const cum =
      avgMonths !== null
        ? `<div><span class="gap-label">Cumulative (agreed)</span><span class="gap-cumulative">${fmtMoneyPlain(amt * avgMonths)} over ${avgMonths} months</span></div>`
        : "";
    gapBlock = `
      <div class="factor-gap agreed-gap">
        <div><span class="gap-label">Agreed adjustment</span><span class="gap-monthly" style="color: var(--green);">${fmtMoney(amt)}/mo</span></div>
        ${cum}
      </div>`;
  }

  const decisionEl = decisionButtons(row, decision.decision);

  return `
  <div class="${cardClass(row.inPlay)}"
       data-factor="${row.letter}"
       data-obligor="${row.obligor.applicable ? row.obligor.amount : 0}"
       data-obligee="${row.obligee.applicable ? row.obligee.amount : 0}"
       data-obligor-applicable="${row.obligor.applicable ? "1" : "0"}"
       data-obligee-applicable="${row.obligee.applicable ? "1" : "0"}"
       data-in-play="${row.inPlay}"
       data-decision="${decision.decision}">
    <div class="factor-header">
      <div class="factor-letter">${row.letter}</div>
      <div class="factor-title">${esc(FACTOR_TITLES[row.letter])}</div>
      <div class="factor-status ${pill.cls}">${esc(pill.label)}</div>
    </div>
    <div class="statute-text">
      <strong>§ 43-19-103(${row.letter}):</strong> <em>${esc(FACTOR_STATUTORY_TEXT[row.letter])}</em>
    </div>
    <div class="factor-body">
      ${obligorBlock}
      ${obligeeBlock}
    </div>
    ${gapBlock}
    ${decisionEl}
  </div>`;
}

// ───────────────────────────── reconciliation table ────────────────

function renderReconciliationTable(args: {
  rows: ReconciliationRow[];
  inputs: MSInputs;
  outputs: MSOutputs;
  decisions: Record<MSFactorLetter, MSChancellorDecision>;
  avgMonths: number | null;
}): string {
  const { rows, inputs, outputs, decisions, avgMonths } = args;
  const presumptive = outputs.presumptiveMonthly;
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";

  const bodyRows = rows
    .map((r) => {
      const dec = decisions[r.letter];
      const chCell =
        r.inPlay === "neither"
          ? "—"
          : fmtMoney(decisionContribution(r, dec));
      const gap =
        r.inPlay === "both"
          ? fmtMoneyPlain(Math.abs(r.gapMonthly))
          : r.inPlay === "neither" || r.inPlay === "agree"
            ? "—"
            : fmtMoneyPlain(
                Math.abs(
                  r.obligor.applicable
                    ? r.obligor.amount
                    : r.obligee.amount,
                ),
              );
      return `
        <tr>
          <td>(${r.letter}) ${esc(r.title)}</td>
          <td>${fmtMoneyCell(r.obligor.amount, r.obligor.applicable)}</td>
          <td>${fmtMoneyCell(r.obligee.amount, r.obligee.applicable)}</td>
          <td>${gap}</td>
          <td id="cell-${r.letter}">${chCell}</td>
        </tr>`;
    })
    .join("");

  const obligorDevTotal = rows.reduce((s, r) => s + r.obligor.amount, 0);
  const obligeeDevTotal = rows.reduce((s, r) => s + r.obligee.amount, 0);
  const totals = computeChancellorTotals(rows, decisions);
  const obligorFinal = presumptive + obligorDevTotal;
  const obligeeFinal = presumptive + obligeeDevTotal;
  const chancellorFinal = presumptive + totals.totalMonthly;
  const gapFinal = Math.abs(obligorFinal - obligeeFinal);

  const cumRow =
    avgMonths !== null
      ? `
      <tr>
        <td>Cumulative through emancipation (${avgMonths} mo avg)</td>
        <td id="obligor-cumulative">$${(obligorFinal * avgMonths).toLocaleString("en-US")}</td>
        <td id="obligee-cumulative">$${(obligeeFinal * avgMonths).toLocaleString("en-US")}</td>
        <td id="gap-cumulative-bottom" style="color: var(--amber); font-weight: 600;">$${(gapFinal * avgMonths).toLocaleString("en-US")}</td>
        <td id="chancellor-cumulative"><strong>$${(chancellorFinal * avgMonths).toLocaleString("en-US")}</strong></td>
      </tr>`
      : "";

  return `
    <table class="reconciliation">
      <thead>
        <tr>
          <th>Component</th>
          <th>${esc(obligorRole)} proposes</th>
          <th>${esc(obligeeRole)} proposes</th>
          <th>Gap</th>
          <th>Chancellor's current</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Presumptive § 43-19-101 (anchor)</td><td>$${presumptive.toLocaleString("en-US")}</td><td>$${presumptive.toLocaleString("en-US")}</td><td>—</td><td>$${presumptive.toLocaleString("en-US")}</td></tr>
        ${bodyRows}
        <tr class="total">
          <td><strong>Final monthly order</strong></td>
          <td id="obligor-total"><strong>$${obligorFinal.toLocaleString("en-US")}</strong></td>
          <td id="obligee-total"><strong>$${obligeeFinal.toLocaleString("en-US")}</strong></td>
          <td id="gap-total"><strong>$${gapFinal.toLocaleString("en-US")}</strong></td>
          <td id="chancellor-total"><strong>$${chancellorFinal.toLocaleString("en-US")}</strong></td>
        </tr>
        ${cumRow}
      </tbody>
    </table>`;
}

// ───────────────────────────── authorities ─────────────────────────

function collectAuthorities(inputs: MSInputs): {
  cases: string[];
  exhibits: string[];
} {
  const cases = new Set<string>();
  const exhibits = new Set<string>();
  const collect = (slate: MSDeviation[] | undefined) => {
    if (!slate) return;
    for (const d of slate) {
      const a = d.party?.legalAuthority?.trim();
      if (a) cases.add(a);
      const docs = d.party?.documentationReferenced?.trim();
      if (docs) {
        for (const piece of docs.split(/[;\n]/)) {
          const t = piece.trim();
          if (t) exhibits.add(t);
        }
      }
    }
  };
  collect(inputs.deviationsA);
  collect(inputs.deviationsB);
  return {
    cases: Array.from(cases).sort(),
    exhibits: Array.from(exhibits).sort(),
  };
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
  --accent-soft: #8a6a40;
  --highlight: #fff6dc;
  --obligor: #2b5d8f;
  --obligor-soft: #e8eff7;
  --obligor-tint: #f4f8fc;
  --obligee: #7a3a8f;
  --obligee-soft: #f0e7f5;
  --obligee-tint: #faf6fc;
  --green: #2e7d32;
  --green-soft: #e8efe5;
  --red: #c62828;
  --amber: #d4843a;
  --statute-bg: #f4f0e5;
  --neutral-bg: #f8f6f1;
}
* { box-sizing: border-box; }
body { font-family: Georgia, "Times New Roman", serif; color: var(--ink); background: var(--paper); margin: 0; padding: 2rem 1.25rem 4rem; line-height: 1.55; font-size: 15px; }
.page { max-width: 1180px; margin: 0 auto; }
header.case-header { border-bottom: 3px solid var(--accent); padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
header.case-header h1 { margin: 0 0 .25rem 0; font-size: 1.65rem; color: var(--accent); letter-spacing: -.01em; }
header.case-header .subtitle { color: var(--ink-muted); font-style: italic; font-size: .95rem; }
.case-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem 1.5rem; margin-top: 1rem; font-size: .88rem; }
.case-meta .label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: .05em; font-size: .7rem; display: block; margin-bottom: .15rem; }
.live-bar { position: sticky; top: 0; z-index: 50; background: var(--accent); color: white; padding: .9rem 1.5rem; margin: 0 0 1.5rem 0; border-radius: 4px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.live-bar .stat { text-align: center; }
.live-bar .stat .label { text-transform: uppercase; letter-spacing: .08em; font-size: .65rem; color: rgba(255,255,255,.75); display: block; font-family: -apple-system, "Helvetica Neue", sans-serif; }
.live-bar .stat .val { font-size: 1.5rem; font-weight: bold; font-variant-numeric: tabular-nums; margin-top: .15rem; display: block; }
.live-bar .stat.primary .val { font-size: 1.85rem; }
.live-bar .stat .sub { font-size: .72rem; color: rgba(255,255,255,.7); display: block; margin-top: .15rem; }
section.module { background: var(--paper-card); border: 1px solid var(--rule); border-radius: 4px; padding: 1.35rem 1.65rem; margin-bottom: 1.25rem; }
section.module > h2 { margin: 0 0 .85rem 0; font-size: 1.18rem; color: var(--accent); border-bottom: 1px dashed var(--rule); padding-bottom: .45rem; }
section.module > h2 .module-tag { display: inline-block; background: var(--statute-bg); color: var(--accent); padding: .15rem .55rem; border-radius: 3px; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; margin-right: .65rem; vertical-align: middle; font-family: -apple-system, "Helvetica Neue", sans-serif; font-weight: 600; }
h3 { color: var(--ink); margin: 1rem 0 .4rem; font-size: 1rem; }
.formula { font-family: "Menlo", "Consolas", monospace; font-size: .82rem; background: var(--neutral-bg); padding: .55rem .8rem; border-radius: 3px; color: var(--accent); margin: .35rem 0; border: 1px solid var(--rule); line-height: 1.7; white-space: pre-wrap; }
.cite { color: var(--ink-muted); font-size: .78rem; font-style: italic; margin-top: .25rem; }
.cite::before { content: "↳ "; color: var(--accent-soft); }
.required-finding { background: #fdf3e7; border: 1px solid #d4843a; padding: .6rem .9rem; border-radius: 3px; margin: .6rem 0; font-size: .87rem; color: var(--ink); }
.required-finding::before { content: "⚖ Required written finding"; display: block; color: #a55a14; font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; margin-bottom: .25rem; font-weight: 600; }
.factor { border: 1px solid var(--rule); border-radius: 6px; background: white; margin: .9rem 0; overflow: hidden; }
.factor.in-dispute { border-color: var(--amber); border-width: 2px; }
.factor.agreed { border-color: var(--green); }
.factor.not-asserted { opacity: .55; }
.factor-header { background: var(--neutral-bg); padding: .65rem 1rem; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 1rem; }
.factor-letter { background: var(--accent); color: white; width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: -apple-system, "Helvetica Neue", sans-serif; font-weight: 700; font-size: .9rem; flex-shrink: 0; }
.factor-title { flex: 1; font-weight: 600; color: var(--accent); font-size: .98rem; }
.factor-status { font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; padding: .2rem .55rem; border-radius: 3px; }
.factor-status.in-dispute { background: #fdf3e7; color: #a55a14; }
.factor-status.agreed { background: var(--green-soft); color: var(--green); }
.factor-status.obligor-only { background: var(--obligor-soft); color: var(--obligor); }
.factor-status.obligee-only { background: var(--obligee-soft); color: var(--obligee); }
.factor-status.not-asserted { background: #ececea; color: var(--ink-muted); }
.statute-text { background: var(--statute-bg); padding: .65rem 1rem; border-bottom: 1px solid var(--rule); font-size: .88rem; color: var(--ink-soft); }
.statute-text strong { color: var(--accent); font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; margin-right: .4rem; }
.statute-text em { font-style: italic; color: var(--ink); }
.factor-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.position { padding: .85rem 1rem; }
.position.obligor { background: var(--obligor-tint); border-right: 1px solid var(--rule); }
.position.obligee { background: var(--obligee-tint); }
.position-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .5rem; padding-bottom: .35rem; border-bottom: 1px dotted var(--rule); gap: .75rem; }
.position-header .party { font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; flex: 1; }
.position.obligor .party { color: var(--obligor); }
.position.obligee .party { color: var(--obligee); }
.position-header .amount { font-weight: 700; font-variant-numeric: tabular-nums; font-size: .95rem; white-space: nowrap; }
.position-header .amount.negative { color: var(--green); }
.position-header .amount.positive { color: var(--red); }
.position-header .amount.neutral { color: var(--ink-muted); }
.position-narrative { margin: .5rem 0; font-size: .9rem; line-height: 1.55; color: var(--ink); }
.position-narrative.empty { color: var(--ink-muted); font-style: italic; font-size: .85rem; }
.amendment-note { margin-top: .35rem; padding: .3rem .55rem; background: #fff8e6; border-left: 3px solid var(--amber); font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .75rem; color: #8a5a14; border-radius: 2px; }
.position-meta { font-size: .8rem; margin-top: .55rem; padding-top: .45rem; border-top: 1px dotted var(--rule); }
.position-meta dt { color: var(--ink-muted); font-family: -apple-system, "Helvetica Neue", sans-serif; text-transform: uppercase; font-size: .68rem; letter-spacing: .05em; margin-top: .4rem; margin-bottom: .15rem; }
.position-meta dd { margin: 0; color: var(--ink-soft); }
.factor-gap { background: #fffbf0; border-top: 1px solid var(--rule); padding: .6rem 1rem; font-size: .85rem; color: var(--ink-soft); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.factor-gap .gap-label { font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-muted); margin-right: .35rem; }
.factor-gap .gap-monthly { font-weight: 700; color: var(--amber); font-variant-numeric: tabular-nums; }
.factor-gap .gap-cumulative { color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.decision-surface { border-top: 1px solid var(--rule); background: white; padding: .65rem 1rem; display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; }
.decision-surface .decision-label { font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-muted); margin-right: .4rem; }
.decision-options { display: flex; gap: .35rem; flex-wrap: wrap; }
.decision-btn { background: white; border: 1px solid var(--rule); border-radius: 3px; padding: .35rem .7rem; font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .82rem; cursor: pointer; color: var(--ink-soft); transition: all .15s; }
.decision-btn:hover { border-color: var(--accent); color: var(--accent); }
.decision-btn.selected { background: var(--accent); color: white; border-color: var(--accent); font-weight: 600; }
.decision-btn.decision-decline.selected { background: var(--ink-soft); border-color: var(--ink-soft); }
.decision-btn.decision-adopt_obligor.selected { background: var(--obligor); border-color: var(--obligor); }
.decision-btn.decision-adopt_obligee.selected { background: var(--obligee); border-color: var(--obligee); }
.decision-btn.decision-split.selected { background: var(--amber); border-color: var(--amber); }
.decision-btn.decision-accept_agreed.selected { background: var(--green); border-color: var(--green); }
table.reconciliation { width: 100%; border-collapse: collapse; margin: .6rem 0; font-size: .88rem; font-variant-numeric: tabular-nums; }
table.reconciliation th, table.reconciliation td { padding: .5rem .75rem; border-bottom: 1px solid var(--rule); }
table.reconciliation th { background: var(--statute-bg); color: var(--accent); font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; text-align: right; font-weight: 600; }
table.reconciliation th:first-child, table.reconciliation td:first-child { text-align: left; }
table.reconciliation th:not(:first-child), table.reconciliation td:not(:first-child) { text-align: right; }
table.reconciliation tr.total td { background: var(--highlight); font-weight: 700; border-top: 2px solid var(--accent); border-bottom: 2px solid var(--accent); }
.final-output { background: var(--accent); color: white; padding: 1.5rem 2rem; border-radius: 4px; margin: 1.25rem 0; text-align: center; }
.final-output .label { text-transform: uppercase; letter-spacing: .1em; font-size: .78rem; color: rgba(255,255,255,.85); }
.final-output .amount { font-size: 2.5rem; font-weight: bold; margin: .4rem 0; font-variant-numeric: tabular-nums; }
.final-output .cumulative { font-size: .95rem; color: rgba(255,255,255,.85); margin-top: .65rem; }
.pending-banner { background: #fff8e6; border: 1px solid var(--amber); padding: .55rem .8rem; border-radius: 3px; margin: .5rem 0; font-size: .85rem; color: #8a5a14; }
footer.authorities { margin-top: 2rem; padding-top: 1rem; border-top: 2px solid var(--accent); font-size: .82rem; color: var(--ink-soft); }
footer.authorities h3 { color: var(--accent); margin-top: 0; }
footer.authorities ul { padding-left: 1.4rem; }
footer.authorities li { margin-bottom: .25rem; }
.audience-note { background: var(--statute-bg); border-left: 4px solid var(--accent); padding: .85rem 1rem; margin: 1rem 0; font-size: .9rem; color: var(--ink-soft); border-radius: 0 4px 4px 0; }
.audience-note strong { color: var(--accent); }
@media (max-width: 800px) {
  .factor-body { grid-template-columns: 1fr; }
  .position.obligor { border-right: none; border-bottom: 1px solid var(--rule); }
  .live-bar { grid-template-columns: 1fr; gap: .5rem; }
  .case-meta { grid-template-columns: repeat(2, 1fr); }
}
@media print {
  body { background: white; padding: .5in; font-size: 10pt; }
  .live-bar { position: static; box-shadow: none; }
  .no-print { display: none !important; }
  section.module { page-break-inside: avoid; border: none; padding: .5rem 0; }
  .factor { page-break-inside: avoid; }
}
`;

// ───────────────────────────── interactive JS ──────────────────────

const SCRIPT = `
(function () {
  var factors = Array.from(document.querySelectorAll('.factor'));
  var avgMonths = parseInt(document.body.dataset.avgMonths, 10);
  if (isNaN(avgMonths)) avgMonths = 0;
  var presumptive = parseInt(document.body.dataset.presumptive, 10) || 0;

  function contribution(f) {
    var obligor = parseFloat(f.dataset.obligor) || 0;
    var obligee = parseFloat(f.dataset.obligee) || 0;
    var oApp = f.dataset.obligorApplicable === '1';
    var eApp = f.dataset.obligeeApplicable === '1';
    var dec = f.dataset.decision;
    switch (dec) {
      case 'adopt_obligor': return oApp ? obligor : 0;
      case 'adopt_obligee': return eApp ? obligee : 0;
      case 'accept_agreed': return oApp ? obligor : eApp ? obligee : 0;
      case 'split':
        if (oApp && eApp) return Math.round((obligor + obligee) / 2);
        if (oApp) return Math.round(obligor / 2);
        if (eApp) return Math.round(obligee / 2);
        return 0;
      case 'decline':
      case 'none':
      default: return 0;
    }
  }

  function fmt(n) {
    if (n === 0) return '$0';
    var abs = Math.abs(Math.round(n)).toLocaleString('en-US');
    return n < 0 ? '\u2212$' + abs : '+$' + abs;
  }

  function recompute() {
    var totalDev = 0;
    var oblTotal = 0;
    var oblEeTotal = 0;
    var pending = 0;
    var active = 0;
    factors.forEach(function (f) {
      var inPlay = f.dataset.inPlay;
      var oApp = f.dataset.obligorApplicable === '1';
      var eApp = f.dataset.obligeeApplicable === '1';
      var obligor = parseFloat(f.dataset.obligor) || 0;
      var obligee = parseFloat(f.dataset.obligee) || 0;
      if (oApp) oblTotal += obligor;
      if (eApp) oblEeTotal += obligee;
      var c = contribution(f);
      totalDev += c;
      if (inPlay !== 'neither') {
        active += 1;
        if (f.dataset.decision === 'none') pending += 1;
      }
      var cell = document.getElementById('cell-' + f.dataset.factor);
      if (cell) cell.textContent = (inPlay === 'neither') ? '\u2014' : fmt(c);
    });
    var obligorFinal = presumptive + oblTotal;
    var obligeeFinal = presumptive + oblEeTotal;
    var chancellorFinal = presumptive + totalDev;
    var gap = Math.abs(obligorFinal - obligeeFinal);

    function set(id, val) { var el = document.getElementById(id); if (el) el.innerHTML = val; }
    set('obligor-total', '<strong>$' + obligorFinal.toLocaleString('en-US') + '</strong>');
    set('obligee-total', '<strong>$' + obligeeFinal.toLocaleString('en-US') + '</strong>');
    set('gap-total', '<strong>$' + gap.toLocaleString('en-US') + '</strong>');
    set('chancellor-total', '<strong>$' + chancellorFinal.toLocaleString('en-US') + '</strong>');

    if (avgMonths > 0) {
      set('obligor-cumulative', '$' + (obligorFinal * avgMonths).toLocaleString('en-US'));
      set('obligee-cumulative', '$' + (obligeeFinal * avgMonths).toLocaleString('en-US'));
      set('gap-cumulative-bottom', '$' + (gap * avgMonths).toLocaleString('en-US'));
      set('chancellor-cumulative', '<strong>$' + (chancellorFinal * avgMonths).toLocaleString('en-US') + '</strong>');
      var cumEl = document.getElementById('live-cumulative');
      if (cumEl) cumEl.textContent = '$' + (chancellorFinal * avgMonths).toLocaleString('en-US');
      var fcEl = document.getElementById('final-cumulative');
      if (fcEl) fcEl.textContent = '$' + (chancellorFinal * avgMonths).toLocaleString('en-US');
    }
    var fo = document.getElementById('final-order');
    if (fo) fo.textContent = '$' + chancellorFinal.toLocaleString('en-US') + '/mo';
    var fa = document.getElementById('final-amount');
    if (fa) fa.textContent = '$' + chancellorFinal.toLocaleString('en-US') + ' / month';

    var pb = document.getElementById('pending-banner');
    if (pb) {
      if (pending > 0) {
        pb.style.display = '';
        pb.textContent = pending + ' of ' + active + ' contested factor' + (active === 1 ? '' : 's') + ' awaiting a chancellor decision.';
      } else {
        pb.style.display = 'none';
      }
    }
  }

  factors.forEach(function (factor) {
    var buttons = factor.querySelectorAll('.decision-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        factor.dataset.decision = btn.dataset.action;
        recompute();
      });
    });
  });

  recompute();
})();
`;

// ───────────────────────────── main renderer ───────────────────────

export function renderMSBehindTheScenesHtml(args: {
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
  const totals = computeChancellorTotals(report.rows, decisions);
  const chancellorFinal = outputs.presumptiveMonthly + totals.totalMonthly;
  const cumulative = avgMonths !== null ? chancellorFinal * avgMonths : null;
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";

  const factorCards = report.rows
    .map((row) =>
      renderFactorCard({
        row,
        inputs,
        caption,
        handoff,
        decision: decisions[row.letter],
        avgMonths,
      }),
    )
    .join("\n");

  const reconciliation = renderReconciliationTable({
    rows: report.rows,
    inputs,
    outputs,
    decisions,
    avgMonths,
  });

  const authorities = collectAuthorities(inputs);
  const caseList =
    authorities.cases.length > 0
      ? `<h4 style="color: var(--accent); margin-top: 1rem;">Case authorities cited by counsel</h4><ul>${authorities.cases
          .map((c) => `<li>${esc(c)}</li>`)
          .join("")}</ul>`
      : "";
  const exhibitList =
    authorities.exhibits.length > 0
      ? `<h4 style="color: var(--accent); margin-top: 1rem;">Documentation index</h4><ul style="columns: 2;">${authorities.exhibits
          .map((x) => `<li>${esc(x)}</li>`)
          .join("")}</ul>`
      : "";

  const childCount = inputs.numChildren;
  const childAgesStr =
    inputs.childAges.length > 0 ? ` (ages ${inputs.childAges.join(", ")})` : "";

  const highIncomeFinding = outputs.requiresFindingHighIncome
    ? `<div class="required-finding"><strong>Annual AGI exceeds the high-income threshold of § 43-19-101(4).</strong> The court must make a written finding as to whether application of the guideline percentage is reasonable in this case.</div>`
    : "";

  const pending = totals.pendingCount;
  const active = totals.activeCount;
  const pendingBanner = `<div id="pending-banner" class="pending-banner" ${pending > 0 ? "" : 'style="display:none"'}>${pending} of ${active} contested factor${active === 1 ? "" : "s"} awaiting a chancellor decision.</div>`;

  const title = caption.matterName
    ? `${caption.matterName} — MS § 43-19-103 Deviation Worksheet`
    : "MS § 43-19-103 Deviation Worksheet";

  const handoffFooter =
    handoff && handoff.status !== "none"
      ? `<p style="margin-top: 1rem; font-size: .78rem; color: var(--ink-muted); font-style: italic;">Two-attorney handoff — round ${handoff.handoffRound}. Originating counsel: ${esc(handoff.originatingAttorney?.name || "(unnamed)")}${handoff.originatingAttorney?.firm ? ` (${esc(handoff.originatingAttorney.firm)})` : ""}. Receiving counsel: ${esc(handoff.receivingAttorney?.name || "(unnamed)")}${handoff.receivingAttorney?.firm ? ` (${esc(handoff.receivingAttorney.firm)})` : ""}.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body data-presumptive="${outputs.presumptiveMonthly}" data-avg-months="${avgMonths ?? 0}">
<div class="page">

<header class="case-header">
  <h1>§ 43-19-103 Deviation Worksheet — Behind the Scenes</h1>
  <div class="subtitle">${esc(caption.matterName || "Mississippi child support deviation analysis")} — structured statement of both parties' positions and the chancellor's running decisions.</div>
  <div class="case-meta">
    ${caption.docketNumber ? `<div><span class="label">Docket no.</span>${esc(caption.docketNumber)}</div>` : ""}
    <div><span class="label">Computation date</span>${todayISO()}</div>
    <div><span class="label">Children</span>${childCount}${esc(childAgesStr)}</div>
    ${caption.court ? `<div><span class="label">Court</span>${esc(caption.court)}</div>` : ""}
    <div><span class="label">Obligor</span>${esc(obligorRole)}</div>
    <div><span class="label">Obligee</span>${esc(obligeeRole)}</div>
    ${caption.preparedBy ? `<div><span class="label">Prepared by</span>${esc(caption.preparedBy)}</div>` : ""}
    <div><span class="label">Statutory framework</span>Miss. Code Ann. § 43-19-101, -103</div>
  </div>
</header>

<div class="live-bar">
  <div class="stat">
    <span class="label">Presumptive (§ 43-19-101)</span>
    <span class="val">$${outputs.presumptiveMonthly.toLocaleString("en-US")}/mo</span>
    <span class="sub">${(outputs.statutoryPercentage * 100).toFixed(0)}% × $${Math.round(outputs.monthlyAGI).toLocaleString("en-US")} AGI · ${childCount} child${childCount === 1 ? "" : "ren"}</span>
  </div>
  <div class="stat primary">
    <span class="label">Final order under current decisions</span>
    <span class="val" id="final-order">$${chancellorFinal.toLocaleString("en-US")}/mo</span>
    <span class="sub">${esc(obligorRole)} → ${esc(obligeeRole)} · monthly</span>
  </div>
  <div class="stat">
    <span class="label">Cumulative through emancipation</span>
    <span class="val" id="live-cumulative">${cumulative !== null ? `$${cumulative.toLocaleString("en-US")}` : "—"}</span>
    <span class="sub">${avgMonths !== null ? `avg ${avgMonths} months remaining` : "child ages not provided"}</span>
  </div>
</div>

${pendingBanner}

<div class="audience-note">
  <strong>Reading this document.</strong> The presumptive monthly amount under Miss. Code Ann. § 43-19-101 is fixed at $${outputs.presumptiveMonthly.toLocaleString("en-US")}. Below that, each of the ten enumerated deviation factors in § 43-19-103 is presented with the statute verbatim, both parties' positions side-by-side, and a chancellor's decision surface. Toggle a decision in any factor to see the final order at the top update in real time.
</div>

<section class="module">
  <h2><span class="module-tag">Module 1</span>The Presumptive Amount — § 43-19-101</h2>
  ${highIncomeFinding}
  <h3>Presumptive monthly support (${childCount} child${childCount === 1 ? "" : "ren"})</h3>
  <div class="formula">Adjusted Gross Income × statutory percentage = monthly presumptive support
$${Math.round(outputs.monthlyAGI).toLocaleString("en-US")} × ${(outputs.statutoryPercentage * 100).toFixed(0)}% = <strong>$${outputs.presumptiveMonthly.toLocaleString("en-US")} / month</strong></div>
  <div class="cite">§ 43-19-101(1). Annualized AGI: $${Math.round(outputs.annualAGI).toLocaleString("en-US")}. Guidelines effective ${esc(outputs.guidelinesEffectiveDate)}.</div>
  ${avgMonths !== null ? `<h3>Cumulative-through-emancipation projection</h3><div class="formula">Average remaining months across ${inputs.childAges.length || childCount} child${(inputs.childAges.length || childCount) === 1 ? "" : "ren"}: ${avgMonths}\nAt presumptive of $${outputs.presumptiveMonthly.toLocaleString("en-US")}/month × ${avgMonths} months = <strong>$${(outputs.presumptiveMonthly * avgMonths).toLocaleString("en-US")} cumulative</strong></div><div class="cite">Miss. Code Ann. § 93-11-65(8). Age-21 default unless a carve-out applies (marriage, military service, qualifying felony, full-time school discontinuance).</div>` : ""}
</section>

<section class="module">
  <h2><span class="module-tag">Module 2</span>Statutory Deviation Analysis — § 43-19-103</h2>
  <p>The rebuttable presumption of § 43-19-101 may be overcome by a written finding under § 43-19-103 that application of the guideline percentage would be unjust or inappropriate, based on the ten enumerated criteria. Each factor below shows: the statute verbatim, both parties' positions in their own counsel's words, supporting facts and documentation, proposed dollar adjustments, and the chancellor's decision surface.</p>
  ${factorCards}
</section>

<section class="module">
  <h2><span class="module-tag">Module 3</span>Reconciliation — Both Sides' Bottom Lines</h2>
  ${reconciliation}
  <p style="font-size: .87rem; color: var(--ink-soft); margin-top: .75rem;">The "gap" column quantifies the dollar magnitude of every factor in dispute. The chancellor's column shows the running total based on the current decision selections above. Toggle any decision to see all totals update.</p>
</section>

<div class="final-output">
  <div class="label">Final Order under current decisions — ${esc(obligorRole)} to ${esc(obligeeRole)}</div>
  <div class="amount" id="final-amount">$${chancellorFinal.toLocaleString("en-US")} / month</div>
  ${cumulative !== null ? `<div class="cumulative">Cumulative through emancipation: <strong><span id="final-cumulative">$${cumulative.toLocaleString("en-US")}</span></strong> over an average of ${avgMonths} months remaining</div>` : ""}
</div>

<footer class="authorities">
  <h3>Source Authorities</h3>
  <h4 style="color: var(--accent); margin-top: 1rem;">Statutes</h4>
  <ul>
    <li><strong>Miss. Code Ann. § 43-19-101</strong> — Child support guideline (presumptive percentage, AGI computation, $10k/$100k written-finding thresholds, medical support).</li>
    <li><strong>Miss. Code Ann. § 43-19-101(5)</strong> (HB 1067, eff. 2022-07-01) — Imputation framework with specific factor list.</li>
    <li><strong>Miss. Code Ann. § 43-19-103</strong> — Ten criteria for overcoming the presumption.</li>
    <li><strong>Miss. Code Ann. § 43-19-36</strong> (SB 2082, eff. 2023-07-01) — Suspension of obligation during 180+ day incarceration.</li>
    <li><strong>Miss. Code Ann. § 93-11-65(8)</strong> — Age-21 emancipation default and carve-outs.</li>
  </ul>
  ${caseList}
  ${exhibitList}
  ${handoffFooter}
  <p style="margin-top: 1.25rem; font-style: italic; color: var(--ink-muted);">This document is a structured statement of both parties' positions on the § 43-19-103 deviation analysis, produced by the calculator at csg.tcblaw.org/ms. The presumptive amount, the gap quantification, and the chancellor's-decision logic are mechanical; the positions, supporting facts, legal authority, and the chancellor's ultimate ruling are matters of judgment that the document captures but does not predetermine.</p>
</footer>

</div>
<script>${SCRIPT}</script>
</body>
</html>`;
}

/** Browser-side helper — trigger download of the Behind the Scenes HTML. */
export function downloadMSBehindTheScenesHtml(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  handoff?: HandoffState;
  filename?: string;
}) {
  const html = renderMSBehindTheScenesHtml(args);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = args.filename ?? behindTheScenesFilename(args.caption);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
