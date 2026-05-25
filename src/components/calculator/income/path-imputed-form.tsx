import { useState } from "react";
import type {
  CalcInputs,
  ImputationBasis,
  ImputedMethodology,
  VariableYearRow,
} from "@/lib/calc/types";
import {
  ApplyBar,
  DollarInput,
  Field,
  TextInput,
  YearsTable,
  averageMonthly,
  fmt,
} from "./shared";

type Method = "prior_earnings" | "vocational_capacity" | "asset_based";

const BASIS_LABELS: Record<ImputationBasis, string> = {
  voluntary_underemployment: "Voluntary underemployment / unemployment — Rule .04(3)(a)(2)(i)",
  failure_to_produce_evidence: "Failure to produce reliable income evidence — Rule .04(3)(a)(2)(ii)",
  non_income_producing_assets: "Substantial non-income-producing assets — Rule .04(3)(a)(2)(v)",
};

export function PathImputedForm({
  parent,
  label,
  initial,
  onCancel,
  onApply,
}: {
  parent: "A" | "B";
  label: string;
  initial?: ImputedMethodology;
  onCancel: () => void;
  onApply: (updates: Partial<CalcInputs>, m: ImputedMethodology) => void;
}) {
  const [basis, setBasis] = useState<ImputationBasis>(
    initial?.basis ?? "voluntary_underemployment",
  );
  const [method, setMethod] = useState<Method>(initial?.method ?? "prior_earnings");
  const [actual, setActual] = useState<number>(initial?.actualMonthlyGross ?? 0);

  // prior_earnings
  const [years, setYears] = useState<VariableYearRow[]>(initial?.years ?? []);
  const [avgMethod, setAvgMethod] = useState<"3yr" | "5yr" | "custom">(
    initial?.averagingMethod ?? "3yr",
  );
  // vocational_capacity
  const [occupation, setOccupation] = useState(initial?.occupation ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [hours, setHours] = useState<number>(initial?.hoursPerWeek ?? 40);
  const [vocMonthly, setVocMonthly] = useState<number>(initial?.monthlyGrossResult ?? 0);
  // asset_based
  const [assets, setAssets] = useState<number>(initial?.assetsTotal ?? 0);
  const [rate, setRate] = useState<number>(initial?.rateOfReturn ?? 5);

  const [rationale, setRationale] = useState(initial?.rationale ?? "");

  let imputed = 0;
  if (method === "prior_earnings") {
    imputed = averageMonthly(years, avgMethod);
  } else if (method === "vocational_capacity") {
    imputed = vocMonthly;
  } else {
    imputed = Math.round(((assets * (rate / 100)) / 12) * 100) / 100;
  }
  const canApply = imputed > 0;

  return (
    <div className="space-y-3 rounded-md border border-primary/40 bg-primary/[0.03] p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {label} · Imputed income
      </div>
      <p className="text-xs text-muted-foreground">
        Imputation assigns income beyond what the parent actually earns. The
        calculator stores the imputed figure as gross and the real earnings
        separately — the Imputed vs Actual tab lights up automatically.
      </p>

      <Field
        label="Actual current monthly gross (real earnings)"
        help="What this parent actually earns now. Drives the side-by-side comparison."
      >
        <DollarInput value={actual} onChange={setActual} />
      </Field>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Statutory basis</div>
        <div className="space-y-1">
          {(Object.keys(BASIS_LABELS) as ImputationBasis[]).map((k) => (
            <label key={k} className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={basis === k}
                onChange={() => setBasis(k)}
              />
              <span className="text-xs text-ink">{BASIS_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Method to compute the imputed figure</div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["prior_earnings", "Prior earnings (multi-year average)"],
            ["vocational_capacity", "Vocational capacity"],
            ["asset_based", "Asset-based (return on assets)"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMethod(k)}
              className={
                "rounded-md border px-2.5 py-1 text-xs " +
                (method === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-ink hover:bg-accent/40")
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {method === "prior_earnings" && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-ink">Prior-year annual gross</div>
          <YearsTable years={years} onChange={setYears} />
          <div className="flex flex-wrap gap-1.5">
            {(["3yr", "5yr", "custom"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAvgMethod(m)}
                className={
                  "rounded-md border px-2.5 py-1 text-xs " +
                  (avgMethod === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-ink hover:bg-accent/40")
                }
              >
                {m === "3yr" ? "3-year" : m === "5yr" ? "5-year" : "All"}
              </button>
            ))}
          </div>
        </div>
      )}

      {method === "vocational_capacity" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Occupation">
            <TextInput value={occupation} onChange={setOccupation} placeholder="e.g., RN" />
          </Field>
          <Field label="Geographic area">
            <TextInput value={area} onChange={setArea} placeholder="e.g., Nashville MSA" />
          </Field>
          <Field label="Hours / week">
            <input
              type="number"
              value={hours || ""}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Proposed monthly gross">
            <DollarInput value={vocMonthly} onChange={setVocMonthly} />
          </Field>
        </div>
      )}

      {method === "asset_based" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total non-income-producing assets">
            <DollarInput value={assets} onChange={setAssets} />
          </Field>
          <Field label="Reasonable annual rate of return (%)">
            <input
              type="number"
              step="0.1"
              value={rate || ""}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <div className="col-span-2 rounded-md bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
            ${fmt(assets)} × {rate || 0}% ÷ 12 = ${fmt(imputed)} / mo
          </div>
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-ink">Rationale</span>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="Brief written rationale for the imputation — required at filing."
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <ApplyBar
        result={imputed}
        canApply={canApply}
        resultLabel="Imputed monthly gross"
        onCancel={onCancel}
        onApply={() => {
          const m: ImputedMethodology = {
            path: "imputed",
            basis,
            method,
            actualMonthlyGross: actual,
            years: method === "prior_earnings" ? years.filter((y) => y.amount > 0) : undefined,
            averagingMethod: method === "prior_earnings" ? avgMethod : undefined,
            occupation: method === "vocational_capacity" ? occupation.trim() || undefined : undefined,
            area: method === "vocational_capacity" ? area.trim() || undefined : undefined,
            hoursPerWeek: method === "vocational_capacity" ? hours : undefined,
            assetsTotal: method === "asset_based" ? assets : undefined,
            rateOfReturn: method === "asset_based" ? rate : undefined,
            rationale: rationale.trim() || undefined,
            monthlyGrossResult: imputed,
          };
          const updates: Partial<CalcInputs> =
            parent === "A"
              ? {
                  parentAGrossMonthly: imputed,
                  parentAActualGrossMonthly: actual,
                  useImputationForA: true,
                  parentAIncomeMethodology: m,
                }
              : {
                  parentBGrossMonthly: imputed,
                  parentBActualGrossMonthly: actual,
                  useImputationForB: true,
                  parentBIncomeMethodology: m,
                };
          onApply(updates, m);
        }}
      />
    </div>
  );
}
