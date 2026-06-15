/**
 * Parenting-time strategy interface.
 *
 * Parenting-time math differs sharply by state (TN variable multiplier,
 * GA cross-credit, FL gross-up-1.5, AR offset). Each is its own strategy
 * selected by spec.parentingTime.model — NOT a parameterization of one
 * formula. The strategy returns the signed net presumptive support from
 * Parent A's perspective so the orchestrator stays model-agnostic.
 */

/** TN bands; other models use their own labels. Kept open as a string union. */
export type ParentingBand =
  | "standard"
  | "reduction"
  | "neutral"
  | "increase"
  | "equal"
  | (string & {});

export interface ParentingInput {
  /** Basic combined obligation (BCSO) for this case. */
  bcso: number;
  /** Parent A / Parent B income shares (0..1). */
  piA: number;
  piB: number;
  parentingType: "standard" | "equal" | "custom";
  /** For 'standard': which parent is the ARP. */
  arpForStandard?: "parent_a" | "parent_b";
  /** For 'custom': days with each parent (should sum to ~365). */
  parentADays?: number;
  parentBDays?: number;
}

export interface ParentingResult {
  /** Signed net presumptive from Parent A (positive => A pays B). */
  netFromA: number;
  /** Model-specific multiplier surfaced on the worksheet, or null. */
  multiplier: number | null;
  arpIdentity: "parent_a" | "parent_b" | "equal";
  band: ParentingBand;
  /** ARP days used in the computation (cosmetic for non-day models). */
  arpDays: number;
  /** Non-fatal notices (e.g. days not summing to 365). */
  warnings: string[];
}

export type ParentingStrategy<P = unknown> = (
  input: ParentingInput,
  params: P,
) => ParentingResult;
