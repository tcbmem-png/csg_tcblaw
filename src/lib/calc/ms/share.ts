import type { MSInputs } from "./types";
import { defaultMSInputs } from "./calc";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";

interface MSSharePayloadV2 {
  v: 2;
  s: "MS";
  i: MSInputs;
  c: CaseCaption;
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

export function encodeMSShare(inputs: MSInputs, caption: CaseCaption): string {
  const payload: MSSharePayloadV2 = { v: 2, s: "MS", i: inputs, c: caption };
  return b64urlEncode(JSON.stringify(payload));
}

/** Canonical position-to-letter mapping (a..j). */
const CANONICAL_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;

/**
 * Returns true when an incoming deviation entry is structurally consistent
 * with the canonical letter for its position. Pre-fix MS share URLs encoded
 * (g)/(h)/(i) with the wrong structured shapes (parental/assets/childcare
 * were mis-assigned). We detect that mismatch and reset just those slots
 * rather than crash or render mislabelled data.
 */
function deviationMatchesLetter(d: unknown, expectedLetter: string): boolean {
  if (!d || typeof d !== "object") return false;
  const dev = d as { letter?: string; structured?: { letter?: string } };
  if (dev.letter !== expectedLetter) return false;
  // If no structured payload, the bare entry is letter-agnostic — keep it.
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
    // Slot mismatched — reset to defaults (consistent with v1→v2 precedent).
    return defaultEntry;
  });
}

export function decodeMSShare(
  s: string,
): { inputs: MSInputs; caption: CaseCaption } | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as Partial<MSSharePayloadV2> & {
      v?: number;
      i?: Partial<MSInputs> & { deviations?: unknown };
    };
    if (parsed.s !== "MS" || !parsed.i) return null;
    const base = defaultMSInputs();

    // v1 → v2: prior schema used `deviations`; that field is dropped. We keep
    // the rest of the inputs (parties, AGI, health) and rebuild defaults for
    // everything new. Per project decision: no shim for the deviation slate.
    if (parsed.v !== 2) {
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

    // Per § 43-19-103 letter-mapping bugfix: pre-fix URLs may encode (g)/(h)/(i)
    // slots with the wrong structured shape. migrateSlate detects per-slot
    // mismatch and resets only the affected slots.
    const migratedA = incomingDevA
      ? migrateSlate(incomingDevA, base.deviationsA)
      : base.deviationsA;
    const migratedB = incomingDevB
      ? migrateSlate(incomingDevB, base.deviationsA)
      : undefined;

    const inputs: MSInputs = {
      ...base,
      ...parsed.i,
      // Defensive: drop any v1 `deviations` field that snuck through ...spread.
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
    // Strip stray v1/legacy fields that snuck through ...spread.
    delete (inputs as unknown as { deviations?: unknown }).deviations;
    delete (inputs as unknown as { positionALabel?: unknown }).positionALabel;
    delete (inputs as unknown as { positionBLabel?: unknown }).positionBLabel;

    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };
    return { inputs, caption };
  } catch {
    return null;
  }
}
