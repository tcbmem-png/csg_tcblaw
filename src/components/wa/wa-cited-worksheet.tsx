/**
 * Washington cited-worksheet renderer. For every worksheet line it shows three
 * things — the computed number, how it was derived, and the governing authority
 * (RCW / WAC / verified case law) — plus a match-check column so the parent can
 * confirm each figure against Washington's own open WSCSS calculator.
 *
 * Presentational only: it renders a WaWorksheetModel (built from the byte-checked
 * engine). [VERIFY] lines are shown as statute-only / pending, never as settled.
 */
import { useState } from "react";
import type { WaWorksheetModel, WaWorksheetLine } from "@/lib/calc/states/wa/worksheet-model";

/** Parse a displayed money/share string back to a number for the match-check. */
function primaryNumber(line: WaWorksheetLine): number | null {
  const raw = line.combined ?? line.col1;
  if (!raw) return null;
  const m = raw.replace(/[$,]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function AuthorityCell({ line }: { line: WaWorksheetLine }) {
  const { rcw, wac, cases } = line.authority;
  return (
    <div className="space-y-1 text-xs">
      {[...rcw, ...wac].map((c) => (
        <span
          key={c}
          className="mr-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
          {c}
        </span>
      ))}
      {cases.map((c) => (
        <p key={c.cite} className="text-muted-foreground">
          {c.cite}
          {c.status !== "verified" && (
            <span className="ml-1 italic text-amber-700">(quote pending)</span>
          )}
        </p>
      ))}
      {line.verify && (
        <p className="font-medium text-amber-700">
          {line.verify} — statute-only; pending professional confirmation.
        </p>
      )}
    </div>
  );
}

function MatchCheck({ line }: { line: WaWorksheetLine }) {
  const ours = primaryNumber(line);
  const [entered, setEntered] = useState("");
  if (ours == null) return <span className="text-xs text-muted-foreground">—</span>;
  const theirs = entered.trim() === "" ? null : Number(entered.replace(/[$,]/g, ""));
  const match =
    theirs == null || Number.isNaN(theirs) ? null : Math.round(theirs) === Math.round(ours);
  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="decimal"
        value={entered}
        onChange={(e) => setEntered(e.target.value)}
        placeholder="WSCSS tool"
        aria-label={`WSCSS tool value for line ${line.line}`}
        className="w-24 rounded border border-input bg-background px-2 py-1 text-xs"
      />
      {match === true && <span className="text-xs font-medium text-green-700">✓ match</span>}
      {match === false && <span className="text-xs font-medium text-red-700">✗ differs</span>}
    </div>
  );
}

export interface WaCitedWorksheetProps {
  model: WaWorksheetModel;
}

export function WaCitedWorksheet({ model }: WaCitedWorksheetProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-ink">
      <h1 className="font-serif text-3xl">Washington Child Support Worksheet — cited</h1>
      <p className="mt-2 text-lg font-medium">{model.summary}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Each line is recomputed independently and matched to the State's open WSCSS calculator.
        Enter the tool's figure in the last column to confirm.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left align-bottom">
              <th className="py-2 pr-2 font-medium">Line</th>
              <th className="py-2 pr-2 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">How it was derived</th>
              <th className="py-2 pr-4 font-medium">Authority</th>
              <th className="py-2 font-medium">Check vs. WSCSS</th>
            </tr>
          </thead>
          <tbody>
            {model.lines.map((l) => (
              <tr
                key={l.line}
                className={`border-b border-border/60 align-top ${l.informational ? "text-muted-foreground" : ""}`}
              >
                <td className="py-3 pr-2 font-mono text-xs">
                  {l.line}
                  {l.informational && <div className="text-[10px]">(info)</div>}
                </td>
                <td className="py-3 pr-2 font-medium">
                  {l.combined ? (
                    l.combined
                  ) : (
                    <div className="space-y-0.5">
                      <div>P1: {l.col1}</div>
                      <div>P2: {l.col2}</div>
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                    {l.label}
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">{l.derivation}</td>
                <td className="py-3 pr-4">
                  <AuthorityCell line={l} />
                </td>
                <td className="py-3">
                  <MatchCheck line={l} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{model.authorityCaveat}</p>
    </div>
  );
}
