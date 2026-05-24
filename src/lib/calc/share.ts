import type { CalcInputs } from "./types";
import { defaultInputs } from "./calc";

export interface CaseCaption {
  matterName: string;
  docketNumber: string;
  court: string;
  preparedBy: string;
  client: string;
}

export function defaultCaption(): CaseCaption {
  return {
    matterName: "",
    docketNumber: "",
    court: "",
    preparedBy: "",
    client: "",
  };
}

interface SharePayload {
  v: 1;
  i: CalcInputs;
  c: CaseCaption;
}

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
  const payload: SharePayload = { v: 1, i: inputs, c: caption };
  return b64urlEncode(JSON.stringify(payload));
}

export function decodeShare(
  s: string,
): { inputs: CalcInputs; caption: CaseCaption } | null {
  try {
    const parsed = JSON.parse(b64urlDecode(s)) as Partial<SharePayload>;
    if (parsed.v !== 1 || !parsed.i) return null;
    // Merge with defaults to tolerate older payloads missing newer fields.
    const inputs: CalcInputs = { ...defaultInputs(), ...parsed.i };
    const caption: CaseCaption = { ...defaultCaption(), ...(parsed.c ?? {}) };
    return { inputs, caption };
  } catch {
    return null;
  }
}
