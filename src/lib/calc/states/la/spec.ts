/**
 * Louisiana runtime spec — income_shares_gross, La. R.S. 9:315 et seq.
 * Translated verbatim from the doctrine pack (CSG/01_States/LA/LA_StateSpec.json,
 * lastVerified 2026-06-14); primary-source verified — not re-derived.
 *
 * LA specifics, all handled by registered core pieces:
 *  - schedule lookup snaps to the nearest $50 row (convention "nearest_50",
 *    shared with AL); the final order rounds half_up — two separate steps.
 *  - shared custody (9:315.9): the shared_custody_cross_multiply strategy with
 *    multiplier 1.5, qualitative trigger, cross_multiply_time_share credit, and
 *    a CEILING (capped at the obligor's domiciliary amount — 9:315.9(A)(7)).
 *  - split custody (9:315.10): per-group worksheet + offset, via the core
 *    orchestrator's splitCustody input.
 *  - above $40,000 the top row is a discretionary floor (Falterman); no
 *    marginal formula.
 *  - the $100 self-sufficiency floor is built into the schedule's lowest row,
 *    so there is no separate low-income strategy or minimum-order floor.
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeShareScheduleConfig } from "../../core/schedule";
import type { SharedCustodyCrossMultiplyParams } from "../../core/parenting";
import {
  LA_BCSO_SCHEDULE,
  LA_SCHEDULE_CAP,
  LA_SCHEDULE_MAX_CHILDREN,
} from "./schedule";

export const LA_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: LA_BCSO_SCHEDULE,
  maxChildren: LA_SCHEDULE_MAX_CHILDREN,
  cap: LA_SCHEDULE_CAP,
  // La. R.S. 9:315.13(B)(1) / Falterman: above $40,000 the highest tabulated
  // amount is a floor; additions are discretionary on needs findings.
  aboveCap: { behavior: "discretionary_floor" },
  convention: "nearest_50",
};

const LA_PARENTING_PARAMS: SharedCustodyCrossMultiplyParams = {
  multiplier: 1.5, // 9:315.9(A)(2)
  trigger: { type: "qualitative_shared_custody", thresholdOvernights: null },
  creditMethod: "cross_multiply_time_share", // 9:315.9(A)(3)
  boundary: "ceiling", // 9:315.9(A)(7) — cap at domiciliary amount, never a floor
};

export const LA_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "LA",
  model: "income_shares_gross",
  schedule: LA_SCHEDULE_CONFIG,
  parenting: {
    model: "shared_custody_cross_multiply",
    params: LA_PARENTING_PARAMS,
  },
  // The $100 self-sufficiency reserve is built into the schedule's lowest row
  // (9:315(B)(1)); not a separate strategy or minimum-order statute.
  lowIncome: null,
  minimumOrder: null,
  rounding: { finalOrder: "half_up" },
};
