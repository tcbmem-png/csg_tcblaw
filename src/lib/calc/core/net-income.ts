/**
 * income_shares_net gross→net pre-step (Florida, Fla. Stat. § 61.30(3)).
 *
 * FL is the only income_shares_net state: its schedule runs on combined NET
 * income, so each parent's gross is converted to net BEFORE combining. The
 * design decision (2026-06-14) is locked: the USER supplies the deduction
 * amounts (including actual federal income tax and FICA from their Form
 * 12.902(e) affidavit) and the ENGINE SUMS them — there is no embedded tax
 * estimator. § 61.30(3) deduction order: federal income tax, FICA/SECA,
 * mandatory union dues, mandatory retirement, the obligor's own health
 * insurance (NOT the child's — that's the § 61.30(8) add-on), court-ordered
 * support for other children actually paid, and spousal support paid.
 */

export interface NetIncomeConfig {
  /** Ordered deduction category ids (§ 61.30(3)); drives the UI worksheet. */
  deductions: string[];
}

/** Net = gross − Σ(user-supplied deduction amounts), floored at 0. */
export function grossToNetMonthly(
  grossMonthly: number,
  deductionAmounts: readonly number[] = [],
): number {
  const total = deductionAmounts.reduce(
    (sum, d) => sum + (Number.isFinite(d) ? Math.max(0, d) : 0),
    0,
  );
  return Math.max(0, grossMonthly - total);
}

export interface NetStep {
  step: number;
  id: string;
  deduct: number;
  runningNet: number;
}

/**
 * Step-by-step gross→net running total for the worksheet/UI (and the
 * running-total fixture). Item order is the § 61.30(3) deduction order.
 */
export function grossToNetSteps(
  grossMonthly: number,
  items: ReadonlyArray<{ id: string; amount: number }>,
): { steps: NetStep[]; net: number } {
  const steps: NetStep[] = [
    { step: 0, id: "gross", deduct: 0, runningNet: grossMonthly },
  ];
  let running = grossMonthly;
  items.forEach((it, i) => {
    const deduct = Number.isFinite(it.amount) ? Math.max(0, it.amount) : 0;
    running = running - deduct;
    steps.push({ step: i + 1, id: it.id, deduct, runningNet: running });
  });
  return { steps, net: Math.max(0, running) };
}
