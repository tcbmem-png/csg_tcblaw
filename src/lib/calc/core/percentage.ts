/**
 * Generic percentage-of-obligor-income engine — the base metric for the
 * percentage model (Mississippi). RESERVED for flat/percentage states; it is
 * never a template for income-shares states.
 *
 * base obligation = max(0, monthlyAGI) × statutory%(numChildren)
 *   monthlyAGI = annualAGI / 12 − inHomeChildrenDeductionMonthly
 *   annualAGI  = obligorAnnualGross − Σ deductions
 *
 * State-specific layers (MS incarceration suspension, imputation blend,
 * § 43-19-103 chancellor-decision deviations, high/low-income findings) wrap
 * this base; they are not part of the generic metric.
 */
import type { PercentageSpec } from "./spec";

export interface PercentageInputs {
  obligorAnnualGross: number;
  /** Annual deductions from gross to AGI (taxes, SS, mandatory retirement, prior support, ...). */
  deductionsAnnual?: number;
  /** Monthly deduction for other in-home children. */
  inHomeChildrenDeductionMonthly?: number;
  numChildren: number;
  /** Monthly add-on (e.g. obligee-provided health premium). */
  healthAddOnMonthly?: number;
  /** Net monthly deviation total (signed). */
  deviationTotalMonthly?: number;
}

export interface PercentageOutputs {
  annualAGI: number;
  monthlyAGI: number;
  statutoryPercentage: number;
  presumptiveMonthly: number;
  finalMonthly: number;
}

export function percentagePercent(
  spec: PercentageSpec,
  numChildren: number,
): number {
  const n = Math.max(1, Math.min(5, Math.floor(numChildren)));
  return spec.percentages[n];
}

export function percentageObligor(
  spec: PercentageSpec,
  inputs: PercentageInputs,
): PercentageOutputs {
  const annualAGI =
    Math.max(0, inputs.obligorAnnualGross) - (inputs.deductionsAnnual ?? 0);
  const monthlyAGI = Math.max(
    0,
    annualAGI / 12 - (inputs.inHomeChildrenDeductionMonthly ?? 0),
  );
  const statutoryPercentage = percentagePercent(spec, inputs.numChildren);
  const presumptiveMonthly = monthlyAGI * statutoryPercentage;
  const finalMonthly = Math.max(
    0,
    presumptiveMonthly +
      (inputs.healthAddOnMonthly ?? 0) +
      (inputs.deviationTotalMonthly ?? 0),
  );
  return {
    annualAGI,
    monthlyAGI,
    statutoryPercentage,
    presumptiveMonthly,
    finalMonthly,
  };
}
