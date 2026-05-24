import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";

function fmt(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function dirLabel(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} → ${b}`;
  if (d === "parent_b_to_a") return `${b} → ${a}`;
  return "—";
}

function Line({
  n,
  label,
  cite,
  a,
  b,
  total,
  emphasis,
}: {
  n?: string;
  label: string;
  cite?: string;
  a?: string;
  b?: string;
  total?: string;
  emphasis?: boolean;
}) {
  const base =
    "grid grid-cols-[2.5rem_1fr_8rem_8rem_8rem] gap-2 border-b border-rule px-3 py-2 text-[12px]";
  const emph = emphasis ? "bg-cream font-semibold text-ink" : "text-ink";
  return (
    <div className={`${base} ${emph}`}>
      <div className="font-mono text-muted-foreground">{n}</div>
      <div>
        <div>{label}</div>
        {cite && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {cite}
          </div>
        )}
      </div>
      <div className="text-right font-mono">{a ?? ""}</div>
      <div className="text-right font-mono">{b ?? ""}</div>
      <div className="text-right font-mono">{total ?? ""}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_8rem_8rem_8rem] gap-2 border-b-2 border-primary bg-primary px-3 py-1.5 text-[11px] uppercase tracking-widest text-primary-foreground">
      <div></div>
      <div className="font-semibold">{title}</div>
      <div className="text-right">A</div>
      <div className="text-right">B</div>
      <div className="text-right">Combined</div>
    </div>
  );
}

export function OfficialWorksheet({
  inputs,
  outputs,
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
}) {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  return (
    <div className="print-page">
      <div className="rounded-lg border border-rule bg-card text-ink shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rule px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              State of Tennessee · Department of Human Services
            </div>
            <h2 className="mt-1 font-serif text-xl text-ink">
              Child Support Worksheet — Income Shares Model
            </h2>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Tenn. Comp. R. & Regs. 1240-02-04 · Schedule effective{" "}
              {outputs.scheduleEffectiveDate}
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>Prepared {new Date().toLocaleDateString("en-US")}</div>
            <div>via TCB Law TN Child Support Calculator</div>
          </div>
        </div>

        {/* Identification */}
        <SectionHeader title="I · Identification" />
        <Line
          n="1"
          label="Parent labels"
          a={a}
          b={b}
          total={`${inputs.numChildren} child${inputs.numChildren > 1 ? "ren" : ""}`}
        />
        <Line
          n="2"
          label="Parenting time"
          cite="Rule .04(7)"
          total={
            inputs.parentingType === "equal"
              ? "Equal (182.5 / 182.5)"
              : inputs.parentingType === "standard"
                ? `Standard (ARP = ${inputs.arpForStandard === "parent_a" ? a : b}, 80 days)`
                : `Custom (${inputs.parentADays} / ${inputs.parentBDays})`
          }
        />

        {/* AGI */}
        <SectionHeader title="II · Adjusted Gross Income" />
        <Line
          n="3"
          label="Gross monthly income"
          cite="Rule .04(3)"
          a={`$${fmt(inputs.parentAGrossMonthly)}`}
          b={`$${fmt(inputs.parentBGrossMonthly)}`}
        />
        <Line
          n="3a"
          label="Less: self-employment tax credit"
          cite="Rule .04(4)"
          a={`$${fmt(inputs.parentASECredit)}`}
          b={`$${fmt(inputs.parentBSECredit)}`}
        />
        <Line
          n="3b"
          label="Less: pre-existing child support paid"
          cite="Rule .04(5)"
          a={`$${fmt(inputs.parentAPriorSupport)}`}
          b={`$${fmt(inputs.parentBPriorSupport)}`}
        />
        <Line
          n="3c"
          label="Less: in-home children credit"
          cite="Rule .04(6)"
          a={`$${fmt(inputs.parentAInhomeCredit)}`}
          b={`$${fmt(inputs.parentBInhomeCredit)}`}
        />
        <Line
          n="4"
          label="Adjusted Gross Income (AGI)"
          a={`$${fmt(outputs.parentAAGI)}`}
          b={`$${fmt(outputs.parentBAGI)}`}
          total={`$${fmt(outputs.combinedAGI)}`}
          emphasis
        />
        <Line
          n="5"
          label="Percentage of income (PI)"
          a={`${(outputs.piA * 100).toFixed(2)}%`}
          b={`${(outputs.piB * 100).toFixed(2)}%`}
          total="100.00%"
        />

        {/* BCSO */}
        <SectionHeader title="III · Basic Child Support Obligation" />
        <Line
          n="6"
          label={
            outputs.bcsoSource === "above_cap"
              ? "BCSO (above-cap formula)"
              : "BCSO (schedule lookup, rounded up)"
          }
          cite={
            outputs.bcsoSource === "above_cap"
              ? "Rule .09(2)(d)"
              : "Rule .09"
          }
          total={`$${fmt(outputs.bcso)}`}
          emphasis
        />
        {outputs.scheduleAgiUsed !== null && (
          <Line
            label={`Schedule row used: $${fmt(outputs.scheduleAgiUsed)} combined AGI / ${inputs.numChildren} children`}
          />
        )}
        <Line
          n="7"
          label="Pro-rata share of BCSO"
          cite="Rule .04"
          a={`$${fmt(outputs.parentABcsoShare)}`}
          b={`$${fmt(outputs.parentBBcsoShare)}`}
        />

        {/* Parenting time */}
        <SectionHeader title="IV · Parenting Time Adjustment" />
        <Line
          n="8"
          label={`Band: ${outputs.parentingTimeBand}`}
          cite={
            outputs.parentingTimeBand === "equal"
              ? "Rule .04(7)(b)(2)(i)"
              : outputs.parentingTimeBand === "reduction"
                ? "Rule .04(7)(h)"
                : outputs.parentingTimeBand === "increase"
                  ? "Rule .04(7)(i)"
                  : "Rule .04(7)(a)"
          }
          total={
            outputs.variableMultiplier !== null
              ? `multiplier ${outputs.variableMultiplier.toFixed(4)}`
              : "—"
          }
        />
        <Line
          n="9"
          label="Net presumptive child support"
          a=""
          b=""
          total={`$${fmt(outputs.netPresumptiveSupport)} ${dirLabel(outputs.presumptiveDirection, a, b)}`}
          emphasis
        />
        {outputs.ssrApplied && outputs.ssrNote && (
          <Line label={outputs.ssrNote} cite="Rule .02(25)" />
        )}

        {/* Add-ons */}
        <SectionHeader title="V · Mandatory Add-Ons (pro-rata)" />
        <Line
          n="10"
          label={`Health insurance — paid by ${inputs.healthPaidBy === "parent_a" ? a : b}`}
          cite="Rule .04(8)(b)"
          total={
            inputs.healthPremiumMonthly > 0
              ? `$${fmt(inputs.healthPremiumMonthly)}/mo · ${a} net ${fmt(outputs.addOnHealthFromA)}`
              : "—"
          }
        />
        <Line
          n="11"
          label="Recurring uninsured medical (pro-rata)"
          cite="Rule .04(8)(d)"
          a={`$${fmt(inputs.uninsuredMedicalMonthly * outputs.piA)}`}
          b={`$${fmt(inputs.uninsuredMedicalMonthly * outputs.piB)}`}
          total={`$${fmt(inputs.uninsuredMedicalMonthly)}/mo`}
        />
        <Line
          n="12"
          label={`Work-related childcare — paid by ${inputs.childcarePaidBy === "parent_a" ? a : b}`}
          cite="Rule .04(8)(c)"
          total={
            inputs.childcareMonthly > 0
              ? `$${fmt(inputs.childcareMonthly)}/mo · ${a} net ${fmt(outputs.addOnChildcareFromA)}`
              : "—"
          }
        />

        {/* Deviations */}
        {(inputs.includePrivateSchool || inputs.includeSpecialExpenses) && (
          <>
            <SectionHeader title="VI · Discretionary Deviations" />
            {inputs.includePrivateSchool && (
              <Line
                n="13"
                label="Private school tuition (deviation, pro-rata)"
                cite="Rule .07(2)(d)"
                total={`$${fmt(outputs.privateSchoolMonthlyTotal)}/mo · ${a} net ${fmt(outputs.privateSchoolDeviationFromA)}`}
              />
            )}
            {inputs.includeSpecialExpenses && (
              <>
                <Line
                  n="14"
                  label="Special expenses — 7% of BCSO threshold"
                  cite="Rule .07(2)(d)"
                  total={`Threshold $${fmt(outputs.specialExpensesThresholdAmount)}/mo`}
                />
                <Line
                  n="14a"
                  label={
                    outputs.specialExpensesIncludedAsDeviation > 0
                      ? "Amount counted as deviation (excess of threshold)"
                      : "Within presumed coverage — no deviation"
                  }
                  total={
                    outputs.specialExpensesIncludedAsDeviation > 0
                      ? `$${fmt(outputs.specialExpensesIncludedAsDeviation)}/mo · ${a} net ${fmt(outputs.specialExpensesDeviationFromA)}`
                      : "—"
                  }
                />
              </>
            )}
          </>
        )}

        {/* Final */}
        <SectionHeader title="VII · Final Order" />
        <Line
          n="15"
          label="All-in monthly obligation"
          total={`$${fmt(outputs.allInMonthly)} ${dirLabel(outputs.allInDirection, a, b)}`}
          emphasis
        />
        <Line
          n="16"
          label="Annual"
          total={`$${fmt(outputs.allInAnnual)}`}
        />

        {/* PCSO warning */}
        {outputs.pcsoExceedsStatutoryMax && (
          <div className="border-t border-rule bg-accent/10 px-6 py-4 text-[11px] text-ink">
            <strong>Statutory PCSO maximum exceeded.</strong> Per T.C.A.
            § 36-5-101(e)(1)(B), the recipient bears the burden to prove
            additional support is reasonably necessary; otherwise the order
            may be capped at ${fmt(outputs.pcsoStatutoryMax)}/mo for{" "}
            {inputs.numChildren} child{inputs.numChildren > 1 ? "ren" : ""}.
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-rule bg-cream px-6 py-4 text-[10px] text-muted-foreground">
          Calculated using the Tennessee Child Support Guidelines under Rule
          1240-02-04, schedule effective{" "}
          {outputs.scheduleEffectiveDate}. This worksheet is an estimate and
          not legal advice. Consult a licensed Tennessee attorney for your
          specific case.
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
