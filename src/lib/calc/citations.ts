export interface Citation {
  rule: string;
  name: string;
  plain: string;
  url?: string;
}

export const CITATIONS: Record<string, Citation> = {
  gross_income: {
    rule: "1240-02-04-.04(3)",
    name: "Gross Income",
    plain:
      "All income from any source before taxes and voluntary retirement deductions. For W-2 employees use Box 5 (Medicare wages), not Box 1.",
  },
  agi: {
    rule: "1240-02-04-.04",
    name: "Adjusted Gross Income",
    plain:
      "Gross income minus self-employment tax credit, pre-existing child support paid, and in-home children credit.",
  },
  bcso_lookup: {
    rule: "1240-02-04-.09",
    name: "BCSO Schedule",
    plain:
      "Look up the basic obligation in the Tennessee Child Support Schedule using combined AGI and number of children; round combined AGI UP to the next schedule line.",
  },
  above_cap: {
    rule: "1240-02-04-.09(2)(d)",
    name: "Above-Cap Formula",
    plain:
      "When combined AGI exceeds $28,250, BCSO equals the top-of-schedule value plus a percentage of the excess (6.81% / 7.22% / 7.77% / 8.05% / 8.66% by number of children).",
  },
  pro_rata: {
    rule: "1240-02-04-.04",
    name: "Pro-Rata Share",
    plain:
      "Each parent's share of the BCSO equals total BCSO times that parent's percentage of combined income.",
  },
  parenting_time_5050: {
    rule: "1240-02-04-.04(7)(b)(2)(i)",
    name: "Equal Parenting (50/50) Cross-Credit",
    plain:
      "In equal parenting, one parent is deemed the ARP for the adjustment. The net presumptive support reduces to |BCSO × (PI_higher − PI_lower)|, flowing from the higher-earning parent to the lower-earning parent.",
  },
  parenting_time_reduction: {
    rule: "1240-02-04-.04(7)(h)",
    name: "Parenting Time Reduction (92+ ARP days)",
    plain:
      "Variable multiplier (2 / 182.5 × ARP days) applied to total BCSO yields an adjusted BCSO; the PRP's pro-rata share of the additional child-rearing expense is credited against the ARP's pro-rata BCSO.",
  },
  parenting_time_increase: {
    rule: "1240-02-04-.04(7)(i)",
    name: "Parenting Time Increase (≤68 ARP days)",
    plain:
      "ARP's pro-rata BCSO is increased by (69 − ARP days) / 365.",
  },
  addons: {
    rule: "1240-02-04-.04(8)",
    name: "Add-Ons (pro-rata)",
    plain:
      "Health insurance premium (children's portion), recurring uninsured medical, and work-related childcare are added on top of the BCSO and allocated pro-rata to income share.",
  },
  private_school: {
    rule: "1240-02-04-.07(2)(d)",
    name: "Private School (Discretionary Deviation)",
    plain:
      "Private school tuition is a discretionary deviation requiring written court findings that it is in the child's best interest and consistent with the parents' financial circumstances. If granted, the cost is allocated pro-rata to income share.",
  },
  special_expenses: {
    rule: "1240-02-04-.07(2)(d)",
    name: "Special Expenses (7% threshold)",
    plain:
      "Special expenses (camp, lessons, travel, extra-curriculars) are presumed covered by the BCSO up to 7% of monthly BCSO. Amounts above 7% may be considered as a discretionary deviation, allocated pro-rata. Parties may agree to waive the threshold.",
  },
  pcso_max: {
    rule: "Tenn. Code Ann. § 36-5-101(e)(1)(B)",
    name: "Statutory PCSO Maximum",
    plain:
      "Above a statutory threshold (varies by # children), the recipient parent bears the burden to prove additional support is reasonably necessary. If not met, the order may be capped at the threshold.",
  },
  ssr: {
    rule: "1240-02-04-.02(25)",
    name: "Self-Support Reserve",
    plain:
      "The SSR ($957/month, 90% of 2020 federal poverty level for one person) protects low-income obligors from being ordered to pay more than they can afford while still maintaining a basic standard of living.",
  },
  minimum: {
    rule: "1240-02-04-.04(12)",
    name: "Minimum Support",
    plain:
      "$100/month minimum order unless the obligor's only income is SSI, federal benefit calculation results in less, or the parenting time adjustment results in less.",
  },
  imputation: {
    rule: "1240-02-04-.04(3)(a)(2)",
    name: "Imputation of Income",
    plain:
      "Income may be imputed to a willfully under-employed parent based on prior earnings, education, training, and local job market. Default values when no reliable evidence: $43,761/yr (male) or $35,936/yr (female). Incarceration and military service are NOT grounds for imputation.",
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
