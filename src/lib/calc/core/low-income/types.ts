/**
 * Low-income / self-support adjustment strategy interface.
 *
 * States protect a low-income obligor differently (TN self-support reserve,
 * schedule floor, low-income deviation table). Each is a strategy selected by
 * spec.lowIncome.model, applied to the post-parenting presumptive amount.
 */

export interface LowIncomeInput {
  /** Signed net presumptive from Parent A (positive => A pays B). */
  presumptiveFromA: number;
  aAGI: number;
  bAGI: number;
  numChildren: number;
}

export interface LowIncomeResult {
  /** Signed presumptive after the adjustment. */
  presumptiveAfterAdjustment: number;
  applied: boolean;
  note: string | null;
  /** True when the adjustment drove the obligor's amount to ~$0. */
  collapsedToZero: boolean;
  /** Which parent was the obligor when collapse occurred. */
  obligorIsA: boolean;
}

export type LowIncomeStrategy<P = unknown> = (
  input: LowIncomeInput,
  params: P,
) => LowIncomeResult;
