import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";

/**
 * AOC-format Child Support Worksheet (clean, filing-ready).
 *
 * Mirrors the structure of AOC forms CS-101 / CS-102 referenced in the
 * brief: Part I Identification → Part VI Final Order with signature
 * block. No RuleInfo popovers, no methodology appendix, no source line,
 * no rich citation column. The form itself carries minimal rule-citation
 * footnotes next to certain line labels (matching how the official AOC
 * version annotates the worksheet); the rich citation density lives on
 * the annotated worksheet only.
 *
 * The line values MUST reconcile to OfficialWorksheet line-by-line —
 * both render from the same CalcInputs/CalcOutputs.
 */

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

function Row({
  n,
  label,
  note,
  a,
  b,
  c,
  emphasis,
}: {
  n?: string;
  label: string;
  note?: string;
  a?: string;
  b?: string;
  c?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[2.25rem_1fr_7rem_7rem_7rem] gap-2 border-b border-black/40 px-3 py-1.5 text-[11px] ${
        emphasis ? "bg-black/5 font-semibold" : ""
      }`}
    >
      <div className="font-mono">{n}</div>
      <div>
        {label}
        {note && (
          <span className="ml-1 text-[9px] font-normal text-black/60">
            {note}
          </span>
        )}
      </div>
      <div className="text-right font-mono">{a ?? ""}</div>
      <div className="text-right font-mono">{b ?? ""}</div>
      <div className="text-right font-mono">{c ?? ""}</div>
    </div>
  );
}

function PartHeader({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr_7rem_7rem_7rem] gap-2 border-y border-black bg-black px-3 py-1 text-[10px] uppercase tracking-widest text-white">
      <div></div>
      <div className="font-semibold">{title}</div>
      <div className="text-right">Column A</div>
      <div className="text-right">Column B</div>
      <div className="text-right">Combined</div>
    </div>
  );
}

export function AocWorksheet({
  inputs,
  outputs,
  caption = defaultCaption(),
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption?: CaseCaption;
}) {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;
  const kids = `${inputs.numChildren} child${inputs.numChildren > 1 ? "ren" : ""}`;

  return (
    <div className="pdf-aoc print-page">
      <div className="border border-black bg-white p-0 text-black">
        {/* Form header — mirrors AOC CS-101 title block */}
        <div className="border-b-2 border-black px-6 py-4 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest">
            State of Tennessee · Administrative Office of the Courts
          </div>
          <h2 className="mt-1 font-serif text-lg font-bold">
            Child Support Worksheet
          </h2>
          <div className="mt-0.5 text-[10px]">
            Tenn. Comp. R. &amp; Regs. 1240-02-04 · Schedule effective{" "}
            {outputs.scheduleEffectiveDate}
          </div>
        </div>

        {/* Part I — Identification */}
        <PartHeader title="Part I · Identification" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-b border-black/40 px-6 py-3 text-[11px]">
          <div>
            <span className="font-semibold">Matter: </span>
            {caption.matterName || "_____________________________"}
          </div>
          <div>
            <span className="font-semibold">Docket No.: </span>
            {caption.docketNumber || "_____________________________"}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Court: </span>
            {caption.court || "_____________________________"}
          </div>
          <div>
            <span className="font-semibold">Parent A: </span>
            {a}
          </div>
          <div>
            <span className="font-semibold">Parent B: </span>
            {b}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Children: </span>
            {kids}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Parenting Time: </span>
            {inputs.parentingType === "equal"
              ? "Equal (182.5 / 182.5)"
              : inputs.parentingType === "standard"
                ? `Standard (ARP = ${inputs.arpForStandard === "parent_a" ? a : b}, 80 days)`
                : `Custom (${inputs.parentADays} / ${inputs.parentBDays})`}
          </div>
        </div>

        {/* Part II — Adjusted Gross Income */}
        <PartHeader title="Part II · Adjusted Gross Income" />
        <Row
          n="1"
          label="Monthly Gross Income"
          note="Rule .04(3)"
          a={`$${fmt(inputs.parentAGrossMonthly)}`}
          b={`$${fmt(inputs.parentBGrossMonthly)}`}
        />
        <Row
          n="2a"
          label="Less: self-employment tax credit"
          note="Rule .04(4)"
          a={`$${fmt(inputs.parentASECredit)}`}
          b={`$${fmt(inputs.parentBSECredit)}`}
        />
        <Row
          n="2b"
          label="Less: pre-existing child support paid"
          note="Rule .04(5)"
          a={`$${fmt(inputs.parentAPriorSupport)}`}
          b={`$${fmt(inputs.parentBPriorSupport)}`}
        />
        <Row
          n="2c"
          label="Less: in-home children credit"
          note="Rule .04(5)"
          a={`$${fmt(inputs.parentAInhomeCredit)}`}
          b={`$${fmt(inputs.parentBInhomeCredit)}`}
        />
        <Row
          n="3"
          label="Adjusted Gross Income"
          a={`$${fmt(outputs.parentAAGI)}`}
          b={`$${fmt(outputs.parentBAGI)}`}
          c={`$${fmt(outputs.combinedAGI)}`}
          emphasis
        />

        {/* Part III — Parents' Share of BCSO */}
        <PartHeader title="Part III · Parents' Share of BCSO" />
        <Row
          n="4"
          label="Basic Child Support Obligation"
          note="Rule .09"
          c={`$${fmt(outputs.bcso)}`}
          emphasis
        />
        <Row
          n="5"
          label="Percentage of Income (PI)"
          a={`${(outputs.piA * 100).toFixed(2)}%`}
          b={`${(outputs.piB * 100).toFixed(2)}%`}
          c="100.00%"
        />
        <Row
          n="6"
          label="Each parent's pro-rata share of BCSO"
          a={`$${fmt(outputs.parentABcsoShare)}`}
          b={`$${fmt(outputs.parentBBcsoShare)}`}
        />
        <Row
          n="7"
          label="Adjusted BCSO (after parenting-time adjustment)"
          note="Rule .04(7)"
          c={`$${fmt(Math.abs(outputs.netPresumptiveSupport))} ${dirLabel(outputs.presumptiveDirection, a, b)}`}
          emphasis
        />

        {/* Part IV — Additional Expenses */}
        <PartHeader title="Part IV · Additional Expenses" />
        <Row
          n="8a"
          label={`Health insurance — paid by ${inputs.healthPaidBy === "parent_a" ? a : b}`}
          note="Rule .04(8)(b)"
          c={
            inputs.healthPremiumMonthly > 0
              ? `$${fmt(inputs.healthPremiumMonthly)}/mo`
              : "—"
          }
        />
        <Row
          n="8b"
          label="Recurring uninsured medical (pro-rata)"
          note="Rule .04(8)(d)"
          c={
            inputs.uninsuredMedicalMonthly > 0
              ? `$${fmt(inputs.uninsuredMedicalMonthly)}/mo`
              : "—"
          }
        />
        <Row
          n="8c"
          label={`Work-related childcare — paid by ${inputs.childcarePaidBy === "parent_a" ? a : b}`}
          note="Rule .04(8)(c)"
          c={
            inputs.childcareMonthly > 0
              ? `$${fmt(inputs.childcareMonthly)}/mo`
              : "—"
          }
        />

        {/* Part V — Presumptive Child Support */}
        <PartHeader title="Part V · Presumptive Child Support" />
        <Row
          n="9"
          label="Presumptive Child Support Order"
          c={`$${fmt(outputs.netPresumptiveSupport)} ${dirLabel(outputs.presumptiveDirection, a, b)}`}
          emphasis
        />
        {outputs.ssrApplied && (
          <Row
            n="9a"
            label="Self-Support Reserve applied"
            note="Rule .04(9)"
            c="See annotated worksheet"
          />
        )}

        {/* Part VI — Deviations and Final Order */}
        <PartHeader title="Part VI · Deviations and Final Order" />
        {inputs.includePrivateSchool && (
          <Row
            n="10a"
            label="Private school tuition (deviation)"
            note="Rule .07(2)(d)"
            c={`$${fmt(outputs.privateSchoolMonthlyTotal)}/mo`}
          />
        )}
        {inputs.includeSpecialExpenses &&
          outputs.specialExpensesIncludedAsDeviation > 0 && (
            <Row
              n="10b"
              label="Special expenses above 7% threshold (deviation)"
              note="Rule .07(2)(d)"
              c={`$${fmt(outputs.specialExpensesIncludedAsDeviation)}/mo`}
            />
          )}
        {outputs.pcsoExceedsStatutoryMax && (
          <Row
            n="10c"
            label="Statutory cap exceeded — recipient bears excess"
            note="§ 36-5-101(e)(1)(B)"
            c={`Cap $${fmt(outputs.pcsoStatutoryMax)}/mo · Excess $${fmt(outputs.pcsoExcessOverCap)}/mo`}
          />
        )}
        <Row
          n="11"
          label="Final Child Support Order (monthly)"
          c={`$${fmt(outputs.allInMonthly)} ${dirLabel(outputs.allInDirection, a, b)}`}
          emphasis
        />
        <Row n="12" label="Annual obligation" c={`$${fmt(outputs.allInAnnual)}`} />

        {/* Signature block */}
        <div className="border-t-2 border-black px-6 py-6 text-[11px]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8">
            <div>
              <div className="border-b border-black pb-1">&nbsp;</div>
              <div className="mt-1 text-[10px]">
                {a} — signature / date
              </div>
            </div>
            <div>
              <div className="border-b border-black pb-1">&nbsp;</div>
              <div className="mt-1 text-[10px]">
                {b} — signature / date
              </div>
            </div>
            <div className="col-span-2">
              <div className="border-b border-black pb-1">&nbsp;</div>
              <div className="mt-1 text-[10px]">
                Prepared by{caption.preparedBy ? `: ${caption.preparedBy}` : ""}{" "}
                — date
              </div>
            </div>
          </div>
        </div>

        {/* Form footer — no marketing, no URLs (filing form discipline). */}
        <div className="border-t border-black/40 px-6 py-2 text-center font-mono text-[9px] uppercase tracking-widest">
          Tennessee Child Support Worksheet · Rule 1240-02-04 ·
          Prepared {new Date().toLocaleDateString("en-US")}
        </div>
      </div>
    </div>
  );
}
