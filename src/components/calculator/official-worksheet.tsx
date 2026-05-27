/**
 * Phase B — WDM-driven worksheet renderer.
 *
 * This component is now a pure projection of the Worksheet Data Model
 * (WDM) built by `src/lib/calc/wdm/build.ts`. All formatting, line
 * ordering, citation tagging, judgment-call metadata, and panel shaping
 * live in `buildWDM`. The component only walks the model and emits JSX.
 *
 * The B0 baselines under `src/lib/calc/wdm/__baselines__/` lock the
 * exact HTML output across all 6 fixtures. Any visible regression
 * during the rewire fails the regression gate.
 *
 * The single piece not yet carried by the WDM is the special-expenses
 * threshold sub-line (a one-line cream-tinted note under Line 14a). It
 * is still derived from `inputs`/`outputs` here; promotion into the WDM
 * is tracked for Phase D.
 */
import { Fragment } from "react";
import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";
import {
  CITATIONS,
  specialExpensesThresholdLine,
  type CitationKey,
} from "@/lib/calc/citations";
import { buildWDM } from "@/lib/calc/wdm/build";
import type {
  WDMLine,
  WDMSection,
  WDMStatutoryCapPanel,
  WDMValue,
} from "@/lib/calc/wdm/types";
import { RuleInfo } from "./rule-info";

function fmt(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function cellDisplay(v: WDMValue | undefined): string {
  return v?.display ?? "";
}

function SourceLine({ a, b }: { a: string; b: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_8rem_8rem_8rem] gap-2 border-b border-rule px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      <div></div>
      <div></div>
      <div className="text-right normal-case">{a}</div>
      <div className="text-right normal-case">{b}</div>
      <div></div>
    </div>
  );
}

function LineRow({ line }: { line: WDMLine }) {
  const base =
    "grid grid-cols-[2.5rem_1fr_8rem_8rem_8rem] gap-2 border-b border-rule px-3 py-2 text-[12px]";
  const emph = line.emphasis ? "bg-cream font-semibold text-ink" : "text-ink";
  // Citation-driven label/cite takes precedence: derived from a CitationKey,
  // it stays in lockstep with citations.ts so paragraph upgrades propagate
  // without per-line edits.
  const citation: CitationKey | undefined = line.citation;
  const resolvedCite =
    citation !== undefined
      ? `Rule ${CITATIONS[citation].rule.replace(/^1240-02-04-/, "")}`
      : line.cite;
  return (
    <div className={`${base} ${emph}`}>
      <div className="font-mono text-muted-foreground">{line.screenLineNo ?? ""}</div>
      <div>
        <div className="flex items-center gap-1.5">
          <span>{line.label}</span>
          {citation && <RuleInfo citation={citation} />}
        </div>
        {resolvedCite && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {resolvedCite}
          </div>
        )}
      </div>
      <div className="text-right font-mono">{cellDisplay(line.a)}</div>
      <div className="text-right font-mono">{cellDisplay(line.b)}</div>
      <div className="text-right font-mono">{cellDisplay(line.total)}</div>
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

function StatutoryCapPanel({ panel }: { panel: WDMStatutoryCapPanel }) {
  return (
    <div className="border-t border-rule bg-cream px-6 py-4 text-[11px] leading-relaxed text-ink">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Statutory Presumptive Cap · Tenn. Code Ann. §36-5-101(e)(1)(B)
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px] sm:max-w-md">
        <div>Calculated PCSO</div>
        <div className="text-right">${fmt(panel.calculatedPCSO)}/mo</div>
        <div>
          Statutory cap ({panel.numChildren}{" "}
          {panel.numChildren === 1 ? "child" : "children"})
        </div>
        <div className="text-right">${fmt(panel.statutoryMax)}/mo</div>
        <div className="border-t border-rule pt-1 font-semibold">
          Excess subject to recipient's burden
        </div>
        <div className="border-t border-rule pt-1 text-right font-semibold">
          ${fmt(panel.excessOverCap)}/mo · ${fmt(panel.excessOverCap * 12)}/yr
        </div>
      </div>
      {panel.capNote && (
        <p className="mt-3 text-[11px] leading-relaxed">{panel.capNote}</p>
      )}
      {panel.caseLaw && (
        <p className="mt-3 border-t border-rule pt-3 text-[11px] italic leading-relaxed text-muted-foreground">
          {panel.caseLaw}
        </p>
      )}
    </div>
  );
}

export function OfficialWorksheet({
  inputs,
  outputs,
  caption = defaultCaption(),
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption?: CaseCaption;
}) {
  const wdm = buildWDM(inputs, outputs, caption);
  const { header, caption: cap, hasCaption, panels } = wdm;

  return (
    <div className="print-page">
      <div className="rounded-lg border border-rule bg-card text-ink shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rule px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {header.jurisdiction}
            </div>
            <h2 className="mt-1 font-serif text-xl text-ink">{header.formTitle}</h2>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Tenn. Comp. R. & Regs. 1240-02-04 · Schedule effective{" "}
              {header.scheduleEffectiveDate}
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>Prepared {header.preparedOnDisplay}</div>
            <div>via TCB Law TN Child Support Calculator</div>
          </div>
        </div>

        {/* Case caption */}
        {hasCaption && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-rule bg-cream px-6 py-4 text-[11px] text-ink sm:grid-cols-2">
            {cap.matterName && (
              <div>
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Matter ·{" "}
                </span>
                {cap.matterName}
              </div>
            )}
            {cap.docketNumber && (
              <div>
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Docket ·{" "}
                </span>
                {cap.docketNumber}
              </div>
            )}
            {cap.court && (
              <div className="sm:col-span-2">
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Court ·{" "}
                </span>
                {cap.court}
              </div>
            )}
            {cap.client && (
              <div>
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Client ·{" "}
                </span>
                {cap.client}
              </div>
            )}
            {cap.preparedBy && (
              <div>
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Prepared by ·{" "}
                </span>
                {cap.preparedBy}
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {wdm.sections.map((section: WDMSection) => (
          <SectionBlock
            key={section.id}
            section={section}
            inputs={inputs}
            outputs={outputs}
          />
        ))}

        {/* Statutory cap panel — side-by-side display per §36-5-101(e)(1)(B) */}
        {panels.statutoryCap.engaged && (
          <StatutoryCapPanel panel={panels.statutoryCap} />
        )}

        {!panels.statutoryCap.engaged && panels.statutoryCap.capNote && (
          <div className="border-t border-rule bg-cream px-6 py-3 text-[11px] leading-relaxed text-muted-foreground">
            {panels.statutoryCap.capNote}
          </div>
        )}

        {panels.equalParentingLowSupportNote && (
          <div className="border-t border-rule bg-primary/5 px-6 py-4 text-[11px] leading-relaxed text-ink">
            <div className="mb-1 font-semibold">Why is this support amount so low?</div>
            {panels.equalParentingLowSupportNote}
          </div>
        )}

        {/* Methodology footnote — mirrors the AOC PDF page-2 footnote so
            the on-screen worksheet explains itself the same way. */}
        {panels.deviationMethodologyNote && (
          <div className="border-t border-rule bg-cream/60 px-6 py-3 text-[10px] leading-relaxed text-muted-foreground">
            {panels.deviationMethodologyNote}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-rule bg-cream px-6 py-4 text-[10px] text-muted-foreground">
          Calculated using the Tennessee Child Support Guidelines under Rule
          1240-02-04, schedule effective {header.scheduleEffectiveDate}. This
          worksheet is an estimate and not legal advice. Consult a licensed
          Tennessee attorney for your specific case.
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a WDM section: section header, each line, plus the inline
 * sub-rows that aren't yet promoted into the WDM (income SourceLine
 * under Line 3, special-expenses threshold note under Line 14a).
 */
function SectionBlock({
  section,
  inputs,
  outputs,
}: {
  section: WDMSection;
  inputs: CalcInputs;
  outputs: CalcOutputs;
}) {
  return (
    <>
      <SectionHeader title={section.title} />
      {section.lines.map((line, idx) => {
        const key = `${section.id}-${line.screenLineNo ?? "x"}-${idx}`;
        return (
          <Fragment key={key}>
            <LineRow line={line} />
            {line.subSource && (
              <SourceLine a={line.subSource.a} b={line.subSource.b} />
            )}
            {/* Special-expenses threshold sub-note: appears once, right
                after Line 14a. Not yet carried in the WDM — derived from
                inputs/outputs here. Promotion tracked for Phase D. */}
            {section.id === "deviations" &&
              line.screenLineNo === "14a" &&
              inputs.includeSpecialExpenses && (
                <div className="border-b border-rule bg-cream/40 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                  {specialExpensesThresholdLine({
                    monthly: (inputs.specialExpensesAnnual || 0) / 12,
                    threshold: outputs.specialExpensesThresholdAmount,
                    basis: outputs.specialExpensesIncludedAsDeviation,
                  })}
                </div>
              )}
          </Fragment>
        );
      })}
    </>
  );
}
