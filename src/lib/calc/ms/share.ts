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

    const inputs: MSInputs = {
      ...base,
      ...parsed.i,
      // Defensive: drop any v1 `deviations` field that snuck through ...spread.
      deviationsA:
        incomingDevA && incomingDevA.length === 10
          ? (incomingDevA as MSInputs["deviationsA"])
          : base.deviationsA,
      deviationsB:
        incomingDevB && incomingDevB.length === 10
          ? (incomingDevB as MSInputs["deviationsB"])
          : undefined,
      incarceration: { ...base.incarceration, ...(parsed.i.incarceration ?? {}) },
      imputationBasis: {
        ...base.imputationBasis,
        ...(parsed.i.imputationBasis ?? {}),
      },
    };
    // Strip stray v1 field if it ended up on the object via the spread above.
    delete (inputs as unknown as { deviations?: unknown }).deviations;

    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };
    return { inputs, caption };
  } catch {
    return null;
  }
}
