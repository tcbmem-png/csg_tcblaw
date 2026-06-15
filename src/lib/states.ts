// Single source of truth for the 50-state registry that drives the homepage
// tile-grid map, the text list, the header's active-state detection, and the
// sitemap. Flipping a state from "planned" -> "coming_soon" -> "available"
// here updates every surface.

export type StateStatus = "available" | "coming_soon" | "planned";

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
}

export const TILE_COLS = 11;
export const TILE_ROWS = 8;

export const STATES: StateEntry[] = [
  // Row 0
  { code: "AK", name: "Alaska", status: "planned", tile: [0, 0] },
  { code: "ME", name: "Maine", status: "planned", tile: [10, 0] },

  // Row 1
  { code: "VT", name: "Vermont", status: "planned", tile: [9, 1] },
  { code: "NH", name: "New Hampshire", status: "planned", tile: [10, 1] },

  // Row 2
  { code: "WA", name: "Washington", status: "planned", tile: [0, 2] },
  { code: "ID", name: "Idaho", status: "planned", tile: [1, 2] },
  { code: "MT", name: "Montana", status: "planned", tile: [2, 2] },
  { code: "ND", name: "North Dakota", status: "planned", tile: [3, 2] },
  { code: "MN", name: "Minnesota", status: "planned", tile: [4, 2] },
  { code: "WI", name: "Wisconsin", status: "planned", tile: [5, 2] },
  { code: "MI", name: "Michigan", status: "planned", tile: [6, 2] },
  { code: "NY", name: "New York", status: "planned", tile: [8, 2] },
  { code: "MA", name: "Massachusetts", status: "planned", tile: [9, 2] },
  { code: "RI", name: "Rhode Island", status: "planned", tile: [10, 2] },

  // Row 3
  { code: "OR", name: "Oregon", status: "planned", tile: [0, 3] },
  { code: "NV", name: "Nevada", status: "planned", tile: [1, 3] },
  { code: "WY", name: "Wyoming", status: "planned", tile: [2, 3] },
  { code: "SD", name: "South Dakota", status: "planned", tile: [3, 3] },
  { code: "IA", name: "Iowa", status: "planned", tile: [4, 3] },
  { code: "IL", name: "Illinois", status: "planned", tile: [5, 3] },
  { code: "IN", name: "Indiana", status: "planned", tile: [6, 3] },
  { code: "OH", name: "Ohio", status: "planned", tile: [7, 3] },
  { code: "PA", name: "Pennsylvania", status: "planned", tile: [8, 3] },
  { code: "NJ", name: "New Jersey", status: "planned", tile: [9, 3] },
  { code: "CT", name: "Connecticut", status: "planned", tile: [10, 3] },

  // Row 4
  { code: "CA", name: "California", status: "planned", tile: [0, 4] },
  { code: "UT", name: "Utah", status: "planned", tile: [1, 4] },
  { code: "CO", name: "Colorado", status: "planned", tile: [2, 4] },
  { code: "NE", name: "Nebraska", status: "planned", tile: [3, 4] },
  { code: "MO", name: "Missouri", status: "planned", tile: [4, 4] },
  { code: "KY", name: "Kentucky", status: "planned", tile: [5, 4] },
  { code: "WV", name: "West Virginia", status: "planned", tile: [6, 4] },
  { code: "VA", name: "Virginia", status: "planned", tile: [7, 4] },
  { code: "MD", name: "Maryland", status: "planned", tile: [8, 4] },
  { code: "DE", name: "Delaware", status: "planned", tile: [9, 4] },

  // Row 5
  { code: "AZ", name: "Arizona", status: "planned", tile: [1, 5] },
  { code: "NM", name: "New Mexico", status: "planned", tile: [2, 5] },
  { code: "KS", name: "Kansas", status: "planned", tile: [3, 5] },
  {
    code: "AR",
    name: "Arkansas",
    model: "Income Shares Model",
    cite: "Ark. Sup. Ct. Admin. Order No. 10",
    status: "available",
    route: "/ar",
    tile: [4, 5],
  },
  {
    code: "TN",
    name: "Tennessee",
    model: "Income Shares Model",
    cite: "Tenn. Comp. R. & Regs. 1240-02-04",
    status: "available",
    route: "/tn",
    tile: [5, 5],
  },
  { code: "NC", name: "North Carolina", status: "planned", tile: [6, 5] },
  { code: "SC", name: "South Carolina", status: "planned", tile: [7, 5] },

  // Row 6
  { code: "HI", name: "Hawaii", status: "planned", tile: [0, 6] },
  { code: "OK", name: "Oklahoma", status: "planned", tile: [3, 6] },
  {
    code: "LA",
    name: "Louisiana",
    model: "Income Shares Model",
    cite: "La. R.S. § 9:315 et seq.",
    status: "available",
    route: "/la",
    tile: [4, 6],
  },
  {
    code: "MS",
    name: "Mississippi",
    model: "Statutory percentage guideline",
    cite: "Miss. Code Ann. § 43-19-101",
    status: "available",
    route: "/ms",
    tile: [5, 6],
  },
  {
    code: "AL",
    name: "Alabama",
    model: "Income Shares Model",
    cite: "Ala. R. Jud. Admin. 32",
    status: "available",
    route: "/al",
    tile: [6, 6],
  },
  {
    code: "GA",
    name: "Georgia",
    model: "Income Shares Model",
    cite: "O.C.G.A. § 19-6-15",
    status: "available",
    route: "/ga",
    tile: [7, 6],
  },

  // Row 7
  { code: "TX", name: "Texas", status: "planned", tile: [3, 7] },
  {
    code: "FL",
    name: "Florida",
    model: "Income Shares Model",
    cite: "Fla. Stat. § 61.30",
    status: "available",
    route: "/fl",
    tile: [8, 7],
  },
];

export const GITHUB_ISSUES_URL =
  "https://github.com/tcbmem-png/csg_tcblaw/issues";

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
