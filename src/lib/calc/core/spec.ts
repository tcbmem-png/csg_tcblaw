/**
 * Runtime StateSpec — the projection of the doctrine StateSpec
 * (04_Agent_Pipeline/StateSpec_Contract.md) that the engine actually
 * consumes. The authoring form is JSON; this is the TS shape, which may
 * additionally carry functions the JSON can't (e.g. the SSR obligor-only
 * lookup). A new income-shares state is one of these + fixtures.
 */
import type { IncomeShareScheduleConfig } from "./schedule";
import type { ParentingModel } from "./parenting";
import type { LowIncomeModel } from "./low-income";
import type { NetIncomeConfig } from "./net-income";

export type FinalRounding =
  | "nearest_dollar"
  | "half_up"
  | "round_down"
  | "none";

export interface IncomeSharesSpec {
  code: string;
  /** income_shares_net states run a gross→net pre-step before this engine. */
  model: "income_shares_gross" | "income_shares_net";
  /** Required for income_shares_net (FL); the gross→net deduction config. */
  netIncome?: NetIncomeConfig;
  schedule: IncomeShareScheduleConfig;
  parenting: { model: ParentingModel; params: unknown };
  lowIncome: { model: LowIncomeModel; params: unknown } | null;
  /** Minimum order floor applied to the presumptive amount, or null. */
  minimumOrder: number | null;
  rounding: {
    finalOrder: FinalRounding;
    /**
     * Round each parent's income-share percentage before applying it.
     * "nearest_1pct" => AL Rule 32(C)(3). Omit for full precision (TN/AR/LA).
     */
    incomeShare?: "nearest_1pct";
  };
}

export interface PercentageSpec {
  code: string;
  model: "percentage_obligor";
  /** Statutory percentage (decimal) by number of children, clamped at 5. */
  percentages: Record<number, number>;
  rounding: { finalOrder: FinalRounding };
}

export function roundFinal(n: number, mode: FinalRounding): number {
  switch (mode) {
    case "nearest_dollar":
      return Math.round(n);
    case "round_down":
      return Math.floor(n);
    case "half_up":
      return Math.sign(n) * Math.floor(Math.abs(n) + 0.5);
    case "none":
      return n;
  }
}
