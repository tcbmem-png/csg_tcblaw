/**
 * TN parenting-time model — Rule 1240-02-04-.04(7).
 *
 * Standard/neutral: ARP pays full pro-rata BCSO.
 * Reduction (ARP days >= reductionThreshold): variable multiplier
 *   (variableMultiplierConstant * arpDays) applied to BCSO; PRP's share of
 *   the increase credited against the ARP's pro-rata.
 * Increase (ARP days <= increaseThreshold): ARP's pro-rata bumped by
 *   ((increaseThreshold - arpDays)/365).
 * Equal (50/50): Parent B deemed ARP at equalDays => same reduction formula.
 *
 * Extracted verbatim from the legacy TN engine; this is the single home of
 * the TN parenting metric. Registered as `tn_variable_multiplier`.
 */
import type {
  ParentingInput,
  ParentingResult,
  ParentingStrategy,
} from "./types";

export interface TnVariableMultiplierParams {
  /** ARP days >= this triggers the reduction band. (TN: 92) */
  reductionThreshold: number;
  /** ARP days <= this triggers the increase band. (TN: 68) */
  increaseThreshold: number;
  /** Per-diem multiplier constant. (TN: 2/182.5) */
  variableMultiplierConstant: number;
  /** Equal-parenting days deemed for each parent. (TN: 182.5) */
  equalDays: number;
  /** ARP days assigned to the standard preset. (TN: 80) */
  standardArpDays: number;
}

function bandForDays(
  arpDays: number,
  p: TnVariableMultiplierParams,
): "reduction" | "neutral" | "increase" {
  if (arpDays >= p.reductionThreshold) return "reduction";
  if (arpDays <= p.increaseThreshold) return "increase";
  return "neutral";
}

/**
 * Signed monthly support from Parent A's perspective:
 *   positive => Parent A pays Parent B; negative => Parent B pays Parent A.
 */
function computePresumptive(
  bcso: number,
  piA: number,
  piB: number,
  band: "standard" | "reduction" | "neutral" | "increase" | "equal",
  arpDays: number,
  arpIsA: boolean,
  p: TnVariableMultiplierParams,
): { netFromA: number; multiplier: number | null } {
  const proRataA = bcso * piA;
  const proRataB = bcso * piB;

  if (band === "neutral" || band === "standard") {
    if (arpIsA) return { netFromA: proRataA, multiplier: null };
    return { netFromA: -proRataB, multiplier: null };
  }

  if (band === "reduction" || band === "equal") {
    const multiplier = p.variableMultiplierConstant * arpDays;
    const adjustedBcso = bcso * multiplier;
    const additional = adjustedBcso - bcso;
    if (arpIsA) {
      const prpShareAdditional = additional * piB;
      const arpFinal = proRataA - prpShareAdditional;
      return { netFromA: arpFinal, multiplier };
    } else {
      const prpShareAdditional = additional * piA;
      const arpFinal = proRataB - prpShareAdditional;
      return { netFromA: -arpFinal, multiplier };
    }
  }

  // band === "increase"
  const daysBelow = p.increaseThreshold - arpDays;
  const increasePct = daysBelow / 365;
  if (arpIsA) {
    const adjusted = proRataA + proRataA * increasePct;
    return { netFromA: adjusted, multiplier: null };
  } else {
    const adjusted = proRataB + proRataB * increasePct;
    return { netFromA: -adjusted, multiplier: null };
  }
}

export const tnVariableMultiplier: ParentingStrategy<
  TnVariableMultiplierParams
> = (input, p) => {
  const { bcso, piA, piB } = input;
  const warnings: string[] = [];

  let arpDays: number;
  let arpIsA: boolean;
  let band: "standard" | "reduction" | "neutral" | "increase" | "equal";
  let arpIdentity: "parent_a" | "parent_b" | "equal";

  if (input.parentingType === "equal") {
    arpDays = p.equalDays;
    arpIsA = false; // Rule .04(7)(b)(2)(i) — Parent B deemed ARP
    band = "equal";
    arpIdentity = "equal";
  } else if (input.parentingType === "standard") {
    const arp = input.arpForStandard ?? "parent_b";
    arpIsA = arp === "parent_a";
    arpDays = p.standardArpDays;
    band = "standard";
    arpIdentity = arp;
  } else {
    // custom
    const aDays = input.parentADays ?? 285;
    const bDays = input.parentBDays ?? 365 - aDays;
    if (Math.abs(aDays + bDays - 365) > 1.5) {
      warnings.push(
        `Parenting days (${aDays} + ${bDays}) do not sum to 365. Adjust before relying on this calculation.`,
      );
    }
    if (Math.abs(aDays - bDays) < 0.5) {
      band = "equal";
      arpDays = p.equalDays;
      arpIsA = false;
      arpIdentity = "equal";
    } else if (aDays < bDays) {
      arpIsA = true;
      arpDays = aDays;
      arpIdentity = "parent_a";
      band = bandForDays(arpDays, p);
    } else {
      arpIsA = false;
      arpDays = bDays;
      arpIdentity = "parent_b";
      band = bandForDays(arpDays, p);
    }
  }

  const { netFromA, multiplier } = computePresumptive(
    bcso,
    piA,
    piB,
    band,
    arpDays,
    arpIsA,
    p,
  );

  return { netFromA, multiplier, arpIdentity, band, arpDays, warnings };
};
