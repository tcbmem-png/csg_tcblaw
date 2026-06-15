/**
 * Florida runtime spec — the income_shares_NET state (Fla. Stat. § 61.30).
 * Translated verbatim from the verified pack (CSG/01_States/FL/FL_StateSpec.json,
 * lastVerified 2026-06-14); not re-derived.
 *
 * FL specifics:
 *  - income_shares_net: each parent's gross is converted to NET via the
 *    user-supplied deduction summation (§ 61.30(3)); the schedule runs on
 *    combined NET. The engine sums; it never estimates tax/FICA.
 *  - schedule lookup is interpolate_linear between the $50 rows; above $10,000
 *    net the obligation is the top row + a marginal % of the excess (§ 61.30(6)).
 *  - parenting reuses shared_custody_cross_multiply with the overnight_threshold
 *    trigger (73 overnights = 20%): mandatory 1.5× gross-up + cross-multiply.
 *  - low-income: lesser of income-share vs 90%×(obligor net − poverty guideline),
 *    nominal principle-of-payment order (no flat floor). Poverty figure is dated.
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeShareScheduleConfig } from "../../core/schedule";
import type { SharedCustodyCrossMultiplyParams } from "../../core/parenting";
import type { PovertyGuidelineReserveParams } from "../../core/low-income";
import {
  FL_BCSO_SCHEDULE,
  FL_SCHEDULE_CAP,
  FL_SCHEDULE_MAX_CHILDREN,
} from "./schedule";

const TOP_ROW = FL_BCSO_SCHEDULE[FL_BCSO_SCHEDULE.length - 1];
// § 61.30(6)(b) marginal rates above $10,000 net, by number of children.
const MARGINAL_PCT: Record<number, number> = {
  1: 0.05,
  2: 0.075,
  3: 0.095,
  4: 0.11,
  5: 0.12,
  6: 0.125,
};

export const FL_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: FL_BCSO_SCHEDULE,
  maxChildren: FL_SCHEDULE_MAX_CHILDREN,
  cap: FL_SCHEDULE_CAP,
  aboveCap: {
    behavior: "marginal_percent",
    byChildren: Object.fromEntries(
      Object.entries(MARGINAL_PCT).map(([n, rate]) => [
        Number(n),
        { rate, bcsoAtCap: TOP_ROW[Number(n)] },
      ]),
    ),
  },
  convention: "interpolate_linear",
};

const FL_PARENTING_PARAMS: SharedCustodyCrossMultiplyParams = {
  multiplier: 1.5,
  // § 61.30(11)(b): mandatory at >= 20% of overnights = 73/yr.
  trigger: { type: "overnight_threshold", thresholdOvernights: 73 },
  creditMethod: "cross_multiply_time_share",
  boundary: "none",
};

const FL_SSR_PARAMS: PovertyGuidelineReserveParams = {
  // HHS 2026 single-person poverty guideline, 48 states + DC = $15,960/yr.
  // UPDATES ANNUALLY each January — re-pin before each filing year.
  povertyGuidelineMonthly: 1330,
  pct: 0.9,
  noteBuilder: (cappedTo, poverty) =>
    `Low-income adjustment (§ 61.30(6)(a)): the order is the lesser of the income-share amount and 90% of the obligor's net above the $${poverty}/mo poverty guideline ($${Math.round(cappedTo)}). Below the guideline the court enters a nominal principle-of-payment order — Florida has no flat minimum.`,
};

export const FL_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "FL",
  model: "income_shares_net",
  netIncome: {
    deductions: [
      "federal_income_tax",
      "fica_or_self_employment_tax",
      "mandatory_union_dues",
      "mandatory_retirement",
      "health_insurance_obligor_not_children",
      "court_ordered_support_other_children_actually_paid",
      "spousal_support_paid",
    ],
  },
  schedule: FL_SCHEDULE_CONFIG,
  parenting: {
    model: "shared_custody_cross_multiply",
    params: FL_PARENTING_PARAMS,
  },
  lowIncome: { model: "poverty_guideline_reserve", params: FL_SSR_PARAMS },
  minimumOrder: null,
  rounding: { finalOrder: "nearest_dollar" },
};
