import type { CalcInputs, IncomeMethodology } from "@/lib/calc/types";

export function IncomeMethodologyAppendix({ inputs }: { inputs: CalcInputs }) {
  const a = inputs.parentAIncomeMethodology;
  const b = inputs.parentBIncomeMethodology;
  if (!a && !b) return null;

  return (
    <section className="mt-8 rounded-lg border border-rule bg-card p-6 text-sm text-ink print:break-inside-avoid">
      <header className="mb-3 border-b border-rule pb-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Appendix · Income methodology (documented via Income Helper)
        </div>
        <h3 className="mt-1 font-serif text-base text-ink">
          How the gross monthly income figures were derived
        </h3>
      </header>

      <div className="space-y-4">
        {a && (
          <ParentBlock
            label={inputs.parentALabel}
            methodology={a}
            currentMonthly={inputs.parentAGrossMonthly}
          />
        )}
        {b && (
          <ParentBlock
            label={inputs.parentBLabel}
            methodology={b}
            currentMonthly={inputs.parentBGrossMonthly}
          />
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Source authority: Tenn. Comp. R. & Regs. 1240-02-04-.04(3). Tennessee
        uses W-2 Box 5 (Medicare wages), not Box 1.
      </p>
    </section>
  );
}

function ParentBlock({
  label,
  methodology,
  currentMonthly,
}: {
  label: string;
  methodology: IncomeMethodology;
  currentMonthly: number;
}) {
  const stale =
    Math.round(currentMonthly) !== Math.round(methodology.monthlyGrossResult);
  return (
    <div>
      <div className="font-serif text-sm text-ink">{label}</div>
      {methodology.source === "w2_box5_annual" ? (
        <div className="mt-1 font-mono text-[12px] text-ink">
          Source: W-2 Box 5 (Medicare wages)
          <br />
          Annual: ${fmt(methodology.w2Box5Annual ?? 0)} ÷ 12 = $
          {fmt(methodology.monthlyGrossResult)} / month
        </div>
      ) : (
        <div className="mt-1 font-mono text-[12px] text-ink">
          Source: Current monthly gross pay (most recent paystub)
          <br />
          Entered monthly gross: ${fmt(methodology.monthlyGrossResult)} / month
        </div>
      )}
      {stale && (
        <div className="mt-1 text-[11px] text-accent-foreground">
          ⚠ Monthly figure currently in the calculator (${fmt(currentMonthly)})
          differs from the captured methodology. Re-run the helper to keep
          them in sync.
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
