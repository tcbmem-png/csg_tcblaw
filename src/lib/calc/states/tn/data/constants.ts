// Versioned TN Child Support constants, effective 2021-10-01
// Source: Income_Shares_Worksheet_2022_v1_0_MAC_English_.xlsm

export const CONSTANTS_EFFECTIVE_DATE = "2021-10-01";

/** Combined AGI cap above which the above-cap percentage formula applies. */
export const COMBINED_AGI_CAP = 28_250;

/** Above-cap percentage rates and top-of-schedule BCSO values by number of children. */
export const ABOVE_CAP = {
  1: { rate: 0.0681, bcsoAtCap: 2_231 },
  2: { rate: 0.0722, bcsoAtCap: 2_803 },
  3: { rate: 0.0777, bcsoAtCap: 2_954 },
  4: { rate: 0.0805, bcsoAtCap: 3_294 },
  5: { rate: 0.0866, bcsoAtCap: 3_624 },
} as const;

/** Statutory PCSO maximum thresholds — Tenn. Code Ann. § 36-5-101(e)(1)(B). */
export const STATUTORY_PCSO_MAX = {
  1: 2_100,
  2: 3_200,
  3: 4_100,
  4: 4_600,
  5: 5_000,
} as const;

/** Self-Support Reserve — 90% of 2020 federal poverty level for one person. */
export const SSR_AMOUNT = 957;

/** Statutory default imputed annual income (Rule .04(3)(a)(2)(iv)(I)(IV)). */
export const IMPUTATION_DEFAULT_ANNUAL = {
  male: 43_761,
  female: 35_936,
} as const;

/** Parenting time bands per Rule 1240-02-04-.04(7)(h) and (i). */
export const PARENTING_TIME = {
  /** ARP days ≥ this triggers the reduction (variable multiplier). */
  REDUCTION_THRESHOLD: 92,
  /** ARP days ≤ this triggers the increase. */
  INCREASE_THRESHOLD: 68,
  /** 0.0109589 = 2 / 182.5 */
  VARIABLE_MULTIPLIER_CONSTANT: 2 / 182.5,
  /** Equal parenting days for each parent (365 / 2). */
  EQUAL_DAYS: 182.5,
} as const;

/** Minimum child support order per Rule .04(12). */
export const MIN_SUPPORT_MONTHLY = 100;

/** Special Expenses threshold rule (Rule .07(2)(d)). */
export const SPECIAL_EXPENSES_THRESHOLD_RATIO = 0.07;
