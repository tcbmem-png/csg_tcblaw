import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { SimpleMethodology } from "@/lib/calc/types";
import { ApplyBar, DollarInput, Field } from "./shared";

export function PathSimpleForm({
  label,
  initial,
  onCancel,
  onApply,
}: {
  label: string;
  initial?: SimpleMethodology;
  onCancel: () => void;
  onApply: (monthly: number, m: SimpleMethodology) => void;
}) {
  const [source, setSource] = useState<"w2_box5_annual" | "monthly_gross">(
    initial?.source ?? "w2_box5_annual",
  );
  const [annual, setAnnual] = useState<number>(initial?.w2Box5Annual ?? 0);
  const [monthly, setMonthly] = useState<number>(initial?.monthlyGrossEntered ?? 0);
  const [addBack, setAddBack] = useState<number>(initial?.voluntaryRetirementMonthly ?? 0);

  const baseMonthly =
    source === "w2_box5_annual"
      ? annual > 0
        ? Math.round((annual / 12) * 100) / 100
        : 0
      : monthly;
  const result =
    source === "monthly_gross"
      ? Math.round((baseMonthly + addBack) * 100) / 100
      : baseMonthly;
  const canApply = result > 0;

  return (
    <div className="space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Simple steady income
      </div>

      <label className="flex items-start gap-2">
        <input
          type="radio"
          className="mt-1"
          checked={source === "w2_box5_annual"}
          onChange={() => setSource("w2_box5_annual")}
        />
        <div className="flex-1">
          <div className="font-medium">Annual gross from W-2 Box 5</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            "Medicare wages and tips" — already includes 401(k) / 403(b)
            contributions.
          </div>
          {source === "w2_box5_annual" && (
            <div className="mt-2">
              <DollarInput value={annual} onChange={setAnnual} />
            </div>
          )}
        </div>
      </label>

      <label className="flex items-start gap-2">
        <input
          type="radio"
          className="mt-1"
          checked={source === "monthly_gross"}
          onChange={() => setSource("monthly_gross")}
        />
        <div className="flex-1">
          <div className="font-medium">Current monthly gross pay</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            From the most recent paystub, before deductions.
          </div>
          {source === "monthly_gross" && (
            <div className="mt-2 space-y-2">
              <Field label="Monthly gross pay">
                <DollarInput value={monthly} onChange={setMonthly} />
              </Field>
              <Field
                label="401(k) / other voluntary retirement contributions this month"
                help="Tennessee uses pre-401(k) gross. Enter the amount you contribute monthly; we add it back."
              >
                <DollarInput value={addBack} onChange={setAddBack} />
              </Field>
            </div>
          )}
        </div>
      </label>

      <div className="rounded-md border border-accent/60 bg-accent/10 p-3 text-xs leading-relaxed text-ink">
        <strong>⚠ Box 5 vs Box 1.</strong> Tennessee uses W-2 Box 5, NOT Box 1.{" "}
        <Link
          to="/tn/how-it-works/income"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          Read more →
        </Link>
      </div>

      <ApplyBar
        result={result}
        canApply={canApply}
        onCancel={onCancel}
        onApply={() =>
          onApply(result, {
            path: "simple",
            source,
            w2Box5Annual: source === "w2_box5_annual" ? annual : undefined,
            monthlyGrossEntered: source === "monthly_gross" ? monthly : undefined,
            voluntaryRetirementMonthly:
              source === "monthly_gross" && addBack > 0 ? addBack : undefined,
            monthlyGrossResult: result,
          })
        }
      />
    </div>
  );
}
