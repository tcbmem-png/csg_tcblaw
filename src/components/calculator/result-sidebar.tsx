import { useState } from "react";
import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import { computeScenarioPair, hasImputation } from "@/lib/calc/scenarios";
import { citationForBcso } from "@/lib/calc/citation-resolvers";
import { RuleInfo } from "./rule-info";

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function directionLabel(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} → ${b}`;
  if (d === "parent_b_to_a") return `${b} → ${a}`;
  return "—";
}

export function ResultSidebar({
  inputs,
  outputs,
  onViewWorksheet,
  onViewComparison,
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  onViewWorksheet: () => void;
  onViewComparison?: () => void;
}) {
  return (
    <div className="rounded-lg border border-rule bg-card p-5 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Live result
      </div>
      <div className="mt-1 font-serif text-sm text-ink">Net presumptive support</div>
      <div className="mt-2 font-serif text-4xl text-primary">
        ${fmt(outputs.netPresumptiveSupport)}
        <span className="text-base text-muted-foreground"> /mo</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {directionLabel(
          outputs.presumptiveDirection,
          inputs.parentALabel,
          inputs.parentBLabel,
        )}
      </div>

      <div className="mt-6 space-y-2 border-t border-rule pt-4 text-sm">
        <Row label="Combined AGI" value={`$${fmt(outputs.combinedAGI)}/mo`} citation="agi" />
        <Row label="BCSO" value={`$${fmt(outputs.bcso)}`} citation={citationForBcso(outputs)} />
        <Row
          label={`${inputs.parentALabel} PI`}
          value={`${(outputs.piA * 100).toFixed(2)}%`}
          citation="pro_rata"
        />
        <Row
          label={`${inputs.parentBLabel} PI`}
          value={`${(outputs.piB * 100).toFixed(2)}%`}
          citation="pro_rata"
        />
      </div>

      <div className="mt-4 rounded-md bg-cream p-3">
        <div className="text-xs text-muted-foreground">All-in monthly</div>
        <div className="flex items-center gap-1.5 font-serif text-2xl text-ink">
          ${fmt(outputs.allInMonthly)}
          <RuleInfo citation="fcso" />
        </div>
        <div className="text-xs text-muted-foreground">
          {directionLabel(
            outputs.allInDirection,
            inputs.parentALabel,
            inputs.parentBLabel,
          )}
          {" · "}
          ${fmt(outputs.allInAnnual)}/yr
        </div>
      </div>

      {hasImputation(inputs) && onViewComparison && (
        <ImputationMiniSummary
          inputs={inputs}
          outputs={outputs}
          onViewComparison={onViewComparison}
        />
      )}

      {outputs.pcsoExceedsStatutoryMax && (
        <div className="mt-4 rounded-md border border-accent/60 bg-accent/10 p-3 text-xs leading-relaxed text-ink">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Statutory cap check · §36-5-101(e)(1)(B)
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span>Calculated PCSO</span>
              <span className="font-mono">${fmt(Math.abs(outputs.allInMonthlyFromA) + Math.abs(outputs.federalBenefitOffsetFromA))}/mo</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span>Statutory cap ({inputs.numChildren} {inputs.numChildren === 1 ? "child" : "children"})</span>
              <span className="font-mono">${fmt(outputs.pcsoStatutoryMax)}/mo</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-rule pt-1 font-semibold">
              <span>Excess (recipient's burden)</span>
              <span className="font-mono">${fmt(outputs.pcsoExcessOverCap)}/mo</span>
            </div>
          </div>
          {outputs.pcsoCapNote && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] underline-offset-2 hover:underline">
                How the statutory cap works
              </summary>
              <p className="mt-2 text-[11px] leading-relaxed">{outputs.pcsoCapNote}</p>
            </details>
          )}
        </div>
      )}

      {!outputs.pcsoExceedsStatutoryMax && outputs.pcsoBelowCapNote && (
        <div className="mt-4 rounded-md border border-rule bg-cream p-3 text-[11px] leading-relaxed text-muted-foreground">
          {outputs.pcsoBelowCapNote}
        </div>
      )}

      {outputs.equalParentingLowSupportNote && (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
          <div className="mb-1 font-semibold">Why is this support amount so low?</div>
          {outputs.equalParentingLowSupportNote}
        </div>
      )}

      {outputs.nonEarnerArpNote && (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
          <div className="mb-1 font-semibold">Why is presumptive support $0?</div>
          {outputs.nonEarnerArpNote}
        </div>
      )}

      {outputs.zeroPresumptiveNote && (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
          <div className="mb-1 font-semibold">Why doesn't the $100 minimum apply?</div>
          {outputs.zeroPresumptiveNote}
        </div>
      )}

      {outputs.warnings.length > 0 && (
        <ul className="mt-4 space-y-2 rounded-md border border-accent/50 bg-accent/10 p-3 text-xs text-ink">
          {outputs.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onViewWorksheet}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View worksheet
        </button>
        <button
          type="button"
          onClick={() => {
            onViewWorksheet();
            setTimeout(() => window.print(), 100);
          }}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent/40"
        >
          Print / Save PDF
        </button>
        <CopyLinkButton />
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Schedule effective {outputs.scheduleEffectiveDate}. Not legal advice.
      </p>
    </div>
  );
}

function Row({ label, value, citation }: { label: string; value: string; citation?: import("@/lib/calc/citations").CitationKey }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-mono text-ink">
        {value}
        {citation && <RuleInfo citation={citation} />}
      </span>
    </div>
  );
}

function ImputationMiniSummary({
  inputs,
  outputs,
  onViewComparison,
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  onViewComparison: () => void;
}) {
  const pair = computeScenarioPair(inputs);
  const actualNet = pair.actual.outputs.netPresumptiveSupport;
  // Use current outputs as the active "imputed" row so this matches what's
  // displayed in the main result number above.
  const activeImputed = outputs.netPresumptiveSupport;
  const delta = activeImputed - actualNet;
  return (
    <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Imputed vs actual · Rule .04(3)(a)(2)
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Imputed
          </div>
          <div className="font-mono text-sm text-ink">
            ${fmt(activeImputed)}/mo
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Actual
          </div>
          <div className="font-mono text-sm text-ink">
            ${fmt(actualNet)}/mo
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-2">
        <span className="text-[11px] text-muted-foreground">Difference</span>
        <span className="font-mono text-[11px] text-ink">
          {delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))}/mo
        </span>
      </div>
      <button
        type="button"
        onClick={onViewComparison}
        className="mt-2 text-[11px] text-primary underline-offset-2 hover:underline"
      >
        See full comparison →
      </button>
    </div>
  );
}

function CopyLinkButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const onClick = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 1800);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent/40"
    >
      {status === "copied"
        ? "✓ Link copied"
        : status === "error"
          ? "Copy failed — select URL bar"
          : "Copy shareable link"}
    </button>
  );
}
