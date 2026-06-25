/**
 * Phase 4 — Slice 2
 * MS § 43-19-103 Deviation Memorandum (PDF, @react-pdf/renderer).
 *
 * Static, print-ready mirror of the Slice 1 Behind the Scenes HTML, with
 * the interactive decision surface baked to the chancellor's current
 * selections. Same statutory framework, same per-position D-017
 * attribution, same reconciliation math; the PDF is the filing-ready
 * artifact, the HTML is the interactive worksheet.
 *
 * Bundle discipline (D-007): this module — and @react-pdf/renderer
 * itself — must NEVER be imported at module scope from a route or any
 * file pulled into the initial bundle. Always dynamic-import via the
 * download helper at the bottom of this file from a user event handler.
 *
 * Page: US Letter, 0.5" margins (canonical §5; matches the HTML @page).
 * Filename: MS_Deviation_Memorandum_[MatterSlug]_[YYYY-MM-DD].pdf
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type {
  MSInputs,
  MSOutputs,
  MSFactorLetter,
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
  decisionContribution,
  type MSChancellorDecision,
  type MSChancellorDecisionKind,
} from "@/lib/calc/ms/chancellor-decisions";

// ─────────────────────────── style tokens ───────────────────────────
// Tokens mirror the HTML CSS variables so the two artifacts read as the
// same document in different media.

const TOKEN = {
  ink: "#1a1a1a",
  inkSoft: "#444444",
  inkMuted: "#6b6b6b",
  paper: "#faf8f3",
  paperCard: "#ffffff",
  rule: "#d8d3c4",
  accent: "#5a3a14",
  accentSoft: "#8a6a40",
  highlight: "#fff6dc",
  obligor: "#2b5d8f",
  obligorTint: "#f4f8fc",
  obligee: "#7a3a8f",
  obligeeTint: "#faf6fc",
  green: "#2e7d32",
  greenSoft: "#e8efe5",
  red: "#c62828",
  amber: "#d4843a",
  statuteBg: "#f4f0e5",
  neutralBg: "#f8f6f1",
};

// Use bundled core fonts only (Helvetica + Times) — no remote font fetch
// at render time. @react-pdf ships these as built-ins.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36, // 0.5 in
    paddingBottom: 48,
    paddingLeft: 36,
    paddingRight: 36,
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: TOKEN.ink,
    lineHeight: 1.45,
  },
  // header
  h1: { fontSize: 16, color: TOKEN.accent, fontFamily: "Times-Bold" },
  subtitle: {
    fontSize: 9.5,
    color: TOKEN.inkMuted,
    fontStyle: "italic",
    marginTop: 2,
    marginBottom: 8,
  },
  headerRule: {
    borderBottomWidth: 2,
    borderBottomColor: TOKEN.accent,
    marginBottom: 10,
  },
  // meta grid
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  metaCell: { width: "25%", marginBottom: 4, paddingRight: 6 },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 9, color: TOKEN.ink },
  // live bar (snapshot, not interactive)
  liveBar: {
    backgroundColor: TOKEN.accent,
    color: "#ffffff",
    padding: 10,
    borderRadius: 3,
    flexDirection: "row",
    marginBottom: 12,
  },
  stat: { flex: 1, paddingHorizontal: 6 },
  statLabel: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: "#e8dccc",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#ffffff",
    marginTop: 2,
  },
  statValPrimary: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: "#ffffff",
    marginTop: 2,
  },
  statSub: { fontSize: 7, color: "#e8dccc", marginTop: 2 },
  // modules
  module: {
    borderWidth: 1,
    borderColor: TOKEN.rule,
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
    backgroundColor: TOKEN.paperCard,
  },
  moduleTitle: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: TOKEN.accent,
    borderBottomWidth: 0.5,
    borderBottomColor: TOKEN.rule,
    paddingBottom: 4,
    marginBottom: 6,
  },
  moduleTag: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.accent,
    backgroundColor: TOKEN.statuteBg,
    padding: 2,
    marginRight: 4,
  },
  formula: {
    fontFamily: "Courier",
    fontSize: 8.5,
    backgroundColor: TOKEN.neutralBg,
    borderWidth: 0.5,
    borderColor: TOKEN.rule,
    padding: 5,
    marginVertical: 3,
    color: TOKEN.accent,
  },
  cite: {
    fontSize: 7.5,
    color: TOKEN.inkMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  // factor card
  factor: {
    borderWidth: 1,
    borderColor: TOKEN.rule,
    borderRadius: 3,
    marginVertical: 4,
    backgroundColor: "#ffffff",
  },
  factorInDispute: { borderWidth: 1.5, borderColor: TOKEN.amber },
  factorAgreed: { borderColor: TOKEN.green },
  factorNotAsserted: { opacity: 0.6 },
  factorHeader: {
    backgroundColor: TOKEN.neutralBg,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: TOKEN.rule,
    flexDirection: "row",
    alignItems: "center",
  },
  factorLetterBadge: {
    backgroundColor: TOKEN.accent,
    color: "#ffffff",
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingTop: 2,
    marginRight: 6,
  },
  factorTitle: {
    flex: 1,
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    color: TOKEN.accent,
  },
  factorStatusPill: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statute: {
    backgroundColor: TOKEN.statuteBg,
    padding: 6,
    fontSize: 8.5,
    color: TOKEN.inkSoft,
    borderBottomWidth: 0.5,
    borderBottomColor: TOKEN.rule,
  },
  statuteTag: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: TOKEN.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statuteText: { fontStyle: "italic", color: TOKEN.ink },
  factorBody: { flexDirection: "row" },
  positionObligor: {
    flex: 1,
    backgroundColor: TOKEN.obligorTint,
    borderRightWidth: 0.5,
    borderRightColor: TOKEN.rule,
    padding: 6,
  },
  positionObligee: {
    flex: 1,
    backgroundColor: TOKEN.obligeeTint,
    padding: 6,
  },
  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: TOKEN.rule,
    paddingBottom: 3,
    marginBottom: 4,
  },
  partyObligor: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.obligor,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  partyObligee: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.obligee,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  amount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: TOKEN.ink,
  },
  amountNeg: { color: TOKEN.green },
  amountPos: { color: TOKEN.red },
  amountNeutral: { color: TOKEN.inkMuted },
  narrative: { fontSize: 8.5, color: TOKEN.ink, marginTop: 2 },
  narrativeEmpty: { fontStyle: "italic", color: TOKEN.inkMuted },
  amendmentNote: {
    marginTop: 3,
    padding: 3,
    backgroundColor: "#fff8e6",
    borderLeftWidth: 2,
    borderLeftColor: TOKEN.amber,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: "#8a5a14",
  },
  metaPair: { marginTop: 3 },
  metaPairLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: TOKEN.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaPairValue: { fontSize: 8, color: TOKEN.inkSoft },
  decisionStrip: {
    backgroundColor: TOKEN.highlight,
    borderTopWidth: 0.5,
    borderTopColor: TOKEN.rule,
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  decisionStripLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginRight: 4,
  },
  decisionStripValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: TOKEN.accent,
  },
  gapStrip: {
    backgroundColor: "#fffbf0",
    borderTopWidth: 0.5,
    borderTopColor: TOKEN.rule,
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // reconciliation
  table: {
    borderWidth: 0.5,
    borderColor: TOKEN.rule,
    marginVertical: 4,
  },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: TOKEN.rule },
  th: {
    flex: 1,
    backgroundColor: TOKEN.statuteBg,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: TOKEN.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "right",
  },
  thFirst: { flex: 2, textAlign: "left" },
  td: {
    flex: 1,
    padding: 4,
    fontSize: 8.5,
    textAlign: "right",
    color: TOKEN.ink,
  },
  tdFirst: { flex: 2, textAlign: "left" },
  trTotal: {
    flexDirection: "row",
    backgroundColor: TOKEN.highlight,
    borderTopWidth: 1,
    borderTopColor: TOKEN.accent,
    borderBottomWidth: 1,
    borderBottomColor: TOKEN.accent,
  },
  tdTotal: {
    flex: 1,
    padding: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: TOKEN.ink,
  },
  tdTotalFirst: { flex: 2, textAlign: "left" },
  // final box
  finalBox: {
    backgroundColor: TOKEN.accent,
    color: "#ffffff",
    padding: 14,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  finalLabel: {
    color: "#e8dccc",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  finalAmount: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginVertical: 4,
  },
  finalCum: { color: "#e8dccc", fontSize: 9 },
  // pending banner
  pendingBanner: {
    backgroundColor: "#fff8e6",
    borderWidth: 0.5,
    borderColor: TOKEN.amber,
    padding: 5,
    marginBottom: 6,
    fontSize: 8.5,
    color: "#8a5a14",
  },
  // authorities footer
  authorities: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: TOKEN.accent,
  },
  authoritiesTitle: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: TOKEN.accent,
    marginBottom: 4,
  },
  authoritySub: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    color: TOKEN.accent,
    marginTop: 6,
    marginBottom: 2,
  },
  bullet: { fontSize: 8.5, color: TOKEN.inkSoft, marginBottom: 2 },
  disclaimer: {
    marginTop: 10,
    fontSize: 8,
    color: TOKEN.inkMuted,
    fontStyle: "italic",
  },
  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 7,
    color: TOKEN.inkMuted,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: TOKEN.rule,
    paddingTop: 4,
  },
});

// ─────────────────────────── helpers ───────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

export function memoFilename(caption: CaseCaption): string {
  return `MS_Deviation_Memorandum_${slugMatter(caption.matterName)}_${todayISO()}.pdf`;
}

function fmtMoneySigned(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  if (n === 0) return "$0";
  return n < 0 ? `\u2212$${abs}` : `+$${abs}`;
}

function fmtMoneyPlain(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  return n < 0 ? `\u2212$${abs}` : `$${abs}`;
}

function fmtMoneyCell(n: number, applicable: boolean): string {
  if (!applicable) return "\u2014";
  return fmtMoneySigned(n);
}

// D-017 attribution — mirrors the HTML helper exactly.
// Single-user column header \u2014 "Per counsel for {role} \u2014 {preparer}" from the
// case caption's preparedBy (the worksheet's pre-handoff behavior). The
// two-attorney round / authored-by amendment attribution was removed with the
// handoff feature.
function attributionFor(args: {
  roleLabel: string;
  caption: CaseCaption;
}): { header: string; amendmentLine: string | null } {
  const { roleLabel, caption } = args;
  const preparer = caption.preparedBy?.trim() || "";
  const header = preparer
    ? `Per counsel for ${roleLabel} \u2014 ${preparer}`
    : `Per counsel for ${roleLabel}`;
  return { header, amendmentLine: null };
}

const STATUS_PILL: Record<
  FactorInPlay,
  { label: string; bg: string; fg: string }
> = {
  agree: { label: "Agreed", bg: TOKEN.greenSoft, fg: TOKEN.green },
  both: { label: "Disputed", bg: "#fdf3e7", fg: "#a55a14" },
  obligor_only: { label: "Obligor only", bg: "#e8eff7", fg: TOKEN.obligor },
  obligee_only: { label: "Obligee only", bg: "#f0e7f5", fg: TOKEN.obligee },
  neither: { label: "Not asserted", bg: "#ececea", fg: TOKEN.inkMuted },
};

const DECISION_LABEL: Record<MSChancellorDecisionKind, string> = {
  none: "Pending",
  adopt_obligor: "Adopt Obligor",
  adopt_obligee: "Adopt Obligee",
  split: "Split difference",
  custom: "Custom",
  decline: "No deviation",
  accept_agreed: "Accept agreed",
};

function decisionFactorStyle(inPlay: FactorInPlay) {
  switch (inPlay) {
    case "both":
      return [styles.factor, styles.factorInDispute];
    case "agree":
      return [styles.factor, styles.factorAgreed];
    case "neither":
      return [styles.factor, styles.factorNotAsserted];
    default:
      return [styles.factor];
  }
}

// ─────────────────────────── party block ───────────────────────────

function PartyBlock({
  side,
  roleLabel,
  applicable,
  amount,
  entry,
  caption,
}: {
  side: "obligor" | "obligee";
  roleLabel: string;
  applicable: boolean;
  amount: number;
  entry: MSDeviation | undefined;
  caption: CaseCaption;
}) {
  const party = entry?.party;
  const { header, amendmentLine } = attributionFor({ roleLabel, caption });

  const partyStyle = side === "obligor" ? styles.partyObligor : styles.partyObligee;
  const containerStyle =
    side === "obligor" ? styles.positionObligor : styles.positionObligee;

  if (!applicable) {
    return (
      <View style={containerStyle}>
        <View style={styles.positionHeader}>
          <Text style={partyStyle}>{header}</Text>
          <Text style={[styles.amount, styles.amountNeutral]}>—</Text>
        </View>
        <Text style={[styles.narrative, styles.narrativeEmpty]}>
          Not asserted by this party.
        </Text>
      </View>
    );
  }

  const amtStyle =
    amount < 0
      ? [styles.amount, styles.amountNeg]
      : amount > 0
        ? [styles.amount, styles.amountPos]
        : [styles.amount, styles.amountNeutral];
  const amtText = amount === 0 ? "$0" : `${fmtMoneySigned(amount)}/mo`;

  const facts = party?.factsAsserted || entry?.description || "";
  const docs = party?.documentationReferenced || "";
  const authority = party?.legalAuthority || "";

  return (
    <View style={containerStyle}>
      <View style={styles.positionHeader}>
        <Text style={partyStyle}>{header}</Text>
        <Text style={amtStyle}>{amtText}</Text>
      </View>
      {facts ? (
        <Text style={styles.narrative}>{facts}</Text>
      ) : (
        <Text style={[styles.narrative, styles.narrativeEmpty]}>
          No narrative provided.
        </Text>
      )}
      {amendmentLine && (
        <Text style={styles.amendmentNote}>{amendmentLine}</Text>
      )}
      {docs && (
        <View style={styles.metaPair}>
          <Text style={styles.metaPairLabel}>Documentation</Text>
          <Text style={styles.metaPairValue}>{docs}</Text>
        </View>
      )}
      {authority && (
        <View style={styles.metaPair}>
          <Text style={styles.metaPairLabel}>Legal authority</Text>
          <Text style={styles.metaPairValue}>{authority}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────── factor card ───────────────────────────

function FactorCard({
  row,
  inputs,
  caption,
  decision,
  avgMonths,
}: {
  row: ReconciliationRow;
  inputs: MSInputs;
  caption: CaseCaption;
  decision: MSChancellorDecision;
  avgMonths: number | null;
}) {
  const pill = STATUS_PILL[row.inPlay];
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";
  const contribution = decisionContribution(row, decision);

  const decisionText =
    decision.decision === "none"
      ? "Pending — no decision recorded"
      : `${DECISION_LABEL[decision.decision]} \u2192 ${fmtMoneySigned(contribution)}/mo`;

  let gapBlock: ReactElement | null = null;
  if (row.inPlay === "both") {
    const cum =
      avgMonths !== null
        ? ` \u00b7 cumulative $${(Math.abs(row.gapMonthly) * avgMonths).toLocaleString("en-US")} over ${avgMonths} mo`
        : "";
    gapBlock = (
      <View style={styles.gapStrip}>
        <Text style={{ fontSize: 7.5, color: TOKEN.inkMuted, fontFamily: "Helvetica-Bold" }}>DISAGREEMENT</Text>
        <Text style={{ fontSize: 8.5, color: TOKEN.amber, fontFamily: "Helvetica-Bold" }}>
          ${Math.abs(row.gapMonthly).toLocaleString("en-US")}/mo{cum}
        </Text>
      </View>
    );
  } else if (row.inPlay === "agree") {
    const amt = row.obligor.amount;
    const cum =
      avgMonths !== null
        ? ` \u00b7 cumulative ${fmtMoneyPlain(amt * avgMonths)} over ${avgMonths} mo`
        : "";
    gapBlock = (
      <View style={styles.gapStrip}>
        <Text style={{ fontSize: 7.5, color: TOKEN.inkMuted, fontFamily: "Helvetica-Bold" }}>AGREED ADJUSTMENT</Text>
        <Text style={{ fontSize: 8.5, color: TOKEN.green, fontFamily: "Helvetica-Bold" }}>
          {fmtMoneySigned(amt)}/mo{cum}
        </Text>
      </View>
    );
  }

  return (
    <View style={decisionFactorStyle(row.inPlay)} wrap={false}>
      <View style={styles.factorHeader}>
        <Text style={styles.factorLetterBadge}>{row.letter}</Text>
        <Text style={styles.factorTitle}>{FACTOR_TITLES[row.letter]}</Text>
        <Text
          style={[
            styles.factorStatusPill,
            { backgroundColor: pill.bg, color: pill.fg },
          ]}
        >
          {pill.label}
        </Text>
      </View>
      <View style={styles.statute}>
        <Text>
          <Text style={styles.statuteTag}>§ 43-19-103({row.letter}):</Text>{" "}
          <Text style={styles.statuteText}>
            {FACTOR_STATUTORY_TEXT[row.letter]}
          </Text>
        </Text>
      </View>
      <View style={styles.factorBody}>
        <PartyBlock
          side="obligor"
          roleLabel={obligorRole}
          applicable={row.obligor.applicable}
          amount={row.obligor.amount}
          entry={row.obligor.entry}
          caption={caption}
        />
        <PartyBlock
          side="obligee"
          roleLabel={obligeeRole}
          applicable={row.obligee.applicable}
          amount={row.obligee.amount}
          entry={row.obligee.entry}
          caption={caption}
        />
      </View>
      {gapBlock}
      {row.inPlay !== "neither" && (
        <View style={styles.decisionStrip}>
          <Text style={styles.decisionStripLabel}>Chancellor's ruling</Text>
          <Text style={styles.decisionStripValue}>{decisionText}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────── reconciliation table ───────────────────

function ReconciliationTable({
  rows,
  inputs,
  outputs,
  decisions,
  avgMonths,
}: {
  rows: ReconciliationRow[];
  inputs: MSInputs;
  outputs: MSOutputs;
  decisions: Record<MSFactorLetter, MSChancellorDecision>;
  avgMonths: number | null;
}) {
  const presumptive = outputs.presumptiveMonthly;
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";

  const obligorDevTotal = rows.reduce((s, r) => s + r.obligor.amount, 0);
  const obligeeDevTotal = rows.reduce((s, r) => s + r.obligee.amount, 0);
  const totals = computeChancellorTotals(rows, decisions);
  const obligorFinal = presumptive + obligorDevTotal;
  const obligeeFinal = presumptive + obligeeDevTotal;
  const chancellorFinal = presumptive + totals.totalMonthly;
  const gapFinal = Math.abs(obligorFinal - obligeeFinal);

  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        <Text style={[styles.th, styles.thFirst]}>Component</Text>
        <Text style={styles.th}>{obligorRole} proposes</Text>
        <Text style={styles.th}>{obligeeRole} proposes</Text>
        <Text style={styles.th}>Gap</Text>
        <Text style={styles.th}>Chancellor's ruling</Text>
      </View>
      <View style={styles.tr}>
        <Text style={[styles.td, styles.tdFirst]}>
          Presumptive § 43-19-101 (anchor)
        </Text>
        <Text style={styles.td}>${presumptive.toLocaleString("en-US")}</Text>
        <Text style={styles.td}>${presumptive.toLocaleString("en-US")}</Text>
        <Text style={styles.td}>—</Text>
        <Text style={styles.td}>${presumptive.toLocaleString("en-US")}</Text>
      </View>
      {rows.map((r) => {
        const dec = decisions[r.letter];
        const chCell =
          r.inPlay === "neither" ? "—" : fmtMoneySigned(decisionContribution(r, dec));
        const gap =
          r.inPlay === "both"
            ? fmtMoneyPlain(Math.abs(r.gapMonthly))
            : r.inPlay === "neither" || r.inPlay === "agree"
              ? "—"
              : fmtMoneyPlain(
                  Math.abs(
                    r.obligor.applicable ? r.obligor.amount : r.obligee.amount,
                  ),
                );
        return (
          <View style={styles.tr} key={r.letter}>
            <Text style={[styles.td, styles.tdFirst]}>
              ({r.letter}) {r.title}
            </Text>
            <Text style={styles.td}>
              {fmtMoneyCell(r.obligor.amount, r.obligor.applicable)}
            </Text>
            <Text style={styles.td}>
              {fmtMoneyCell(r.obligee.amount, r.obligee.applicable)}
            </Text>
            <Text style={styles.td}>{gap}</Text>
            <Text style={styles.td}>{chCell}</Text>
          </View>
        );
      })}
      <View style={styles.trTotal}>
        <Text style={[styles.tdTotal, styles.tdTotalFirst]}>
          Final monthly order
        </Text>
        <Text style={styles.tdTotal}>
          ${obligorFinal.toLocaleString("en-US")}
        </Text>
        <Text style={styles.tdTotal}>
          ${obligeeFinal.toLocaleString("en-US")}
        </Text>
        <Text style={styles.tdTotal}>${gapFinal.toLocaleString("en-US")}</Text>
        <Text style={styles.tdTotal}>
          ${chancellorFinal.toLocaleString("en-US")}
        </Text>
      </View>
      {avgMonths !== null && (
        <View style={styles.tr}>
          <Text style={[styles.td, styles.tdFirst]}>
            Cumulative through emancipation ({avgMonths} mo avg)
          </Text>
          <Text style={styles.td}>
            ${(obligorFinal * avgMonths).toLocaleString("en-US")}
          </Text>
          <Text style={styles.td}>
            ${(obligeeFinal * avgMonths).toLocaleString("en-US")}
          </Text>
          <Text style={[styles.td, { color: TOKEN.amber }]}>
            ${(gapFinal * avgMonths).toLocaleString("en-US")}
          </Text>
          <Text style={styles.td}>
            ${(chancellorFinal * avgMonths).toLocaleString("en-US")}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────── authorities ────────────────────────────

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

// ─────────────────────────── document ──────────────────────────────

function MemoDocument({
  inputs,
  outputs,
  caption,
}: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
}) {
  const report = buildReconciliation(inputs);
  const decisions = inputs.chancellorDecisions ?? defaultChancellorDecisions();
  const avgMonths = report.totals.avgMonthsRemaining;
  const totals = computeChancellorTotals(report.rows, decisions);
  const chancellorFinal = outputs.presumptiveMonthly + totals.totalMonthly;
  const cumulative = avgMonths !== null ? chancellorFinal * avgMonths : null;
  const obligorRole = inputs.obligorLabel || "Obligor";
  const obligeeRole = inputs.obligeeLabel || "Obligee";
  const childCount = inputs.numChildren;
  const authorities = collectAuthorities(inputs);
  const pending = totals.pendingCount;
  const active = totals.activeCount;

  return (
    <Document
      title={`${caption.matterName || "MS Deviation"} — § 43-19-103 Memorandum`}
      author={caption.preparedBy || "TCB Law MS Calculator"}
      subject="Mississippi § 43-19-103 Deviation Memorandum"
    >
      <Page size="LETTER" style={styles.page} wrap>
        {/* header */}
        <Text style={styles.h1}>
          § 43-19-103 Deviation Memorandum
        </Text>
        <Text style={styles.subtitle}>
          {caption.matterName || "Mississippi child support deviation analysis"} —
          structured statement of both parties' positions and the chancellor's
          rulings.
        </Text>
        <View style={styles.headerRule} />

        {/* meta grid */}
        <View style={styles.metaGrid}>
          {caption.docketNumber && (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Docket no.</Text>
              <Text style={styles.metaValue}>{caption.docketNumber}</Text>
            </View>
          )}
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Computation date</Text>
            <Text style={styles.metaValue}>{todayISO()}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Children</Text>
            <Text style={styles.metaValue}>
              {childCount}
              {inputs.childAges.length > 0
                ? ` (ages ${inputs.childAges.join(", ")})`
                : ""}
            </Text>
          </View>
          {caption.court && (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Court</Text>
              <Text style={styles.metaValue}>{caption.court}</Text>
            </View>
          )}
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Obligor</Text>
            <Text style={styles.metaValue}>{obligorRole}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Obligee</Text>
            <Text style={styles.metaValue}>{obligeeRole}</Text>
          </View>
          {caption.preparedBy && (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Prepared by</Text>
              <Text style={styles.metaValue}>{caption.preparedBy}</Text>
            </View>
          )}
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Framework</Text>
            <Text style={styles.metaValue}>Miss. Code Ann. §§ 43-19-101, -103</Text>
          </View>
        </View>

        {/* live bar (snapshot) */}
        <View style={styles.liveBar}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Presumptive (§ 43-19-101)</Text>
            <Text style={styles.statVal}>
              ${outputs.presumptiveMonthly.toLocaleString("en-US")}/mo
            </Text>
            <Text style={styles.statSub}>
              {(outputs.statutoryPercentage * 100).toFixed(0)}% × $
              {Math.round(outputs.monthlyAGI).toLocaleString("en-US")} AGI ·{" "}
              {childCount} child{childCount === 1 ? "" : "ren"}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              Final order under chancellor's rulings
            </Text>
            <Text style={styles.statValPrimary}>
              ${chancellorFinal.toLocaleString("en-US")}/mo
            </Text>
            <Text style={styles.statSub}>
              {obligorRole} → {obligeeRole} · monthly
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              Cumulative through emancipation
            </Text>
            <Text style={styles.statVal}>
              {cumulative !== null
                ? `$${cumulative.toLocaleString("en-US")}`
                : "—"}
            </Text>
            <Text style={styles.statSub}>
              {avgMonths !== null
                ? `avg ${avgMonths} months remaining`
                : "child ages not provided"}
            </Text>
          </View>
        </View>

        {pending > 0 && (
          <Text style={styles.pendingBanner}>
            {pending} of {active} contested factor
            {active === 1 ? "" : "s"} awaiting a chancellor decision.
          </Text>
        )}

        {/* Module 1 */}
        <View style={styles.module} wrap={false}>
          <Text style={styles.moduleTitle}>
            <Text style={styles.moduleTag}>MODULE 1 </Text>
            The Presumptive Amount — § 43-19-101
          </Text>
          <Text style={styles.formula}>
            ${Math.round(outputs.monthlyAGI).toLocaleString("en-US")} AGI/mo × {(outputs.statutoryPercentage * 100).toFixed(0)}% ={" "}
            ${outputs.presumptiveMonthly.toLocaleString("en-US")} / month
          </Text>
          <Text style={styles.cite}>
            § 43-19-101(1). Annualized AGI: $
            {Math.round(outputs.annualAGI).toLocaleString("en-US")}. Guidelines
            effective {outputs.guidelinesEffectiveDate}.
          </Text>
          {avgMonths !== null && (
            <>
              <Text style={styles.formula}>
                Avg remaining months ({inputs.childAges.length || childCount} child
                {(inputs.childAges.length || childCount) === 1 ? "" : "ren"}): {avgMonths}
                {"\n"}Cumulative presumptive: $
                {(outputs.presumptiveMonthly * avgMonths).toLocaleString("en-US")}
              </Text>
              <Text style={styles.cite}>
                Miss. Code Ann. § 93-11-65(8). Age-21 default unless a carve-out
                applies (marriage, military service, qualifying felony, full-time
                school discontinuance).
              </Text>
            </>
          )}
        </View>

        {/* Module 2 — factors */}
        <View style={styles.module}>
          <Text style={styles.moduleTitle}>
            <Text style={styles.moduleTag}>MODULE 2 </Text>
            Statutory Deviation Analysis — § 43-19-103
          </Text>
          {report.rows.map((row) => (
            <FactorCard
              key={row.letter}
              row={row}
              inputs={inputs}
              caption={caption}
              decision={decisions[row.letter]}
              avgMonths={avgMonths}
            />
          ))}
        </View>

        {/* Module 3 — reconciliation */}
        <View style={styles.module}>
          <Text style={styles.moduleTitle}>
            <Text style={styles.moduleTag}>MODULE 3 </Text>
            Reconciliation — Both Sides' Bottom Lines
          </Text>
          <ReconciliationTable
            rows={report.rows}
            inputs={inputs}
            outputs={outputs}
            decisions={decisions}
            avgMonths={avgMonths}
          />
        </View>

        {/* final box */}
        <View style={styles.finalBox} wrap={false}>
          <Text style={styles.finalLabel}>
            Final Order under chancellor's rulings — {obligorRole} to {obligeeRole}
          </Text>
          <Text style={styles.finalAmount}>
            ${chancellorFinal.toLocaleString("en-US")} / month
          </Text>
          {cumulative !== null && (
            <Text style={styles.finalCum}>
              Cumulative through emancipation: $
              {cumulative.toLocaleString("en-US")} over an average of {avgMonths}{" "}
              months remaining
            </Text>
          )}
        </View>

        {/* Authorities */}
        <View style={styles.authorities} wrap={false}>
          <Text style={styles.authoritiesTitle}>Source Authorities</Text>
          <Text style={styles.authoritySub}>Statutes</Text>
          <Text style={styles.bullet}>
            • Miss. Code Ann. § 43-19-101 — Presumptive guideline, AGI
            computation, $10k/$100k written-finding thresholds, medical support.
          </Text>
          <Text style={styles.bullet}>
            • Miss. Code Ann. § 43-19-101(5) (HB 1067, eff. 2022-07-01) —
            Imputation framework.
          </Text>
          <Text style={styles.bullet}>
            • Miss. Code Ann. § 43-19-103 — Ten criteria for overcoming the
            presumption.
          </Text>
          <Text style={styles.bullet}>
            • Miss. Code Ann. § 43-19-36 (SB 2082, eff. 2023-07-01) — Suspension
            during 180+ day incarceration.
          </Text>
          <Text style={styles.bullet}>
            • Miss. Code Ann. § 93-11-65(8) — Age-21 emancipation default.
          </Text>
          {authorities.cases.length > 0 && (
            <>
              <Text style={styles.authoritySub}>Case authorities cited by counsel</Text>
              {authorities.cases.map((c) => (
                <Text key={c} style={styles.bullet}>• {c}</Text>
              ))}
            </>
          )}
          {authorities.exhibits.length > 0 && (
            <>
              <Text style={styles.authoritySub}>Documentation index</Text>
              {authorities.exhibits.map((x) => (
                <Text key={x} style={styles.bullet}>• {x}</Text>
              ))}
            </>
          )}
          <Text style={styles.disclaimer}>
            This memorandum is a structured statement of both parties' positions
            on the § 43-19-103 deviation analysis, produced by the calculator at
            csg.tcblaw.org/ms. The presumptive amount, the gap quantification,
            and the chancellor-ruling reconciliation are mechanical; the
            positions, supporting facts, legal authority, and the chancellor's
            ultimate ruling are matters of judgment that the document captures
            but does not predetermine. Not legal advice. Not an official MDHS
            form.
          </Text>
        </View>

        {/* page footer with numbering */}
        <View style={styles.pageFooter} fixed>
          <Text>
            {caption.matterName || "MS Deviation Memorandum"} — {todayISO()}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────── browser download helper ───────────────

/**
 * Browser-only — triggers download of the rendered PDF blob. Must be
 * called from a user event handler so the popup-blocker permits the
 * synthetic anchor click. Throws if invoked during SSR.
 */
export async function downloadMSDeviationMemoPdf(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  filename?: string;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadMSDeviationMemoPdf requires a browser context");
  }
  const doc = (
    <MemoDocument
      inputs={args.inputs}
      outputs={args.outputs}
      caption={args.caption}
    />
  );
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = args.filename ?? memoFilename(args.caption);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
