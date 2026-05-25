import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { CalcInputs, IncomeMethodology } from "@/lib/calc/types";
import { PATH_LABELS, fmt } from "./income/shared";
import { PathRouter, type PathKey } from "./income/path-router";
import { PathSimpleForm } from "./income/path-simple-form";
import { PathVariableForm } from "./income/path-variable-form";
import { PathSelfEmployedForm } from "./income/path-self-employed-form";
import { PathMultiSourceForm } from "./income/path-multi-source-form";
import { PathImputedForm } from "./income/path-imputed-form";
import { PathSpecialForm } from "./income/path-special-form";

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
  const [activePath, setActivePath] = useState<PathKey | null>(null);

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

  const openFor = (p: ParentKey, path: PathKey) => {
    setActiveParent(p);
    setActivePath(path);
  };
  const close = () => {
    setActiveParent(null);
    setActivePath(null);
  };

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
            Already know each parent's monthly gross? Skip this section. Need
            help — variable pay, self-employment, imputation, or a special
            situation? Click to expand.
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
            Six paths cover every income situation in Tennessee's guidelines.
            Pick the one that fits each parent.
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
              inputs={inputs}
              methodology={aMeth}
              activePath={activeParent === "A" ? activePath : null}
              onPick={(path) => openFor("A", path)}
              onClose={close}
              onApply={(updates) => {
                setInputs({ ...inputs, ...updates });
                close();
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
              inputs={inputs}
              methodology={bMeth}
              activePath={activeParent === "B" ? activePath : null}
              onPick={(path) => openFor("B", path)}
              onClose={close}
              onApply={(updates) => {
                setInputs({ ...inputs, ...updates });
                close();
              }}
              onClear={() => {
                const next = { ...inputs };
                delete next.parentBIncomeMethodology;
                setInputs(next);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ParentCard({
  parent,
  label,
  inputs,
  methodology,
  activePath,
  onPick,
  onClose,
  onApply,
  onClear,
}: {
  parent: ParentKey;
  label: string;
  inputs: CalcInputs;
  methodology: IncomeMethodology | undefined;
  activePath: PathKey | null;
  onPick: (path: PathKey) => void;
  onClose: () => void;
  onApply: (updates: Partial<CalcInputs>) => void;
  onClear: () => void;
}) {
  const currentGross =
    parent === "A" ? inputs.parentAGrossMonthly : inputs.parentBGrossMonthly;
  const initialPath = methodology?.path;

  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-serif text-base text-ink">{label}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Parent {parent}
        </div>
      </div>

      {methodology && !activePath && (
        <MethodologySummary
          methodology={methodology}
          currentMonthly={currentGross}
          onRedo={() => onPick(methodology.path as PathKey)}
          onChangePath={() => onPick("simple")}
          onClear={onClear}
        />
      )}

      {!methodology && !activePath && (
        <div className="mt-3">
          <PathRouter label={label} onPick={onPick} />
        </div>
      )}

      {activePath && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-muted-foreground hover:text-ink"
            >
              ← Back to paths
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {PATH_LABELS[activePath]}
            </span>
          </div>
          <FormFor
            parent={parent}
            label={label}
            path={activePath}
            initial={initialPath === activePath ? methodology : undefined}
            currentGross={currentGross}
            onCancel={onClose}
            onApply={(updates, m) =>
              onApply({
                ...updates,
                [parent === "A" ? "parentAIncomeMethodology" : "parentBIncomeMethodology"]: m,
              } as Partial<CalcInputs>)
            }
          />
        </div>
      )}
    </div>
  );
}

function FormFor({
  parent,
  label,
  path,
  initial,
  currentGross,
  onCancel,
  onApply,
}: {
  parent: ParentKey;
  label: string;
  path: PathKey;
  initial: IncomeMethodology | undefined;
  currentGross: number;
  onCancel: () => void;
  onApply: (updates: Partial<CalcInputs>, m: IncomeMethodology) => void;
}) {
  const applyMonthly = (monthly: number, m: IncomeMethodology) => {
    const updates: Partial<CalcInputs> =
      parent === "A"
        ? { parentAGrossMonthly: monthly }
        : { parentBGrossMonthly: monthly };
    onApply(updates, m);
  };

  if (path === "simple") {
    return (
      <PathSimpleForm
        label={label}
        initial={initial?.path === "simple" ? initial : undefined}
        onCancel={onCancel}
        onApply={applyMonthly}
      />
    );
  }
  if (path === "variable") {
    return (
      <PathVariableForm
        label={label}
        initial={initial?.path === "variable" ? initial : undefined}
        onCancel={onCancel}
        onApply={applyMonthly}
      />
    );
  }
  if (path === "self_employed") {
    return (
      <PathSelfEmployedForm
        label={label}
        initial={initial?.path === "self_employed" ? initial : undefined}
        onCancel={onCancel}
        onApply={applyMonthly}
      />
    );
  }
  if (path === "multi_source") {
    return (
      <PathMultiSourceForm
        label={label}
        initial={initial?.path === "multi_source" ? initial : undefined}
        onCancel={onCancel}
        onApply={applyMonthly}
      />
    );
  }
  if (path === "imputed") {
    return (
      <PathImputedForm
        parent={parent}
        label={label}
        initial={initial?.path === "imputed" ? initial : undefined}
        onCancel={onCancel}
        onApply={onApply}
      />
    );
  }
  return (
    <PathSpecialForm
      parent={parent}
      label={label}
      initial={initial?.path === "special" ? initial : undefined}
      currentGross={currentGross}
      onCancel={onCancel}
      onApply={onApply}
    />
  );
}

function MethodologySummary({
  methodology,
  currentMonthly,
  onRedo,
  onChangePath,
  onClear,
}: {
  methodology: IncomeMethodology;
  currentMonthly: number;
  onRedo: () => void;
  onChangePath: () => void;
  onClear: () => void;
}) {
  const stale =
    Math.round(currentMonthly) !== Math.round(methodology.monthlyGrossResult);
  return (
    <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {PATH_LABELS[methodology.path]} · documented
      </div>
      <div className="mt-1">
        <SummaryLine m={methodology} />
      </div>
      {stale && (
        <div className="mt-2 text-[11px] text-accent-foreground">
          ⚠ The monthly figure has been edited directly in the calculator since
          this was captured. Re-run the helper or clear the methodology to
          avoid mismatched worksheet notes.
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRedo}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-ink hover:bg-accent/40"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onChangePath}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-ink hover:bg-accent/40"
        >
          Change path
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

function SummaryLine({ m }: { m: IncomeMethodology }) {
  if (m.path === "simple") {
    if (m.source === "w2_box5_annual") {
      return (
        <>
          W-2 Box 5: <span className="font-mono">${fmt(m.w2Box5Annual ?? 0)}/yr</span>{" "}
          ÷ 12 = <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
        </>
      );
    }
    return (
      <>
        Monthly gross{m.voluntaryRetirementMonthly ? ` + $${fmt(m.voluntaryRetirementMonthly)} 401(k) add-back` : ""}:{" "}
        <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
      </>
    );
  }
  if (m.path === "variable") {
    return (
      <>
        {m.averagingMethod === "3yr" ? "3-year" : m.averagingMethod === "5yr" ? "5-year" : "Custom"} average ={" "}
        <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
      </>
    );
  }
  if (m.path === "self_employed") {
    return (
      <>
        Receipts − expenses + add-backs ={" "}
        <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
      </>
    );
  }
  if (m.path === "multi_source") {
    return (
      <>
        {m.sources.length} source{m.sources.length === 1 ? "" : "s"} ={" "}
        <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
      </>
    );
  }
  if (m.path === "imputed") {
    return (
      <>
        Imputed <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span> vs actual{" "}
        <span className="font-mono">${fmt(m.actualMonthlyGross)}/mo</span>
      </>
    );
  }
  // special
  return (
    <>
      {m.situation.replace(/_/g, " ")}:{" "}
      <span className="font-mono">${fmt(m.monthlyGrossResult)}/mo</span>
    </>
  );
}
