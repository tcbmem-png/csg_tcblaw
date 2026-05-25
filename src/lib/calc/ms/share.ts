import type {
  MSInputs,
  MSDeviation,
  HandoffState,
  HandoffSide,
} from "./types";
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

/** Canonical position-to-letter mapping (a..j). */
const CANONICAL_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;

/**
 * True when the incoming deviation entry is structurally consistent with
 * the canonical letter for its position. Pre-fix MS share URLs encoded
 * (g)/(h)/(i) with the wrong structured shapes; we detect the mismatch
 * and reset just those slots.
 */
function deviationMatchesLetter(d: unknown, expectedLetter: string): boolean {
  if (!d || typeof d !== "object") return false;
  const dev = d as { letter?: string; structured?: { letter?: string } };
  if (dev.letter !== expectedLetter) return false;
  if (!dev.structured) return true;
  return dev.structured.letter === expectedLetter;
}

function migrateSlate(
  incoming: unknown[],
  base: MSInputs["deviationsA"],
): MSInputs["deviationsA"] {
  if (incoming.length !== 10) return base;
  return base.map((defaultEntry, idx) => {
    const expected = CANONICAL_LETTERS[idx];
    const candidate = incoming[idx];
    if (deviationMatchesLetter(candidate, expected)) {
      return candidate as MSInputs["deviationsA"][number];
    }
    return defaultEntry;
  });
}

export interface MSDecoded {
  inputs: MSInputs;
  caption: CaseCaption;
  handoff: HandoffState;
}

export function decodeMSShare(s: string): MSDecoded | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as Partial<MSSharePayloadV3> & {
      v?: number;
      i?: Partial<MSInputs> & { deviations?: unknown };
      h?: Partial<HandoffState>;
    };
    if (parsed.s !== "MS" || !parsed.i) return null;
    const base = defaultMSInputs();

    if (parsed.v !== 2 && parsed.v !== 3) {
      if (typeof console !== "undefined") {
        console.warn(
          "MS share URL is from an older schema; deviation slate reset to defaults.",
        );
      }
    }

    const incomingDevA = Array.isArray(parsed.i.deviationsA)
      ? parsed.i.deviationsA
      : null;
    const incomingDevB = Array.isArray(parsed.i.deviationsB)
      ? parsed.i.deviationsB
      : null;

    const migratedA = incomingDevA
      ? migrateSlate(incomingDevA, base.deviationsA)
      : base.deviationsA;
    const migratedB = incomingDevB
      ? migrateSlate(incomingDevB, base.deviationsA)
      : undefined;

    const inputs: MSInputs = {
      ...base,
      ...parsed.i,
      deviationsA: migratedA,
      deviationsB: migratedB,
      incarceration: { ...base.incarceration, ...(parsed.i.incarceration ?? {}) },
      imputationBasis: {
        ...base.imputationBasis,
        ...(parsed.i.imputationBasis ?? {}),
      },
      childAges: Array.isArray(parsed.i.childAges)
        ? (parsed.i.childAges as number[]).filter((n) => Number.isFinite(n))
        : base.childAges,
    };
    delete (inputs as unknown as { deviations?: unknown }).deviations;
    delete (inputs as unknown as { positionALabel?: unknown }).positionALabel;
    delete (inputs as unknown as { positionBLabel?: unknown }).positionBLabel;

    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };

    // v2 → v3 upgrade: synthesize a "none" handoff.
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
// At URL-generation time the originator writes a random 16-byte hex
// token into localStorage keyed by the share payload hash (sans handoff
// + sans side). On landing, if the local token matches we know this
// browser generated the URL. Cross-browser → silent.
//
// Token GC: deferred (tokens are ~40 bytes each, accumulation is slow).
// A future maintainer can prune entries older than N days if quota
// pressure ever materializes.
// =================================================================

const ORIGIN_STORAGE_KEY = "ms.handoff.origins";

async function sha256Hex(s: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback for older runtimes / unit tests without WebCrypto.
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
  // Hash inputs+caption only — handoff state is volatile and would
  // change the fingerprint as the receiving side edits.
  return JSON.stringify({ i: inputs, c: caption });
}

export async function fingerprintShare(
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<string> {
  return sha256Hex(payloadFingerprintInput(inputs, caption));
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

function randomToken(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32);
}

export async function recordOriginatedHandoff(
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<void> {
  const key = await fingerprintShare(inputs, caption);
  const store = readOriginStore();
  if (!store[key]) {
    store[key] = randomToken();
    writeOriginStore(store);
  }
}

export async function isOriginatorBrowser(
  inputs: MSInputs,
  caption: CaseCaption,
): Promise<boolean> {
  const key = await fingerprintShare(inputs, caption);
  const store = readOriginStore();
  return Boolean(store[key]);
}
