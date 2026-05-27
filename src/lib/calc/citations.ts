/**
 * Tennessee Child Support Guidelines — citation registry.
 *
 * Every dollar number, threshold, or categorical determination on the
 * worksheet traces back to an entry here. The article's "every formula
 * annotated" claim is enforced mechanically by
 * src/lib/calc/__tests__/citations.test.ts, which walks the shared
 * worksheet manifest (see citation-resolvers.ts) and asserts every
 * non-practitioner line has a CITATIONS key with a paragraph-specific
 * rule reference.
 *
 * Rule paragraphs are cited to Tenn. Comp. R. & Regs. 1240-02-04 (the
 * chapter PDF on the TN Secretary of State website, effective
 * October 1, 2021). Sub-paragraph numbering follows the rule's own
 * convention: parenthesized digits for the top level "(3)", lowercase
 * letters in parens for the second "(a)", arabic numeral + period for
 * the third "2.", lowercase roman in parens for the fourth "(iv)", and
 * so on. We do not deep-link past the chapter PDF — the URL structure
 * does not support stable paragraph anchors.
 *
 * Statutory citations use the full "Tenn. Code Ann. § ..." form.
 *
 * P1.5 audit (2026-05-25): every entry below was line-checked against
 * the rule PDF. See docs/TN_Citation_Audit.md for the row-by-row
 * findings.
 */

/** Canonical chapter-PDF URL for Tenn. Comp. R. & Regs. 1240-02-04. */
export const TN_CHAPTER_URL =
  "https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20211001.pdf";

export interface Citation {
  /** Rule or statute reference (e.g. "1240-02-04-.04(7)(b)2.(i)" or "Tenn. Code Ann. § 36-5-101(e)(1)(B)"). */
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
  | "fcso"
  // -------- Case law (additive per Phase D+E ack §6) --------
  | "case.nash_v_mulle"
  | "case.richardson_v_spanos"
  | "case.smallman_v_smallman"
  | "case.massey_v_casals";

export const CITATIONS: Record<CitationKey, Citation> = {
  // -------- Line 1 — Income basis --------
  gross_income: {
    rule: "1240-02-04-.04(3)",
    name: "Gross Income",
    plain:
      "All income from any source, before deductions for taxes or other deductions, whether earned or unearned. The rule lists 23 enumerated income types at .04(3)(a)1.(i)–(xxiii).",
    url: TN_CHAPTER_URL,
  },
  income_simple: {
    rule: "1240-02-04-.04(3)(a)1.",
    name: "Gross Income — Employment",
    plain:
      "Wages, salary, commissions, fees, tips, bonuses, overtime, severance, and the other items enumerated at .04(3)(a)1.(i)–(xxiii), before voluntary deductions.",
    url: TN_CHAPTER_URL,
  },
  income_variable: {
    rule: "1240-02-04-.04(3)(b)",
    name: "Gross Income — Variable",
    plain:
      "Variable income such as commissions, bonuses, overtime pay, and dividends shall be averaged over a reasonable period of time consistent with the circumstances and added to fixed salary or wages.",
    url: TN_CHAPTER_URL,
  },
  income_self_employed: {
    rule: "1240-02-04-.04(3)(a)3.",
    name: "Gross Income — Self-Employment",
    plain:
      "Self-employment income equals gross receipts from business operations, contract/consulting work, sales, or rentals, less ordinary and reasonable expenses necessary to produce that income. Accelerated depreciation and §179 add-backs are excluded from \"reasonable expenses\" per .04(3)(a)3.(ii)(II). The SE-tax credit is taken separately at Rule .04(4).",
    url: TN_CHAPTER_URL,
  },
  income_multi_source: {
    rule: "1240-02-04-.04(3)(a)1.",
    name: "Gross Income — Multiple Sources",
    plain:
      "When a parent has income from multiple sources enumerated at .04(3)(a)1. (wages, self-employment, rental, investment, retirement, etc.), all sources are summed to a single monthly gross figure.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_prior_earnings: {
    rule: "1240-02-04-.04(3)(a)2.(ii)",
    name: "Imputation — Willful Under-/Unemployment",
    plain:
      "Once a parent has been found willfully under- or unemployed, additional income is allocated to reflect the parent's income potential or earning capacity based on past and present employment and on the parent's education and training.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_vocational: {
    rule: "1240-02-04-.04(3)(a)2.(iii)",
    name: "Imputation — Factors To Be Considered",
    plain:
      "When determining willful under-/unemployment the tribunal weighs the parent's past and present employment; education, training, and ability to work; stay-at-home caretaker role; extravagant lifestyle; caretaker role for a handicapped relative; pursuit of training; and other relevant factors.",
    url: TN_CHAPTER_URL,
  },
  income_imputed_assets: {
    rule: "1240-02-04-.04(3)(a)2.(i)(III)",
    name: "Imputation — Substantial Non-Income-Producing Assets",
    plain:
      "When a parent owns substantial non-income-producing assets, the tribunal may impute income based on a reasonable rate of return on those assets.",
    url: TN_CHAPTER_URL,
  },
  income_carveout_incarceration: {
    rule: "1240-02-04-.04(3)(a)2.(ii)(I)II.",
    name: "Incarceration Carve-Out",
    plain:
      "Under the Guidelines, incarceration of a parent shall not be treated as willful underemployment or unemployment for the purpose of establishing or modifying a child support order. (See also .03(1)(d)5.)",
    url: TN_CHAPTER_URL,
  },
  income_carveout_means_tested: {
    rule: "1240-02-04-.04(3)(c)2.",
    name: "Means-Tested Income Excluded From Gross",
    plain:
      "Benefits received from means-tested public assistance programs — Families First/TANF, SNAP, SSI, 42 U.S.C. § 402(d) benefits for disabled adult children of deceased disabled workers, and LIHEAP — are excluded from gross income.",
    url: TN_CHAPTER_URL,
  },
  income_federal_benefit_to_child: {
    rule: "1240-02-04-.04(3)(a)5.",
    name: "Federal Benefit Paid to the Child",
    plain:
      "Veteran's and Social Security Title II benefits received by a child on a parent's account are added to that parent's gross income and applied against that parent's support obligation. A benefit drawn on the child's own disability is excluded from both parents' income and obligation.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 2 — Adjustments --------
  se_tax_credit: {
    rule: "1240-02-04-.04(4)",
    name: "Self-Employment Tax Credit",
    plain:
      "A self-employed parent who actually pays self-employment tax deducts FICA (6.2%) plus Medicare (1.45%) on self-employment earnings, up to one-half of the maximum amounts due in a year, as part of the AGI calculation. The Schedule already embeds the employee half. See .04(4)(b) and .04(4)(e).",
    url: TN_CHAPTER_URL,
  },
  credit_other_in_home_children: {
    rule: "1240-02-04-.04(5)(e)1.",
    name: "Credit — Qualified Other Children In the Home",
    plain:
      "For a parent's qualified other children whose primary residence is with that parent (50% or more of the time), the credit against gross income is 75% of a theoretical support order calculated on the Credit Worksheet using the parent's gross income (less SE taxes) and the total number of qualified in-home other children.",
    url: TN_CHAPTER_URL,
  },
  credit_not_in_home_children: {
    rule: "1240-02-04-.04(5)(e)2.",
    name: "Credit — Qualified Other Children Not In the Home",
    plain:
      "For a parent's qualified other children who reside with the parent less than 50% of the time, the credit is the actual documented monetary support paid over at least the past 12 months, capped at 75% of a theoretical order under the Credit Worksheet.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 3 — AGI / pro-rata --------
  agi: {
    rule: "1240-02-04-.02(1)",
    name: "Adjusted Gross Income (Definition)",
    plain:
      "AGI is the net determination of a parent's income: gross income, plus any federal benefit paid to the child on that parent's account, minus applicable self-employment taxes and minus the qualified-other-children credit.",
    url: TN_CHAPTER_URL,
  },
  pro_rata: {
    rule: "1240-02-04-.02(20)",
    name: "Percentage of Income (PI)",
    plain:
      "Each parent's PI is obtained by dividing that parent's AGI by the combined AGI of both parents. PI then determines each parent's pro-rata share of the BCSO and add-ons (\"pro rata\" is defined at .02(23)).",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 4 — BCSO --------
  bcso_schedule_within: {
    rule: "1240-02-04-.04(6)(a)",
    name: "BCSO — Schedule Lookup",
    plain:
      "The combined obligation is read from the Child Support Schedule (Rule .09) based on combined monthly AGI and the number of children. If the obligor's AGI falls within the schedule's shaded area, the SSR comparison is performed under .04(7)(h)5. or .04(7)(i)2.",
    url: TN_CHAPTER_URL,
  },
  bcso_schedule_table: {
    rule: "1240-02-04-.04(6)(b)",
    name: "BCSO — Schedule Row Rounding",
    plain:
      "When the combined AGI falls between amounts shown in the Schedule, round UP to the next amount of combined AGI; that rounded-up row determines the BCSO.",
    url: TN_CHAPTER_URL,
  },
  above_cap: {
    rule: "1240-02-04-.09",
    name: "BCSO — Above-Schedule Formula",
    plain:
      "When combined AGI exceeds $28,250 the Schedule provides a formula at the end of Rule .09: top-of-schedule BCSO plus 6.81% / 7.22% / 7.77% / 8.05% / 8.66% (for 1–5+ children) of the excess.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 5/6/7 — Parenting time --------
  parenting_time_arp_reduction: {
    rule: "1240-02-04-.04(7)(a)",
    name: "Standard Parenting Baseline (80 Days)",
    plain:
      "The Guidelines presume standard parenting: every other weekend Friday-Sunday, two weeks of summer, and two weeks across holidays — a total of 80 days per year. Adjustments above and below this baseline are governed by paragraphs (h) and (i).",
    url: TN_CHAPTER_URL,
  },
  parenting_time_increase: {
    rule: "1240-02-04-.04(7)(i)",
    name: "Parenting Time Increase (≤ 68 ARP days)",
    plain:
      "If the ARP spends 68 or fewer days per year with the children, the ARP's pro-rata BCSO is increased by ((69 − ARP days) / 365) × the ARP's share of the BCSO. The presumption is rebuttable.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_reduction: {
    rule: "1240-02-04-.04(7)(h)",
    name: "Parenting Time Reduction (≥ 92 ARP days)",
    plain:
      "If the ARP spends 92 or more days per year with the children, a variable multiplier of (2/182.5) × ARP days is applied to the total BCSO. The increase represents transferred/duplicated expenses; the PRP's pro-rata share of that increase is credited against the ARP's pro-rata BCSO.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_5050: {
    rule: "1240-02-04-.04(7)(b)2.(i)",
    name: "Equal Parenting (50/50) ARP Designation",
    plain:
      "In a 50/50 / equal-parenting situation there is no PRP/ARP based on parenting time; Father or Parent 2 is deemed the ARP solely for purposes of the parenting-time adjustment. The reduction formula at .04(7)(h) then applies.",
    url: TN_CHAPTER_URL,
  },
  parenting_time_day_constants: {
    rule: "1240-02-04-.04(7)(a), (h), (i)",
    name: "80 / 68 / 92 / 182.5-Day Constants",
    plain:
      "The 80-day standard-parenting baseline is set at .04(7)(a); the 92-day threshold and 2/182.5 per-diem variable multiplier are set at .04(7)(h); the 68-day threshold and 365-day denominator are set at .04(7)(i).",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 8 — Add-ons --------
  addon_health: {
    rule: "1240-02-04-.04(8)(b)",
    name: "Add-On — Health Insurance Premium",
    plain:
      "The portion of the health/vision/dental insurance premium attributable to the children at issue is added to the BCSO and allocated between the parents pro rata per .04(8)(a)3. If coverage is shared with other persons and the children's portion cannot be verified, the total is pro-rated by number of persons covered.",
    url: TN_CHAPTER_URL,
  },
  addon_childcare: {
    rule: "1240-02-04-.04(8)(c)",
    name: "Add-On — Work-Related Childcare",
    plain:
      "Childcare necessary for either parent's employment, education, or vocational training is averaged to a monthly amount, entered in the paying parent's column, and the other parent's pro-rata share is included in the support order.",
    url: TN_CHAPTER_URL,
  },
  addon_medical: {
    rule: "1240-02-04-.04(8)(d)",
    name: "Add-On — Recurring Uninsured Medical",
    plain:
      "If uninsured medical expenses (deductibles, co-pays, dental, orthodontic, counseling, vision, hearing, etc.) are routinely incurred so a specific monthly amount can be established, that amount is added to the BCSO and pro-rated to each parent's PI.",
    url: TN_CHAPTER_URL,
  },

  // -------- Deviations --------
  private_school: {
    rule: "1240-02-04-.07(2)(d)1.",
    name: "Extraordinary Educational Expenses (Deviation)",
    plain:
      "Tuition, room and board, lab fees, books, and other reasonable expenses for special-needs education or private elementary/secondary schooling may be added to the presumptive order as a deviation. Scholarships, grants, and other cost-reducing programs are considered in setting the amount.",
    url: TN_CHAPTER_URL,
  },
  special_expenses: {
    rule: "1240-02-04-.07(2)(d)2.",
    name: "Special Expenses (7% Threshold)",
    plain:
      "Special child-rearing expenses — summer camp, music/art lessons, travel, school-sponsored extra-curriculars — are presumed already covered by the BCSO. When these expenses exceed 7% of the monthly BCSO, the tribunal shall consider additional support as a deviation to cover the full amount.",
    url: TN_CHAPTER_URL,
  },
  deviation_general: {
    rule: "1240-02-04-.07(1)",
    name: "Deviation From Presumptive Order",
    plain:
      "A deviation requires written findings stating the reasons, the amount that would have been required under the Guidelines, and how application of the Guidelines would be unjust or inappropriate and how the deviation serves the best interest of the child.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 10 — Statutory cap --------
  pcso_max: {
    rule: "Tenn. Code Ann. § 36-5-101(e)(1)(B)",
    name: "Statutory PCSO Maximum",
    plain:
      "Above the statutory presumptive maximum the PRP must prove by a preponderance of the evidence that additional support is reasonably necessary. The maximum is 21% / 32% / 41% / 46% / 50% of a $10,000 monthly net-income benchmark, i.e. $2,100 / $3,200 / $4,100 / $4,600 / $5,000 per month for 1–5+ children (Rule .07(2)(g)1.).",
    caseNote:
      "Case law setting the standard for upward deviation above the statutory presumptive maximum: Nash v. Mulle, 846 S.W.2d 803 (Tenn. 1993); Richardson v. Spanos, 189 S.W.3d 720 (Tenn. Ct. App. 2005); Smallman v. Smallman, 689 S.W.3d 845 (Tenn. Ct. App. 2023).",
  },

  // -------- Line 11 — Self-Support Reserve --------
  ssr: {
    rule: "1240-02-04-.02(25)",
    name: "Self-Support Reserve",
    plain:
      "The SSR is the minimum amount of income required to meet the basic subsistence needs of the obligor. When the obligor's AGI falls within the shaded area of the Schedule, the order is limited so the obligor retains the reserve (the SSR adjustment in Schedule .09 vs. the BCSO × PI is compared under .04(7)(h)5. and .04(7)(i)2.; the lesser controls).",
    url: TN_CHAPTER_URL,
  },
  minimum: {
    rule: "1240-02-04-.04(12)",
    name: "Minimum Child Support Order",
    plain:
      "$100/month minimum order, except (1) when the obligor's only source of income is SSI; (2) when the federal benefit paid for the child results in a calculated order less than the minimum; or (3) when the parenting-time adjustment results in less.",
    url: TN_CHAPTER_URL,
  },

  // -------- Line 12 — Final Child Support Order --------
  fcso: {
    rule: "1240-02-04-.02(13)",
    name: "Final Child Support Order",
    plain:
      "FCSO is the PCSO adjusted by any deviations the tribunal grants under Rule .07 with written findings. When no deviation is granted, FCSO equals PCSO.",
    url: TN_CHAPTER_URL,
  },

  // -------- Case law (additive per Phase D+E ack §6) --------
  // Each case is its own manifest key. Builders never inline citation
  // strings — they consume these by key. pcso_max.caseNote remains in
  // place (deprecation deferred to a separate cycle).
  "case.nash_v_mulle": {
    rule: "Nash v. Mulle, 846 S.W.2d 803 (Tenn. 1993)",
    name: "Nash v. Mulle",
    plain:
      "Tennessee Supreme Court decision establishing that above the statutory presumptive cap the recipient parent bears the burden of proving the child's reasonable need for support exceeding the cap; the obligor's lifestyle and the child's standard of living absent separation are among the considerations.",
  },
  "case.richardson_v_spanos": {
    rule: "Richardson v. Spanos, 189 S.W.3d 720 (Tenn. Ct. App. 2005)",
    name: "Richardson v. Spanos",
    plain:
      "Court of Appeals application of the Nash framework: the recipient parent's proof of need above the presumptive cap must be specific to the child rather than reflective of the recipient parent's own standard of living.",
  },
  "case.smallman_v_smallman": {
    rule: "Smallman v. Smallman, 689 S.W.3d 845 (Tenn. Ct. App. 2023)",
    name: "Smallman v. Smallman",
    plain:
      "Recent Court of Appeals decision restating and applying the Nash / Richardson above-cap burden-shift framework under the current Income Shares Guidelines and the statutory presumptive maximums of § 36-5-101(e)(1)(B).",
  },
  "case.massey_v_casals": {
    rule:
      "Massey v. Casals, 315 S.W.3d 788 (Tenn. Ct. App. 2009), perm. app. denied (Tenn. May 17, 2010)",
    name: "Massey v. Casals",
    plain:
      "Court of Appeals decision addressing the reasonable-averaging-period requirement for variable income under Rule 1240-02-04-.04(3)(b); the averaging period selected must be consistent with the circumstances and the parent's earnings pattern.",
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
    return `Extracurriculars deviation basis: $${fmt(args.monthly)}/mo − $${fmt(args.threshold)}/mo (7% of BCSO per Rule .07(2)(d)2.) = $${fmt(args.basis)}/mo, allocated pro rata.`;
  }
  return `Extracurriculars: $${fmt(args.monthly)}/mo is at or below the 7% of BCSO threshold ($${fmt(args.threshold)}/mo, Rule .07(2)(d)2.) and is presumed already in BCSO; no deviation applied.`;
}
