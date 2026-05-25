import type { VariableYearRow } from "@/lib/calc/types";

export function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function DollarInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <span className="mr-1 text-muted-foreground">$</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
        value={value === 0 ? "" : value.toLocaleString("en-US")}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          const n = parseFloat(raw);
          onChange(isNaN(n) ? 0 : n);
        }}
      />
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function NumInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value === 0 ? "" : String(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        const n = parseFloat(raw);
        onChange(isNaN(n) ? 0 : n);
      }}
      className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-right font-mono text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

/** Compute averaged monthly gross from a years table. */
export function averageMonthly(
  years: VariableYearRow[],
  method: "3yr" | "5yr" | "custom",
): number {
  const valid = years.filter((y) => y.amount > 0);
  if (valid.length === 0) return 0;
  const take =
    method === "3yr" ? Math.min(3, valid.length) :
    method === "5yr" ? Math.min(5, valid.length) :
    valid.length;
  const slice = valid.slice(-take);
  const total = slice.reduce((s, y) => s + y.amount, 0);
  return Math.round((total / slice.length / 12) * 100) / 100;
}

export function YearsTable({
  years,
  onChange,
  minRows = 3,
  maxRows = 5,
}: {
  years: VariableYearRow[];
  onChange: (next: VariableYearRow[]) => void;
  minRows?: number;
  maxRows?: number;
}) {
  const rows = years.length === 0
    ? Array.from({ length: minRows }, (_, i) => ({
        year: String(new Date().getFullYear() - (minRows - 1) + i),
        amount: 0,
      }))
    : years;

  const update = (i: number, patch: Partial<VariableYearRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={r.year}
            onChange={(e) => update(i, { year: e.target.value })}
            className="w-20 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            placeholder="Year"
          />
          <div className="flex-1">
            <DollarInput
              value={r.amount}
              onChange={(n) => update(i, { amount: n })}
              placeholder="Annual gross"
            />
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        {rows.length < maxRows && (
          <button
            type="button"
            onClick={() =>
              onChange([
                ...rows,
                { year: String(new Date().getFullYear() - rows.length), amount: 0 },
              ])
            }
            className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          >
            + Add year
          </button>
        )}
        {rows.length > minRows && (
          <button
            type="button"
            onClick={() => onChange(rows.slice(0, -1))}
            className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          >
            − Remove last
          </button>
        )}
      </div>
    </div>
  );
}

export function ApplyBar({
  result,
  canApply,
  onCancel,
  onApply,
  resultLabel = "Monthly gross",
}: {
  result: number;
  canApply: boolean;
  onCancel: () => void;
  onApply: () => void;
  resultLabel?: string;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between rounded-md bg-cream px-3 py-2 text-sm">
        <span className="text-muted-foreground">{resultLabel}</span>
        <span className="font-mono text-base text-ink">${fmt(result)}/mo</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink hover:bg-accent/40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canApply}
          onClick={onApply}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          Use this value
        </button>
      </div>
    </>
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-ink">{label}</span>
      {children}
      {help && <span className="block text-[11px] text-muted-foreground">{help}</span>}
    </label>
  );
}

export const PATH_LABELS = {
  simple: "Simple — steady salary or hourly",
  variable: "Variable — bonuses, commissions, overtime",
  self_employed: "Self-employed — 1099 / K-1 / sole prop",
  multi_source: "Multi-source — several income streams",
  imputed: "Imputed — court may assign income",
  special: "Special situation — SSI, incarcerated, military, federal benefits",
} as const;
