/**
 * §1.9 chancellor decision row — the per-factor decision surface.
 *
 * Rendered inside the reconciliation table as a card footer. Five filled-
 * pill buttons on disputed/single-sided rows; collapses to two buttons
 * (Accept Agreed / Decline) on stipulated rows. Selected state is a deeper
 * fill; unselected is outlined. Each button carries a tiny preview of the
 * resulting contribution so the chancellor sees the consequence before
 * clicking. Custom-amount selection reveals a signed number input bounded
 * to ±$50,000 with a live contribution preview.
 *
 * The Decline / Accept-Agreed-and-Resolved visual treatment mutes the
 * surrounding row (opacity-60 + caption swap) — wiring lives in the
 * parent table, which reads `decision` off this component's state.
 */
import { memo, useCallback } from "react";
import type {
  MSChancellorDecision,
  MSChancellorDecisionKind,
} from "@/lib/calc/ms/chancellor-decisions";
import {
  CUSTOM_AMOUNT_MAX,
  CUSTOM_AMOUNT_MIN,
  availableDecisions,
  clampCustomAmount,
  decisionContribution,
  recordDecision,
} from "@/lib/calc/ms/chancellor-decisions";
import type { ReconciliationRow } from "@/lib/calc/ms/reconciliation";

function fmtSigned(n: number): string {
  if (n === 0) return "$0";
  const a = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `−$${a}` : `+$${a}`;
}

const KIND_LABELS: Record<MSChancellorDecisionKind, string> = {
  none: "Pending",
  adopt_obligor: "Adopt Obligor",
  adopt_obligee: "Adopt Obligee",
  split: "Split Difference",
  custom: "Custom Amount",
  decline: "Decline",
  accept_agreed: "Accept Agreed",
};

interface Props {
  row: ReconciliationRow;
  decision: MSChancellorDecision;
  onChange: (next: MSChancellorDecision) => void;
  obligorLabel: string;
  obligeeLabel: string;
}

function MSChancellorDecisionRowImpl({
  row,
  decision,
  onChange,
  obligorLabel,
  obligeeLabel,
}: Props) {
  const options = availableDecisions(row.inPlay);
  const isAgreed = row.inPlay === "agree";

  const previewFor = useCallback(
    (kind: MSChancellorDecisionKind): number =>
      decisionContribution(row, {
        ...decision,
        decision: kind,
        customAmount: kind === "custom" ? decision.customAmount : 0,
      }),
    [row, decision],
  );

  const select = useCallback(
    (kind: MSChancellorDecisionKind) => {
      onChange(
        recordDecision(decision, {
          decision: kind,
          customAmount: kind === "custom" ? decision.customAmount : 0,
        }),
      );
    },
    [decision, onChange],
  );

  if (options.length === 0) return null;

  const labelFor = (kind: MSChancellorDecisionKind): string => {
    if (kind === "adopt_obligor") return `Adopt ${obligorLabel}`;
    if (kind === "adopt_obligee") return `Adopt ${obligeeLabel}`;
    return KIND_LABELS[kind];
  };

  return (
    <div className="mt-2 rounded-md border border-rule bg-cream/40 p-3 no-print">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Chancellor decision — § 43-19-103({row.letter})
        </span>
        {decision.decidedAt && (
          <span className="font-mono text-[10px] text-muted-foreground">
            decided {new Date(decision.decidedAt).toLocaleString()}
          </span>
        )}
      </div>

      <div
        className={
          "flex flex-wrap gap-1.5" +
          (isAgreed ? " justify-start" : "")
        }
      >
        {options.map((kind) => {
          const active = decision.decision === kind;
          const preview = previewFor(kind);
          const showPreview =
            kind !== "custom" && kind !== "decline" && kind !== "none";
          return (
            <button
              key={kind}
              type="button"
              onClick={() => select(kind)}
              aria-pressed={active}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-rule bg-background text-ink hover:bg-accent/30")
              }
            >
              {labelFor(kind)}
              {showPreview && (
                <span
                  className={
                    "ml-1.5 font-mono text-[10px] " +
                    (active ? "text-primary-foreground/85" : "text-muted-foreground")
                  }
                >
                  ({fmtSigned(preview)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {decision.decision === "custom" && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Monthly amount
            <input
              type="number"
              inputMode="decimal"
              step={1}
              min={CUSTOM_AMOUNT_MIN}
              max={CUSTOM_AMOUNT_MAX}
              value={decision.customAmount === 0 ? "" : decision.customAmount}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = raw === "" || raw === "-" ? 0 : Number(raw);
                onChange(
                  recordDecision(decision, {
                    decision: "custom",
                    customAmount: clampCustomAmount(parsed),
                  }),
                );
              }}
              className="w-32 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </label>
          <span className="font-mono text-xs text-ink">
            → contribution {fmtSigned(decisionContribution(row, decision))}/mo
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            bounds ±${CUSTOM_AMOUNT_MAX.toLocaleString("en-US")}
          </span>
        </div>
      )}
    </div>
  );
}

export const MSChancellorDecisionRow = memo(MSChancellorDecisionRowImpl);
