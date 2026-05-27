import type {
  MSInputs,
  MSOutputs,
  MSDeviation,
  MSFactorLetter,
  MSDeviationComputation,
} from "./types";
import { defaultMSImputationBasis } from "./types";
import {
  computeChancellorTotals,
  defaultChancellorDecisions,
} from "./chancellor-decisions";
import { buildReconciliation } from "./reconciliation";
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
  return {
    letter,
    applicable: false,
    description: "",
    proposedMonthly: 0,
    party: {
      position: "",
      factsAsserted: "",
      documentationReferenced: "",
      proposedMonthly: 0,
      legalAuthority: "",
    },
  };
}

export function defaultMSInputs(): MSInputs {
  return {
    obligorLabel: "Obligor",
    obligeeLabel: "Obligee",
    numChildren: 1,
    incarceration: {
      status: "none",
      reasons: { domesticViolence: false, childAbuse: false, criminalNonpayment: false },
      hasMeansToPay: false,
      meansToPayRationale: "",
    },
    obligorAnnualGross: 0,
    obligorAnnualTaxes: 0,
    obligorAnnualSocialSecurity: 0,
    obligorAnnualMandatoryRetirement: 0,
    preexistingSupportAnnual: 0,
    inHomeChildrenDeductionMonthly: 0,
    agiBasis: "actual",
    imputationBasis: defaultMSImputationBasis(),
    healthInsuranceMonthly: 0,
    healthInsuranceProvidedBy: "neither",
    sharedCustodyFlag: false,
    comparisonMode: "single",
    deviationEntryMode: "pick",
    deviationsA: ALL_FACTOR_LETTERS.map(defaultDeviation),
    deviationsB: undefined,
    childAges: [],
    children: [],
    chancellorDecisions: defaultChancellorDecisions(),
  };
}

function sumDeviations(dev: MSDeviation[] | undefined): number {
  if (!dev) return 0;
  return dev
    .filter((d) => d.applicable)
    .reduce((sum, d) => sum + (Number(d.proposedMonthly) || 0), 0);
}

/**
 * Pure Mississippi child support calculation.
 *
 *   PRE-CHECK § 43-19-36: if obligor is incarcerated > 180 days, no carve-out
 *   applies, and no means to pay → suspension by operation of law.
 *
 *   Otherwise:
 *     annualAGI       = gross - taxes - ss - mandatoryRetirement - preexistingSupport
 *     monthlyAGI      = (annualAGI / 12) - inHomeChildrenDeductionMonthly
 *     presumptive     = monthlyAGI × pct(numChildren)
 *     healthAddOn     = obligee provides ? premium : 0
 *     final           = max(0, presumptive + healthAddOn + Σ applicable deviations)
 */
export function calculateMS(inputs: MSInputs): MSOutputs {
  const warnings: string[] = [];

  // ----- § 43-19-36 incarceration suspension check -----
  const inc = inputs.incarceration;
  const hasCarveOut =
    inc.reasons.domesticViolence ||
    inc.reasons.childAbuse ||
    inc.reasons.criminalNonpayment;
  const suspensionApplies =
    inc.status === "over_180" && !hasCarveOut && !inc.hasMeansToPay;

  // We still compute everything for display, but if suspension applies
  // we floor the final at zero and surface the suspension finding.
  const actualGross = Math.max(0, inputs.obligorAnnualGross);
  // ----- § 43-19-101(5) imputation blend -----
  // Active only when basis === "imputed". The application slider (0..100)
  // mixes actual and imputed gross linearly so the user can model partial
  // imputation outcomes. The note that imputation is "scenario modeling —
  // not a court determination" is emitted in warnings, below.
  const imputationActive =
    inputs.agiBasis === "imputed" && inputs.imputationBasis.imputedAnnualGross > 0;
  const imputationApplicationPct = Math.min(
    100,
    Math.max(0, Number(inputs.imputationBasis.applicationPct ?? 100)),
  );
  const imputedGross = Math.max(
    0,
    Number(inputs.imputationBasis.imputedAnnualGross || 0),
  );
  const blendedGross = imputationActive
    ? actualGross * (1 - imputationApplicationPct / 100) +
      imputedGross * (imputationApplicationPct / 100)
    : actualGross;
  const gross = blendedGross;
  const taxes = Math.max(0, inputs.obligorAnnualTaxes);
  const ss = Math.max(0, inputs.obligorAnnualSocialSecurity);
  const mandRet = Math.max(0, inputs.obligorAnnualMandatoryRetirement);
  const priorSupport = Math.max(0, inputs.preexistingSupportAnnual);
  const inHomeMonthly = Math.max(0, inputs.inHomeChildrenDeductionMonthly);

  const annualAGI = gross - taxes - ss - mandRet - priorSupport;
  const monthlyAGI = Math.max(0, annualAGI / 12 - inHomeMonthly);

  const statutoryPercentage = msStatutoryPercentage(inputs.numChildren);
  const presumptiveMonthly = monthlyAGI * statutoryPercentage;

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

  // §1.9 — final order is driven by the chancellor's per-factor decisions when
  // the decision map is present (i.e. all current sessions and shared URLs that
  // include the v2 surface). Pending decisions contribute $0, so a fresh case
  // returns the presumptive baseline rather than silently adopting either
  // party's proposal. Legacy URLs lacking `chancellorDecisions` entirely fall
  // back to summing the obligor's slate to preserve backward compatibility.
  let totalDeviationsMonthly: number;
  if (inputs.chancellorDecisions) {
    const report = buildReconciliation(inputs);
    const chancellor = computeChancellorTotals(
      report.rows,
      inputs.chancellorDecisions,
    );
    totalDeviationsMonthly = chancellor.totalMonthly;
  } else {
    totalDeviationsMonthly = sumDeviations(inputs.deviationsA);
  }

  const computeFinal = (devTotal: number): number =>
    Math.max(0, presumptiveMonthly + healthInsuranceAddOnMonthly + devTotal);

  let proposedFinalMonthly = computeFinal(totalDeviationsMonthly);

  let positionB: MSDeviationComputation | undefined;
  if (inputs.comparisonMode === "side_by_side") {
    const bTotal = sumDeviations(inputs.deviationsB);
    positionB = {
      totalMonthly: bTotal,
      proposedFinalMonthly: computeFinal(bTotal),
    };
  }

  let suspensionReason: string | null = null;
  if (suspensionApplies) {
    proposedFinalMonthly = 0;
    if (positionB) positionB = { ...positionB, proposedFinalMonthly: 0 };
    suspensionReason =
      "Obligation suspended by operation of law during incarceration exceeding 180 days. Resumes the first day of the month following 60 days after release. § 43-19-36(2)–(3).";
    warnings.unshift(
      "§ 43-19-36 suspension applies: obligation is suspended during incarceration and resumes 60 days after release.",
    );
  } else if (inc.status === "over_180" && hasCarveOut) {
    const which: string[] = [];
    if (inc.reasons.domesticViolence) which.push("domestic violence (§ 97-3-7)");
    if (inc.reasons.childAbuse) which.push("child abuse (§ 97-5-39)");
    if (inc.reasons.criminalNonpayment)
      which.push("criminal nonpayment of child support (§ 97-5-3)");
    warnings.push(
      `§ 43-19-36(2)(b) carve-out applies (${which.join("; ")}). Suspension is unavailable; the full obligation continues.`,
    );
  } else if (inc.status === "over_180" && inc.hasMeansToPay) {
    warnings.push(
      "§ 43-19-36(2)(a) exception: obligor has means to pay during incarceration; suspension is unavailable.",
    );
  }

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

  if (inputs.agiBasis === "imputed") {
    warnings.push(
      "Gross income is marked imputed. Under § 43-19-101(5) (effective 2022-07-01), imputation must be based on specific fact-gathering, not a standard amount.",
    );
    if (imputationActive) {
      warnings.push(
        `Imputation scenario active — actual $${Math.round(actualGross).toLocaleString("en-US")}/yr blended with imputed $${Math.round(imputedGross).toLocaleString("en-US")}/yr at ${imputationApplicationPct}% application. Downstream amounts reflect scenario modeling — not a court determination. § 43-19-101(5).`,
      );
    }
  }

  return {
    suspensionApplies,
    suspensionReason,
    annualAGI,
    monthlyAGI,
    statutoryPercentage,
    presumptiveMonthly,
    healthInsuranceAddOnMonthly,
    totalDeviationsMonthly,
    proposedFinalMonthly,
    positionB,
    requiresFindingHighIncome,
    requiresFindingLowIncome,
    warnings,
    guidelinesEffectiveDate: MS_GUIDELINES_EFFECTIVE_DATE,
    imputationActive,
    imputationApplicationPct,
    imputedAnnualGross: imputationActive ? imputedGross : 0,
    actualAnnualGross: actualGross,
    blendedAnnualGross: blendedGross,
  };
}

export { ALL_FACTOR_LETTERS };
