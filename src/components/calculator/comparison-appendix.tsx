import type { CalcInputs, Direction } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import { computeScenarioPair, hasImputation } from "@/lib/calc/scenarios";

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function dir(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} → ${b}`;
  if (d === "parent_b_to_a") return `${b} → ${a}`;
  return "—";
}

/**
 * Printable second-page appendix: side-by-side Imputed vs Actual outcomes
 * with a cumulative-through-age-18 summary. Renders only when at least one
 * parent's income is being imputed.
 */
export function ComparisonAppendix({
  inputs,
  caption,
}: {
  inputs: CalcInputs;
  caption: CaseCaption;
}) {
  if (!hasImputation(inputs)) return null;
  const pair = computeScenarioPair(inputs);
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;
  const months = pair.monthsToEighteen;
  const imp = pair.imputed.outputs;
  const act = pair.actual.outputs;

  const payorIsA = imp.allInMonthlyFromA >= 0;
  const sign = payorIsA ? 1 : -1;
  const cumImp = imp.allInMonthlyFromA * months * sign;
  const cumAct = act.allInMonthlyFromA * months * sign;
  const delta = cumImp - cumAct;

  return (
    <div className="print-page mt-6">
      <div className="rounded-lg border border-rule bg-card text-ink shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-rule px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Appendix A · Imputed vs Actual income
            </div>
            <h2 className="mt-1 font-serif text-xl text-ink">
              Comparison of presumptive support under both scenarios
            </h2>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {caption.matterName ? `${caption.matterName} · ` : ""}
              Youngest child age {inputs.youngestChildAge} ·{" "}
              {(months / 12).toFixed(1)} years remaining to age 18
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>Generated {new Date().toLocaleDateString("en-US")}</div>
            <div>TCB Law TN Child Support Calculator</div>
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b-2 border-primary bg-primary px-3 py-1.5 text-[11px] uppercase tracking-widest text-primary-foreground">
          <div className="font-semibold">Line</div>
          <div className="text-right font-semibold">Imputed scenario</div>
          <div className="text-right font-semibold">Actual scenario</div>
        </div>

        <Row
          label={`${a} gross / mo`}
          imp={`$${fmt(pair.imputed.inputs.parentAGrossMonthly)}`}
          act={`$${fmt(pair.actual.inputs.parentAGrossMonthly)}`}
        />
        <Row
          label={`${b} gross / mo`}
          imp={`$${fmt(pair.imputed.inputs.parentBGrossMonthly)}`}
          act={`$${fmt(pair.actual.inputs.parentBGrossMonthly)}`}
        />
        <Row
          label="Combined AGI / mo"
          imp={`$${fmt(imp.combinedAGI)}`}
          act={`$${fmt(act.combinedAGI)}`}
        />
        <Row
          label={`${a} PI`}
          imp={`${(imp.piA * 100).toFixed(2)}%`}
          act={`${(act.piA * 100).toFixed(2)}%`}
        />
        <Row
          label={`${b} PI`}
          imp={`${(imp.piB * 100).toFixed(2)}%`}
          act={`${(act.piB * 100).toFixed(2)}%`}
        />
        <Row
          label="BCSO / mo"
          imp={`$${fmt(imp.bcso)}`}
          act={`$${fmt(act.bcso)}`}
        />
        <Row
          label="Net presumptive / mo"
          imp={`$${fmt(imp.netPresumptiveSupport)} ${dir(imp.presumptiveDirection, a, b)}`}
          act={`$${fmt(act.netPresumptiveSupport)} ${dir(act.presumptiveDirection, a, b)}`}
        />
        <Row
          label="All-in monthly"
          emphasis
          imp={`$${fmt(imp.allInMonthly)} ${dir(imp.allInDirection, a, b)}`}
          act={`$${fmt(act.allInMonthly)} ${dir(act.allInDirection, a, b)}`}
        />
        <Row
          label="All-in annual"
          imp={`$${fmt(imp.allInAnnual)}`}
          act={`$${fmt(act.allInAnnual)}`}
        />
        <Row
          label={`Cumulative through age 18 (${(months / 12).toFixed(1)} yrs)`}
          emphasis
          imp={`$${fmt(Math.abs(cumImp))}`}
          act={`$${fmt(Math.abs(cumAct))}`}
        />

        <div className="grid grid-cols-[1.4fr_2fr] border-t-2 border-primary bg-cream px-3 py-3 text-[12px]">
          <div className="font-semibold text-ink">
            Lifetime delta (imputed − actual)
          </div>
          <div className="text-right font-mono font-semibold text-ink">
            {delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))} · paid by{" "}
            {payorIsA ? a : b}
          </div>
        </div>

        <div className="border-t border-rule bg-cream px-6 py-4 text-[10px] text-muted-foreground">
          Projection assumes today's monthly order is paid at constant dollars
          until the youngest child reaches age 18. Does not adjust for future
          income changes, age-out modifications, or rule revisions. Provided
          as a negotiation aid; not a forecast and not legal advice.
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  imp,
  act,
  emphasis,
}: {
  label: string;
  imp: string;
  act: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-rule px-3 py-2 text-[12px] " +
        (emphasis ? "bg-cream font-semibold text-ink" : "text-ink")
      }
    >
      <div>{label}</div>
      <div className="text-right font-mono">{imp}</div>
      <div className="text-right font-mono">{act}</div>
    </div>
  );
}
