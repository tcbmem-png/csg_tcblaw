import type { CalcInputs, CalcOutputs } from "./types";
import { calculate } from "./calc";

/** Has either parent's imputation toggle been turned on? */
export function hasImputation(inputs: CalcInputs): boolean {
  return inputs.useImputationForA || inputs.useImputationForB;
}

/** Build the "actual income" scenario by swapping any imputed gross with
 *  that parent's actual gross figure. Leaves everything else unchanged. */
export function asActualScenario(inputs: CalcInputs): CalcInputs {
  const next: CalcInputs = { ...inputs };
  if (inputs.useImputationForA) {
    next.parentAGrossMonthly = inputs.parentAActualGrossMonthly ?? 0;
  }
  if (inputs.useImputationForB) {
    next.parentBGrossMonthly = inputs.parentBActualGrossMonthly ?? 0;
  }
  return next;
}

export interface ScenarioPair {
  imputed: { inputs: CalcInputs; outputs: CalcOutputs };
  actual: { inputs: CalcInputs; outputs: CalcOutputs };
  /** Months until the youngest child turns 18 — clamped to [0, 216]. */
  monthsToEighteen: number;
}

export function computeScenarioPair(inputs: CalcInputs): ScenarioPair {
  const imputedOut = calculate(inputs);
  const actualInputs = asActualScenario(inputs);
  const actualOut = calculate(actualInputs);
  const age = Math.min(17, Math.max(0, inputs.youngestChildAge ?? 0));
  const monthsToEighteen = (18 - age) * 12;
  return {
    imputed: { inputs, outputs: imputedOut },
    actual: { inputs: actualInputs, outputs: actualOut },
    monthsToEighteen,
  };
}
