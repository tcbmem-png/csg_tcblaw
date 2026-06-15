/**
 * TN runtime spec — Tennessee expressed as data for the generic income-shares
 * core, plus the adapter from TN's rich CalcInputs onto the generic inputs.
 *
 * The live TN engine (calc.ts) still owns TN-only extras (federal-benefit
 * offset, statutory-cap narrative, special-expenses 7% threshold, explainer
 * prose). This spec proves TN's SHARED pipeline reproduces through the generic
 * core (see core/__tests__/income-shares.equivalence.test.ts) and is the
 * template every other income-shares state follows.
 */
import type { IncomeSharesSpec } from "../../core/spec";
import type { IncomeSharesInputs } from "../../core/types";
import type { TnVariableMultiplierParams } from "../../core/parenting";
import type { SsrParams } from "../../core/low-income";
import type { CalcInputs } from "./types";
import { lookupBcso, TN_SCHEDULE_CONFIG } from "./bcso";
import {
  COMBINED_AGI_CAP,
  MIN_SUPPORT_MONTHLY,
  PARENTING_TIME,
  SSR_AMOUNT,
} from "./data/constants";

const TN_PARENTING_PARAMS: TnVariableMultiplierParams = {
  reductionThreshold: PARENTING_TIME.REDUCTION_THRESHOLD,
  increaseThreshold: PARENTING_TIME.INCREASE_THRESHOLD,
  variableMultiplierConstant: PARENTING_TIME.VARIABLE_MULTIPLIER_CONSTANT,
  equalDays: PARENTING_TIME.EQUAL_DAYS,
  standardArpDays: 80,
};

const TN_SSR_PARAMS: SsrParams = {
  reserve: SSR_AMOUNT,
  cap: COMBINED_AGI_CAP,
  lookup: (agi, n) => {
    const r = lookupBcso(agi, n);
    return { bcso: r.bcso, isShaded: r.isShaded };
  },
  noteBuilder: (altBcso, reserve) =>
    `Self-Support Reserve applied (Rule .02(25)): obligor-only BCSO ($${altBcso}) used in place of pro-rata BCSO so the obligor retains the $${reserve}/mo reserve.`,
};

export const TN_INCOME_SHARES_SPEC: IncomeSharesSpec = {
  code: "TN",
  model: "income_shares_gross",
  schedule: TN_SCHEDULE_CONFIG,
  parenting: { model: "tn_variable_multiplier", params: TN_PARENTING_PARAMS },
  lowIncome: { model: "self_support_reserve", params: TN_SSR_PARAMS },
  minimumOrder: MIN_SUPPORT_MONTHLY,
  rounding: { finalOrder: "nearest_dollar" },
};

/**
 * Map TN's CalcInputs onto the generic income-shares inputs. Covers the shared
 * pipeline only; TN-only inputs (federal benefit, means-tested, special
 * expenses, imputation methodology) are handled by the TN engine, not here.
 */
export function calcInputsToIncomeShares(i: CalcInputs): IncomeSharesInputs {
  return {
    parentAGrossMonthly: i.parentAGrossMonthly,
    parentBGrossMonthly: i.parentBGrossMonthly,
    parentADeductionsMonthly:
      i.parentASECredit + i.parentAPriorSupport + i.parentAInhomeCredit,
    parentBDeductionsMonthly:
      i.parentBSECredit + i.parentBPriorSupport + i.parentBInhomeCredit,
    numChildren: i.numChildren,
    parentingType: i.parentingType,
    arpForStandard: i.arpForStandard,
    parentADays: i.parentADays,
    parentBDays: i.parentBDays,
    addOns: [
      {
        id: "health_insurance",
        monthly: i.healthPremiumMonthly,
        paidBy: i.healthPaidBy,
      },
      {
        id: "uninsured_medical",
        monthly: i.uninsuredMedicalMonthly,
        paidBy: i.uninsuredMedicalPaidBy,
      },
      {
        id: "work_related_childcare",
        monthly: i.childcareMonthly,
        paidBy: i.childcarePaidBy,
      },
    ],
    deviations: i.includePrivateSchool
      ? [
          {
            id: "private_school",
            monthly: i.privateSchoolAnnual / 12,
            paidBy: i.privateSchoolPaidBy,
          },
        ]
      : [],
  };
}
