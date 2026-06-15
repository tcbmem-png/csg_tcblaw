/**
 * Arkansas runtime spec — the first data-only state through the generic
 * income-shares core. Translated verbatim from the doctrine pack
 * (CSG/01_States/AR/AR_StateSpec.json, lastVerified 2026-06-14); the math is
 * primary-source verified — not re-derived here.
 *
 * Arkansas Supreme Court Administrative Order No. 10 (Income Shares, eff.
 * 2020-07-01, amended 2022-04-14); Ark. Code Ann. § 9-12-312, §§ 9-14-101 et seq.
 *
 * Three AR specifics, all handled by registered core pieces:
 *  - schedule lookup rounds DOWN to the $50 row (convention "round_down"),
 *    while the FINAL order rounds half-up — two separate roundings.
 *  - above the $30,000 chart the obligation is discretionary with the top row
 *    as a floor (AboveCap "discretionary_floor"); no marginal formula (Parnell).
 *  - low-income SSR (payor gross < $900) recomputes from the payor's gross
 *    alone, drops add-ons, and floors at the $125 minimum ("payor_gross_reserve").
 */
import type { IncomeSharesSpec } from "../../core/spec";
import {
  lookupScheduleAmount,
  type IncomeShareScheduleConfig,
} from "../../core/schedule";
import type { OffsetDualWorksheetParams } from "../../core/parenting";
import type { PayorGrossReserveParams } from "../../core/low-income";
import {
  AR_BCSO_SCHEDULE,
  AR_SCHEDULE_CAP,
  AR_SCHEDULE_MAX_CHILDREN,
} from "./schedule";

export const AR_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: AR_BCSO_SCHEDULE,
  maxChildren: AR_SCHEDULE_MAX_CHILDREN,
  cap: AR_SCHEDULE_CAP,
  // AO 10 § II: above $30,000 combined the highest tabulated amount is a floor;
  // any increment is discretionary on needs/ability findings (Parnell 2022 Ark. 52).
  aboveCap: { behavior: "discretionary_floor" },
  // AO 10 § III(D): round DOWN to the nearest $50 chart row.
  convention: "round_down",
};

const AR_PARENTING_PARAMS: OffsetDualWorksheetParams = {
  // AO 10 § II / § V(2): 141–182 overnights is a discretionary band, not a formula.
  discretionaryBand: { minOvernights: 141, maxOvernights: 182 },
  approxEqualOvernights: 183,
  multiplier: 1, // straight offset — Arkansas uses NO 1.5× multiplier
};

const AR_SSR_PARAMS: PayorGrossReserveParams = {
  triggerThreshold: 900,
  minimumOrder: 125,
  lookup: (income, n) =>
    lookupScheduleAmount(AR_SCHEDULE_CONFIG, income, n).bcso,
  noteBuilder: (base, threshold) =>
    `Self-Support Reserve applied (AO 10 § II(3)): payor monthly gross is below $${threshold}, so the obligation is computed from the payor's gross alone ($${base}); the three add-ons are dropped and the $125 minimum order applies.`,
};

export const AR_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "AR",
  model: "income_shares_gross",
  schedule: AR_SCHEDULE_CONFIG,
  parenting: { model: "offset_dual_worksheet", params: AR_PARENTING_PARAMS },
  // Doctrine model = "self_support_reserve" (AO 10 § II(3)); AR's mechanic is
  // distinct from TN's shaded-cell SSR, so it maps to a separate core strategy.
  lowIncome: { model: "payor_gross_reserve", params: AR_SSR_PARAMS },
  // The $125 minimum is part of the SSR mechanic (payor gross < $900), not a
  // magnitude floor on any small order — so the generic minimumOrder is null.
  minimumOrder: null,
  rounding: { finalOrder: "half_up" },
};
