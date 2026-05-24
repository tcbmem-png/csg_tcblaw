import type { MSInputs, MSOutputs, MSFactorLetter } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";

const FACTOR_TITLES: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of obligee, obligor, and child",
  i: "Payment by obligee of child care expenses for employment or disability",
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
 * structure of ms-worksheet-pdf.ts so users can review before unlocking.
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
  const applicable = inputs.deviations.filter((d) => d.applicable);
  return (
    <div className="rounded-lg border border-rule bg-background p-6 font-serif text-ink">
      <h2 className="text-xl font-bold">Mississippi Child Support Worksheet</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Miss. Code Ann. § 43-19-101 (presumptive guideline) and § 43-19-103
        (deviation criteria). Guidelines effective {outputs.guidelinesEffectiveDate}.
      </p>

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

      <SectionTitle>I. Adjusted Gross Income (§ 43-19-101(3))</SectionTitle>
      <Table>
        <Row n="1" label="Obligor's gross income (annual)" total={fmt(inputs.obligorAnnualGross)} />
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
      {applicable.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No statutory deviation factors marked applicable. Presumptive amount
          stands.
        </p>
      ) : (
        <Table>
          {applicable.map((d) => (
            <Row
              key={d.letter}
              label={`(${d.letter}) ${FACTOR_TITLES[d.letter]}${d.description ? ` — ${d.description}` : ""}`}
              total={fmt(d.proposedMonthly, 2)}
            />
          ))}
          <Row label="Total proposed deviations" total={fmt(outputs.totalDeviationsMonthly, 2)} emphasis />
        </Table>
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
        <Row label="Proposed final monthly support" total={fmt(outputs.proposedFinalMonthly, 2)} emphasis />
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
