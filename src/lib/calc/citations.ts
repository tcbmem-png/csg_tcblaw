/**
 * Tennessee Child Support Guidelines — citation registry.
 *
 * Every dollar number, threshold, or categorical determination on the
 * worksheet must trace back to an entry here. The article's "every formula
 * annotated" claim is enforced mechanically by
 * src/lib/calc/__tests__/citations.test.ts, which walks the shared
 * worksheet manifest (see citation-resolvers.ts) and asserts every
 * non-practitioner line has a CITATIONS key.
 *
 * Rule paragraphs are cited to Tenn. Comp. R. & Regs. 1240-02-04 and follow
 * the format used by the TN Secretary of State's official chapter PDF.
 * Hyperlinks point to the chapter-level PDF; the URL structure does not
 * support stable paragraph-level anchoring, so we never deep-link.
 *
 * Statutory citations use the full "Tenn. Code Ann. § ..." form.
 */

/** Canonical chapter-PDF URL for Tenn. Comp. R. & Regs. 1240-02-04. */
export const TN_CHAPTER_URL =
  "https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20231215.pdf";

export interface Citation {
  /** Rule or statute reference (e.g. "1240-02-04-.09(2)(d)" or "Tenn. Code Ann. § 36-5-101(e)(1)(B)"). */
  rule: string;
  /** Short human-readable name for the cited paragraph. */
  name: string;
  /** Plain-English explanation surfaced in the ⓘ tooltip. */
  plain: string;
  /** Link to the source rule or statute (chapter-level only for TN regs). */
  url?: string;
  /** Optional case-law footnote (used on the statutory cap). */
  caseNote?: string;
}

export type CitationKey =
  // Line 1 — Gross income / income basis
  | "gross_income"
  | "income_simple"
  | "income_variable"
  | "income_self_employed"
  | "income_multi_source"
  | "income_imputed_prior_earnings"
  | "income_imputed_vocational"
  | "income_imputed_assets"
  | "income_carveout_incarceration"
  | "income_carveout_means_tested"
  | "income_federal_benefit_to_child"
  // Line 2 — Adjustments to gross
  | "se_tax_credit"
  | "credit_other_in_home_children"
  | "credit_not_in_home_children"
  // Line 3 — AGI / pro-rata
  | "agi"
  | "pro_rata"
  // Line 4 — BCSO
  | "bcso_schedule_within"
  | "bcso_schedule_table"
  | "above_cap"
  // Line 5/6/7 — Parenting time
  | "parenting_time_arp_reduction"
  | "parenting_time_increase"
  | "parenting_time_reduction"
  | "parenting_time_5050"
  | "parenting_time_day_constants"
  // Line 8 — Add-ons
  | "addon_health"
  | "addon_childcare"
  | "addon_medical"
  // Line 8/deviations
  | "special_expenses"
  | "private_school"
  | "deviation_general"
  // Line 10 / 11 / 12
  | "pcso_max"
  | "ssr"
  | "minimum"
  | "fcso";

export const CITATIONS: Record<CitationKey, Citation> = {
  // -------- Line 1 — Income basis --------
  gross_income: {
    rule: "1240-02-04-.04(3)",
    name: "Gross Income",
    plain:
      "All income from any source before taxes and voluntary retirement deductions. For W-2 employees use Box 5 (Medicare wages), not Box 1.",
    url: TN_CHAPTER_URL,
  },
  income_simple: {
    rule: "1240-02-04-.04(3)(a)",
    name: "Gross Income — Employment",
    plain:
      "Wages, salary, commissions, bonuses, overtime, tips, and severance from employment, taken before voluntary retirement deductions.",
    url: TN_CHAPTER_URL,
  },
  income_variable: {
    rule: "1240-02-04-.04(3)(a)",
    name: "Gross Income — Variable",
    plain:
      "Variable income (bonuses, commissions, overtime) is averaged across prior tax years to produce a representative monthly figure.",
    url: TN_CHAPTER_URL,
  },
  income_self_employed: {
    rule: "1240-02-04-.04(3)(a)",
    name: "Gross Income — Self-Employment",
    plain:
      "Self-employment income equals gross receipts minus ordinary and necessary expenses, plus add-backs (depreciation, §179, personal-use portions). Self-employment tax credit applies separately at Rule .04(5)(a).",
    url: TN_CHAPTER_URL,
  },
  income_multi_source: {
    rule: "1240-02-04-.04(3)(a)",
    name: "Gross Income — Multiple Sources",
    plain:
      "Income from multiple sources (employment, contract, rental, investment) is summed to a single monthly gross figure.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_prior_earnings: {
    rule: "1240-02-04-.04(3)(a)(2)(i)",
    name: "Imputation — Prior Earnings",
    plain:
      "Income may be imputed to a willfully under-employed parent based on prior earnings, averaged across recent tax years.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_vocational: {
    rule: "1240-02-04-.04(3)(a)(2)(ii)",
    name: "Imputation — Vocational Capacity",
    plain:
      "Income may be imputed based on the parent's education, training, recent work history, and the local job market.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_assets: {
    rule: "1240-02-04-.04(3)(a)(2)",
    name: "Imputation — Substantial Non-Income-Producing Assets",
    plain:
      "Income may be imputed from substantial non-income-producing assets at a reasonable rate of return.",
    url: TN_CHAPTER_URL,
  },
  income_carveout_incarceration: {
    rule: "1240-02-04-.04(3)(a)(2)(iii)",
    name: "Incarceration Carve-Out",
    plain:
      "Incarceration is not voluntary unemployment for purposes of imputation, unless the incarceration is for criminal nonsupport, domestic violence, or child abuse against the child or the child's other parent.",
    url: TN_CHAPTER_URL,
  },
  income_carveout_means_tested: {
    rule: "1240-02-04-.04(3)(a)(2)(iv)",
    name: "Means-Tested Income Only",
    plain:
      "A parent whose only income is from means-tested public assistance (SSI, TANF, food stamps) shall be presumed to be unable to pay child support.",
    url: TN_CHAPTER_URL,
  },
  income_federal_benefit_to_child: {
    rule: "1240-02-04-.04(3)(b)",
    name: "Federal Benefit Paid to the Child",
    plain:
      "SSA or VA derivative benefits paid to the child on a parent's disability or retirement record offset that parent's FCSO at line 16; they do not reduce AGI.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 2 — Adjustments --------
  se_tax_credit: {
    rule: "1240-02-04-.04(5)(a)",
    name: "Self-Employment Tax Credit",
    plain:
      "A self-employed parent receives a credit for the employer-equivalent portion of FICA/Medicare not withheld by an employer.",
    url: TN_CHAPTER_URL,
  },
  credit_other_in_home_children: {
    rule: "1240-02-04-.04(5)(b)(1)",
    name: "Credit — Other Children in the Home",
    plain:
      "A theoretical-order credit is available for the parent's biological/adopted children who live in that parent's home but are not before the court in this case.",
    url: TN_CHAPTER_URL,
  },
  credit_not_in_home_children: {
    rule: "1240-02-04-.04(5)(b)(2)",
    name: "Credit — Other Children Not in the Home",
    plain:
      "A credit is available for child support actually paid pursuant to an existing order for the parent's other biological/adopted children.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 3 — AGI / pro-rata --------
  agi: {
    rule: "1240-02-04-.04",
    name: "Adjusted Gross Income",
    plain:
      "Gross income minus self-employment tax credit, pre-existing child support paid, and the in-home/not-in-home children credit.",
    url: TN_CHAPTER_URL,
  },
  pro_rata: {
    rule: "1240-02-04-.04(6)(b)",
    name: "Percentage of Income (PI)",
    plain:
      "Each parent's percentage of combined AGI determines that parent's pro-rata share of the BCSO and the add-ons.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 4 — BCSO --------
  bcso_schedule_within: {
    rule: "1240-02-04-.09(2)(a)",
    name: "BCSO — Schedule Lookup",
    plain:
      "Look up the basic obligation in the Tennessee Child Support Schedule using combined AGI and number of children.",
    url: TN_CHAPTER_URL,
  },
  bcso_schedule_table: {
    rule: "1240-02-04-.09(2)(c)",
    name: "BCSO — Schedule Row Rounding",
    plain:
      "Combined AGI is rounded UP to the next schedule row to read the basic obligation.",
    url: TN_CHAPTER_URL,
  },
  above_cap: {
    rule: "1240-02-04-.09(2)(d)",
    name: "BCSO — Above-Cap Formula",
    plain:
      "When combined AGI exceeds $28,250, BCSO equals the top-of-schedule value plus a percentage of the excess (6.81% / 7.22% / 7.77% / 8.05% / 8.66% for 1–5 children).",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 5/6/7 — Parenting time --------
  parenting_time_arp_reduction: {
    rule: "1240-02-04-.04(7)(a)",
    name: "Standard Parenting (ARP ≤ 68 days)",
    plain:
      "The Alternate Residential Parent's pro-rata BCSO is increased on a sliding scale when ARP days are at or below 68 per year.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_increase: {
    rule: "1240-02-04-.04(7)(i)",
    name: "Parenting Time Increase (≤ 68 ARP days)",
    plain:
      "ARP's pro-rata BCSO is increased by (69 − ARP days) / 365.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_reduction: {
    rule: "1240-02-04-.04(7)(h)",
    name: "Parenting Time Reduction (≥ 92 ARP days)",
    plain:
      "A variable multiplier (2 / 182.5 × ARP days) is applied to total BCSO; the PRP's pro-rata share of the additional child-rearing expense is credited against the ARP's pro-rata BCSO.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_5050: {
    rule: "1240-02-04-.04(7)(b)(2)(i)",
    name: "Equal Parenting (50/50) Cross-Credit",
    plain:
      "Under equal parenting, the higher-earning parent is deemed the ARP for the adjustment. Net presumptive support equals |BCSO × (PI_higher − PI_lower)|, flowing from higher-earning to lower-earning parent.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_day_constants: {
    rule: "1240-02-04-.04(7)(h)–(i)",
    name: "68 / 92 / 182.5-Day Constants",
    plain:
      "The 68-day, 92-day, and 182.5-day thresholds and the standard 80-day visitation baseline are set by Rule .04(7)(h)–(i).",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 8 — Add-ons --------
  addon_health: {
    rule: "1240-02-04-.04(8)(b)",
    name: "Add-On — Health Insurance",
    plain:
      "The children's portion of the health insurance premium is added on top of the BCSO and allocated pro-rata to income share.",
    url: TN_CHAPTER_URL,
  },
  addon_childcare: {
    rule: "1240-02-04-.04(8)(c)",
    name: "Add-On — Work-Related Childcare",
    plain:
      "Work-related childcare expenses are added on top of the BCSO and allocated pro-rata to income share.",
    url: TN_CHAPTER_URL,
  },
  addon_medical: {
    rule: "1240-02-04-.04(8)(d)",
    name: "Add-On — Recurring Uninsured Medical",
    plain:
      "Recurring uninsured medical expenses are added on top of the BCSO and allocated pro-rata to income share.",
    url: TN_CHAPTER_URL,
  },

  // -------- Deviations --------
  private_school: {
    rule: "1240-02-04-.07(2)(d)",
    name: "Private School (Discretionary Deviation)",
    plain:
      "Private school tuition is a discretionary deviation requiring written court findings that it is in the child's best interest and consistent with the parents' financial circumstances. If granted, the cost is allocated pro-rata.",
    url: TN_CHAPTER_URL,
  },
  special_expenses: {
    rule: "1240-02-04-.07(2)(d)",
    name: "Special Expenses (7% threshold)",
    plain:
      "Special expenses (camp, lessons, extra-curriculars, travel) are presumed covered by the BCSO up to 7% of monthly BCSO. Amounts above 7% may be considered as a discretionary deviation, allocated pro-rata.",
    url: TN_CHAPTER_URL,
  },
  deviation_general: {
    rule: "1240-02-04-.07",
    name: "Deviation From Presumptive Order",
    plain:
      "A court may deviate from the presumptive order upon written findings that application of the guidelines would be unjust or inappropriate.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 10 — Statutory cap --------
  pcso_max: {
    rule: "Tenn. Code Ann. § 36-5-101(e)(1)(B)",
    name: "Statutory PCSO Maximum",
    plain:
      "Above the statutory presumptive maximum ($2,100 / $3,200 / $4,100 / $4,600 / $5,000 per month for 1–5 children), the recipient parent bears the burden to prove additional support is reasonably necessary.",
    caseNote:
      "Case law sets the standard for upward deviation above the statutory presumptive maximum: Nash v. Mulle, 846 S.W.2d 803 (Tenn. 1993); Richardson v. Spanos, 189 S.W.3d 720 (Tenn. Ct. App. 2005); Smallman v. Smallman, 689 S.W.3d 845 (Tenn. Ct. App. 2023).",
  },

  // -------- Line 11 — Self-Support Reserve --------
  ssr: {
    rule: "1240-02-04-.04(12)",
    name: "Self-Support Reserve",
    plain:
      "The SSR protects low-income obligors. When the obligor's income falls in the shaded area of the schedule, the order is limited so the obligor retains a self-support reserve of 90% of the federal poverty level for one person.",
    url: TN_CHAPTER_URL,
  },
  minimum: {
    rule: "1240-02-04-.04(12)",
    name: "Minimum Support Order",
    plain:
      "$100/month minimum order unless the obligor's only income is SSI, the federal-benefit-to-child offset results in less, or the parenting time adjustment results in less.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 12 — Final Child Support Order --------
  fcso: {
    rule: "1240-02-04-.07(2)",
    name: "Final Child Support Order",
    plain:
      "When no deviation is granted, FCSO equals PCSO. When a deviation is granted, the court must make written findings supporting the deviation under Rule .07(2)(a)–(d).",
    url: TN_CHAPTER_URL,
  },
};

/**
 * Rule .07(2)(d) deviation methodology — shared verbatim across the
 * official AOC PDF, the on-screen worksheet, and the summary PDF so that
 * a future wording change propagates to every surface at once.
 */
export const DEVIATION_METHODOLOGY_NOTE =
  "Discretionary deviations under Rule 1240-02-04-.07(2)(d) are calculated as net-transfer line items: the parent paying the third-party expense directly is reimbursed for the other parent's pro-rata share. This is distinct from Rule .04(8) mandatory add-ons, which are not subject to the 7% threshold.";

/** Reusable phrasing for the Special Expenses 7% threshold math. */
export function specialExpensesThresholdLine(args: {
  monthly: number;
  threshold: number;
  basis: number;
}): string {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (args.basis > 0) {
    return `Extracurriculars deviation basis: $${fmt(args.monthly)}/mo − $${fmt(args.threshold)}/mo (7% of BCSO per Rule .07(2)(d)) = $${fmt(args.basis)}/mo, allocated pro rata.`;
  }
  return `Extracurriculars: $${fmt(args.monthly)}/mo is at or below the 7% of BCSO threshold ($${fmt(args.threshold)}/mo, Rule .07(2)(d)) and is presumed already in BCSO; no deviation applied.`;
}
