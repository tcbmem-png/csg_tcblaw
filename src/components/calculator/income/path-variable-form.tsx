import { useState } from "react";
import type { VariableMethodology, VariableYearRow } from "@/lib/calc/types";
import { ApplyBar, YearsTable, averageMonthly, fmt } from "./shared";

export function PathVariableForm({
  label,
  initial,
  onCancel,
  onApply,
}: {
  label: string;
  initial?: VariableMethodology;
  onCancel: () => void;
  onApply: (monthly: number, m: VariableMethodology) => void;
}) {
  const [years, setYears] = useState<VariableYearRow[]>(initial?.years ?? []);
  const [method, setMethod] = useState<"3yr" | "5yr" | "custom">(
    initial?.averagingMethod ?? "3yr",
  );
  const [rationale, setRationale] = useState<string>(initial?.rationale ?? "");

  const result = averageMonthly(years, method);
  const canApply = result > 0;
  const validYears = years.filter((y) => y.amount > 0);
  const used =
    method === "3yr" ? Math.min(3, validYears.length) :
    method === "5yr" ? Math.min(5, validYears.length) :
    validYears.length;

  return (
    <div className="space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Variable income (multi-year averaging)
      </div>
      <p className="text-xs text-muted-foreground">
        Rule .04(3)(b): for variable income (bonuses, commissions, overtime),
        average prior tax years to smooth out fluctuation.
      </p>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Annual gross by year</div>
        <YearsTable years={years} onChange={setYears} minRows={3} maxRows={5} />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Averaging method</div>
        <div className="flex flex-wrap gap-1.5">
          {(["3yr", "5yr", "custom"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={
                "rounded-md border px-2.5 py-1 text-xs " +
                (method === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-ink hover:bg-accent/40")
              }
            >
              {m === "3yr" ? "3-year average" : m === "5yr" ? "5-year average" : "All entered years"}
            </button>
          ))}
        </div>
        {used > 0 && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            Using last {used} year{used === 1 ? "" : "s"}. Total ÷ {used} ÷ 12 = ${fmt(result)}/mo.
          </div>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-ink">Rationale (optional)</span>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="e.g., 2024 included a one-time signing bonus; 3-year average more representative."
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <ApplyBar
        result={result}
        canApply={canApply}
        onCancel={onCancel}
        onApply={() =>
          onApply(result, {
            path: "variable",
            years: validYears,
            averagingMethod: method,
            rationale: rationale.trim() || undefined,
            monthlyGrossResult: result,
          })
        }
      />
    </div>
  );
}
