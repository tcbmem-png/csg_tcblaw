import type {
  MSInputs,
  MSDeviation,
  MSPartyEntry,
  HandoffState,
  HandoffSide,
  HandoffAttorney,
} from "./types";
import { defaultMSChild } from "./types";
import { defaultMSInputs } from "./calc";
import { defaultHandoffState } from "./types";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";

// =================================================================
// Share payload versions
//   v2 — pre-handoff (inputs + caption only)
//   v3 — adds HandoffState as `h`
// v2 URLs round-trip cleanly through the v3 decoder with
// handoff.status === "none".
// =================================================================

interface MSSharePayloadV2 {
  v: 2;
  s: "MS";
  i: MSInputs;
  c: CaseCaption;
}

interface MSSharePayloadV3 {
  v: 3;
  s: "MS";
  i: MSInputs;
  c: CaseCaption;
  h: HandoffState;
}

function b64urlEncode(s: string): string {
  const b = btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(b)));
}

export function encodeMSShare(
  inputs: MSInputs,
  caption: CaseCaption,
  handoff: HandoffState = defaultHandoffState(),
): string {
  const payload: MSSharePayloadV3 = {
    v: 3,
    s: "MS",
    i: inputs,
    c: caption,
    h: handoff,
  };
  return b64urlEncode(JSON.stringify(payload));
}

export interface MSDecoded {
  inputs: MSInputs;
  caption: CaseCaption;
  handoff: HandoffState;
}

export function decodeMSShare(s: string): MSDecoded | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as {
      v?: number;
      s?: string;
      i?: Partial<MSInputs> & {
        deviations?: unknown;
        positionALabel?: unknown;
        positionBLabel?: unknown;
      };
      c?: Partial<CaseCaption>;
      h?: Partial<HandoffState>;
    };
    if (parsed.s !== "MS" || !parsed.i) return null;
    const base = defaultMSInputs();

    const version = parsed.v;
    if (version !== 2 && version !== 3) {
      if (typeof console !== "undefined") {
        console.warn(
          "MS share URL is from an older schema; deviation slate reset to defaults.",
        );
      }
    }

    // v2 URLs are pass-through: the statute-correct letter mapping has been
    // in force since v5, and v2 payloads already encode (g)/(h)/(i) in that
    // canonical order. No per-slot reset is performed — doing so would
    // destroy valid practitioner data on every re-opened pre-handoff URL.
    const incomingDevA = Array.isArray(parsed.i.deviationsA)
      ? (parsed.i.deviationsA as MSInputs["deviationsA"])
      : null;
    const incomingDevB = Array.isArray(parsed.i.deviationsB)
      ? (parsed.i.deviationsB as MSInputs["deviationsA"])
      : null;

    // Legacy label migration: positionALabel / positionBLabel were removed
    // from MSInputs but older v2/v3 URLs may still encode them. Preserve a
    // practitioner-customized value (anything other than the old default
    // "Position A" / "Position B") into the current obligor/obligee slots
    // when the current field isn't already set. This is data-preserving;
    // it never overwrites a value the user already has in the new shape.
    const legacyA =
      typeof parsed.i.positionALabel === "string" ? parsed.i.positionALabel : "";
    const legacyB =
      typeof parsed.i.positionBLabel === "string" ? parsed.i.positionBLabel : "";
    const resolvedObligor =
      typeof parsed.i.obligorLabel === "string" && parsed.i.obligorLabel
        ? parsed.i.obligorLabel
        : legacyA && legacyA !== "Position A"
          ? legacyA
          : base.obligorLabel;
    const resolvedObligee =
      typeof parsed.i.obligeeLabel === "string" && parsed.i.obligeeLabel
        ? parsed.i.obligeeLabel
        : legacyB && legacyB !== "Position B"
          ? legacyB
          : base.obligeeLabel;

    const inputs: MSInputs = {
      ...base,
      ...parsed.i,
      obligorLabel: resolvedObligor,
      obligeeLabel: resolvedObligee,
      deviationsA: incomingDevA ?? base.deviationsA,
      deviationsB: incomingDevB ?? undefined,
      incarceration: { ...base.incarceration, ...(parsed.i.incarceration ?? {}) },
      imputationBasis: {
        ...base.imputationBasis,
        ...(parsed.i.imputationBasis ?? {}),
      },
      childAges: Array.isArray(parsed.i.childAges)
        ? (parsed.i.childAges as number[]).filter((n) => Number.isFinite(n))
        : base.childAges,
      children: Array.isArray((parsed.i as { children?: unknown }).children)
        ? ((parsed.i as { children?: MSInputs["children"] }).children ?? [])
        : undefined,
    };
    delete (inputs as unknown as { deviations?: unknown }).deviations;
    delete (inputs as unknown as { positionALabel?: unknown }).positionALabel;
    delete (inputs as unknown as { positionBLabel?: unknown }).positionBLabel;

    // §1.6 back-compat: synthesize a default children roster from childAges
    // when no structured roster is present. Status defaults to "none".
    if ((!inputs.children || inputs.children.length === 0) && inputs.childAges.length > 0) {
      inputs.children = inputs.childAges.map((age) => defaultMSChild(age));
    }

    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };

    // v2 → v3 upgrade: synthesize a "none" handoff. handoffRound defaults to 0
    // on any payload predating §1.5 attribution.
    const handoff: HandoffState = parsed.h
      ? { ...defaultHandoffState(), ...parsed.h }
      : defaultHandoffState();

    return { inputs, caption, handoff };
  } catch {
    return null;
  }
}

// =================================================================
// ?side= transport
// =================================================================

export function parseSideParam(v: string | null | undefined): HandoffSide | null {
  if (v === "A" || v === "B") return v;
  return null;
}

export function otherSide(s: HandoffSide): HandoffSide {
  return s === "A" ? "B" : "A";
}

// =================================================================
// Scrubbing transform — applied at handoff URL generation time, when
// the originator opts in (default ON in the share dialog). Zeros the
// opposite slate's monetary proposals and clears its narrative fields
// so the receiving attorney starts from a blank slate. The originator's
// own slate is preserved verbatim.
// =================================================================

function blankDeviation(d: MSDeviation): MSDeviation {
  const cleared: MSDeviation = {
    ...d,
    applicable: false,
    description: "",
    proposedMonthly: 0,
  };
  if (cleared.party) {
    cleared.party = {
      position: "",
      factsAsserted: "",
      documentationReferenced: "",
      proposedMonthly: 0,
      legalAuthority: "",
    };
  }
  return cleared;
}

/**
 * Returns a copy of `inputs` where the slate OPPOSITE `originatingSide`
 * has been scrubbed. The originator's own slate is untouched. Used at
 * URL-generation time only.
 */
export function scrubOppositeSlate(
  inputs: MSInputs,
  originatingSide: HandoffSide,
): MSInputs {
  const next: MSInputs = { ...inputs };
  if (originatingSide === "A") {
    // Receiving will fill slate B — scrub B (or ensure B starts blank).
    if (next.deviationsB) {
      next.deviationsB = next.deviationsB.map(blankDeviation);
    }
  } else {
    next.deviationsA = next.deviationsA.map(blankDeviation);
  }
  return next;
}

// =================================================================
// C2 — originator-opens-their-own-handoff detection
//
// PRIMARY KEY: HandoffState.caseId (16-byte / 128-bit hex token minted
//   once at first Send and preserved across re-generates and round-trips).
//   localStorage shape: { [caseId]: token16hex }.
//
// LEGACY FALLBACK: pre-caseId URLs hash fingerprint(inputs+caption) into
//   the same map. This was the original mechanism; it fails on round-trip
//   because receiving-side edits change the fingerprint. Kept for back-
//   compat only; new shares always carry a caseId.
// =================================================================

const ORIGIN_STORAGE_KEY = "ms.handoff.origins";

async function sha256Hex(s: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return ("0000000" + (h >>> 0).toString(16)).slice(-8);
  }
  const bytes = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function payloadFingerprintInput(
  inputs: MSInputs,
  caption: CaseCaption,
): string {
  return JSON.stringify({ i: inputs, c: caption });
}

export async function fingerprintShare(
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<string> {
  return sha256Hex(payloadFingerprintInput(inputs, caption));
}

/**
 * Cheap synchronous hash for share-state divergence checks. Not crypto-
 * grade; sufficient to compare two encoded `?s=` payloads for equality.
 */
export function shareStateHash(encoded: string): string {
  let h = 5381;
  for (let i = 0; i < encoded.length; i++) {
    h = ((h << 5) + h + encoded.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function readOriginStore(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(ORIGIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOriginStore(store: Record<string, string>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / privacy mode — silently ignore */
  }
}

/**
 * 16-byte / 128-bit hex token. Same entropy budget as the existing C2
 * origin token. Used for both caseId and per-origin tokens — do NOT
 * downsize without auditing every call site.
 */
export function randomToken(bytes = 16): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(16).slice(2).padEnd(bytes * 2, "0").slice(0, bytes * 2);
}

async function resolveOriginKey(
  caseId: string | null,
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<string> {
  if (caseId) return `case:${caseId}`;
  // Legacy fingerprint fallback for pre-caseId URLs.
  return `fp:${await fingerprintShare(inputs, caption)}`;
}

export async function recordOriginatedHandoff(
  caseId: string | null,
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<void> {
  const key = await resolveOriginKey(caseId, inputs, caption);
  const store = readOriginStore();
  if (!store[key]) {
    store[key] = randomToken(16);
    writeOriginStore(store);
  }
}

export async function isOriginatorBrowser(
  caseId: string | null,
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<boolean> {
  const store = readOriginStore();
  if (caseId && store[`case:${caseId}`]) return true;
  // Fallback: legacy fingerprint key (for URLs minted before caseId).
  const fpKey = `fp:${await fingerprintShare(inputs, caption)}`;
  return Boolean(store[fpKey]);
}
