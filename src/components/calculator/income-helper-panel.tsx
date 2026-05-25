import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { CalcInputs, IncomeMethodology } from "@/lib/calc/types";

const STORAGE_KEY = "tn.incomeHelper.expanded";

type Setter = (next: CalcInputs) => void;
type ParentKey = "A" | "B";

export function IncomeHelperPanel({
  inputs,
  setInputs,
}: {
  inputs: CalcInputs;
  setInputs: Setter;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeParent, setActiveParent] = useState<ParentKey | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") setExpanded(true);
    } catch {
      /* ignore */
    }
  }, []);

  const persistExpanded = (next: boolean) => {
    setExpanded(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
  };

  const aMeth = inputs.parentAIncomeMethodology;
  const bMeth = inputs.parentBIncomeMethodology;

  return (
    <section className="mb-6 rounded-lg border border-rule bg-card shadow-sm">
      <button
        type="button"
        onClick={() => persistExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Step 1 · Optional
          </div>
          <h2 className="mt-1 font-serif text-lg text-ink">Income Helper</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already know each parent's monthly gross income? Skip this section.
            Need help figuring it out (especially the W-2 Box 5 gotcha)? Click
            to expand.
          </p>
        </div>
        <span
          aria-hidden
          className="mt-1 shrink-0 rounded-md border border-rule px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          {expanded ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-rule px-6 py-5">
          <p className="text-sm text-ink">
            We'll help you figure out monthly gross income for each parent
            using Tennessee's rules. This number flows into the calculation
            below.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Want the law first?{" "}
            <Link
              to="/tn/how-it-works/income"
              className="underline decoration-rule underline-offset-2 hover:text-primary"
            >
              How Tennessee calculates income →
            </Link>
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ParentCard
              parent="A"
              label={inputs.parentALabel}
              currentMonthly={inputs.parentAGrossMonthly}
              methodology={aMeth}
              active={activeParent === "A"}
              onOpen={() => setActiveParent("A")}
              onClose={() => setActiveParent(null)}
              onApply={(monthly, methodology) => {
                setInputs({
                  ...inputs,
                  parentAGrossMonthly: monthly,
                  parentAIncomeMethodology: methodology,
                });
                setActiveParent(null);
              }}
              onClear={() => {
                const next = { ...inputs };
                delete next.parentAIncomeMethodology;
                setInputs(next);
              }}
            />
            <ParentCard
              parent="B"
              label={inputs.parentBLabel}
              currentMonthly={inputs.parentBGrossMonthly}
              methodology={bMeth}
              active={activeParent === "B"}
              onOpen={() => setActiveParent("B")}
              onClose={() => setActiveParent(null)}
              onApply={(monthly, methodology) => {
                setInputs({
                  ...inputs,
                  parentBGrossMonthly: monthly,
                  parentBIncomeMethodology: methodology,
                });
                setActiveParent(null);
              }}
              onClear={() => {
                const next = { ...inputs };
                delete next.parentBIncomeMethodology;
                setInputs(next);
              }}
            />
          </div>

          <p className="mt-5 rounded-md border border-rule bg-cream p-3 text-[11px] leading-relaxed text-muted-foreground">
            Phase 1 covers the steady-income (W-2) path. Variable income,
            self-employment, imputation, and special-situation flows are
            coming in later phases. Until then, enter those parents' figures
            directly in the calculator below.
          </p>
        </div>
      )}
    </section>
  );
}

function ParentCard({
  parent,
  label,
  currentMonthly,
  methodology,
  active,
  onOpen,
  onClose,
  onApply,
  onClear,
}: {
  parent: ParentKey;
  label: string;
  currentMonthly: number;
  methodology: IncomeMethodology | undefined;
  active: boolean;
  onOpen: () => void;
  onClose: () => void;
  onApply: (monthly: number, methodology: IncomeMethodology) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-serif text-base text-ink">{label}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Parent {parent}
        </div>
      </div>

      {methodology && !active ? (
        <MethodologySummary
          methodology={methodology}
          currentMonthly={currentMonthly}
          onRedo={onOpen}
          onClear={onClear}
        />
      ) : !active ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Set up {label}'s income →
        </button>
      ) : null}

      {active && (
        <SimplePathForm
          label={label}
          initial={methodology}
          onCancel={onClose}
          onApply={onApply}
        />
      )}
    </div>
  );
}

function MethodologySummary({
  methodology,
  currentMonthly,
  onRedo,
  onClear,
}: {
  methodology: IncomeMethodology;
  currentMonthly: number;
  onRedo: () => void;
  onClear: () => void;
}) {
  const stale =
    Math.round(currentMonthly) !== Math.round(methodology.monthlyGrossResult);
  return (
    <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
        Income source documented
      </div>
      {methodology.source === "w2_box5_annual" ? (
        <div className="mt-1">
          W-2 Box 5 (Medicare wages):{" "}
          <span className="font-mono">
            ${fmt(methodology.w2Box5Annual ?? 0)}/yr
          </span>{" "}
          ÷ 12 ={" "}
          <span className="font-mono">
            ${fmt(methodology.monthlyGrossResult)}/mo
          </span>
        </div>
      ) : (
        <div className="mt-1">
          Current monthly gross:{" "}
          <span className="font-mono">
            ${fmt(methodology.monthlyGrossResult)}/mo
          </span>
        </div>
      )}
      {stale && (
        <div className="mt-2 text-[11px] text-accent-foreground">
          ⚠ The monthly figure has been edited directly in the calculator since
          this was captured. Re-run the helper or clear the methodology to
          avoid mismatched worksheet notes.
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onRedo}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-ink hover:bg-accent/40"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function SimplePathForm({
  label,
  initial,
  onCancel,
  onApply,
}: {
  label: string;
  initial?: IncomeMethodology;
  onCancel: () => void;
  onApply: (monthly: number, methodology: IncomeMethodology) => void;
}) {
  const [source, setSource] = useState<"w2_box5_annual" | "monthly_gross">(
    initial?.source ?? "w2_box5_annual",
  );
  const [annual, setAnnual] = useState<number>(initial?.w2Box5Annual ?? 0);
  const [monthly, setMonthly] = useState<number>(
    initial?.monthlyGrossEntered ?? 0,
  );

  const result =
    source === "w2_box5_annual"
      ? annual > 0
        ? Math.round((annual / 12) * 100) / 100
        : 0
      : monthly;

  const canApply = result > 0;

  return (
    <div className="mt-3 space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Simple steady income
      </div>

      <div className="space-y-2">
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
              "Medicare wages and tips" — compensation BEFORE any voluntary
              retirement contributions (401(k), 403(b), etc).
            </div>
            {source === "w2_box5_annual" && (
              <DollarInput value={annual} onChange={setAnnual} />
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
              Gross pay from your most recent paystub, before deductions. If
              you contribute to a 401(k) or similar plan, add those
              contributions back.
            </div>
            {source === "monthly_gross" && (
              <DollarInput value={monthly} onChange={setMonthly} />
            )}
          </div>
        </label>
      </div>

      <div className="rounded-md border border-accent/60 bg-accent/10 p-3 text-xs leading-relaxed text-ink">
        <strong>⚠ Box 5 vs Box 1.</strong> Tennessee uses W-2 Box 5, NOT
        Box 1. If your annual salary is $100,000 and you contribute $20,000 to
        a 401(k), Box 1 says $80,000 but Box 5 says $100,000. For child
        support purposes, you owe on $100,000.{" "}
        <Link
          to="/tn/how-it-works/income"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          Read more →
        </Link>
      </div>

      <div className="flex items-baseline justify-between rounded-md bg-cream px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          Calculated monthly gross income
        </span>
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
          onClick={() =>
            onApply(result, {
              path: "simple",
              source,
              w2Box5Annual: source === "w2_box5_annual" ? annual : undefined,
              monthlyGrossEntered:
                source === "monthly_gross" ? monthly : undefined,
              monthlyGrossResult: result,
            })
          }
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          Use this value
        </button>
      </div>
    </div>
  );
}

function DollarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <span className="mr-1 text-muted-foreground">$</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
        value={value === 0 ? "" : value.toLocaleString("en-US")}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          const n = parseFloat(raw);
          onChange(isNaN(n) ? 0 : n);
        }}
      />
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
