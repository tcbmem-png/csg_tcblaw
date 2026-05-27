/**
 * buildWDM — Phase A
 *
 * Pure function: (CalcInputs, CalcOutputs, CaseCaption?) → WDM.
 *
 * The builder owns ALL display formatting decisions and ALL line-level
 * annotation logic that is currently inlined in
 * `official-worksheet.tsx`. Once Phase B rewires the screen and PDF
 * renderers to consume the WDM, those decisions live in exactly one
 * place.
 *
 * Approved Phase A behaviors (locked in chat):
 *  - Equal 50/50 → Line 6 (BCSO) prints "$0" with the margin annotation
 *    "equal-parenting cross-credit applied at Line 7 per Rule
 *    .04(7)(b)(2)(i)". (Cross-credit shows on Line 7.)
 *  - Equal 50/50 → PRP/ARP/SPLIT remain unchecked with the margin
 *    annotation "Equal parenting — Rule .04(7)(b)(2)(i)." on the
 *    parenting-time line. (SPLIT in TN means split custody, not
 *    split-time.)
 */

import type { CalcInputs, CalcOutputs, Direction, IncomeMethodology } from "../types";
import type { CaseCaption } from "../share";
import { defaultCaption } from "../share";
import { CITATIONS } from "../citations";
import {
  citationForBcso,
  citationForParentingMode,
} from "../citation-resolvers";
import type {
  WDM,
  WDMLine,
  WDMSection,
  WDMValue,
  WDMCaption,
  WDMPanels,
} from "./types";

const DEVIATION_METHODOLOGY_NOTE =
  "Deviations are applied as monthly cash flows after the BCSO is set. " +
  "The court must enter written findings stating the amount of support that " +
  "would have been ordered under the guidelines and the reasons for the deviation.";

// ---------- formatting helpers ----------

function fmtAbs(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function money(n: number): WDMValue {
  return { display: `$${fmtAbs(n)}`, amount: n };
}

function pct(fraction: number): WDMValue {
  return { display: `${(fraction * 100).toFixed(2)}%`, amount: fraction };
}

function text(display: string): WDMValue {
  return { display, amount: null };
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
    // Approved Phase A annotation — leaves PRP/ARP/SPLIT unchecked and
    // calls out the rule basis directly on the line.
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
        a: text(a),
        b: text(b),
        total: text(
          `${inputs.numChildren} child${inputs.numChildren > 1 ? "ren" : ""}`,
        ),
      },
      {
        screenLineNo: "2",
        label: "Parenting time",
        citation: citationForParentingMode(outputs),
        total: text(parentingTotal),
        annotation: parentingAnnotation,
      },
    ],
  };
}

function buildAgiSection(inputs: CalcInputs, outputs: CalcOutputs): WDMSection {
  return {
    id: "agi",
    title: "II · Adjusted Gross Income",
    lines: [
      {
        screenLineNo: "3",
        label: "Gross monthly income",
        citation: "gross_income",
        a: money(inputs.parentAGrossMonthly),
        b: money(inputs.parentBGrossMonthly),
        subSource: {
          a: incomeSourceLabel(inputs.parentAIncomeMethodology),
          b: incomeSourceLabel(inputs.parentBIncomeMethodology),
        },
      },
      {
        screenLineNo: "3a",
        label: "Less: self-employment tax credit",
        citation: "se_tax_credit",
        a: money(inputs.parentASECredit),
        b: money(inputs.parentBSECredit),
      },
      {
        screenLineNo: "3b",
        label: "Less: pre-existing child support paid",
        citation: "credit_not_in_home_children",
        a: money(inputs.parentAPriorSupport),
        b: money(inputs.parentBPriorSupport),
      },
      {
        screenLineNo: "3c",
        label: "Less: in-home children credit",
        citation: "credit_other_in_home_children",
        a: money(inputs.parentAInhomeCredit),
        b: money(inputs.parentBInhomeCredit),
      },
      {
        screenLineNo: "4",
        label: "Adjusted Gross Income (AGI)",
        citation: "agi",
        a: money(outputs.parentAAGI),
        b: money(outputs.parentBAGI),
        total: money(outputs.combinedAGI),
        emphasis: true,
      },
      {
        screenLineNo: "5",
        label: "Percentage of income (PI)",
        citation: "pro_rata",
        a: pct(outputs.piA),
        b: pct(outputs.piB),
        total: text("100.00%"),
      },
    ],
  };
}

function buildBcsoSection(inputs: CalcInputs, outputs: CalcOutputs): WDMSection {
  const lines: WDMLine[] = [];

  // -------- Line 6 (BCSO) --------
  const isEqual = outputs.parentingTimeBand === "equal";

  // Approved Phase A behavior: on Equal 50/50, Line 6 prints "$0" with
  // a margin annotation that points to the cross-credit on Line 7.
  const bcsoLine: WDMLine = isEqual
    ? {
        screenLineNo: "6",
        label: "BCSO (schedule lookup, rounded up)",
        citation: citationForBcso(outputs),
        total: money(0),
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
        total: money(outputs.bcso),
        emphasis: true,
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
      total: money(brk.topOfSchedule),
    });
    lines.push({
      label: "Combined AGI in excess of schedule cap",
      total: money(brk.excessAGI),
    });
    lines.push({
      label: `Above-cap rate × excess (${(brk.rate * 100).toFixed(2)}%)`,
      citation: "above_cap",
      total: text(`+ $${fmtAbs(brk.addition)}`),
    });
  }

  // -------- Line 7 (pro-rata BCSO share, or post-multiplier cross-credit) --------
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
    a: money(adjA),
    b: money(adjB),
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
          ? text(`multiplier ${outputs.variableMultiplier.toFixed(4)}`)
          : text("—"),
    },
    {
      screenLineNo: "9",
      label: "Net presumptive child support",
      citation: "pro_rata",
      total: text(
        `$${fmtAbs(outputs.netPresumptiveSupport)} ${dirLabel(outputs.presumptiveDirection, a, b)}`,
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
              )
            : text("—"),
      },
      {
        screenLineNo: "11",
        label: "Recurring uninsured medical (pro-rata)",
        citation: "addon_medical",
        a: money(inputs.uninsuredMedicalMonthly * outputs.piA),
        b: money(inputs.uninsuredMedicalMonthly * outputs.piB),
        total: text(`$${fmtAbs(inputs.uninsuredMedicalMonthly)}/mo`),
      },
      {
        screenLineNo: "12",
        label: `Work-related childcare — paid by ${inputs.childcarePaidBy === "parent_a" ? a : b}`,
        citation: "addon_childcare",
        total:
          inputs.childcareMonthly > 0
            ? text(
                `$${fmtAbs(inputs.childcareMonthly)}/mo · ${a} net ${fmtAbs(outputs.addOnChildcareFromA)}`,
              )
            : text("—"),
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
    lines.push({
      screenLineNo: "13",
      label: "Private school tuition (deviation, pro-rata)",
      citation: "private_school",
      total: text(
        `$${fmtAbs(outputs.privateSchoolMonthlyTotal)}/mo · ${a} net ${fmtAbs(outputs.privateSchoolDeviationFromA)}`,
      ),
    });
  }

  if (inputs.includeSpecialExpenses) {
    lines.push({
      screenLineNo: "14",
      label: "Special expenses — 7% of BCSO threshold",
      citation: "special_expenses",
      total: text(`Threshold $${fmtAbs(outputs.specialExpensesThresholdAmount)}/mo`),
    });
    lines.push({
      screenLineNo: "14a",
      label:
        outputs.specialExpensesIncludedAsDeviation > 0
          ? "Amount counted as deviation (excess of threshold)"
          : "Within presumed coverage — no deviation",
      total:
        outputs.specialExpensesIncludedAsDeviation > 0
          ? text(
              `$${fmtAbs(outputs.specialExpensesIncludedAsDeviation)}/mo · ${a} net ${fmtAbs(outputs.specialExpensesDeviationFromA)}`,
            )
          : text("—"),
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
        ),
        emphasis: true,
      },
      {
        screenLineNo: "16",
        label: "Annual",
        total: money(outputs.allInAnnual),
      },
    ],
  };
}

function buildPanels(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): WDMPanels {
  const statutoryCap = outputs.pcsoExceedsStatutoryMax
    ? {
        // Match the screen worksheet's "calculated PCSO" expression.
        calculatedPCSO:
          Math.abs(outputs.allInMonthlyFromA) +
          Math.abs(outputs.federalBenefitOffsetFromA),
        statutoryMax: outputs.pcsoStatutoryMax,
        excessOverCap: outputs.pcsoExcessOverCap,
        numChildren: inputs.numChildren,
        capNote: outputs.pcsoCapNote,
        caseNote: CITATIONS.pcso_max.caseNote ?? null,
      }
    : null;

  return {
    statutoryCap,
    pcsoBelowCapNote: outputs.pcsoExceedsStatutoryMax
      ? null
      : outputs.pcsoBelowCapNote,
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
