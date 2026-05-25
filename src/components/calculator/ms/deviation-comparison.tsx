import type { MSInputs } from "@/lib/calc/ms/types";

const TITLES: Record<string, string> = {
  a: "Extraordinary expenses",
  b: "Independent income of child",
  c: "Child support + spousal support",
  d: "Seasonal variation",
  e: "Age of child",
  f: "Special needs in family budget",
  g: "Shared parental arrangement",
  h: "Available assets",
  i: "Obligee child-care costs",
  j: "Other equitable adjustment",
};

function fmt(n: number): string {
  const a = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${a})` : `$${a}`;
}

/**
 * Side-by-side deviation comparison view (Phase 2). Shows both positions per
 * factor with per-factor gap, plus an aggregate gap summary.
 */
export function MSDeviationComparison({ inputs }: { inputs: MSInputs }) {
  if (inputs.comparisonMode !== "side_by_side" || !inputs.deviationsB) {
    return null;
  }
  const slateA = inputs.deviationsA;
  const slateB = inputs.deviationsB;

  let totalA = 0;
  let totalB = 0;

  const rows = slateA.map((dA, i) => {
    const dB = slateB[i];
    const a = dA.applicable ? dA.proposedMonthly : 0;
    const b = dB?.applicable ? dB.proposedMonthly : 0;
    totalA += a;
    totalB += b;
    return { letter: dA.letter, a, b, descA: dA.description, descB: dB?.description ?? "", anyApplicable: dA.applicable || (dB?.applicable ?? false) };
  });

  const activeRows = rows.filter((r) => r.anyApplicable);
  const gap = totalA - totalB;

  return (
    <div className="rounded-lg border border-rule bg-background p-5">
      <h3 className="font-serif text-lg text-ink">
        Proposed Deviation Comparison
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {inputs.positionALabel} vs {inputs.positionBLabel}. Both positions are
        proposals; the chancellor retains discretion under § 43-19-103.
      </p>
      {activeRows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No deviations marked applicable on either side.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {activeRows.map((r) => (
            <div key={r.letter} className="rounded-md border border-rule">
              <div className="border-b border-rule bg-cream px-3 py-2 text-sm font-medium text-ink">
                ({r.letter}) {TITLES[r.letter]}
              </div>
              <div className="grid grid-cols-2 divide-x divide-rule">
                <PositionCell label={inputs.positionALabel} amount={r.a} desc={r.descA} />
                <PositionCell label={inputs.positionBLabel} amount={r.b} desc={r.descB} />
              </div>
              <div className="border-t border-rule bg-background px-3 py-2 text-xs text-muted-foreground">
                Gap: <span className="font-mono text-ink">{fmt(r.a - r.b)}</span> / mo •{" "}
                Annual: <span className="font-mono text-ink">{fmt((r.a - r.b) * 12)}</span>
              </div>
            </div>
          ))}
          <div className="rounded-md border border-rule bg-cream p-4 text-sm">
            <div className="flex justify-between"><span>{inputs.positionALabel} total / mo</span><span className="font-mono">{fmt(totalA)}</span></div>
            <div className="flex justify-between"><span>{inputs.positionBLabel} total / mo</span><span className="font-mono">{fmt(totalB)}</span></div>
            <div className="mt-2 flex justify-between border-t border-rule pt-2 font-medium">
              <span>Aggregate gap</span><span className="font-mono">{fmt(gap)} / mo</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Annualized aggregate gap</span><span className="font-mono">{fmt(gap * 12)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PositionCell({ label, amount, desc }: { label: string; amount: number; desc: string }) {
  return (
    <div className="p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-base text-ink">{fmt(amount)} / mo</div>
      {desc && <div className="mt-1 text-xs text-muted-foreground">{desc}</div>}
    </div>
  );
}
