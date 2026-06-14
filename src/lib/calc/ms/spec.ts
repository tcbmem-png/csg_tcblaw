/**
 * MS runtime spec — Mississippi expressed as data for the generic percentage
 * core, plus the adapter from MSInputs onto the generic percentage inputs.
 *
 * This is the percentage model and is RESERVED for MS / flat-percentage
 * states — never a template for income-shares states. The live MS engine
 * (ms/calc.ts) owns MS-only layers (§ 43-19-36 incarceration suspension,
 * imputation blend, § 43-19-103 chancellor-decision deviations, high/low
 * income findings) that wrap this base obligation.
 *
 * (MS still lives at src/lib/calc/ms/; relocation into states/ms/ is a later
 * step. This file sits with MS so its ./types import is local.)
 */
import type { PercentageSpec } from "../core/spec";
import type { PercentageInputs } from "../core/percentage";
import type { MSInputs } from "./types";

export const MS_PERCENTAGE_SPEC: PercentageSpec = {
  code: "MS",
  model: "percentage_obligor",
  // Miss. Code Ann. § 43-19-101(1); 6+ children use the 5-child 26%.
  percentages: { 1: 0.14, 2: 0.2, 3: 0.22, 4: 0.24, 5: 0.26 },
  rounding: { finalOrder: "none" }, // MS keeps cents; calculateMS does not round
};

/**
 * Map MSInputs onto the generic percentage inputs. Baseline obligation only —
 * the caller supplies any deviation total; MS's incarceration, imputation, and
 * chancellor layers remain in ms/calc.ts.
 */
export function msInputsToPercentage(
  i: MSInputs,
  opts: { deviationTotalMonthly?: number } = {},
): PercentageInputs {
  const healthAddOnMonthly =
    i.healthInsuranceProvidedBy === "obligee" && i.healthInsuranceMonthly > 0
      ? i.healthInsuranceMonthly
      : 0;
  return {
    obligorAnnualGross: i.obligorAnnualGross,
    deductionsAnnual:
      Math.max(0, i.obligorAnnualTaxes) +
      Math.max(0, i.obligorAnnualSocialSecurity) +
      Math.max(0, i.obligorAnnualMandatoryRetirement) +
      Math.max(0, i.preexistingSupportAnnual),
    inHomeChildrenDeductionMonthly: Math.max(
      0,
      i.inHomeChildrenDeductionMonthly,
    ),
    numChildren: i.numChildren,
    healthAddOnMonthly,
    deviationTotalMonthly: opts.deviationTotalMonthly ?? 0,
  };
}
