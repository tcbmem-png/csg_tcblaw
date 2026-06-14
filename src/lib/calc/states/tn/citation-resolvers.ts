/**
 * Resolve a CalcInputs / CalcOutputs state into the specific paragraph-level
 * citation that applies to each computed line, and produce the canonical
 * worksheet manifest that both the on-screen worksheet, the PDF, and the
 * mechanical citations test consume.
 *
 * Pure functions. No React. No engine math. Annotation-only — adding or
 * changing a resolver here NEVER changes a calculated number.
 */

import type {
  CalcInputs,
  CalcOutputs,
  IncomeMethodology,
} from "./types";
import { CITATIONS, type Citation, type CitationKey } from "./citations";

/** Resolve the citation key for a parent's income line based on methodology. */
export function citationForIncomePath(
  m: IncomeMethodology | undefined,
): CitationKey {
  if (!m) return "income_simple";
  switch (m.path) {
    case "simple":
      return "income_simple";
    case "variable":
      return "income_variable";
    case "self_employed":
      return "income_self_employed";
    case "multi_source":
      return "income_multi_source";
    case "imputed":
      if (m.method === "prior_earnings") return "income_imputed_prior_earnings";
      if (m.method === "vocational_capacity") return "income_imputed_vocational";
      return "income_imputed_assets";
    case "special":
      if (m.situation === "ssi_only") return "income_carveout_means_tested";
      if (m.situation === "incarcerated") return "income_carveout_incarceration";
      if (m.situation === "federal_benefit_to_child")
        return "income_federal_benefit_to_child";
      return "income_simple";
  }
}

/** Resolve the citation key for the parenting-time band. */
export function citationForParentingMode(
  outputs: CalcOutputs,
): CitationKey {
  switch (outputs.parentingTimeBand) {
    case "equal":
      return "parenting_time_5050";
    case "reduction":
      return "parenting_time_reduction";
    case "increase":
      return "parenting_time_increase";
    case "standard":
    case "neutral":
    default:
      return "parenting_time_arp_reduction";
  }
}

/** Resolve the citation key for the BCSO derivation. */
export function citationForBcso(outputs: CalcOutputs): CitationKey {
  if (outputs.bcsoSource === "above_cap") return "above_cap";
  return "bcso_schedule_within";
}

/**
 * A single annotated line on the worksheet. `citation` is null only for
 * practitioner-input lines (case caption, parent labels, raw entered
 * values that are not yet a rule application).
 */
export interface ManifestEntry {
  /** Worksheet line label (matches what's printed in the UI). */
  label: string;
  /** Optional line number/letter for display ("1", "3a", "10"). */
  lineNumber?: string;
  /** Citation key, or null for explicit practitioner-input lines. */
  citation: CitationKey | null;
  /** Whether this is a computed numeric line (vs. categorical or input). */
  numeric: boolean;
}

/**
 * Build the canonical line→citation manifest for a calculation result.
 *
 * Both `OfficialWorksheet` (in-app) and `official-worksheet-pdf.ts` consume
 * this so the test in `__tests__/citations.test.ts` exercises the same
 * source of truth — no parallel list to drift.
 */
export function manifestFor(
  inputs: CalcInputs,
  outputs: CalcOutputs,
): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  // Practitioner-input identification lines (intentionally non-cited).
  entries.push({
    label: "Parent labels",
    lineNumber: "1",
    citation: null,
    numeric: false,
  });

  // Parenting time mode is a categorical determination cited to .04(7).
  entries.push({
    label: "Parenting time",
    lineNumber: "2",
    citation: citationForParentingMode(outputs),
    numeric: false,
  });

  // -------- AGI block --------
  entries.push({
    label: "Gross monthly income (Parent A)",
    lineNumber: "3",
    citation: citationForIncomePath(inputs.parentAIncomeMethodology),
    numeric: true,
  });
  entries.push({
    label: "Gross monthly income (Parent B)",
    lineNumber: "3",
    citation: citationForIncomePath(inputs.parentBIncomeMethodology),
    numeric: true,
  });
  if (inputs.parentASECredit > 0 || inputs.parentBSECredit > 0) {
    entries.push({
      label: "Self-employment tax credit",
      lineNumber: "3a",
      citation: "se_tax_credit",
      numeric: true,
    });
  }
  if (inputs.parentAPriorSupport > 0 || inputs.parentBPriorSupport > 0) {
    entries.push({
      label: "Pre-existing child support paid (not-in-home)",
      lineNumber: "3b",
      citation: "credit_not_in_home_children",
      numeric: true,
    });
  }
  if (inputs.parentAInhomeCredit > 0 || inputs.parentBInhomeCredit > 0) {
    entries.push({
      label: "In-home children credit",
      lineNumber: "3c",
      citation: "credit_other_in_home_children",
      numeric: true,
    });
  }
  entries.push({
    label: "Adjusted Gross Income (AGI)",
    lineNumber: "4",
    citation: "agi",
    numeric: true,
  });
  entries.push({
    label: "Percentage of income (PI)",
    lineNumber: "5",
    citation: "pro_rata",
    numeric: true,
  });

  // -------- BCSO --------
  entries.push({
    label:
      outputs.bcsoSource === "above_cap"
        ? "BCSO (above-cap formula)"
        : "BCSO (schedule lookup, rounded up)",
    lineNumber: "6",
    citation: citationForBcso(outputs),
    numeric: true,
  });
  if (outputs.bcsoSource === "schedule") {
    entries.push({
      label: "Schedule row rounding",
      citation: "bcso_schedule_table",
      numeric: true,
    });
  }
  entries.push({
    label: "Pro-rata share of BCSO",
    lineNumber: "7",
    citation: "pro_rata",
    numeric: true,
  });

  // -------- Parenting time --------
  entries.push({
    label: `Parenting time band: ${outputs.parentingTimeBand}`,
    lineNumber: "8",
    citation: citationForParentingMode(outputs),
    numeric: true,
  });
  if (
    outputs.parentingTimeBand === "reduction" ||
    outputs.parentingTimeBand === "increase"
  ) {
    entries.push({
      label: "Day-threshold constants (68 / 92 / 182.5)",
      citation: "parenting_time_day_constants",
      numeric: false,
    });
  }
  entries.push({
    label: "Net presumptive child support",
    lineNumber: "9",
    citation: "pro_rata",
    numeric: true,
  });

  // -------- SSR --------
  if (outputs.ssrApplied) {
    entries.push({
      label: "Self-Support Reserve applied",
      citation: "ssr",
      numeric: false,
    });
  }

  // -------- Add-ons --------
  if (inputs.healthPremiumMonthly > 0) {
    entries.push({
      label: "Health insurance (children's portion)",
      lineNumber: "10",
      citation: "addon_health",
      numeric: true,
    });
  }
  if (inputs.uninsuredMedicalMonthly > 0) {
    entries.push({
      label: "Recurring uninsured medical",
      lineNumber: "11",
      citation: "addon_medical",
      numeric: true,
    });
  }
  if (inputs.childcareMonthly > 0) {
    entries.push({
      label: "Work-related childcare",
      lineNumber: "12",
      citation: "addon_childcare",
      numeric: true,
    });
  }

  // -------- Federal benefit to child --------
  if (inputs.parentAFederalBenefit > 0 || inputs.parentBFederalBenefit > 0) {
    entries.push({
      label: "Federal benefit paid to the child (line 16 offset)",
      citation: "income_federal_benefit_to_child",
      numeric: true,
    });
  }

  // -------- Deviations --------
  if (inputs.includePrivateSchool) {
    entries.push({
      label: "Private school tuition (deviation)",
      lineNumber: "13",
      citation: "private_school",
      numeric: true,
    });
  }
  if (inputs.includeSpecialExpenses) {
    entries.push({
      label: "Special expenses — 7% threshold",
      lineNumber: "14",
      citation: "special_expenses",
      numeric: true,
    });
  }

  // -------- Final --------
  entries.push({
    label: "All-in monthly obligation",
    lineNumber: "15",
    citation: "fcso",
    numeric: true,
  });

  // -------- Categorical flags --------
  if (outputs.pcsoExceedsStatutoryMax) {
    entries.push({
      label: "Statutory PCSO cap exceeded",
      citation: "pcso_max",
      numeric: false,
    });
  }
  if (inputs.parentAMeansTestedOnly || inputs.parentBMeansTestedOnly) {
    entries.push({
      label: "Means-tested-only income carve-out",
      citation: "income_carveout_means_tested",
      numeric: false,
    });
  }

  return entries;
}

/** Look up the full Citation object for a key (sugar). */
export function getCitation(key: CitationKey): Citation {
  return CITATIONS[key];
}
