import type { CalcInputs } from "./types";
import { defaultInputs } from "./calc";

export interface ChildEntry {
  name: string;
  /** Free-form date of birth; printed verbatim on the AOC form. */
  dob: string;
  /** Days/year with Parent A. Independent of which parent is the Mother. */
  daysWithA: number;
  daysWithB: number;
}

export type ParentRole = "mother" | "father" | null;

export interface CaseCaption {
  matterName: string;
  docketNumber: string;
  court: string;
  preparedBy: string;
  client: string;
  /** Which calculator parent fills the AOC's "Mother" row. Required before AOC export.
   *  Paired with parentBRole: setting one forces the other to the opposite. */
  parentARole: ParentRole;
  parentBRole: ParentRole;
  /** Per-child entries for the AOC Part I sub-table. Length is synced to inputs.numChildren.
   *  Days seed from the parenting plan; user can override per child for AOC display only
   *  (does NOT change the math — engine still uses parent-level totals). */
  children: ChildEntry[];
  /** Optional override of the auto-composed Part VI narrative. When non-empty,
   *  takes precedence over the composed text. Also receives back-compat imports
   *  of legacy v1/v2 `comments` + `deviationNarrative` fields. */
  narrativeOverride: string;
}

export function defaultCaption(): CaseCaption {
  return {
    matterName: "",
    docketNumber: "",
    court: "",
    preparedBy: "",
    client: "",
    parentARole: null,
    parentBRole: null,
    children: [],
    narrativeOverride: "",
  };
}

export function defaultChildEntry(): ChildEntry {
  return { name: "", dob: "", daysWithA: 0, daysWithB: 0 };
}

/** Paired role setter: setting one parent's role forces the other to the opposite. */
export function setParentRole(
  caption: CaseCaption,
  parent: "A" | "B",
  role: Exclude<ParentRole, null>,
): CaseCaption {
  const opposite: Exclude<ParentRole, null> = role === "mother" ? "father" : "mother";
  if (parent === "A") {
    return { ...caption, parentARole: role, parentBRole: opposite };
  }
  return { ...caption, parentARole: opposite, parentBRole: role };
}

// --- Share payload versions -------------------------------------------------
//
// v1, v2 — legacy. Carried `comments` and `deviationNarrative` on CaseCaption.
// v3      — current. Drops both fields in favour of per-toggle reasons on
//           CalcInputs (privateSchoolReason / specialExpensesReason) plus an
//           optional narrativeOverride for the rare "I want to write my own"
//           case. Reader still understands v1/v2 and folds legacy free-text
//           into narrativeOverride so existing shared URLs render the same PDF.

interface LegacyCaption {
  matterName?: string;
  docketNumber?: string;
  court?: string;
  preparedBy?: string;
  client?: string;
  comments?: string;
  parentARole?: "mother" | "father";
  parentBRole?: "mother" | "father";
  children?: ChildEntry[];
  deviationNarrative?: string;
  narrativeOverride?: string;
}

interface SharePayloadLegacy {
  v: 1 | 2;
  i: CalcInputs;
  c: LegacyCaption;
}
interface SharePayloadV3 {
  v: 3;
  i: CalcInputs;
  c: CaseCaption;
}
type SharePayload = SharePayloadLegacy | SharePayloadV3;

/** URL-safe base64. */
function b64urlEncode(s: string): string {
  // btoa handles latin-1; encodeURIComponent first to be UTF-8 safe.
  const b = btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(b)));
}

export function encodeShare(inputs: CalcInputs, caption: CaseCaption): string {
  const payload: SharePayloadV3 = { v: 3, i: inputs, c: caption };
  return b64urlEncode(JSON.stringify(payload));
}

export function decodeShare(
  s: string,
): { inputs: CalcInputs; caption: CaseCaption } | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as Partial<SharePayload>;
    if (!parsed || ![1, 2, 3].includes(parsed.v as number) || !parsed.i) {
      return null;
    }
    const inputs: CalcInputs = { ...defaultInputs(), ...parsed.i };

    const rawCap = (parsed.c ?? {}) as LegacyCaption;
    // Derive paired roles. v1/v2 only stored parentARole; infer B as opposite.
    let aRole: ParentRole = rawCap.parentARole ?? null;
    let bRole: ParentRole = rawCap.parentBRole ?? null;
    if (aRole && !bRole) bRole = aRole === "mother" ? "father" : "mother";
    if (bRole && !aRole) aRole = bRole === "mother" ? "father" : "mother";

    // Back-compat: fold legacy comments + deviationNarrative into a single
    // narrativeOverride. The new UI auto-composes Part VI from per-toggle
    // reasons; an explicit override beats the composer.
    const legacyParts = [
      rawCap.narrativeOverride ?? "",
      rawCap.deviationNarrative ?? "",
      rawCap.comments ?? "",
    ]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const narrativeOverride = legacyParts.join("\n\n");

    const caption: CaseCaption = {
      ...defaultCaption(),
      matterName: rawCap.matterName ?? "",
      docketNumber: rawCap.docketNumber ?? "",
      court: rawCap.court ?? "",
      preparedBy: rawCap.preparedBy ?? "",
      client: rawCap.client ?? "",
      parentARole: aRole,
      parentBRole: bRole,
      children: rawCap.children ?? [],
      narrativeOverride,
    };
    return { inputs, caption };
  } catch {
    return null;
  }
}

/**
 * Compose the Part VI deviation narrative from per-toggle reasons.
 * When `caption.narrativeOverride` is non-empty, it takes precedence.
 */
export function composeDeviationNarrative(
  inputs: CalcInputs,
  caption: CaseCaption,
): string {
  if (caption.narrativeOverride && caption.narrativeOverride.trim().length > 0) {
    return caption.narrativeOverride.trim();
  }
  const parts: string[] = [];
  if (inputs.includePrivateSchool && inputs.privateSchoolReason.trim()) {
    parts.push(
      `Private school tuition deviation per Rule .07(2)(d): ${inputs.privateSchoolReason.trim()}`,
    );
  }
  if (inputs.includeSpecialExpenses && inputs.specialExpensesReason.trim()) {
    parts.push(
      `Special expenses deviation per Rule .07(2)(d): ${inputs.specialExpensesReason.trim()}`,
    );
  }
  return parts.join(" ");
}
