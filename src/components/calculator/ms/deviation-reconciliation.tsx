/**
 * Reconciliation table per MS_Deviation_Worksheet_Build_Brief §
 * "The Reconciliation View". Always renders both sides; in single-position
 * mode the obligee column is suppressed.
 */
import { useState } from "react";
import type { MSInputs } from "@/lib/calc/ms/types";
import {
  buildReconciliation,
  type ReconciliationRow,
} from "@/lib/calc/ms/reconciliation";

function fmt(n: number): string {
  const a = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${a})` : `$${a}`;
}

function inPlayBadge(row: ReconciliationRow): string {
  switch (row.inPlay) {
    case "neither":
      return "—";
    case "agree":
      return "Agreed";
    case "both":
      return "Both, differ";
    case "obligor_only":
      return "Obligor only";
    case "obligee_only":
      return "Obligee only";
  }
}

export function MSDeviationReconciliation({ inputs }: { inputs: MSInputs }) {
  const sideBySide =
    inputs.comparisonMode === "side_by_side" && !!inputs.deviationsB;
  const report = buildReconciliation(inputs);
  const { activeRows, totals } = report;

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
      <p className="mb-4 text-xs text-muted-foreground">
        Both positions are proposals; the chancellor retains discretion under
        § 43-19-103. Cumulative figures assume support continues through age 21
        (Miss. Code Ann. § 93-11-65) averaged across the listed children.
      </p>

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
                  <th className="py-2 pr-3 text-right">
                    {inputs.obligeeLabel}
                  </th>
                )}
                {sideBySide && (
                  <th className="py-2 pl-3 text-right">Gap / mo</th>
                )}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((r) => (
                <tr key={r.letter} className="border-b border-rule/60">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-ink">({r.letter})</div>
                    <div className="text-xs text-muted-foreground">
                      {r.title}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-xs">{inPlayBadge(r)}</td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {r.obligor.applicable ? `${fmt(r.obligor.amount)} / mo` : "—"}
                  </td>
                  {sideBySide && (
                    <td className="py-2 pr-3 text-right font-mono">
                      {r.obligee.applicable
                        ? `${fmt(r.obligee.amount)} / mo`
                        : "—"}
                    </td>
                  )}
                  {sideBySide && (
                    <td className="py-2 pl-3 text-right font-mono text-ink">
                      {fmt(r.gapMonthly)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule bg-cream/60">
                <td className="py-2 pr-3 font-medium">Total / mo</td>
                <td />
                <td className="py-2 pr-3 text-right font-mono">
                  {fmt(totals.obligorMonthly)}
                </td>
                {sideBySide && (
                  <td className="py-2 pr-3 text-right font-mono">
                    {fmt(totals.obligeeMonthly)}
                  </td>
                )}
                {sideBySide && (
                  <td className="py-2 pl-3 text-right font-mono font-medium">
                    {fmt(totals.netDifferenceMonthly)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {sideBySide && activeRows.length > 0 && (
        <div className="mt-4 rounded-md border border-rule bg-cream p-3 text-sm">
          {totals.avgMonthsRemaining === null ? (
            <p className="text-xs text-muted-foreground">
              Enter the children's ages above to see the cumulative impact of
              the parties' disagreement over the remaining support period.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">
                  Net difference (monthly)
                </span>
                <span className="font-mono text-ink">
                  {fmt(totals.netDifferenceMonthly)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">
                  Avg. months remaining through age 21
                </span>
                <span className="font-mono text-ink">
                  {totals.avgMonthsRemaining} mo (
                  {(totals.avgMonthsRemaining / 12).toFixed(1)} yr)
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-2 font-medium">
                <span>Cumulative net difference</span>
                <span className="font-mono">
                  {fmt(totals.cumulativeNetDifference!)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
