// Single source of truth for the 50-state registry that drives the homepage
// tile-grid map, the text list, the header's active-state detection, and the
// sitemap. Flipping a state from "planned" -> "available" here updates every
// surface.

export type StateStatus = "available" | "coming_soon" | "planned";

/**
 * Verification posture for an "available" calculator. Defaults to "verified".
 * Setting "under_review" surfaces a banner on /xx and a small marker on the
 * homepage tile + list. Single field, no per-state code paths.
 */
export type StateReviewStatus = "verified" | "under_review";

/** Calculation model used by a state guideline. Drives the tile hue. */
export type StateModel = "income_shares" | "percentage" | "melson";

export interface StateEntry {
  /** USPS 2-letter code, uppercase. */
  code: string;
  /** Full state name. */
  name: string;
  /** Calculation model label (available + coming_soon). */
  model?: string;
  /** Controlling rule citation (available + coming_soon). */
  cite?: string;
  status: StateStatus;
  /** Internal route for the calculator (available) or roadmap stub. */
  route?: string;
  /** [col, row] in the 11x8 tile grid. */
  tile: [number, number];
  /** Verification posture for available calculators. Defaults to "verified". */
  reviewStatus?: StateReviewStatus;
  /** Plain-English note shown on the /xx banner when under_review. */
  reviewNote?: string;
  /** Calculation-model family (hue on the map). */
  modelKey: StateModel;
  /** Plain-English note on a recent correction; renders the corner flag (LA, GA). */
  correction?: string;
  /** Active verification flag; renders the diagonal hatch (AR, AL, FL). */
  verifyStatus?: "in_verification";
  /** Hybrid/edge cases that need a model confirmation (e.g. DC). */
  confirm?: boolean;
  /** Effective date of the state's current schedule (ISO YYYY-MM-DD). */
  scheduleEffectiveDate?: string;
}

export const TILE_COLS = 11;
export const TILE_ROWS = 8;

const MODEL_LABELS: Record<StateModel, string> = {
  income_shares: "Income shares",
  percentage: "Percentage of income",
  melson: "Melson formula",
};

/** Display label for a state's model. NY is "Percentage of combined income". */
export function modelLabel(s: StateEntry): string {
  if (s.code === "NY") return "Percentage of combined income";
  return MODEL_LABELS[s.modelKey];
}

export const STATES: StateEntry[] = [
  // Row 0
  { code: "AK", name: "Alaska", status: "planned", tile: [0, 0], modelKey: "percentage" },
  { code: "ME", name: "Maine", status: "planned", tile: [10, 0], modelKey: "income_shares" },

  // Row 1
  { code: "VT", name: "Vermont", status: "planned", tile: [9, 1], modelKey: "income_shares" },
  { code: "NH", name: "New Hampshire", status: "planned", tile: [10, 1], modelKey: "income_shares" },

  // Row 2
  { code: "WA", name: "Washington", status: "planned", tile: [0, 2], modelKey: "income_shares" },
  { code: "ID", name: "Idaho", status: "planned", tile: [1, 2], modelKey: "income_shares" },
  { code: "MT", name: "Montana", status: "planned", tile: [2, 2], modelKey: "melson" },
  { code: "ND", name: "North Dakota", status: "planned", tile: [3, 2], modelKey: "percentage" },
  { code: "MN", name: "Minnesota", status: "planned", tile: [4, 2], modelKey: "income_shares" },
  { code: "WI", name: "Wisconsin", status: "planned", tile: [5, 2], modelKey: "percentage" },
  { code: "MI", name: "Michigan", status: "planned", tile: [6, 2], modelKey: "income_shares" },
  { code: "NY", name: "New York", status: "planned", tile: [8, 2], modelKey: "percentage" },
  { code: "MA", name: "Massachusetts", status: "planned", tile: [9, 2], modelKey: "income_shares" },
  { code: "RI", name: "Rhode Island", status: "planned", tile: [10, 2], modelKey: "income_shares" },

  // Row 3
  { code: "OR", name: "Oregon", status: "planned", tile: [0, 3], modelKey: "income_shares" },
  { code: "NV", name: "Nevada", status: "planned", tile: [1, 3], modelKey: "percentage" },
  { code: "WY", name: "Wyoming", status: "planned", tile: [2, 3], modelKey: "income_shares" },
  { code: "SD", name: "South Dakota", status: "planned", tile: [3, 3], modelKey: "income_shares" },
  { code: "IA", name: "Iowa", status: "planned", tile: [4, 3], modelKey: "income_shares" },
  { code: "IL", name: "Illinois", status: "planned", tile: [5, 3], modelKey: "income_shares" },
  { code: "IN", name: "Indiana", status: "planned", tile: [6, 3], modelKey: "income_shares" },
  { code: "OH", name: "Ohio", status: "planned", tile: [7, 3], modelKey: "income_shares" },
  { code: "PA", name: "Pennsylvania", status: "planned", tile: [8, 3], modelKey: "income_shares" },
  { code: "NJ", name: "New Jersey", status: "planned", tile: [9, 3], modelKey: "income_shares" },
  { code: "CT", name: "Connecticut", status: "planned", tile: [10, 3], modelKey: "income_shares" },

  // Row 4
  { code: "CA", name: "California", status: "planned", tile: [0, 4], modelKey: "income_shares" },
  { code: "UT", name: "Utah", status: "planned", tile: [1, 4], modelKey: "income_shares" },
  { code: "CO", name: "Colorado", status: "planned", tile: [2, 4], modelKey: "income_shares" },
  { code: "NE", name: "Nebraska", status: "planned", tile: [3, 4], modelKey: "income_shares" },
  { code: "MO", name: "Missouri", status: "planned", tile: [4, 4], modelKey: "income_shares" },
  { code: "KY", name: "Kentucky", status: "planned", tile: [5, 4], modelKey: "income_shares" },
  { code: "WV", name: "West Virginia", status: "planned", tile: [6, 4], modelKey: "income_shares" },
  { code: "VA", name: "Virginia", status: "planned", tile: [7, 4], modelKey: "income_shares" },
  { code: "MD", name: "Maryland", status: "planned", tile: [8, 4], modelKey: "income_shares" },
  { code: "DE", name: "Delaware", status: "planned", tile: [9, 4], modelKey: "melson" },

  // Row 5
  { code: "AZ", name: "Arizona", status: "planned", tile: [1, 5], modelKey: "income_shares" },
  { code: "NM", name: "New Mexico", status: "planned", tile: [2, 5], modelKey: "income_shares" },
  { code: "KS", name: "Kansas", status: "planned", tile: [3, 5], modelKey: "income_shares" },
  {
    code: "AR",
    name: "Arkansas",
    model: "Income Shares Model",
    cite: "Ark. Sup. Ct. Admin. Order No. 10",
    status: "available",
    route: "/ar",
    tile: [4, 5],
    modelKey: "income_shares",
    verifyStatus: "in_verification",
    scheduleEffectiveDate: "2020-07-01",
  },
  {
    code: "TN",
    name: "Tennessee",
    model: "Income Shares Model",
    cite: "Tenn. Comp. R. & Regs. 1240-02-04",
    status: "available",
    route: "/tn",
    tile: [5, 5],
    modelKey: "income_shares",
    scheduleEffectiveDate: "2021-10-01",
  },
  { code: "NC", name: "North Carolina", status: "planned", tile: [6, 5], modelKey: "income_shares" },
  { code: "SC", name: "South Carolina", status: "planned", tile: [7, 5], modelKey: "income_shares" },

  // Row 6
  { code: "HI", name: "Hawaii", status: "planned", tile: [0, 6], modelKey: "melson" },
  { code: "OK", name: "Oklahoma", status: "planned", tile: [3, 6], modelKey: "income_shares" },
  {
    code: "LA",
    name: "Louisiana",
    model: "Income Shares Model",
    cite: "La. R.S. § 9:315 et seq.",
    status: "available",
    route: "/la",
    tile: [4, 6],
    modelKey: "income_shares",
    correction:
      "Updated to Louisiana's 2025 child-support schedule (we had been running the 2021 table).",
    scheduleEffectiveDate: "2025-01-01",
  },
  {
    code: "MS",
    name: "Mississippi",
    model: "Statutory percentage guideline",
    cite: "Miss. Code Ann. § 43-19-101",
    status: "available",
    route: "/ms",
    tile: [5, 6],
    modelKey: "percentage",
  },
  {
    code: "AL",
    name: "Alabama",
    model: "Income Shares Model",
    cite: "Ala. R. Jud. Admin. 32",
    status: "available",
    route: "/al",
    tile: [6, 6],
    modelKey: "income_shares",
    verifyStatus: "in_verification",
    scheduleEffectiveDate: "2022-05-01",
  },
  {
    code: "GA",
    name: "Georgia",
    model: "Income Shares Model",
    cite: "O.C.G.A. § 19-6-15",
    status: "available",
    route: "/ga",
    tile: [7, 6],
    modelKey: "income_shares",
    correction:
      "Corrected the parenting-time (Schedule C) calculation against Georgia's 2026 guidelines.",
    scheduleEffectiveDate: "2026-01-01",
  },

  // Row 7
  { code: "TX", name: "Texas", status: "planned", tile: [3, 7], modelKey: "percentage" },
  {
    code: "FL",
    name: "Florida",
    model: "Income Shares Model",
    cite: "Fla. Stat. § 61.30",
    status: "available",
    route: "/fl",
    tile: [8, 7],
    modelKey: "income_shares",
    verifyStatus: "in_verification",
    scheduleEffectiveDate: "2023-07-01",
  },
];

export const GITHUB_ISSUES_URL = "https://github.com/tcbmem-png/csg_tcblaw/issues";

export function getStateByCode(code: string): StateEntry | undefined {
  const upper = code.toUpperCase();
  return STATES.find((s) => s.code === upper);
}

export function getStateByRoute(route: string): StateEntry | undefined {
  return STATES.find((s) => s.route === route);
}

/**
 * Detect the active state from a pathname. Matches /xx and /xx/anything,
 * for any state in the registry that has a route.
 */
export function detectState(pathname: string): StateEntry | null {
  const match = pathname.match(/^\/([a-zA-Z]{2})(?:\/|$)/);
  if (!match) return null;
  const candidate = `/${match[1].toLowerCase()}`;
  return getStateByRoute(candidate) ?? null;
}

export interface StateSitemapEntry {
  path: string;
  priority: string;
}

/**
 * Sitemap entries derived from available states. Sub-paths like
 * /tn/how-it-works are NOT registry-driven — they stay in the sitemap file.
 */
export const STATE_SITEMAP_ENTRIES: StateSitemapEntry[] = STATES.filter(
  (s) => s.status === "available" && s.route,
).map((s) => ({ path: s.route!, priority: "0.9" }));
