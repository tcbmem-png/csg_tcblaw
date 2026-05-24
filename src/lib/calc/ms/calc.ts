import type { MSInputs, MSOutputs, MSDeviation, MSFactorLetter } from "./types";
import {
  MS_AGI_HIGH_THRESHOLD,
  MS_AGI_LOW_THRESHOLD,
  MS_GUIDELINES_EFFECTIVE_DATE,
  msStatutoryPercentage,
} from "./data/percentages";

const ALL_FACTOR_LETTERS: MSFactorLetter[] = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
];

export function defaultDeviation(letter: MSFactorLetter): MSDeviation {
  return { letter, applicable: false, description: "", proposedMonthly: 0 };
}

export function defaultMSInputs(): MSInputs {
  return {
    obligorLabel: "Obligor",
    obligeeLabel: "Obligee",
    numChildren: 1,
    obligorAnnualGross: 0,
    obligorAnnualTaxes: 0,
    obligorAnnualSocialSecurity: 0,
    obligorAnnualMandatoryRetirement: 0,
    preexistingSupportAnnual: 0,
    inHomeChildrenDeductionMonthly: 0,
    healthInsuranceMonthly: 0,
    healthInsuranceProvidedBy: "neither",
    sharedCustodyFlag: false,
    deviations: ALL_FACTOR_LETTERS.map(defaultDeviation),
  };
}

/**
 * Pure Mississippi child support calculation.
 *
 *   annualAGI       = gross - taxes - ss - mandatoryRetirement - preexistingSupport
 *   monthlyAGI      = (annualAGI / 12) - inHomeChildrenDeductionMonthly
 *   presumptive     = monthlyAGI × pct(numChildren)
 *   healthAddOn     = obligee provides ? premium : 0   (if obligor provides, already credited in AGI flow — note in PDF)
 *   final           = max(0, presumptive + healthAddOn + Σ applicable deviations)
 */
export function calculateMS(inputs: MSInputs): MSOutputs {
  const warnings: string[] = [];

  const gross = Math.max(0, inputs.obligorAnnualGross);
  const taxes = Math.max(0, inputs.obligorAnnualTaxes);
  const ss = Math.max(0, inputs.obligorAnnualSocialSecurity);
  const mandRet = Math.max(0, inputs.obligorAnnualMandatoryRetirement);
  const priorSupport = Math.max(0, inputs.preexistingSupportAnnual);
  const inHomeMonthly = Math.max(0, inputs.inHomeChildrenDeductionMonthly);

  const annualAGI = gross - taxes - ss - mandRet - priorSupport;
  const monthlyAGI = Math.max(0, annualAGI / 12 - inHomeMonthly);

  const statutoryPercentage = msStatutoryPercentage(inputs.numChildren);
  const presumptiveMonthly = monthlyAGI * statutoryPercentage;

  // Health insurance per § 43-19-101(6).
  // If obligor provides: cost is taken into account implicitly because the obligor
  // is already paying it out of post-tax dollars; we display it as informational
  // and do not add it. If obligee provides, add the children's portion to the award.
  let healthInsuranceAddOnMonthly = 0;
  if (
    inputs.healthInsuranceProvidedBy === "obligee" &&
    inputs.healthInsuranceMonthly > 0
  ) {
    healthInsuranceAddOnMonthly = inputs.healthInsuranceMonthly;
  }
  if (
    inputs.healthInsuranceProvidedBy === "obligor" &&
    inputs.healthInsuranceMonthly > 0
  ) {
    warnings.push(
      "Obligor-provided health insurance: cost is informational only; the court may adjust the support obligation to reflect a share of the premium under § 43-19-101(6).",
    );
  }

  const totalDeviationsMonthly = inputs.deviations
    .filter((d) => d.applicable)
    .reduce((sum, d) => sum + (Number(d.proposedMonthly) || 0), 0);

  const proposedFinalMonthly = Math.max(
    0,
    presumptiveMonthly + healthInsuranceAddOnMonthly + totalDeviationsMonthly,
  );

  const requiresFindingHighIncome = annualAGI > MS_AGI_HIGH_THRESHOLD;
  const requiresFindingLowIncome = annualAGI < MS_AGI_LOW_THRESHOLD;

  if (requiresFindingHighIncome) {
    warnings.push(
      "Per § 43-19-101(4), this calculation requires written court findings because obligor's annual AGI is above $100,000. The guidelines may or may not be deemed reasonable in your case.",
    );
  }
  if (requiresFindingLowIncome) {
    warnings.push(
      "Per § 43-19-101(4), this calculation requires written court findings because obligor's annual AGI is below $10,000. The guidelines may or may not be deemed reasonable in your case.",
    );
  }

  if (inputs.sharedCustodyFlag) {
    warnings.push(
      "Shared / 50-50 parenting indicated. Mississippi has no statutory 50-50 formula; address via § 43-19-103(g) deviation (the 'particular shared parental arrangement' factor).",
    );
  }

  return {
    annualAGI,
    monthlyAGI,
    statutoryPercentage,
    presumptiveMonthly,
    healthInsuranceAddOnMonthly,
    totalDeviationsMonthly,
    proposedFinalMonthly,
    requiresFindingHighIncome,
    requiresFindingLowIncome,
    warnings,
    guidelinesEffectiveDate: MS_GUIDELINES_EFFECTIVE_DATE,
  };
}

export { ALL_FACTOR_LETTERS };
