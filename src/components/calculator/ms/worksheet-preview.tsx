import type {
  MSInputs,
  MSOutputs,
  MSFactorLetter,
  MSDeviation,
  MSDeviationStructured,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import { MSDeviationComparison } from "./deviation-comparison";
import { assertedImputationFactors } from "@/lib/calc/ms/imputation-labels";

function ImputationCallout({
  inputs,
  outputs,
}: {
  inputs: MSInputs;
  outputs: MSOutputs;
}) {
  const basis = inputs.imputationBasis;
  const factors = assertedImputationFactors(basis);
  const asserter =
    basis.assertedBy === "obligor"
      ? inputs.obligorLabel || "Obligor"
      : basis.assertedBy === "obligee"
        ? inputs.obligeeLabel || "Obligee"
        : null;
  return (
    <div className="mt-3 rounded border-l-4 border-accent bg-accent/10 p-3 text-sm">
      <strong>Imputed income — § 43-19-101(5).</strong>{" "}
      {asserter ? `Asserted by ${asserter}. ` : ""}
      {outputs.imputationActive && (
        <span className="text-xs text-muted-foreground">
          Scenario: actual ${Math.round(outputs.actualAnnualGross).toLocaleString("en-US")}/yr blended with imputed ${Math.round(outputs.imputedAnnualGross).toLocaleString("en-US")}/yr at {outputs.imputationApplicationPct}%.
        </span>
      )}
      {factors.length > 0 && (
        <>
          <div className="mt-2 text-xs font-medium text-ink">Twelve-factor basis:</div>
          <ul className="mt-1 list-disc pl-6 text-xs">
            {factors.map((f) => (
              <li key={f.key}>
                <span className="text-ink">{f.label}:</span>{" "}
                <span className="text-muted-foreground">{f.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {basis.note && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-ink">Additional context:</span> {basis.note}
        </p>
      )}
      <p className="mt-2 text-[11px] italic text-muted-foreground">
        Scenario modeling — not a court determination.
      </p>
    </div>
  );
}

const FACTOR_TITLES: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of the obligee, obligor, and the child",
  i: "Payment by the obligee of child care expenses (employment or disability)",
  j: "Any other adjustment needed to achieve an equitable result",
};

function fmt(n: number, dec = 0): string {
  const opts = dec === 0
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: dec, maximumFractionDigits: dec };
  const abs = Math.abs(n).toLocaleString("en-US", opts);
  return n < 0 ? `(${abs})` : abs;
}

/**
 * On-screen preview of what the MS worksheet PDF will contain. Mirrors the
 * structure of ms-worksheet-pdf.ts.
 */
export function MSWorksheetPreview({
  inputs,
  outputs,
  caption,
}: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
}) {
  const applicable = inputs.deviationsA.filter((d) => d.applicable);
  const sideBySide = inputs.comparisonMode === "side_by_side";

  // § 43-19-36 suspension short-circuit
  if (outputs.suspensionApplies) {
    return (
      <div className="rounded-lg border border-rule bg-background p-6 font-serif text-ink">
        <h2 className="text-xl font-bold">Mississippi Child Support Worksheet</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Miss. Code Ann. § 43-19-36 (suspension during incarceration).
          Guidelines: {outputs.guidelinesEffectiveDate}.
        </p>

        <CaptionBlock caption={caption} inputs={inputs} />

        <div className="mt-6 rounded-md border-l-4 border-primary bg-primary/10 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
            § 43-19-36 finding
          </div>
          <h3 className="mt-1 font-serif text-2xl text-ink">
            Obligation suspended by operation of law
          </h3>
          <p className="mt-3 text-sm">
            {outputs.suspensionReason}
          </p>
          <p className="mt-3 text-sm">
            Because the suspension applies, the chancellor need not perform
            the standard § 43-19-101 percentage calculation while
            incarceration continues. The obligation resumes the first day of
            the month following 60 days after release. § 43-19-36(3).
          </p>
        </div>

        {outputs.warnings.length > 0 && (
          <>
            <SectionTitle>Notes</SectionTitle>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {outputs.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-6 border-t border-rule pt-3 text-[10px] text-muted-foreground">
          This worksheet is a calculation aid produced by TCB Law's Mississippi
          child support calculator. It is not legal advice and is not an official
          MDHS form. Authority: Miss. Code Ann. § 43-19-36.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rule bg-background p-6 font-serif text-ink">
      <h2 className="text-xl font-bold">Mississippi Child Support Worksheet</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Miss. Code Ann. § 43-19-101 (presumptive guideline) and § 43-19-103
        (deviation criteria). Guidelines: {outputs.guidelinesEffectiveDate}.
      </p>

      <CaptionBlock caption={caption} inputs={inputs} />

      <SectionTitle>I. Adjusted Gross Income (§ 43-19-101(3))</SectionTitle>
      <Table>
        <Row
          n="1"
          label={
            inputs.agiBasis === "imputed"
              ? "Obligor's gross income (annual — imputed under § 43-19-101(5))"
              : "Obligor's gross income (annual)"
          }
          total={fmt(inputs.obligorAnnualGross)}
        />
        <Row n="2" label="Less: taxes" total={`(${fmt(inputs.obligorAnnualTaxes)})`} />
        <Row n="3" label="Less: Social Security" total={`(${fmt(inputs.obligorAnnualSocialSecurity)})`} />
        <Row n="4" label="Less: mandatory retirement" total={`(${fmt(inputs.obligorAnnualMandatoryRetirement)})`} />
        <Row n="5" label="Less: pre-existing support (other children)" total={`(${fmt(inputs.preexistingSupportAnnual)})`} />
        <Row n="6" label="Annual Adjusted Gross Income" total={fmt(outputs.annualAGI)} emphasis />
        {inputs.inHomeChildrenDeductionMonthly > 0 && (
          <Row n="7" label="Less: in-home other-children deduction (monthly)" total={`(${fmt(inputs.inHomeChildrenDeductionMonthly)})`} />
        )}
        <Row n="8" label="Monthly Adjusted Gross Income" total={fmt(outputs.monthlyAGI, 2)} emphasis />
      </Table>

      {inputs.agiBasis === "imputed" && (
        <ImputationCallout inputs={inputs} outputs={outputs} />
      )}


      {(outputs.requiresFindingHighIncome || outputs.requiresFindingLowIncome) && (
        <div className="mt-4 rounded border-l-4 border-accent bg-accent/10 p-3 text-sm">
          <strong>Written finding required — § 43-19-101(4).</strong>{" "}
          {outputs.requiresFindingHighIncome
            ? "Annual AGI exceeds $100,000."
            : "Annual AGI is below $10,000."}{" "}
          The chancellor must make written findings as to whether the guideline
          percentage is reasonable.
        </div>
      )}

      <SectionTitle>II. Presumptive Monthly Award (§ 43-19-101(1))</SectionTitle>
      <Table>
        <Row n="9" label={`Statutory percentage (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"})`} total={`${(outputs.statutoryPercentage * 100).toFixed(0)}%`} />
        <Row n="10" label="Presumptive monthly support = Monthly AGI × percentage" total={fmt(outputs.presumptiveMonthly, 2)} emphasis />
      </Table>

      <SectionTitle>III. Health Insurance (§ 43-19-101(6))</SectionTitle>
      <Table>
        {inputs.healthInsuranceProvidedBy === "obligee" && inputs.healthInsuranceMonthly > 0 ? (
          <Row n="11" label="Children's portion of premium (obligee provides — added to award)" total={fmt(outputs.healthInsuranceAddOnMonthly, 2)} />
        ) : inputs.healthInsuranceProvidedBy === "obligor" && inputs.healthInsuranceMonthly > 0 ? (
          <Row n="11" label="Children's portion of premium (obligor provides — informational)" total={fmt(inputs.healthInsuranceMonthly, 2)} />
        ) : (
          <Row n="11" label="Children's portion of premium" total="—" />
        )}
      </Table>

      <SectionTitle>IV. Proposed Deviations (§ 43-19-103)</SectionTitle>
      {sideBySide && inputs.deviationsB ? (
        <div className="mt-3">
          <MSDeviationComparison inputs={inputs} />
        </div>
      ) : applicable.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No statutory deviation factors marked applicable. Presumptive amount
          stands.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {applicable.map((d) => (
            <StructuredDeviationSummary key={d.letter} d={d} />
          ))}
          <Table>
            <Row label="Total proposed deviations" total={fmt(outputs.totalDeviationsMonthly, 2)} emphasis />
          </Table>
        </div>
      )}

      <SectionTitle>V. Proposed Final Monthly Award</SectionTitle>
      <Table>
        <Row label="Presumptive amount" total={fmt(outputs.presumptiveMonthly, 2)} />
        {outputs.healthInsuranceAddOnMonthly > 0 && (
          <Row label="Plus: health insurance add-on" total={fmt(outputs.healthInsuranceAddOnMonthly, 2)} />
        )}
        {outputs.totalDeviationsMonthly !== 0 && (
          <Row
            label={`${outputs.totalDeviationsMonthly >= 0 ? "Plus" : "Less"}: net deviations`}
            total={fmt(outputs.totalDeviationsMonthly, 2)}
          />
        )}
        {sideBySide && outputs.positionB ? (
          <>
            <Row
              label={`${inputs.obligorLabel} — proposed final / mo`}
              total={fmt(outputs.proposedFinalMonthly, 2)}
              emphasis
            />
            <Row
              label={`${inputs.obligeeLabel} — proposed final / mo`}
              total={fmt(outputs.positionB.proposedFinalMonthly, 2)}
              emphasis
            />
            <Row
              label="Gap / mo"
              total={fmt(
                outputs.proposedFinalMonthly - outputs.positionB.proposedFinalMonthly,
                2,
              )}
            />
          </>
        ) : (
          <Row label="Proposed final monthly support" total={fmt(outputs.proposedFinalMonthly, 2)} emphasis />
        )}
      </Table>

      {outputs.warnings.length > 0 && (
        <>
          <SectionTitle>Notes</SectionTitle>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
            {outputs.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 border-t border-rule pt-3 text-[10px] text-muted-foreground">
        This worksheet is a calculation aid produced by TCB Law's Mississippi
        child support calculator. It is not legal advice and is not an official
        MDHS form. Authority: Miss. Code Ann. §§ 43-19-101 and 43-19-103.
      </p>
    </div>
  );
}

function CaptionBlock({
  caption,
  inputs,
}: {
  caption: CaseCaption;
  inputs: MSInputs;
}) {
  return (
    <div className="mt-4 rounded border border-rule p-3 text-sm">
      {caption.matterName && <CapRow l="Matter:" v={caption.matterName} />}
      {caption.docketNumber && <CapRow l="Cause No.:" v={caption.docketNumber} />}
      {caption.court && <CapRow l="Court:" v={caption.court} />}
      {caption.preparedBy && <CapRow l="Prepared by:" v={caption.preparedBy} />}
      {caption.client && <CapRow l="Client:" v={caption.client} />}
      <CapRow l="Obligor:" v={inputs.obligorLabel} />
      <CapRow l="Obligee:" v={inputs.obligeeLabel} />
      <CapRow l="Children:" v={String(inputs.numChildren)} />
    </div>
  );
}

function StructuredDeviationSummary({ d }: { d: MSDeviation }) {
  return (
    <div className="rounded-md border border-rule bg-background p-3">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Factor ({d.letter})
        </div>
        <div className="font-mono text-sm text-ink">
          {fmt(d.proposedMonthly, 2)} / mo
        </div>
      </div>
      <div className="mt-1 text-sm font-medium">{FACTOR_TITLES[d.letter]}</div>
      {d.structured && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {renderStructured(d.structured).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {d.description && (
        <p className="mt-2 text-xs italic text-muted-foreground">{d.description}</p>
      )}
    </div>
  );
}

/** Tiny formatter — produces human-readable bullet lines for each variant. */
export function renderStructured(s: MSDeviationStructured): string[] {
  const out: string[] = [];
  const m = (n: number) => `$${Math.abs(n).toLocaleString("en-US")}`;
  switch (s.letter) {
    case "a": {
      const types = Object.entries(s.types).filter(([, v]) => v).map(([k]) => k);
      if (types.length) out.push(`Type: ${types.join(", ")}`);
      if (s.description) out.push(`Description: ${s.description}`);
      if (s.currentMonthlyCost) out.push(`Current monthly cost: ${m(s.currentMonthlyCost)}`);
      if (s.anticipatedDuration) out.push(`Duration: ${s.anticipatedDuration}`);
      if (s.outOfPocket) out.push(`Out-of-pocket / mo: ${m(s.outOfPocket)}`);
      if (s.currentlyPaidBy) out.push(`Currently paid by: ${s.currentlyPaidBy}`);
      out.push(`Proposed obligor share: ${s.allocationObligorPct}%`);
      break;
    }
    case "b": {
      const parts: string[] = [];
      if (s.earnedMonthly) parts.push(`Earned ${m(s.earnedMonthly)}`);
      if (s.ssBenefitsMonthly) parts.push(`SS ${m(s.ssBenefitsMonthly)}`);
      if (s.trustMonthly) parts.push(`Trust ${m(s.trustMonthly)}`);
      if (s.investmentMonthly) parts.push(`Investment ${m(s.investmentMonthly)}`);
      if (s.otherMonthly) parts.push(`Other ${m(s.otherMonthly)}`);
      if (parts.length) out.push(`Child income / mo: ${parts.join(" • ")}`);
      if (s.reliableRecurring) out.push(`Reliable/recurring: ${s.reliableRecurring}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "c": {
      if (s.status) out.push(`Spousal-support status: ${s.status}`);
      if (s.currentMonthly) out.push(`Current monthly spousal: ${m(s.currentMonthly)}`);
      const basis: string[] = [];
      if (s.basis.courtOrder) basis.push("court order");
      if (s.basis.propertySettlement) basis.push("PSA");
      if (s.basis.pendingDissolution) basis.push("pending dissolution");
      if (basis.length) out.push(`Basis: ${basis.join(", ")}`);
      if (s.basis.caseNumber) out.push(`Case no.: ${s.basis.caseNumber}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "d": {
      if (s.whichParent) out.push(`Which parent: ${s.whichParent}`);
      if (s.peakMonths) out.push(`Peak months: ${s.peakMonths}`);
      if (s.lowMonths) out.push(`Low months: ${s.lowMonths}`);
      if (s.highMonthGross) out.push(`High month gross: ${m(s.highMonthGross)}`);
      if (s.lowMonthGross) out.push(`Low month gross: ${m(s.lowMonthGross)}`);
      if (s.approach) out.push(`Approach: ${s.approach}`);
      if (s.adjustedMonthlyAmount) out.push(`Adjusted monthly: ${m(s.adjustedMonthlyAmount)}`);
      if (s.source) out.push(`Source: ${s.source}`);
      if (s.buildInNote) out.push(s.buildInNote);
      break;
    }
    case "e": {
      if (s.ages) out.push(`Ages: ${s.ages}`);
      const flags: string[] = [];
      if (s.greaterPerChildCosts) flags.push("greater per-child costs");
      if (s.greaterEducational) flags.push("greater educational");
      if (s.needsJustifyUpward) flags.push("upward justified");
      if (flags.length) out.push(flags.join("; "));
      if (s.itemsNotCovered) out.push(`Items not covered: ${s.itemsNotCovered}`);
      break;
    }
    case "f": {
      const cats = Object.entries(s.categories).filter(([, v]) => v).map(([k]) => k);
      if (cats.length) out.push(`Categories: ${cats.join(", ")}`);
      if (s.description) out.push(s.description);
      if (s.establishedPattern) out.push(`Pattern: ${s.establishedPattern}`);
      if (s.monthlyCost) out.push(`Monthly cost: ${m(s.monthlyCost)}`);
      break;
    }
    case "g": {
      if (s.arrangement) out.push(`Arrangement: ${s.arrangement === "other" ? s.arrangementOther : s.arrangement}`);
      if (s.obligorOvernights || s.obligeeOvernights)
        out.push(`Overnights — obligor: ${s.obligorOvernights}, obligee: ${s.obligeeOvernights}`);
      const dir: string[] = [];
      if (s.directExpenses.foodMonthly) dir.push(`food ${m(s.directExpenses.foodMonthly)}`);
      if (s.directExpenses.activitiesMonthly) dir.push(`activities ${m(s.directExpenses.activitiesMonthly)}`);
      if (s.directExpenses.clothingMonthly) dir.push(`clothing ${m(s.directExpenses.clothingMonthly)}`);
      if (s.directExpenses.transportationMonthly) dir.push(`transport ${m(s.directExpenses.transportationMonthly)}`);
      if (s.directExpenses.otherMonthly) dir.push(`other ${m(s.directExpenses.otherMonthly)}`);
      if (dir.length) out.push(`Direct expenses / mo: ${dir.join(" • ")}`);
      if (s.duplicatedExpenses) out.push(`Duplicated expenses: ${s.duplicatedExpenses}${s.duplicatedExpensesNote ? ` — ${s.duplicatedExpensesNote}` : ""}`);
      if (s.approach) out.push(`Approach: ${s.approach === "other" ? s.approachOther : s.approach}`);
      if (s.downwardAmount) out.push(`Downward amount: ${m(s.downwardAmount)}`);
      break;
    }
    case "h": {
      const sumAssets = (a: typeof s.obligor) =>
        a.realEstate + a.equity + a.investments + a.retirement + a.business + a.other;
      out.push(`Obligor assets total: ${m(sumAssets(s.obligor))}`);
      out.push(`Obligee assets total: ${m(sumAssets(s.obligee))}`);
      if (s.child.value) out.push(`Child assets: ${m(s.child.value)}${s.child.note ? ` — ${s.child.note}` : ""}`);
      if (s.incomeFromAssets) out.push(`Income from assets: ${s.incomeFromAssets}${s.partialNote ? ` — ${s.partialNote}` : ""}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "i": {
      if (s.reason) out.push(`Reason: ${s.reason}`);
      if (s.provider) out.push(`Provider: ${s.provider}`);
      if (s.monthlyCost) out.push(`Monthly cost: ${m(s.monthlyCost)}`);
      if (s.hoursPerWeek) out.push(`Hours/wk: ${s.hoursPerWeek}`);
      if (s.taxCredit) out.push(`Tax credit: ${s.taxCredit}`);
      if (s.netOutOfPocket) out.push(`Net out-of-pocket: ${m(s.netOutOfPocket)}`);
      if (s.allocation) out.push(`Allocation: ${s.allocation === "other" ? s.allocationOther : s.allocation}`);
      if (s.childrenCoveredNote) out.push(s.childrenCoveredNote);
      break;
    }
    case "j": {
      if (s.basisIsExistingDebt) out.push("Basis: existing debt obligation");
      if (s.basisIsOtherEquity) out.push(`Basis: other equity — ${s.otherEquityNote || "(unspecified)"}`);
      const types = Object.entries(s.debtType)
        .filter(([k, v]) => v && k !== "otherNote")
        .map(([k]) => k);
      if (types.length) out.push(`Debt type: ${types.join(", ")}`);
      if (s.currentMonthlyPayment) out.push(`Current monthly payment: ${m(s.currentMonthlyPayment)}`);
      if (s.remainingMonths) out.push(`Remaining months: ${s.remainingMonths}`);
      if (s.originalPayee) out.push(`Original payee: ${s.originalPayee}`);
      if (s.whyDeviationWorthy) out.push(s.whyDeviationWorthy);
      break;
    }
  }
  return out;
}

function CapRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="w-28 shrink-0 font-bold">{l}</span>
      <span>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-base font-bold">{children}</h3>;
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 divide-y divide-rule border border-rule text-sm">
      {children}
    </div>
  );
}

function Row({
  n,
  label,
  total,
  emphasis,
}: {
  n?: string;
  label: string;
  total: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center gap-3 px-3 py-2 " +
        (emphasis ? "bg-cream font-bold" : "")
      }
    >
      {n && <span className="w-6 shrink-0 font-mono text-[10px] text-muted-foreground">{n}</span>}
      <span className="flex-1">{label}</span>
      <span className="shrink-0 font-mono">{total}</span>
    </div>
  );
}
