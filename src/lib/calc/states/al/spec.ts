/**
 * Alabama runtime spec — income shares under Rule 32, Ala. R. Jud. Admin.
 * (Schedule eff. 2022-05-01; Rule 32 amendments eff. 2023-06-01). Translated
 * verbatim from the doctrine pack (CSG/01_States/AL/AL_StateSpec.json,
 * lastVerified 2026-06-14); primary-source verified — not re-derived.
 *
 * Reuses the LA-introduced core pieces with AL's parameters:
 *  - nearest_50 schedule lookup (Rule 32(C)(1)).
 *  - shared_custody_cross_multiply with the half_credit variant + boundary none
 *    (Rule 32(C)(7) SPCA, CS-42-S): 1.5× the BCSO, each parent credited half,
 *    higher-share parent pays the difference; SSR/$50-min/zero suppressed on
 *    CS-42-S (the strategy sets suppressLowIncome).
 * AL specifics:
 *  - income-share % rounded to nearest 1% before applying (Rule 32(C)(3)).
 *  - adjusted gross is after preexisting child support AND periodic alimony
 *    actually paid (folded into per-parent deductions by the caller).
 *  - economic-incentive SSR: order capped at 0.85×(obligorAGI − $981), $50 min.
 *  - above the $30,000 cap the obligation is discretionary (Dyas); the at-cap
 *    amount is the deterministic reference (not a statutory floor).
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeShareScheduleConfig } from "../../core/schedule";
import type { SharedCustodyCrossMultiplyParams } from "../../core/parenting";
import type { EconomicIncentiveReserveParams } from "../../core/low-income";
import { AL_BCSO_SCHEDULE, AL_SCHEDULE_CAP, AL_SCHEDULE_MAX_CHILDREN } from "./schedule";

export const AL_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: AL_BCSO_SCHEDULE,
  maxChildren: AL_SCHEDULE_MAX_CHILDREN,
  cap: AL_SCHEDULE_CAP,
  // Rule 32(C)(1) / Editors' Notes + Dyas: above $30,000 is discretionary; the
  // top-row amount is the deterministic at-cap reference (not a statutory floor).
  aboveCap: { behavior: "discretionary_floor" },
  convention: "nearest_50",
};

const AL_PARENTING_PARAMS: SharedCustodyCrossMultiplyParams = {
  multiplier: 1.5,
  trigger: { type: "qualitative_shared_custody", thresholdOvernights: null },
  creditMethod: "half_credit",
  boundary: "none",
};

// Exported so the CS-42 form field map can reproduce the SSR display lines
// (Income Available, Max Recommended After SSR) without re-declaring the
// statutory constants — single source of truth.
export const AL_SSR_PARAMS: EconomicIncentiveReserveParams = {
  reserve: 981,
  incentivePct: 0.85,
  minimumOrder: 50,
  noteBuilder: (cappedTo, reserve) =>
    `Self-support reserve applied (Rule 32(C)(5)): the order is limited to 85% of the obligor's income above the $${reserve} reserve ($${Math.round(cappedTo)}); a $50 minimum order applies where that is below $50.`,
};

export const AL_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "AL",
  model: "income_shares_gross",
  schedule: AL_SCHEDULE_CONFIG,
  parenting: {
    model: "shared_custody_cross_multiply",
    params: AL_PARENTING_PARAMS,
  },
  lowIncome: { model: "economic_incentive_reserve", params: AL_SSR_PARAMS },
  // The $50 minimum is part of the SSR mechanic (and is suppressed on CS-42-S),
  // not a magnitude floor on any small order — so the generic floor is null.
  minimumOrder: null,
  rounding: { finalOrder: "half_up", incomeShare: "nearest_1pct" },
};
