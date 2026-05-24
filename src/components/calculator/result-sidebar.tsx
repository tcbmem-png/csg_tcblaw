import { useState } from "react";
import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import { useIsUnlocked } from "@/lib/calc/unlock";

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
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  onViewWorksheet: () => void;
}) {
  const unlocked = useIsUnlocked();
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
        <Row label="Combined AGI" value={`$${fmt(outputs.combinedAGI)}/mo`} />
        <Row label="BCSO" value={`$${fmt(outputs.bcso)}`} />
        <Row
          label={`${inputs.parentALabel} PI`}
          value={`${(outputs.piA * 100).toFixed(2)}%`}
        />
        <Row
          label={`${inputs.parentBLabel} PI`}
          value={`${(outputs.piB * 100).toFixed(2)}%`}
        />
      </div>

      <div className="mt-4 rounded-md bg-cream p-3">
        <div className="text-xs text-muted-foreground">All-in monthly</div>
        <div className="font-serif text-2xl text-ink">
          ${fmt(outputs.allInMonthly)}
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
            if (unlocked) {
              setTimeout(() => window.print(), 100);
            }
          }}
          title={unlocked ? undefined : "Unlock the PDF to print or export"}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent/40"
        >
          {unlocked ? "Print / Save PDF" : "🔒 Print / Save PDF — Unlock"}
        </button>
        <CopyLinkButton />
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Schedule effective {outputs.scheduleEffectiveDate}. Not legal advice.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-ink">{value}</span>
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
