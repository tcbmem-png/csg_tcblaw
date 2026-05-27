/**
 * Reconciliation table per MS_Deviation_Worksheet_Build_Brief §
 * "The Reconciliation View". Always renders both sides; in single-position
 * mode the obligee column is suppressed.
 *
 * §1.9 — Renders the chancellor decision row beneath each active factor and
 * surfaces a live chancellor running-total plus cumulative-through-
 * emancipation projection. The cumulative number color-flashes briefly on
 * change to signal "the stakes just shifted."
 */
import { useEffect, useRef, useState } from "react";
import type { MSInputs } from "@/lib/calc/ms/types";
import {
  buildReconciliation,
  type ReconciliationRow,
} from "@/lib/calc/ms/reconciliation";
import { inPlayPresentation } from "@/lib/calc/ms/in-play-labels";
import {
  computeChancellorTotals,
  defaultChancellorDecision,
  defaultChancellorDecisions,
  type MSChancellorDecision,
} from "@/lib/calc/ms/chancellor-decisions";
import { MSChancellorDecisionRow } from "./chancellor-decision-row";

function fmt(n: number): string {
  const a = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${a})` : `$${a}`;
}

function inPlayBadge(row: ReconciliationRow): string {
  if (row.inPlay === "neither") return "—";
  return inPlayPresentation(row.inPlay).label;
}

function isResolved(d: MSChancellorDecision): boolean {
  return d.decision === "decline" || d.decision === "accept_agreed";
}

interface Props {
  inputs: MSInputs;
  setInputs?: (next: MSInputs) => void;
}

export function MSDeviationReconciliation({ inputs, setInputs }: Props) {
  const sideBySide =
    inputs.comparisonMode === "side_by_side" && !!inputs.deviationsB;
  const report = buildReconciliation(inputs);
  const { activeRows, totals } = report;
  const [showEmancipation, setShowEmancipation] = useState(false);

  const decisions = inputs.chancellorDecisions ?? defaultChancellorDecisions();
  const chancellor = computeChancellorTotals(report.rows, decisions);
  const chancellorCumulative =
    totals.avgMonthsRemaining === null
      ? null
      : chancellor.totalMonthly * totals.avgMonthsRemaining;

  const setDecision = (next: MSChancellorDecision) => {
    if (!setInputs) return;
    setInputs({
      ...inputs,
      chancellorDecisions: { ...decisions, [next.factorLetter]: next },
    });
  };

  // Subtle color-flash on cumulative change.
  const [flash, setFlash] = useState(false);
  const prevCumulativeRef = useRef<number | null>(chancellorCumulative);
  useEffect(() => {
    if (prevCumulativeRef.current !== chancellorCumulative) {
      prevCumulativeRef.current = chancellorCumulative;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 350);
      return () => clearTimeout(t);
    }
  }, [chancellorCumulative]);

  return (
    <section
      id="ms-reconciliation"
      className="rounded-lg border border-rule bg-background p-5"
    >
      <header className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-lg text-ink">
          Reconciliation — § 43-19-103 deviation analysis
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {sideBySide
            ? `${inputs.obligorLabel} vs ${inputs.obligeeLabel}`
            : inputs.obligorLabel}
        </span>
      </header>
      <p className="mb-2 text-xs text-muted-foreground">
        Both positions are proposals; the chancellor retains discretion under
        § 43-19-103. Cumulative figures assume support continues through age 21
        (Miss. Code Ann. § 93-11-65) averaged across the listed children.{" "}
        <button
          type="button"
          onClick={() => setShowEmancipation((v) => !v)}
          aria-expanded={showEmancipation}
          aria-controls="ms-emancipation-triggers"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rule text-[10px] font-medium text-muted-foreground hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 no-print"
          title="Earlier-emancipation triggers per § 93-11-65(8)"
        >
          i
        </button>
      </p>
      {showEmancipation && (
        <div
          id="ms-emancipation-triggers"
          className="mb-4 rounded-md border border-rule bg-cream p-3 text-xs text-ink no-print"
        >
          <div className="font-medium">
            Earlier-emancipation triggers — Miss. Code Ann. § 93-11-65(8)
          </div>
          <p className="mt-1 text-muted-foreground">
            The age-21 assumption above does not hold if any of the following
            occur first as to a given child:
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            <li>Marriage</li>
            <li>Military service</li>
            <li>Felony conviction with a sentence of two (2) or more years</li>
            <li>Discontinuance of full-time school enrollment (absent disability)</li>
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cumulative figures here are projections, not adjudications;
            confirm against the child's actual circumstances.
          </p>
        </div>
      )}

      {activeRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No deviation factors are in play. Presumptive percentage stands.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Factor</th>
                <th className="py-2 pr-3">In play?</th>
                <th className="py-2 pr-3 text-right">{inputs.obligorLabel}</th>
                {sideBySide && (
                  <th className="py-2 pr-3 text-right">{inputs.obligeeLabel}</th>
                )}
                {sideBySide && <th className="py-2 px-3 text-right">Gap / mo</th>}
                <th className="py-2 pl-3 text-right">Chancellor / mo</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((r) => {
                const dec = decisions[r.letter] ?? defaultChancellorDecision(r.letter);
                const contribution = chancellor.perFactor[r.letter] ?? 0;
                const resolved = isResolved(dec);
                const muted = resolved;
                return (
                  <tr
                    key={r.letter}
                    className={
                      "border-b border-rule/60 transition-opacity " +
                      (muted ? "opacity-60" : "")
                    }
                  >
                    <td className="py-2 pr-3 align-top" colSpan={sideBySide ? 6 : 4}>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-medium text-ink">({r.letter})</span>
                        <span className="text-xs text-muted-foreground">{r.title}</span>
                        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                          {inPlayBadge(r)}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-1 gap-x-4 text-xs sm:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">{inputs.obligorLabel}: </span>
                          <span className="font-mono text-ink">
                            {r.obligor.applicable ? `${fmt(r.obligor.amount)}/mo` : "—"}
                          </span>
                        </div>
                        {sideBySide && (
                          <div>
                            <span className="text-muted-foreground">{inputs.obligeeLabel}: </span>
                            <span className="font-mono text-ink">
                              {r.obligee.applicable ? `${fmt(r.obligee.amount)}/mo` : "—"}
                            </span>
                          </div>
                        )}
                        <div className="sm:text-right">
                          <span className="text-muted-foreground">Chancellor: </span>
                          {dec.decision === "none" ? (
                            <span className="font-mono text-muted-foreground">pending</span>
                          ) : resolved ? (
                            <span className="font-mono text-muted-foreground">
                              ruled: no deviation
                            </span>
                          ) : (
                            <span className="font-mono text-ink">
                              {contribution >= 0 ? "+" : "−"}$
                              {Math.abs(contribution).toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}
                              /mo
                            </span>
                          )}
                        </div>
                      </div>
                      <MSChancellorDecisionRow
                        row={r}
                        decision={dec}
                        onChange={setDecision}
                        obligorLabel={inputs.obligorLabel}
                        obligeeLabel={inputs.obligeeLabel}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule bg-cream/60">
                <td className="py-2 pr-3 font-medium" colSpan={sideBySide ? 5 : 3}>
                  Chancellor running total
                </td>
                <td className="py-2 pl-3 text-right font-mono font-medium text-ink">
                  {fmt(chancellor.totalMonthly)}
                </td>
              </tr>
              {sideBySide && (
                <tr className="bg-cream/30 text-xs text-muted-foreground">
                  <td className="py-1 pr-3" colSpan={3}>
                    Party gap (for reference)
                  </td>
                  <td className="py-1 pr-3 text-right font-mono">
                    {fmt(totals.obligorMonthly)}
                  </td>
                  <td className="py-1 pr-3 text-right font-mono">
                    {fmt(totals.obligeeMonthly)}
                  </td>
                  <td className="py-1 pl-3 text-right font-mono">
                    {fmt(totals.netDifferenceMonthly)}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}

      {activeRows.length > 0 && (
        <div className="mt-4 rounded-md border border-rule bg-cream p-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">
              Pending decisions
            </span>
            <span className="font-mono text-ink">
              {chancellor.pendingCount} of {chancellor.activeCount}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-muted-foreground">
              Chancellor net (monthly)
            </span>
            <span className="font-mono text-ink">
              {fmt(chancellor.totalMonthly)}
            </span>
          </div>
          {chancellorCumulative !== null && (
            <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-2 font-medium">
              <span>Cumulative through emancipation</span>
              <span
                className={
                  "font-mono transition-colors duration-300 " +
                  (flash ? "text-primary" : "text-ink")
                }
              >
                {fmt(chancellorCumulative)}
              </span>
            </div>
          )}
          {totals.avgMonthsRemaining === null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Enter the children's ages above to see the cumulative impact of
              the chancellor's ruling over the remaining support period.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
