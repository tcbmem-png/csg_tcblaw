/**
 * Statutory percentages per Miss. Code Ann. § 43-19-101(1).
 * In effect since 1989; unchanged through the 2020 MDHS revision.
 * SB 2259 (2024) would have amended these but died in committee.
 */

export const MS_GUIDELINES_EFFECTIVE_DATE = "Miss. Code Ann. § 43-19-101 (originally 1989; current through HB 1067, 2022; SB 2082, 2023)";

/**
 * Returns the statutory percentage as a decimal (e.g. 0.14 for 1 child).
 * Caps at 5 children — 6+ uses the same 26% per § 43-19-101(1).
 */
export function msStatutoryPercentage(numChildren: number): number {
  const n = Math.max(1, Math.min(5, Math.floor(numChildren)));
  switch (n) {
    case 1: return 0.14;
    case 2: return 0.20;
    case 3: return 0.22;
    case 4: return 0.24;
    case 5: return 0.26;
    default: return 0.26;
  }
}

export const MS_AGI_HIGH_THRESHOLD = 100_000;
export const MS_AGI_LOW_THRESHOLD = 10_000;
