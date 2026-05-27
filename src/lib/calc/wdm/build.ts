/**
 * buildWDM — Phase A v2
 *
 * Pure function: (CalcInputs, CalcOutputs, CaseCaption?) → WDM.
 *
 * Owns all display formatting and all judgment-call metadata tagging.
 * Phase D narrative builders consume the WDM and rely on:
 *   - every "judgment" value carrying { rule, factors, userElection }
 *   - every userElection carrying source: "user_input" for userQuote()
 *   - methodology pass-through on Line 3 (both sides) for Appendix B
 *   - bcsoAboveCap structured sub-object on Line 6 (above-cap branch)
 *   - statutoryCap panel structured for both engaged and not-engaged
 *
 * Approved Phase A behaviors (locked in chat):
 *  - Equal 50/50 → Line 6 prints "$0" with the margin annotation
 *    "equal-parenting cross-credit applied at Line 7 per Rule
 *    .04(7)(b)(2)(i)". (Cross-credit shows on Line 7.)
 *  - Equal 50/50 → PRP/ARP/SPLIT remain unchecked with the margin
 *    annotation "Equal parenting — Rule .04(7)(b)(2)(i)." on the
 *    parenting-time line.
 */

import type {
  CalcInputs,
  CalcOutputs,
  Direction,
  IncomeMethodology,
} from "../types";
import type { CaseCaption } from "../share";
import { defaultCaption } from "../share";
import { CITATIONS, DEVIATION_METHODOLOGY_NOTE, type CitationKey } from "../citations";
import {
  citationForBcso,
  citationForParentingMode,
} from "../citation-resolvers";
import type {
  WDM,
  WDMLine,
  WDMSection,
  WDMValue,
  WDMValueCategory,
  WDMCaption,
  WDMPanels,
  WDMStatutoryCapPanel,
  WDMUserElection,
} from "./types";



// Burden-shift factor list, Nash v. Mulle progeny. Surfaced on the
// statutoryCap panel when engaged; consumed by Phase D narrative.
const PCSO_BURDEN_SHIFT_FACTORS: ReadonlyArray<string> = [
  "the child's reasonable needs at the time of the order",
  "the lifestyle the child would have enjoyed but for the parents' separation",
  "the recipient parent's proof of need above the presumptive cap",
  "the standard of living attributable to the obligor's income",
];

// ---------- formatting helpers ----------

function fmtAbs(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function money(n: number, category: WDMValueCategory = "mechanical"): WDMValue {
  return { display: `$${fmtAbs(n)}`, amount: n, category };
}

function pct(fraction: number, category: WDMValueCategory = "mechanical"): WDMValue {
  return {
    display: `${(fraction * 100).toFixed(2)}%`,
    amount: fraction,
    category,
  };
}

function text(display: string, category: WDMValueCategory = "structural"): WDMValue {
  return { display, amount: null, category };
}

function judgmentMoney(
  n: number,
  rule: CitationKey,
  factors: string[],
  userElection: WDMUserElection,
): WDMValue {
  return {
    display: `$${fmtAbs(n)}`,
    amount: n,
    category: "judgment",
    rule,
    factors,
    userElection,
  };
}

function dirLabel(d: Direction, a: string, b: string): string {
  if (d === "parent_a_to_b") return `${a} → ${b}`;
  if (d === "parent_b_to_a") return `${b} → ${a}`;
  return "—";
}

function incomeSourceLabel(m: IncomeMethodology | undefined): string {
  if (!m) return "Source: entered directly";
  if (m.path === "simple") {
    if (m.source === "w2_box5_annual") return "Source: W-2 Box 5 (annual ÷ 12)";
    return "Source: monthly gross (Income Helper)";
  }
  if (m.path === "variable") return "Source: variable income, multi-year averaging";
  if (m.path === "self_employed") return "Source: self-employment net + add-backs";
  if (m.path === "multi_source") return "Source: multiple income sources";
  if (m.path === "imputed") return "Source: imputed income (see appendix)";
  if (m.path === "special") return "Source: special situation (see appendix)";
  return "Source: entered directly";
}

// ---------- income-judgment tagging ----------

/**
 * Whether the gross-income figure for a parent is a judgment call.
 * - useImputation toggles the gross slot to the IMPUTED figure → judgment.
 * - imputed / variable / self_employed / special methodologies → judgment.
 * - simple / multi_source → mechanical (factual numeric input).
 */
function isGrossJudgment(
  useImputation: boolean,
  m: IncomeMethodology | undefined,
): boolean {
  if (useImputation) return true;
  if (!m) return false;
  return (
    m.path === "imputed" ||
    m.path === "variable" ||
    m.path === "self_employed" ||
    m.path === "special"
  );
}

function imputedRule(m: IncomeMethodology | undefined): CitationKey {
  if (m && m.path === "imputed") {
    if (m.method === "vocational_capacity") return "income_imputed_vocational";
    if (m.method === "asset_based") return "income_imputed_assets";
    return "income_imputed_prior_earnings";
  }
  return "income_imputed_prior_earnings";
}

function grossRule(
  useImputation: boolean,
  m: IncomeMethodology | undefined,
): CitationKey {
  if (useImputation || (m && m.path === "imputed")) return imputedRule(m);
  if (m?.path === "variable") return "income_variable";
  if (m?.path === "self_employed") return "income_self_employed";
  if (m?.path === "special") {
    if (m.situation === "incarcerated") return "income_carveout_incarceration";
    if (m.situation === "ssi_only") return "income_carveout_means_tested";
    if (m.situation === "federal_benefit_to_child")
      return "income_federal_benefit_to_child";
    return "income_imputed_prior_earnings";
  }
  return "gross_income";
}

function grossFactors(
  useImputation: boolean,
  m: IncomeMethodology | undefined,
): string[] {
  if (useImputation || (m && m.path === "imputed")) {
    const method = m && m.path === "imputed" ? m.method : "prior_earnings";
    if (method === "vocational_capacity") {
      return [
        "occupation",
        "geographic area / labor market",
        "education and training",
        "hours per week reasonably available",
      ];
    }
    if (method === "asset_based") {
      return [
        "non-income-producing assets controlled by the parent",
        "reasonable rate of return on those assets",
      ];
    }
    return [
      "past and present employment",
      "education and training",
      "averaging period applied to prior earnings",
    ];
  }
  if (m?.path === "variable") {
    return [
      "reasonableness of the averaging period selected",
      "weight given to outlier years",
      "consistency with the parent's earnings pattern",
    ];
  }
  if (m?.path === "self_employed") {
    return [
      "ordinary-and-necessary character of each claimed expense",
      "treatment of accelerated depreciation and §179 add-backs",
      "characterization of distributions vs. compensation",
    ];
  }
  if (m?.path === "special") {
    return ["statutory carve-out applicability for the parent's situation"];
  }
  return [];
}

function grossUserElection(
  side: "A" | "B",
  m: IncomeMethodology | undefined,
  useImputation: boolean,
): WDMUserElection {
  const field = side === "A" ? "parentAIncomeMethodology" : "parentBIncomeMethodology";
  // Rationale lives at different keys per path; pull whatever is present.
  let rationale: string | undefined;
  if (m && "rationale" in m && typeof m.rationale === "string") {
    rationale = m.rationale;
  }
  return {
    field: useImputation && !m ? `useImputationFor${side}` : field,
    value: m ?? null,
    rationale,
    source: "user_input",
  };
}

function captionFrom(c: CaseCaption): WDMCaption {
  return {
    matterName: c.matterName,
    docketNumber: c.docketNumber,
    court: c.court,
    client: c.client,
    preparedBy: c.preparedBy,
    comments: c.comments,
    parentARole: c.parentARole,
  };
}

function captionHasContent(c: WDMCaption): boolean {
  return !!(
    c.matterName ||
    c.docketNumber ||
    c.court ||
    c.preparedBy ||
    c.client
  );
}

// ---------- section builders ----------

function buildIdentificationSection(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMSection {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  let parentingTotal: string;
  let parentingAnnotation: string | undefined;
  if (inputs.parentingType === "equal") {
    parentingTotal = "Equal (182.5 / 182.5)";
    parentingAnnotation = "Equal parenting — Rule .04(7)(b)(2)(i).";
  } else if (inputs.parentingType === "standard") {
    parentingTotal = `Standard (ARP = ${inputs.arpForStandard === "parent_a" ? a : b}, 80 days)`;
  } else {
    parentingTotal = `Custom (${inputs.parentADays} / ${inputs.parentBDays})`;
  }

  return {
    id: "identification",
    title: "I · Identification",
    lines: [
      {
        screenLineNo: "1",
        label: "Parent labels",
        a: text(a, "structural"),
        b: text(b, "structural"),
        total: text(
          `${inputs.numChildren} child${inputs.numChildren > 1 ? "ren" : ""}`,
          "structural",
        ),
      },
      {
        screenLineNo: "2",
        label: "Parenting time",
        citation: citationForParentingMode(outputs),
        total: text(parentingTotal, "structural"),
        annotation: parentingAnnotation,
      },
    ],
  };
}

function buildAgiSection(inputs: CalcInputs, outputs: CalcOutputs): WDMSection {
  // Line 3 — gross income, judgment-tagged per side independently.
  const aJudgment = isGrossJudgment(
    inputs.useImputationForA,
    inputs.parentAIncomeMethodology,
  );
  const bJudgment = isGrossJudgment(
    inputs.useImputationForB,
    inputs.parentBIncomeMethodology,
  );

  const grossA = aJudgment
    ? judgmentMoney(
        inputs.parentAGrossMonthly,
        grossRule(inputs.useImputationForA, inputs.parentAIncomeMethodology),
        grossFactors(inputs.useImputationForA, inputs.parentAIncomeMethodology),
        grossUserElection("A", inputs.parentAIncomeMethodology, inputs.useImputationForA),
      )
    : money(inputs.parentAGrossMonthly, "mechanical");

  const grossB = bJudgment
    ? judgmentMoney(
        inputs.parentBGrossMonthly,
        grossRule(inputs.useImputationForB, inputs.parentBIncomeMethodology),
        grossFactors(inputs.useImputationForB, inputs.parentBIncomeMethodology),
        grossUserElection("B", inputs.parentBIncomeMethodology, inputs.useImputationForB),
      )
    : money(inputs.parentBGrossMonthly, "mechanical");

  return {
    id: "agi",
    title: "II · Adjusted Gross Income",
    lines: [
      {
        screenLineNo: "3",
        label: "Gross monthly income",
        citation: "gross_income",
        a: grossA,
        b: grossB,
        subSource: {
          a: incomeSourceLabel(inputs.parentAIncomeMethodology),
          b: incomeSourceLabel(inputs.parentBIncomeMethodology),
        },
        // Refinement 3: both sides pass through independently.
        methodology: {
          parentA: inputs.parentAIncomeMethodology,
          parentB: inputs.parentBIncomeMethodology,
        },
      },
      {
        screenLineNo: "3a",
        label: "Less: self-employment tax credit",
        citation: "se_tax_credit",
        a: money(inputs.parentASECredit, "mechanical"),
        b: money(inputs.parentBSECredit, "mechanical"),
      },
      {
        screenLineNo: "3b",
        label: "Less: pre-existing child support paid",
        citation: "credit_not_in_home_children",
        a: money(inputs.parentAPriorSupport, "mechanical"),
        b: money(inputs.parentBPriorSupport, "mechanical"),
      },
      {
        screenLineNo: "3c",
        label: "Less: in-home children credit",
        citation: "credit_other_in_home_children",
        a: money(inputs.parentAInhomeCredit, "mechanical"),
        b: money(inputs.parentBInhomeCredit, "mechanical"),
      },
      {
        screenLineNo: "4",
        label: "Adjusted Gross Income (AGI)",
        citation: "agi",
        a: money(outputs.parentAAGI, "mechanical"),
        b: money(outputs.parentBAGI, "mechanical"),
        total: money(outputs.combinedAGI, "mechanical"),
        emphasis: true,
      },
      {
        screenLineNo: "5",
        label: "Percentage of income (PI)",
        citation: "pro_rata",
        a: pct(outputs.piA, "mechanical"),
        b: pct(outputs.piB, "mechanical"),
        total: text("100.00%", "mechanical"),
      },
    ],
  };
}

function buildBcsoSection(inputs: CalcInputs, outputs: CalcOutputs): WDMSection {
  const lines: WDMLine[] = [];

  const isEqual = outputs.parentingTimeBand === "equal";

  // Line 6 — Equal 50/50 prints $0 with the cross-credit annotation.
  // BCSO source classification is rule-driven → structural (the
  // schedule cell or above-cap formula is mechanical given AGI, but
  // the *choice* of source path is rule-prescribed).
  const bcsoLine: WDMLine = isEqual
    ? {
        screenLineNo: "6",
        label: "BCSO (schedule lookup, rounded up)",
        citation: citationForBcso(outputs),
        total: money(0, "structural"),
        emphasis: true,
        annotation:
          "equal-parenting cross-credit applied at Line 7 per Rule .04(7)(b)(2)(i)",
      }
    : {
        screenLineNo: "6",
        label:
          outputs.bcsoSource === "above_cap"
            ? "BCSO (above-cap formula)"
            : "BCSO (schedule lookup, rounded up)",
        citation: citationForBcso(outputs),
        total: money(outputs.bcso, "structural"),
        emphasis: true,
        // Structured pass-through (Refinement #2 of the original four
        // checks): Phase D narrative reads this object directly.
        bcsoAboveCap: outputs.bcsoAboveCapBreakdown ?? undefined,
      };
  lines.push(bcsoLine);

  if (outputs.scheduleAgiUsed !== null) {
    lines.push({
      label: `Schedule row used: $${fmtAbs(outputs.scheduleAgiUsed)} combined AGI / ${inputs.numChildren} children`,
      citation: "bcso_schedule_table",
    });
  }

  if (outputs.bcsoAboveCapBreakdown) {
    const brk = outputs.bcsoAboveCapBreakdown;
    lines.push({
      label: `Top of schedule (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"} at $28,250 combined AGI)`,
      total: money(brk.topOfSchedule, "structural"),
    });
    lines.push({
      label: "Combined AGI in excess of schedule cap",
      total: money(brk.excessAGI, "mechanical"),
    });
    lines.push({
      label: `Above-cap rate × excess (${(brk.rate * 100).toFixed(2)}%)`,
      citation: "above_cap",
      total: text(`+ $${fmtAbs(brk.addition)}`, "mechanical"),
    });
  }

  // Line 7 — pro-rata share, or post-multiplier cross-credit on Equal 50/50.
  let adjA = outputs.parentABcsoShare;
  let adjB = outputs.parentBBcsoShare;
  let line7Label = "Pro-rata share of BCSO";
  if (isEqual) {
    line7Label = "Adjusted BCSO (post-multiplier, Rule .04(7)(b)(2)(i))";
    const netAbs = Math.abs(outputs.netPresumptiveSupport);
    if (outputs.presumptiveDirection === "parent_a_to_b") {
      adjA = netAbs;
      adjB = 0;
    } else if (outputs.presumptiveDirection === "parent_b_to_a") {
      adjA = 0;
      adjB = netAbs;
    } else {
      adjA = 0;
      adjB = 0;
    }
  }
  lines.push({
    screenLineNo: "7",
    label: line7Label,
    citation: "pro_rata",
    a: money(adjA, "mechanical"),
    b: money(adjB, "mechanical"),
  });

  return {
    id: "bcso",
    title: "III · Basic Child Support Obligation",
    lines,
  };
}

function buildParentingTimeSection(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMSection {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  const lines: WDMLine[] = [
    {
      screenLineNo: "8",
      label: `Band: ${outputs.parentingTimeBand}`,
      citation: citationForParentingMode(outputs),
      total:
        outputs.variableMultiplier !== null
          ? text(`multiplier ${outputs.variableMultiplier.toFixed(4)}`, "structural")
          : text("—", "structural"),
    },
    {
      screenLineNo: "9",
      label: "Net presumptive child support",
      citation: "pro_rata",
      total: text(
        `$${fmtAbs(outputs.netPresumptiveSupport)} ${dirLabel(outputs.presumptiveDirection, a, b)}`,
        "mechanical",
      ),
      emphasis: true,
    },
  ];

  if (outputs.ssrApplied && outputs.ssrNote) {
    lines.push({ label: outputs.ssrNote, citation: "ssr" });
  }

  return {
    id: "parenting_time",
    title: "IV · Parenting Time Adjustment",
    lines,
  };
}

function buildAddOnsSection(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMSection {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;

  return {
    id: "addons",
    title: "V · Mandatory Add-Ons (pro-rata)",
    lines: [
      {
        screenLineNo: "10",
        label: `Health insurance — paid by ${inputs.healthPaidBy === "parent_a" ? a : b}`,
        citation: "addon_health",
        total:
          inputs.healthPremiumMonthly > 0
            ? text(
                `$${fmtAbs(inputs.healthPremiumMonthly)}/mo · ${a} net ${fmtAbs(outputs.addOnHealthFromA)}`,
                "mechanical",
              )
            : text("—", "mechanical"),
      },
      {
        screenLineNo: "11",
        label: "Recurring uninsured medical (pro-rata)",
        citation: "addon_medical",
        a: money(inputs.uninsuredMedicalMonthly * outputs.piA, "mechanical"),
        b: money(inputs.uninsuredMedicalMonthly * outputs.piB, "mechanical"),
        total: text(`$${fmtAbs(inputs.uninsuredMedicalMonthly)}/mo`, "mechanical"),
      },
      {
        screenLineNo: "12",
        label: `Work-related childcare — paid by ${inputs.childcarePaidBy === "parent_a" ? a : b}`,
        citation: "addon_childcare",
        total:
          inputs.childcareMonthly > 0
            ? text(
                `$${fmtAbs(inputs.childcareMonthly)}/mo · ${a} net ${fmtAbs(outputs.addOnChildcareFromA)}`,
                "mechanical",
              )
            : text("—", "mechanical"),
      },
    ],
  };
}

function buildDeviationsSection(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMSection | null {
  if (!inputs.includePrivateSchool && !inputs.includeSpecialExpenses) {
    return null;
  }

  const a = inputs.parentALabel;
  const lines: WDMLine[] = [];

  if (inputs.includePrivateSchool) {
    // Deviations are court-discretion calls → judgment.
    const election: WDMUserElection = {
      field: "includePrivateSchool",
      value: {
        privateSchoolAnnual: inputs.privateSchoolAnnual,
        privateSchoolPaidBy: inputs.privateSchoolPaidBy,
      },
      source: "user_input",
    };
    lines.push({
      screenLineNo: "13",
      label: "Private school tuition (deviation, pro-rata)",
      citation: "private_school",
      total: {
        display: `$${fmtAbs(outputs.privateSchoolMonthlyTotal)}/mo · ${a} net ${fmtAbs(outputs.privateSchoolDeviationFromA)}`,
        amount: outputs.privateSchoolMonthlyTotal,
        category: "judgment",
        rule: "private_school",
        factors: [
          "best interest of the child",
          "consistency with the parents' financial means",
          "history of the child's enrollment",
        ],
        userElection: election,
      },
    });
  }

  if (inputs.includeSpecialExpenses) {
    lines.push({
      screenLineNo: "14",
      label: "Special expenses — 7% of BCSO threshold",
      citation: "special_expenses",
      total: text(
        `Threshold $${fmtAbs(outputs.specialExpensesThresholdAmount)}/mo`,
        "structural",
      ),
    });
    const seElection: WDMUserElection = {
      field: "includeSpecialExpenses",
      value: {
        specialExpensesAnnual: inputs.specialExpensesAnnual,
        specialExpensesWaiveThreshold: inputs.specialExpensesWaiveThreshold,
        specialExpensesPaidBy: inputs.specialExpensesPaidBy,
      },
      source: "user_input",
    };
    lines.push({
      screenLineNo: "14a",
      label:
        outputs.specialExpensesIncludedAsDeviation > 0
          ? "Amount counted as deviation (excess of threshold)"
          : "Within presumed coverage — no deviation",
      total:
        outputs.specialExpensesIncludedAsDeviation > 0
          ? {
              display: `$${fmtAbs(outputs.specialExpensesIncludedAsDeviation)}/mo · ${a} net ${fmtAbs(outputs.specialExpensesDeviationFromA)}`,
              amount: outputs.specialExpensesIncludedAsDeviation,
              category: "judgment",
              rule: "special_expenses",
              factors: [
                "child's reasonable need for the expense",
                "amount in excess of the 7% presumed-coverage threshold",
                "whether the threshold has been waived by the court",
              ],
              userElection: seElection,
            }
          : text("—", "structural"),
    });
  }

  return {
    id: "deviations",
    title: "VI · Discretionary Deviations",
    lines,
  };
}

function buildFinalSection(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMSection {
  const a = inputs.parentALabel;
  const b = inputs.parentBLabel;
  return {
    id: "final",
    title: "VII · Final Order",
    lines: [
      {
        screenLineNo: "15",
        label: "All-in monthly obligation",
        citation: "fcso",
        total: text(
          `$${fmtAbs(outputs.allInMonthly)} ${dirLabel(outputs.allInDirection, a, b)}`,
          "mechanical",
        ),
        emphasis: true,
      },
      {
        screenLineNo: "16",
        label: "Annual",
        total: money(outputs.allInAnnual, "mechanical"),
      },
    ],
  };
}

function buildStatutoryCapPanel(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMStatutoryCapPanel {
  const calculatedPCSO =
    Math.abs(outputs.allInMonthlyFromA) +
    Math.abs(outputs.federalBenefitOffsetFromA);
  const statutoryMax = outputs.pcsoStatutoryMax;
  const engaged = outputs.pcsoExceedsStatutoryMax;

  return {
    engaged,
    calculatedPCSO,
    statutoryMax,
    numChildren: inputs.numChildren,
    excessOverCap: engaged ? outputs.pcsoExcessOverCap : 0,
    headroom: engaged ? 0 : Math.max(0, statutoryMax - calculatedPCSO),
    capNote: engaged ? outputs.pcsoCapNote : outputs.pcsoBelowCapNote,
    caseLaw: CITATIONS.pcso_max.caseNote ?? null,
    factors: engaged ? [...PCSO_BURDEN_SHIFT_FACTORS] : [],
    // Fixture #11 input flow not yet wired — leave null until the
    // above-cap user-elected PCSO input lands. Phase D narrative reads
    // this field; null means "no user election yet".
    userElectedPCSO: null,
  };
}

function buildPanels(inputs: CalcInputs, outputs: CalcOutputs): WDMPanels {
  return {
    statutoryCap: buildStatutoryCapPanel(inputs, outputs),
    equalParentingLowSupportNote: outputs.equalParentingLowSupportNote,
    nonEarnerArpNote: outputs.nonEarnerArpNote,
    zeroPresumptiveNote: outputs.zeroPresumptiveNote,
    deviationMethodologyNote:
      inputs.includePrivateSchool || inputs.includeSpecialExpenses
        ? DEVIATION_METHODOLOGY_NOTE
        : null,
  };
}

// ---------- top-level builder ----------

export interface BuildWDMOptions {
  /**
   * Override the "prepared on" date string. Defaults to today in en-US.
   * Useful for deterministic snapshot tests.
   */
  preparedOnDisplay?: string;
}

export function buildWDM(
  inputs: CalcInputs,
  outputs: CalcOutputs,
  caption: CaseCaption = defaultCaption(),
  opts: BuildWDMOptions = {},
): WDM {
  const sections: WDMSection[] = [
    buildIdentificationSection(inputs, outputs),
    buildAgiSection(inputs, outputs),
    buildBcsoSection(inputs, outputs),
    buildParentingTimeSection(inputs, outputs),
    buildAddOnsSection(inputs, outputs),
  ];
  const deviations = buildDeviationsSection(inputs, outputs);
  if (deviations) sections.push(deviations);
  sections.push(buildFinalSection(inputs, outputs));

  const wdmCaption = captionFrom(caption);

  return {
    header: {
      jurisdiction: "State of Tennessee · Department of Human Services",
      formTitle: "Child Support Worksheet — Income Shares Model",
      scheduleEffectiveDate: outputs.scheduleEffectiveDate,
      preparedOnDisplay:
        opts.preparedOnDisplay ?? new Date().toLocaleDateString("en-US"),
    },
    caption: wdmCaption,
    hasCaption: captionHasContent(wdmCaption),
    parentALabel: inputs.parentALabel,
    parentBLabel: inputs.parentBLabel,
    numChildren: inputs.numChildren,
    sections,
    panels: buildPanels(inputs, outputs),
    warnings: outputs.warnings,
    errors: outputs.errors,
  };
}

/** Convenience: look up a line by its screenLineNo across all sections. */
export function findLineByScreenNo(wdm: WDM, screenLineNo: string): WDMLine | undefined {
  for (const section of wdm.sections) {
    for (const line of section.lines) {
      if (line.screenLineNo === screenLineNo) return line;
    }
  }
  return undefined;
}

/** Walk every WDMValue in the WDM (sections × lines × {a,b,total}).
 *  Used by the Phase A lint tests and by Phase D narrative routing. */
export function walkValues(wdm: WDM): WDMValue[] {
  const out: WDMValue[] = [];
  for (const s of wdm.sections) {
    for (const l of s.lines) {
      for (const v of [l.a, l.b, l.total]) {
        if (v) out.push(v);
      }
    }
  }
  return out;
}
