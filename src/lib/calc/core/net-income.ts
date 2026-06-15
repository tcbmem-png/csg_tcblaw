/**
 * income_shares_net gross→net pre-step (Florida).
 *
 * FL is the only income_shares_net state: its schedule runs on combined NET
 * income, so each parent's gross must be converted to net (federal income tax,
 * FICA, mandatory union dues, mandatory retirement, health-insurance for the
 * parent, court-ordered pre-existing support, ...) BEFORE combining and looking
 * up the schedule. That conversion is a genuinely new mechanic the core does
 * not yet have.
 *
 * It is STUBBED FAIL-LOUD and named now (harmless), per the core convention:
 * any attempt to run an income_shares_net state throws with a clear message
 * until the real implementation lands with the FL pack — which must specify the
 * ordered deductions and worked fixtures pinning each step's running total
 * (the way AR's pack pinned round_down).
 *
 * NOTE: FL's PARENTING is NOT special — it is the shared_custody_cross_multiply
 * strategy shared with LA/AL (built with those states); FL differs only in the
 * trigger (overnight_threshold thresholdOvernights=73). There is deliberately
 * no gross_up_1_5 strategy.
 */

export interface NetIncomeConfig {
  /**
   * Ordered deduction categories from gross to net (the doctrine spec's
   * `deductionsToNet`). The real engine will apply these in order; shape may
   * be refined when the FL pack lands.
   */
  deductions: string[];
}

/**
 * Convert a parent's monthly gross to monthly net for an income_shares_net
 * state. Not implemented yet — fails loud.
 */
export function grossToNetMonthly(
  _grossMonthly: number,
  _config: NetIncomeConfig | undefined,
): number {
  throw new Error(
    "income_shares_net gross→net pre-step is not implemented yet. FL is the " +
      "only state that needs it; awaiting the FL pack's ordered deductions and " +
      "worked fixtures. (core/net-income.ts)",
  );
}
