/**
 * § 43-19-101(5) twelve-factor labels and helpers. Single source of truth
 * for both the input form (imputation-basis.tsx) and the read surfaces
 * (worksheet-preview, ms-worksheet-pdf).
 */
import type { MSImputationBasis, MSImputationFactors } from "./types";

export const MS_IMPUTATION_FACTOR_KEYS: (keyof MSImputationFactors)[] = [
  "assets",
  "residence",
  "jobSkills",
  "educational",
  "literacy",
  "age",
  "health",
  "criminalBarriers",
  "workSeeking",
  "localJobMarket",
  "employersWilling",
  "prevailingLocal",
];

export const MS_IMPUTATION_FACTOR_LABELS: Record<keyof MSImputationFactors, string> = {
  assets: "Assets",
  residence: "Residence",
  jobSkills: "Job skills",
  educational: "Educational attainment",
  literacy: "Literacy",
  age: "Age",
  health: "Health",
  criminalBarriers: "Criminal record / employment barriers",
  workSeeking: "Record of seeking work",
  localJobMarket: "Local job market",
  employersWilling: "Available employers willing to hire",
  prevailingLocal: "Prevailing local earnings",
};

/** Returns the populated factors as { label, value } pairs for display. */
export function assertedImputationFactors(
  basis: MSImputationBasis,
): { key: keyof MSImputationFactors; label: string; value: string }[] {
  return MS_IMPUTATION_FACTOR_KEYS
    .map((k) => ({
      key: k,
      label: MS_IMPUTATION_FACTOR_LABELS[k],
      value: (basis.factors?.[k] ?? "").trim(),
    }))
    .filter((f) => f.value.length > 0);
}
