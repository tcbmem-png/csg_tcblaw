/**
 * Georgia runtime spec — income shares, O.C.G.A. § 19-6-15 (post-SB 454).
 * Translated verbatim from the verified pack (CSG/01_States/GA/GA_StateSpec.json,
 * lastVerified 2026-06-15); not re-derived.
 *
 * GA needs two new core pieces (both registered):
 *  - cross_credit parenting (§ 19-6-15(g), mandatory eff. 1/1/2026): a
 *    continuous power-of-2.5 day-curve cross-credit. The credit is aggressive
 *    at low NC day-counts by design — oracle-validated, not softened.
 *  - low_income_deviation_table (§ 19-6-15(i.1) + (p), eff. 1/1/2026): the (p)
 *    value is a CAP compared lesser-of against the presumptive — never the
 *    obligation itself. Below $1,500 AGI the cap is a percent of income.
 *
 * Schedule: 785 rows to $40,000 net/mo (nearest_50); above the cap the court
 * sets the top-row amount and may deviate up (discretionary; no formula).
 * Add-ons (Schedule D health + childcare) are mandatory, prorated. Alimony is a
 * deviation, not an income deduction.
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeShareScheduleConfig } from "../../core/schedule";
import type { CrossCreditParams } from "../../core/parenting";
import type {
  LowIncomeDeviationTableParams,
  LowIncomeDeviationTableRow,
} from "../../core/low-income";
import {
  GA_BCSO_SCHEDULE,
  GA_SCHEDULE_CAP,
  GA_SCHEDULE_MAX_CHILDREN,
} from "./schedule";
import lowIncomeTable from "./low-income-table.json";

export const GA_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: GA_BCSO_SCHEDULE,
  maxChildren: GA_SCHEDULE_MAX_CHILDREN,
  cap: GA_SCHEDULE_CAP,
  // § 19-6-15(i)(2)(A): above $40,000 the court sets the top-row amount and may
  // deviate up (discretionary). The top row is the deterministic reference.
  aboveCap: { behavior: "discretionary_floor" },
  convention: "nearest_50",
};

const GA_PARENTING_PARAMS: CrossCreditParams = {
  exponent: 2.5,
  ceilingNoncustodialDays: 182.5,
};

const GA_LOW_INCOME_PARAMS: LowIncomeDeviationTableParams = {
  belowFloorAgi: 1500,
  belowFloorPctByChildren: { 1: 0.19, 2: 0.24, 3: 0.25, 4: 0.26, 5: 0.27, 6: 0.28 },
  columnTerminationAgi: { 1: 2450, 2: 2950, 3: 3350, 4: 3550, 5: 3750, 6: 3950 },
  table: lowIncomeTable as unknown as LowIncomeDeviationTableRow[],
};

export const GA_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "GA",
  model: "income_shares_gross",
  schedule: GA_SCHEDULE_CONFIG,
  parenting: { model: "cross_credit", params: GA_PARENTING_PARAMS },
  lowIncome: {
    model: "low_income_deviation_table",
    params: GA_LOW_INCOME_PARAMS,
  },
  minimumOrder: null,
  // GA carries cents; the statute prescribes no separate final-order rounding.
  rounding: { finalOrder: "none" },
};
