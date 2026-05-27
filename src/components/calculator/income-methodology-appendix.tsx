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
          How each parent's monthly gross figure was derived
        </h3>
      </header>

      <div className="space-y-5">
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
        Authority: Tenn. Comp. R. & Regs. 1240-02-04-.04(3). Tennessee uses
        W-2 Box 5 (Medicare wages), not Box 1. Imputation requires written
        rationale under Rule .04(3)(a)(2). Self-employment add-backs are
        subject to verification against the underlying business return.
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
      <div className="mt-1 font-mono text-[12px] text-ink">
        <PathBody m={methodology} />
      </div>
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

function PathBody({ m }: { m: IncomeMethodology }) {
  if (m.path === "simple") {
    if (m.source === "w2_box5_annual") {
      return (
        <>
          Source: W-2 Box 5 (Medicare wages)
          <br />
          Annual: ${fmt(m.w2Box5Annual ?? 0)} ÷ 12 = ${fmt(m.monthlyGrossResult)} / month
        </>
      );
    }
    return (
      <>
        Source: Current monthly gross pay (most recent paystub)
        <br />
        Entered: ${fmt(m.monthlyGrossEntered ?? 0)} / month
        {m.voluntaryRetirementMonthly ? (
          <>
            <br />401(k) / voluntary retirement add-back: ${fmt(m.voluntaryRetirementMonthly)} / month
          </>
        ) : null}
        <br />Total: ${fmt(m.monthlyGrossResult)} / month
      </>
    );
  }

  if (m.path === "variable") {
    const label =
      m.averagingMethod === "3yr" ? "3-year average" :
      m.averagingMethod === "5yr" ? "5-year average" : "Custom (all entered years)";
    const total = m.years.reduce((s, y) => s + y.amount, 0);
    return (
      <>
        Source: Variable income (Rule .04(3)(b)), {label}
        <br />
        {m.years.map((y) => (
          <span key={y.year}>{y.year}: ${fmt(y.amount)}<br /></span>
        ))}
        Total: ${fmt(total)} ÷ {m.years.length} yrs ÷ 12 = ${fmt(m.monthlyGrossResult)} / month
        {m.rationale && (
          <>
            <br />Rationale: <span className="italic">{m.rationale}</span>
          </>
        )}
      </>
    );
  }

  if (m.path === "self_employed") {
    const ab = m.addBacks.reduce((s, r) => s + r.amount, 0);
    const annual = Math.max(0, m.grossReceiptsAnnual - m.ordinaryExpensesAnnual + ab);
    return (
      <>
        Source: Self-employment (Rule .04(3)(a)(3))
        {m.businessType && (<><br />Business: {m.businessType}</>)}
        <br />Gross receipts: ${fmt(m.grossReceiptsAnnual)}
        <br />Less ordinary & necessary expenses: (${fmt(m.ordinaryExpensesAnnual)})
        {m.addBacks.map((r, i) => (
          <span key={i}><br />+ {r.label}: ${fmt(r.amount)}</span>
        ))}
        <br />= ${fmt(annual)} / yr ÷ 12 = ${fmt(m.monthlyGrossResult)} / month
        <br /><span className="text-[10px] text-muted-foreground">Subject to verification against the underlying business return.</span>
      </>
    );
  }

  if (m.path === "multi_source") {
    const total = m.sources.reduce((s, r) => s + r.annual, 0);
    return (
      <>
        Source: Multiple income streams (Rule .04(3))
        {m.sources.map((r, i) => (
          <span key={i}><br />{r.label}: ${fmt(r.annual)} / yr{r.note ? ` — ${r.note}` : ""}</span>
        ))}
        <br />Total: ${fmt(total)} / yr ÷ 12 = ${fmt(m.monthlyGrossResult)} / month
      </>
    );
  }

  if (m.path === "imputed") {
    const basisCite =
      m.basis === "voluntary_underemployment" ? "Rule .04(3)(a)(2)(i)" :
      m.basis === "failure_to_produce_evidence" ? "Rule .04(3)(a)(2)(ii)" :
      "Rule .04(3)(a)(2)(v)";
    const basisLabel = m.basis.replace(/_/g, " ");
    const methodLabel = m.method.replace(/_/g, " ");
    return (
      <>
        Source: Imputed income — {basisCite}
        <br />Basis: {basisLabel}
        <br />Method: {methodLabel}
        <br />Actual current monthly gross: ${fmt(m.actualMonthlyGross)}
        {m.method === "prior_earnings" && m.years && (
          <>
            <br />Prior years: {m.years.map((y) => `${y.year}=$${fmt(y.amount)}`).join("; ")}
            <br />Averaging: {m.averagingMethod}
          </>
        )}
        {m.method === "vocational_capacity" && (
          <>
            <br />Occupation: {m.occupation || "—"} · Area: {m.area || "—"} · Hours/wk: {m.hoursPerWeek ?? "—"}
          </>
        )}
        {m.method === "asset_based" && (
          <>
            <br />Assets: ${fmt(m.assetsTotal ?? 0)} × {m.rateOfReturn ?? 0}% ÷ 12
          </>
        )}
        <br />Imputed monthly gross: ${fmt(m.monthlyGrossResult)} / month
        {m.rationale && (<><br />Rationale: <span className="italic">{m.rationale}</span></>)}
        <br /><span className="text-[10px] text-muted-foreground">See the Imputed vs Actual comparison appendix for the side-by-side outcomes.</span>
      </>
    );
  }

  // special
  const sitCite =
    m.situation === "ssi_only" ? "Rule .04(3)(c)(2)" :
    m.situation === "incarcerated" ? "Rule .04(3)(a)(2)(iii)" :
    m.situation === "military" ? "Rule .04(3) (BAH/BAS in gross)" :
    "TCA §36-5-101(a)(6) & Rule .04(10)";
  return (
    <>
      Source: Special situation — {sitCite}
      <br />Situation: {m.situation.replace(/_/g, " ")}
      {m.situation === "incarcerated" && (
        <>
          <br />Reason: {(m.incarcerationReason ?? "other").replace(/_/g, " ")}
          {m.hasMeansToPay && <><br />Documented means to pay during incarceration: yes (imputation carve-out overridden)</>}
        </>
      )}
      {m.situation === "military" && (
        <>
          <br />BAH: ${fmt(m.bahMonthly ?? 0)} · BAS: ${fmt(m.basMonthly ?? 0)}
        </>
      )}
      {m.situation === "federal_benefit_to_child" && (
        <>
          <br />Federal benefit paid to child: ${fmt(m.federalBenefitMonthly ?? 0)} / mo (Line 16 offset)
        </>
      )}
      <br />Monthly gross applied: ${fmt(m.monthlyGrossResult)} / month
      {m.rationale && (<><br />Notes: <span className="italic">{m.rationale}</span></>)}
    </>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
