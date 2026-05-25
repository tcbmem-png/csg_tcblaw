import { useState } from "react";
import type { MultiSourceMethodology, MultiSourceRow } from "@/lib/calc/types";
import { ApplyBar, DollarInput, TextInput, fmt } from "./shared";

const SUGGESTED_LABELS = ["W-2 employment", "1099 / contract", "Rental net", "Investment / dividends", "Other"];

export function PathMultiSourceForm({
  label,
  initial,
  onCancel,
  onApply,
}: {
  label: string;
  initial?: MultiSourceMethodology;
  onCancel: () => void;
  onApply: (monthly: number, m: MultiSourceMethodology) => void;
}) {
  const [sources, setSources] = useState<MultiSourceRow[]>(
    initial?.sources ?? SUGGESTED_LABELS.slice(0, 2).map((l) => ({ label: l, annual: 0 })),
  );

  const annualTotal = sources.reduce((s, r) => s + (r.annual > 0 ? r.annual : 0), 0);
  const result = Math.round((annualTotal / 12) * 100) / 100;
  const canApply = result > 0;

  const updateRow = (i: number, patch: Partial<MultiSourceRow>) =>
    setSources(sources.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Multiple income sources
      </div>
      <p className="text-xs text-muted-foreground">
        Add each income stream's annual gross. They sum to a single monthly
        figure for the calculator.
      </p>

      <div className="space-y-1.5">
        {sources.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_10rem_2rem] gap-2">
            <TextInput
              value={row.label}
              onChange={(s) => updateRow(i, { label: s })}
              placeholder="Source"
            />
            <DollarInput
              value={row.annual}
              onChange={(n) => updateRow(i, { annual: n })}
              placeholder="Annual"
            />
            <button
              type="button"
              onClick={() => setSources(sources.filter((_, idx) => idx !== i))}
              className="rounded-md border border-input bg-background px-2 text-[11px] text-muted-foreground hover:bg-accent/40"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSources([...sources, { label: "", annual: 0 }])}
          className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
        >
          + Add source
        </button>
      </div>

      <div className="rounded-md bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
        Total: ${fmt(annualTotal)} / yr ÷ 12 = ${fmt(result)} / mo
      </div>

      <ApplyBar
        result={result}
        canApply={canApply}
        onCancel={onCancel}
        onApply={() =>
          onApply(result, {
            path: "multi_source",
            sources: sources.filter((r) => r.label.trim() && r.annual > 0),
            monthlyGrossResult: result,
          })
        }
      />
    </div>
  );
}
