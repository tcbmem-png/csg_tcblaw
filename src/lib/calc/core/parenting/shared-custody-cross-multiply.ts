/**
 * The 1.5× shared-custody family — one parameterized strategy reused by LA, AL,
 * and FL (contract v1.4). Multiply the basic obligation by `multiplier`,
 * allocate each parent's share by `creditMethod`, then offset.
 *
 *   LA (La. R.S. 9:315.9): multiplier 1.5, trigger qualitative_shared_custody,
 *     creditMethod cross_multiply_time_share, boundary ceiling
 *     (capped at the obligor's domiciliary-worksheet amount — 9:315.9(A)(7)).
 *   FL: multiplier 1.5, trigger overnight_threshold (73), cross_multiply, none.
 *   AL (Rule 32(C)(7)): multiplier 1.5, trigger qualitative, half_credit.
 *
 * Implemented now: cross_multiply_time_share (LA/FL), both triggers, boundary
 * ceiling/none. half_credit (AL) and boundary "floor" are fenced fail-loud
 * until the AL pack lands with fixtures to pin them — per the core convention.
 * Time shares come from parentADays/parentBDays (overnight proportions).
 */
import type {
  ParentingInput,
  ParentingResult,
  ParentingStrategy,
} from "./types";

export interface SharedCustodyCrossMultiplyParams {
  /** Gross-up applied to the basic obligation before allocation. 1.5 for LA/AL/FL. */
  multiplier: number;
  trigger: {
    type: "qualitative_shared_custody" | "overnight_threshold";
    /** Overnights at/above which shared custody applies (FL: 73). */
    thresholdOvernights: number | null;
  };
  creditMethod: "cross_multiply_time_share" | "half_credit";
  boundary: "ceiling" | "floor" | "none";
}

function sharedApplies(
  input: ParentingInput,
  p: SharedCustodyCrossMultiplyParams,
): boolean {
  if (p.trigger.type === "qualitative_shared_custody") {
    return input.parentingType === "equal";
  }
  // overnight_threshold: the lesser-time parent has >= threshold overnights.
  const a = input.parentADays ?? 0;
  const b = input.parentBDays ?? 0;
  const threshold = p.trigger.thresholdOvernights ?? Infinity;
  return Math.min(a, b) >= threshold;
}

export const sharedCustodyCrossMultiply: ParentingStrategy<
  SharedCustodyCrossMultiplyParams
> = (input, p) => {
  const { bcso, piA, piB } = input;
  const warnings: string[] = [];

  // --- Not shared custody: plain income-shares (designated obligor pays share) ---
  if (!sharedApplies(input, p)) {
    const payor = input.arpForStandard ?? "parent_a";
    if (payor === "parent_a") {
      return {
        netFromA: bcso * piA,
        multiplier: null,
        arpIdentity: "parent_a",
        band: "standard",
        arpDays: 0,
        warnings,
      };
    }
    return {
      netFromA: -bcso * piB,
      multiplier: null,
      arpIdentity: "parent_b",
      band: "standard",
      arpDays: 0,
      warnings,
    };
  }

  // --- AL half_credit (Rule 32(C)(7), CS-42-S) ---
  // Gross the BCSO up by the multiplier; each parent's adjusted obligation is
  // their income share of the adjusted amount; each is credited HALF of the
  // adjusted obligation; the higher-adjusted parent pays the difference. The
  // half-credit is equal for both parents, so it cancels in the offset and the
  // net is simply the difference of the two income-share obligations.
  // SSR / $50 minimum / zero-dollar do NOT apply on CS-42-S → suppressLowIncome.
  if (p.creditMethod === "half_credit") {
    const adjusted = bcso * p.multiplier;
    const netFromA = piA * adjusted - piB * adjusted;
    return {
      netFromA,
      multiplier: p.multiplier,
      arpIdentity:
        netFromA > 0 ? "parent_a" : netFromA < 0 ? "parent_b" : "equal",
      band: "shared_custody",
      arpDays: Math.min(input.parentADays ?? 0, input.parentBDays ?? 0),
      warnings,
      suppressLowIncome: true,
    };
  }
  if (p.boundary === "floor") {
    throw new Error(
      "shared_custody_cross_multiply: boundary 'floor' is not implemented yet " +
        "(no current state uses it; LA=ceiling, AL/FL=none).",
    );
  }

  // --- Shared custody: 1.5× gross-up, cross-multiply by the OTHER parent's time ---
  const adjusted = bcso * p.multiplier;
  const aDays = input.parentADays ?? 0;
  const bDays = input.parentBDays ?? 0;
  const totalDays = aDays + bDays;
  // Approximately-equal default when time data is absent (qualitative trigger).
  const timeA = totalDays > 0 ? aDays / totalDays : 0.5;
  const timeB = totalDays > 0 ? bDays / totalDays : 0.5;

  // Each parent's theoretical obligation cross-multiplied by the OTHER parent's
  // physical-custody time share, then offset (La. R.S. 9:315.9(A)(3)).
  const aObligation = piA * adjusted * timeB;
  const bObligation = piB * adjusted * timeA;
  let netFromA = aObligation - bObligation;

  // Ceiling: the shared result may never exceed what the net obligor would owe
  // as the nondomiciliary parent on the plain worksheet (9:315.9(A)(7)).
  if (p.boundary === "ceiling" && netFromA !== 0) {
    const obligorBasic = (netFromA > 0 ? piA : piB) * bcso;
    if (Math.abs(netFromA) > obligorBasic) {
      netFromA = Math.sign(netFromA) * obligorBasic;
    }
  }

  return {
    netFromA,
    multiplier: p.multiplier,
    arpIdentity: netFromA > 0 ? "parent_a" : netFromA < 0 ? "parent_b" : "equal",
    band: "shared_custody",
    arpDays: Math.min(aDays, bDays),
    warnings,
    suppressLowIncome: true,
  };
};
