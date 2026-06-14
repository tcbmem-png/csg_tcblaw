/**
 * Pro-rata reimbursement of third-party expenses (add-ons and net-transfer
 * deviations), expressed as a signed amount from Parent A's perspective.
 *
 * Sign convention: if A pays the expense, B owes A their pro-rata share — that
 * REDUCES A's net outflow, so the value is negative. If B pays, A owes B their
 * share — positive. `split_pro_rata` means each pays their own share directly,
 * with no transfer through the order. Single home of this metric; consumed by
 * the TN engine and the generic income-shares core.
 */

export function reimbursementFromA(
  totalMonthly: number,
  paidBy: "parent_a" | "parent_b",
  piA: number,
  piB: number,
): number {
  if (totalMonthly <= 0) return 0;
  if (paidBy === "parent_a") {
    return -totalMonthly * piB;
  }
  return totalMonthly * piA;
}

export function splitProRataNetFromA(
  totalMonthly: number,
  paidBy: "parent_a" | "parent_b" | "split_pro_rata",
  piA: number,
  piB: number,
): number {
  if (totalMonthly <= 0) return 0;
  if (paidBy === "split_pro_rata") {
    return 0;
  }
  return reimbursementFromA(totalMonthly, paidBy, piA, piB);
}
