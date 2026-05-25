import { useState } from "react";
import type { MSInputs, MSOutputs } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import { useIsUnlocked } from "@/lib/calc/unlock";
import { downloadMSDeviationPdf } from "@/lib/pdf/ms-deviation-pdf";

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmt2(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MSResultSidebar({
  inputs,
  outputs,
  caption,
  onViewWorksheet,
}: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  onViewWorksheet: () => void;
}) {
  const unlocked = useIsUnlocked();
  const sideBySide =
    inputs.comparisonMode === "side_by_side" && outputs.positionB;
  const anyDeviations = inputs.deviationsA.some((d) => d.applicable);

  return (
    <div className="rounded-lg border border-rule bg-card p-5 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Live result
      </div>

      {outputs.suspensionApplies ? (
        <>
          <div className="mt-1 font-serif text-sm text-ink">
            § 43-19-36 finding
          </div>
          <div className="mt-2 font-serif text-2xl text-primary">
            Obligation suspended
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            By operation of law during incarceration exceeding 180 days.
            Resumes the first day of the month following 60 days after release.
          </p>
        </>
      ) : sideBySide ? (
        <>
          <div className="mt-1 font-serif text-sm text-ink">
            Side-by-side comparison
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <Row
              label={`${inputs.positionALabel} / mo`}
              value={`$${fmt(outputs.proposedFinalMonthly)}`}
            />
            <Row
              label={`${inputs.positionBLabel} / mo`}
              value={`$${fmt(outputs.positionB!.proposedFinalMonthly)}`}
            />
            <Row
              label="Gap / mo"
              value={`$${fmt(
                outputs.proposedFinalMonthly -
                  outputs.positionB!.proposedFinalMonthly,
              )}`}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mt-1 font-serif text-sm text-ink">
            Proposed monthly support
          </div>
          <div className="mt-2 font-serif text-4xl text-primary">
            ${fmt(outputs.proposedFinalMonthly)}
            <span className="text-base text-muted-foreground"> /mo</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {inputs.obligorLabel} → {inputs.obligeeLabel}
          </div>
        </>
      )}

      <div className="mt-6 space-y-2 border-t border-rule pt-4 text-sm">
        <Row
          label={inputs.agiBasis === "imputed" ? "Annual AGI (imputed)" : "Annual AGI"}
          value={`$${fmt(outputs.annualAGI)}`}
        />
        <Row label="Monthly AGI" value={`$${fmt2(outputs.monthlyAGI)}`} />
        <Row
          label={`Statutory % (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"})`}
          value={`${(outputs.statutoryPercentage * 100).toFixed(0)}%`}
        />
        <Row label="Presumptive / mo" value={`$${fmt2(outputs.presumptiveMonthly)}`} />
        {outputs.healthInsuranceAddOnMonthly > 0 && (
          <Row
            label="Health insurance add-on"
            value={`+$${fmt2(outputs.healthInsuranceAddOnMonthly)}`}
          />
        )}
        {!outputs.suspensionApplies && outputs.totalDeviationsMonthly !== 0 && (
          <Row
            label="Net deviations"
            value={`${outputs.totalDeviationsMonthly < 0 ? "-" : "+"}$${fmt2(Math.abs(outputs.totalDeviationsMonthly))}`}
          />
        )}
      </div>

      {!outputs.suspensionApplies && !sideBySide && (
        <div className="mt-4 rounded-md bg-cream p-3">
          <div className="text-xs text-muted-foreground">Annualized</div>
          <div className="font-serif text-2xl text-ink">
            ${fmt(outputs.proposedFinalMonthly * 12)}
            <span className="text-sm text-muted-foreground"> / yr</span>
          </div>
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
            if (unlocked) setTimeout(() => window.print(), 100);
          }}
          title={unlocked ? undefined : "Unlock the PDF to print or export"}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent/40"
        >
          {unlocked ? "Print / Save PDF" : "🔒 Print / Save PDF — Unlock"}
        </button>
        {anyDeviations && (
          <button
            type="button"
            onClick={() => downloadMSDeviationPdf({ inputs, outputs, caption })}
            className="w-full rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Download deviation worksheet (PDF)
          </button>
        )}
        <CopyLinkButton />
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Guidelines effective {outputs.guidelinesEffectiveDate}. Not legal advice.
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
