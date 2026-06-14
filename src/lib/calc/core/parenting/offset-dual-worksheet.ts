/**
 * AR parenting-time model — Administrative Order No. 10 § V(2).
 *
 * Arkansas uses a straight dual-worksheet offset with NO 1.5× multiplier and
 * NO time-share cross-multiplication (what separates it from the FL/GA shared
 * families):
 *   - < 141 overnights (standard): no adjustment — the nonresidential payor
 *     pays their income share of the BCSO.
 *   - 141–182 overnights (discretionary band): the court MAY adjust; this is
 *     NOT a formula. The engine applies no deterministic adjustment and
 *     surfaces a note for the annotator.
 *   - ≈ equal (≥ 183): complete a worksheet for each parent as payor and
 *     offset — the higher obligation parent pays the difference. Net from A =
 *     BCSO × shareA − BCSO × shareB (multiplier 1.0).
 *
 * Registered as `offset_dual_worksheet`.
 */
import type {
  ParentingInput,
  ParentingResult,
  ParentingStrategy,
} from "./types";

export interface OffsetDualWorksheetParams {
  /** Discretionary (court-may-adjust) overnight band, e.g. {min:141,max:182}. */
  discretionaryBand: { minOvernights: number; maxOvernights: number } | null;
  /** Overnights at/above which the offset method applies (≈ equal). AR: 183. */
  approxEqualOvernights: number;
  /** Offset multiplier — AR is a straight offset, so 1.0. */
  multiplier: number;
}

export const offsetDualWorksheet: ParentingStrategy<
  OffsetDualWorksheetParams
> = (input, p) => {
  const { bcso, piA, piB } = input;
  const proRataA = bcso * piA;
  const proRataB = bcso * piB;
  const warnings: string[] = [];

  // Equal / approximately-equal time → straight offset (higher earner pays).
  if (input.parentingType === "equal") {
    return {
      netFromA: (proRataA - proRataB) * p.multiplier,
      multiplier: p.multiplier,
      arpIdentity: "equal",
      band: "approximately_equal",
      arpDays: input.parentADays ?? 0,
      warnings,
    };
  }

  // Standard preset → nonresidential payor pays their income share of BCSO.
  if (input.parentingType === "standard") {
    const payor = input.arpForStandard ?? "parent_a";
    if (payor === "parent_a") {
      return {
        netFromA: proRataA,
        multiplier: null,
        arpIdentity: "parent_a",
        band: "standard_visitation",
        arpDays: 0,
        warnings,
      };
    }
    return {
      netFromA: -proRataB,
      multiplier: null,
      arpIdentity: "parent_b",
      band: "standard_visitation",
      arpDays: 0,
      warnings,
    };
  }

  // Custom → decide by overnights with each parent.
  const aDays = input.parentADays ?? 0;
  const bDays = input.parentBDays ?? 0;
  const maxDays = Math.max(aDays, bDays);
  if (maxDays >= p.approxEqualOvernights) {
    return {
      netFromA: (proRataA - proRataB) * p.multiplier,
      multiplier: p.multiplier,
      arpIdentity: "equal",
      band: "approximately_equal",
      arpDays: Math.min(aDays, bDays),
      warnings,
    };
  }
  // Payor is the parent with FEWER overnights (the nonresidential parent).
  const payorIsA = aDays <= bDays;
  const payorOvernights = payorIsA ? aDays : bDays;
  if (
    p.discretionaryBand &&
    payorOvernights >= p.discretionaryBand.minOvernights &&
    payorOvernights <= p.discretionaryBand.maxOvernights
  ) {
    warnings.push(
      `Payor has ${payorOvernights} overnights (within the ${p.discretionaryBand.minOvernights}–${p.discretionaryBand.maxOvernights} discretionary band, AO 10 § V(2)). Any adjustment is discretionary, not formulaic; none applied automatically.`,
    );
  }
  return {
    netFromA: payorIsA ? proRataA : -proRataB,
    multiplier: null,
    arpIdentity: payorIsA ? "parent_a" : "parent_b",
    band: "standard_visitation",
    arpDays: payorOvernights,
    warnings,
  };
};
