/** Shared shapes for the generic calculation cores. */

export type Direction = "parent_a_to_b" | "parent_b_to_a" | "none";

export function directionFromASignedFlow(flowFromA: number): Direction {
  if (flowFromA > 0) return "parent_a_to_b";
  if (flowFromA < 0) return "parent_b_to_a";
  return "none";
}

/** A pro-rata add-on or net-transfer deviation line. */
export interface TransferLine {
  id: string;
  /** Monthly amount of the underlying expense. */
  monthly: number;
  paidBy: "parent_a" | "parent_b" | "split_pro_rata";
}

/**
 * A direct (non-pro-rata) deviation: a flat dollar adjustment to the order in
 * the payor→payee direction. `increase` raises the payor's obligation,
 * `decrease` lowers it (AR AO 10 § II(2) deviations expressed as an amount).
 */
export interface DirectDeviation {
  id: string;
  amount: number;
  direction: "increase" | "decrease";
}

/**
 * Generic income-shares inputs. State adapters map their own rich input
 * shape (e.g. TN CalcInputs) onto this. AGI = gross − deductions; the
 * deduction list is pre-summed by the adapter so the core stays model-clean.
 */
export interface IncomeSharesInputs {
  parentAGrossMonthly: number;
  parentBGrossMonthly: number;
  parentADeductionsMonthly?: number;
  parentBDeductionsMonthly?: number;
  numChildren: number;
  parentingType: "standard" | "equal" | "custom";
  arpForStandard?: "parent_a" | "parent_b";
  parentADays?: number;
  parentBDays?: number;
  /** Mandatory pro-rata add-ons (health, childcare, uninsured medical, ...). */
  addOns?: TransferLine[];
  /** Net-transfer (pro-rata) deviations — an expense split between parents. */
  deviations?: TransferLine[];
  /** Direct (flat-amount) deviations applied in the payor→payee direction. */
  directDeviations?: DirectDeviation[];
  /**
   * Split custody: each parent is domiciliary of some children. A separate
   * schedule lookup is run per group and the two obligations are offset
   * (e.g. LA La. R.S. 9:315.10). Mutually exclusive with the parenting strategy.
   */
  splitCustody?: { parentAChildren: number; parentBChildren: number };
}

export interface IncomeSharesOutputs {
  parentAAGI: number;
  parentBAGI: number;
  combinedAGI: number;
  piA: number;
  piB: number;

  bcso: number;
  bcsoSource: "schedule" | "above_cap";
  scheduleAgiUsed: number | null;
  scheduleIsShaded: boolean;

  arpIdentity: "parent_a" | "parent_b" | "equal";
  parentingBand: string;
  variableMultiplier: number | null;

  netPresumptiveSupport: number; // absolute, rounded
  presumptiveDirection: Direction;

  ssrApplied: boolean;
  minimumOrderApplied: boolean;

  addOnsTotalFromA: number;
  deviationsTotalFromA: number;

  allInMonthlyFromA: number; // signed, rounded
  allInMonthly: number; // absolute
  allInDirection: Direction;

  warnings: string[];
  errors: string[];
}
