import type { MSInputs } from "./types";
import { defaultMSInputs } from "./calc";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";

interface MSSharePayload {
  v: 1;
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
  const payload: MSSharePayload = { v: 1, s: "MS", i: inputs, c: caption };
  return b64urlEncode(JSON.stringify(payload));
}

export function decodeMSShare(
  s: string,
): { inputs: MSInputs; caption: CaseCaption } | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as Partial<MSSharePayload>;
    if (parsed.v !== 1 || parsed.s !== "MS" || !parsed.i) return null;
    const base = defaultMSInputs();
    const inputs: MSInputs = {
      ...base,
      ...parsed.i,
      // Make sure deviations array is well-formed.
      deviations: Array.isArray(parsed.i.deviations) && parsed.i.deviations.length === 10
        ? (parsed.i.deviations as MSInputs["deviations"])
        : base.deviations,
    };
    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };
    return { inputs, caption };
  } catch {
    return null;
  }
}
