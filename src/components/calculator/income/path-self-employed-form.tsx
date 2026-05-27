import { useState } from "react";
import type {
  SelfEmployedAddBack,
  SelfEmployedMethodology,
} from "@/lib/calc/types";
import { ApplyBar, DollarInput, Field, TextInput, fmt } from "./shared";

const DEFAULT_ADD_BACK_LABELS = [
  "Depreciation",
  "§179 expense",
  "Vehicle (personal portion)",
  "Meals (personal portion)",
  "Home office (personal portion)",
];

export function PathSelfEmployedForm({
  label,
  initial,
  onCancel,
  onApply,
}: {
  label: string;
  initial?: SelfEmployedMethodology;
  onCancel: () => void;
  onApply: (monthly: number, m: SelfEmployedMethodology) => void;
}) {
  const [businessType, setBusinessType] = useState<string>(initial?.businessType ?? "");
  const [gross, setGross] = useState<number>(initial?.grossReceiptsAnnual ?? 0);
  const [expenses, setExpenses] = useState<number>(initial?.ordinaryExpensesAnnual ?? 0);
  const [addBacks, setAddBacks] = useState<SelfEmployedAddBack[]>(
    initial?.addBacks ?? DEFAULT_ADD_BACK_LABELS.map((l) => ({ label: l, amount: 0 })),
  );

  const addBacksTotal = addBacks.reduce((s, a) => s + (a.amount > 0 ? a.amount : 0), 0);
  const annual = Math.max(0, gross - expenses + addBacksTotal);
  const result = Math.round((annual / 12) * 100) / 100;
  const canApply = result > 0;

  const updateRow = (i: number, patch: Partial<SelfEmployedAddBack>) =>
    setAddBacks(addBacks.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Self-employment income
      </div>
      <p className="text-xs text-muted-foreground">
        Rule .04(3)(a)(3): TN self-employment gross = gross receipts − ordinary
        and necessary expenses + add-backs (depreciation, §179, personal-use
        portions). Verify against the underlying Schedule C / K-1.
      </p>

      <Field label="Business type / entity (optional)">
        <TextInput
          value={businessType}
          onChange={setBusinessType}
          placeholder="e.g., Sole prop — landscaping LLC"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Gross receipts (annual)">
          <DollarInput value={gross} onChange={setGross} />
        </Field>
        <Field label="Ordinary & necessary expenses (annual)">
          <DollarInput value={expenses} onChange={setExpenses} />
        </Field>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Add-backs (annual)</div>
        <div className="space-y-1.5">
          {addBacks.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(i, { label: e.target.value })}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-ink outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="w-40">
                <DollarInput
                  value={row.amount}
                  onChange={(n) => updateRow(i, { amount: n })}
                />
              </div>
              <button
                type="button"
                onClick={() => setAddBacks(addBacks.filter((_, idx) => idx !== i))}
                className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAddBacks([...addBacks, { label: "", amount: 0 }])}
            className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          >
            + Add line
          </button>
        </div>
      </div>

      <div className="rounded-md bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
        ${fmt(gross)} − ${fmt(expenses)} + ${fmt(addBacksTotal)} = $
        {fmt(annual)} / yr
      </div>

      <ApplyBar
        result={result}
        canApply={canApply}
        onCancel={onCancel}
        onApply={() =>
          onApply(result, {
            path: "self_employed",
            businessType: businessType.trim() || undefined,
            grossReceiptsAnnual: gross,
            ordinaryExpensesAnnual: expenses,
            addBacks: addBacks.filter((r) => r.label.trim() && r.amount > 0),
            monthlyGrossResult: result,
          })
        }
      />
    </div>
  );
}
