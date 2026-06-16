/**
 * Washington runtime spec — income_shares_NET, Ch. 26.19 RCW (Washington State
 * Child Support Schedule), economic table RCW 26.19.020, as amended by EHB 1014
 * (Laws of 2025 ch. 272), effective 1/1/2026. Translated from the verified pack
 * (CSG/01_States/WA/WA_StateSpec.json); not re-derived.
 *
 * GATED: meta.lastVerified is null in the doctrine pack — WA must NOT merge or
 * deploy until Taylor sets it against WA_ByteCheck_Log.md. This engine reproduces
 * all 11 fixtures (byte-checked against the live open WSCSS calculator), but it
 * is not user-exposed (no route) until the gate clears.
 *
 * WA's structural firsts vs. the existing income-shares states:
 *  - PER-CHILD economic table (schedule.valuesArePerChild): the cell is the
 *    per-child amount; total BCSO = cell × N. WA is the only state on this path.
 *  - nearest_100 schedule lookup ($100 increments; ≤49 down / ≥50 up per
 *    EHB 1014) — the first $100-grain table.
 *  - income_shares_net, second instance after FL: combined NET drives the table;
 *    deductions are user-entered actual (federal tax — WA has no state income
 *    tax — FICA, mandatory pension, and the EHB 1014 PFML/WA-Cares line).
 *  - income share rounded to 3 decimals (nearest_0.1pct), whole-dollar order —
 *    pinned against the live WSCSS calculator.
 *  - parenting model "none": no residential-time formula; residential schedule
 *    is a discretionary deviation only (RCW 26.19.075(1)(d)).
 *  - low income (RCW 26.19.065): 45%-net ceiling → obligor-net self-support
 *    reserve ($2,394 = 180% FPL one-person) → $50/child presumptive minimum.
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeShareScheduleConfig } from "../../core/schedule";
import type { ObligorNetReserveParams } from "../../core/low-income";
import { WA_BCSO_SCHEDULE, WA_SCHEDULE_CAP, WA_SCHEDULE_MAX_CHILDREN } from "./schedule";

export const WA_SCHEDULE_CONFIG: IncomeShareScheduleConfig = {
  rows: WA_BCSO_SCHEDULE,
  maxChildren: WA_SCHEDULE_MAX_CHILDREN,
  cap: WA_SCHEDULE_CAP,
  // RCW 26.19.065(3): the economic table is presumptive to $50,000 combined
  // net; above it the court MAY exceed the top-row amount on written findings
  // (non-formulaic). The top row × obligor share is the deterministic floor.
  aboveCap: { behavior: "discretionary_floor" },
  // EHB 1014: round combined net to the nearest $100 row (≤49 down / ≥50 up).
  convention: "nearest_100",
  // RCW 26.19.020 header: "MONTHLY BASIC SUPPORT OBLIGATION PER CHILD".
  valuesArePerChild: true,
};

const WA_LOW_INCOME_PARAMS: ObligorNetReserveParams = {
  // 180% of the 2026 one-person federal poverty guideline ($1,330/mo) = $2,394.
  // Confirmed on the live WSCSS calculator (line 8). Re-pin annually with the
  // HHS poverty guideline.
  reserve: 2394,
  presumptiveMinimumPerChild: 50, // RCW 26.19.065(2)(a)
  netIncomeCapPct: 0.45, // RCW 26.19.065(1)
  noteBuilder: (cappedTo, reserve) =>
    `Low-income limitation (RCW 26.19.065): the obligor's basic support obligation is reduced to $${Math.round(cappedTo)} so it does not push the obligor below the $${reserve}/mo self-support reserve (180% of the federal poverty guideline) or exceed 45% of net income, and never below the $50-per-child presumptive minimum.`,
};

export const WA_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "WA",
  model: "income_shares_net",
  netIncome: {
    // RCW 26.19.071(5) ordered deductions, summed by the engine (no embedded
    // tax estimator — same locked decision as FL). WA has no state income tax,
    // so the state component is $0. (5)(e) is the EHB 1014 PFML/WA-Cares line.
    deductions: [
      "federal_income_tax",
      "fica",
      "mandatory_pension",
      "mandatory_union_or_professional_dues",
      "other_mandatory_state_deductions_pfml_and_wacares",
      "state_industrial_insurance_premiums",
      "court_ordered_maintenance_paid",
      "voluntary_retirement_contributions",
      "normal_business_expenses_and_se_tax",
    ],
  },
  schedule: WA_SCHEDULE_CONFIG,
  // No residential-time formula; residential schedule is a discretionary
  // deviation (RCW 26.19.075(1)(d)), handled outside the calculation.
  parenting: { model: "none", params: {} },
  lowIncome: { model: "obligor_net_reserve", params: WA_LOW_INCOME_PARAMS },
  minimumOrder: null,
  // Live WSCSS calculator: each parent's share to 3 decimals (0.617/0.383),
  // final transfer rounded to the whole dollar.
  rounding: { finalOrder: "nearest_dollar", incomeShare: "nearest_0.1pct" },
};
