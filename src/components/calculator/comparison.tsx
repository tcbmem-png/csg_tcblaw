import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import { computeScenarioPair, hasImputation } from "@/lib/calc/scenarios";

function fmt$(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function dir(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} → ${b}`;
  if (d === "parent_b_to_a") return `${b} → ${a}`;
  return "—";
}

/** Cumulative dollars flowing FROM Parent A across months 0..N. */
function cumulativeFromA(outputs: CalcOutputs, months: number) {
  const m = outputs.allInMonthlyFromA;
  const points = [];
  for (let i = 0; i <= months; i += 1) {
    const yr = i / 12;
    points.push({ year: Number(yr.toFixed(2)), amount: m * i });
  }
  return points;
}

export function ComparisonView({ inputs }: { inputs: CalcInputs }) {
  const pair = useMemo(() => computeScenarioPair(inputs), [inputs]);

  if (!hasImputation(inputs)) {
    return (
      <div className="rounded-lg border border-rule bg-card p-8 text-center">
        <h3 className="font-serif text-xl text-ink">No imputation set</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Turn on <em>"Impute income"</em> for {inputs.parentALabel} or{" "}
          {inputs.parentBLabel} on the Inputs tab. Enter the imputed figure as
          the gross monthly income and the parent's real earnings as the{" "}
          <em>actual</em> figure. This view then compares both outcomes.
        </p>
      </div>
    );
  }

  const months = pair.monthsToEighteen;
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  // Build merged chart data: cumulative from A's perspective. To make the
  // chart intuitive regardless of direction we plot the *magnitude* of net
  // transfer paid by whichever parent is the payor in the imputed scenario.
  const payorIsA = pair.imputed.outputs.allInMonthlyFromA >= 0;
  const sign = payorIsA ? 1 : -1;
  const imputedPts = cumulativeFromA(pair.imputed.outputs, months);
  const actualPts = cumulativeFromA(pair.actual.outputs, months);
  const data = imputedPts.map((p, i) => ({
    year: p.year,
    imputed: p.amount * sign,
    actual: (actualPts[i]?.amount ?? 0) * sign,
  }));

  const cumImputed = pair.imputed.outputs.allInMonthlyFromA * months * sign;
  const cumActual = pair.actual.outputs.allInMonthlyFromA * months * sign;
  const lifetimeDelta = cumImputed - cumActual;

  return (
    <div className="space-y-6">
      <SideBySide
        a={a}
        b={b}
        imputed={pair.imputed.outputs}
        actual={pair.actual.outputs}
      />

      <div className="rounded-lg border border-rule bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg text-ink">
              Cumulative support — through age 18
            </h3>
            <p className="text-xs text-muted-foreground">
              Youngest child is {inputs.youngestChildAge} ·{" "}
              {(months / 12).toFixed(1)} years remaining ·{" "}
              {payorIsA ? `${a} pays ${b}` : `${b} pays ${a}`}
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Lifetime delta
            </div>
            <div
              className={
                "font-serif text-2xl " +
                (lifetimeDelta >= 0 ? "text-primary" : "text-accent")
              }
            >
              {lifetimeDelta >= 0 ? "+" : "−"}${fmt$(Math.abs(lifetimeDelta))}
            </div>
            <div className="text-[11px] text-muted-foreground">
              imputed vs actual
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--rule))" strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tickFormatter={(v) => `${v}y`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <Tooltip
                formatter={(v: number) => `$${fmt$(v)}`}
                labelFormatter={(v) => `Year ${v}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--rule))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="imputed"
                name="Imputed scenario"
                stroke="hsl(var(--primary))"
                fill="url(#gImp)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual scenario"
                stroke="hsl(var(--accent))"
                fill="url(#gAct)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-3 border-t border-rule pt-4 text-sm sm:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Imputed cumulative
            </div>
            <div className="font-serif text-xl text-ink">
              ${fmt$(Math.abs(cumImputed))}
            </div>
            <div className="text-xs text-muted-foreground">
              {dir(pair.imputed.outputs.allInDirection, a, b)}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Actual cumulative
            </div>
            <div className="font-serif text-xl text-ink">
              ${fmt$(Math.abs(cumActual))}
            </div>
            <div className="text-xs text-muted-foreground">
              {dir(pair.actual.outputs.allInDirection, a, b)}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The chart projects today's monthly order at constant dollars. It does
        not adjust for future income changes, age-out modifications, or
        statutory rule revisions. Use as a negotiation lens, not a forecast.
      </p>
    </div>
  );
}

function SideBySide({
  a,
  b,
  imputed,
  actual,
}: {
  a: string;
  b: string;
  imputed: CalcOutputs;
  actual: CalcOutputs;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-card">
      <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-rule bg-primary text-[11px] uppercase tracking-widest text-primary-foreground">
        <div className="px-4 py-2 font-semibold">Line</div>
        <div className="px-4 py-2 text-right font-semibold">Imputed</div>
        <div className="px-4 py-2 text-right font-semibold">Actual</div>
      </div>
      <Row label="Combined AGI / mo" imp={`$${fmt$(imputed.combinedAGI)}`} act={`$${fmt$(actual.combinedAGI)}`} />
      <Row label={`${a} PI`} imp={`${(imputed.piA * 100).toFixed(2)}%`} act={`${(actual.piA * 100).toFixed(2)}%`} />
      <Row label={`${b} PI`} imp={`${(imputed.piB * 100).toFixed(2)}%`} act={`${(actual.piB * 100).toFixed(2)}%`} />
      <Row label="BCSO / mo" imp={`$${fmt$(imputed.bcso)}`} act={`$${fmt$(actual.bcso)}`} />
      <Row
        label="Net presumptive"
        imp={`$${fmt$(imputed.netPresumptiveSupport)} ${dir(imputed.presumptiveDirection, a, b)}`}
        act={`$${fmt$(actual.netPresumptiveSupport)} ${dir(actual.presumptiveDirection, a, b)}`}
      />
      <Row
        label="All-in monthly"
        emphasis
        imp={`$${fmt$(imputed.allInMonthly)} ${dir(imputed.allInDirection, a, b)}`}
        act={`$${fmt$(actual.allInMonthly)} ${dir(actual.allInDirection, a, b)}`}
      />
      <Row
        label="All-in annual"
        imp={`$${fmt$(imputed.allInAnnual)}`}
        act={`$${fmt$(actual.allInAnnual)}`}
      />
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
        "grid grid-cols-[1.4fr_1fr_1fr] border-b border-rule text-sm last:border-b-0 " +
        (emphasis ? "bg-cream font-semibold text-ink" : "text-ink")
      }
    >
      <div className="px-4 py-2.5">{label}</div>
      <div className="px-4 py-2.5 text-right font-mono">{imp}</div>
      <div className="px-4 py-2.5 text-right font-mono">{act}</div>
    </div>
  );
}
