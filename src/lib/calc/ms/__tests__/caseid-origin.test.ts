/**
 * caseId-based origin detection survives content changes. The legacy
 * fingerprint check failed on round-trip because receiver edits mutate
 * `inputs` and therefore the fingerprint. caseId is stable across edits.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  isOriginatorBrowser,
  recordOriginatedHandoff,
  fingerprintShare,
} from "../share";
import { defaultMSInputs } from "../calc";
import { defaultCaption } from "@/lib/calc/share";

class MemoryStorage {
  private s: Record<string, string> = {};
  getItem(k: string) {
    return Object.prototype.hasOwnProperty.call(this.s, k) ? this.s[k] : null;
  }
  setItem(k: string, v: string) {
    this.s[k] = String(v);
  }
  removeItem(k: string) {
    delete this.s[k];
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage =
    new MemoryStorage();
});

describe("caseId origin detection", () => {
  it("survives receiver-side input mutation", async () => {
    const caseId = "deadbeefdeadbeefdeadbeefdeadbeef";
    const caption = defaultCaption();
    const original = defaultMSInputs();
    await recordOriginatedHandoff(caseId, original, caption);

    // Simulate the receiver editing the slate (would change fingerprint).
    const mutated = { ...original, numChildren: 4, obligorAnnualGross: 99000 };
    expect(await isOriginatorBrowser(caseId, mutated, caption)).toBe(true);

    // Fingerprints really did diverge — proves the test is meaningful.
    const fpA = await fingerprintShare(original, caption);
    const fpB = await fingerprintShare(mutated, caption);
    expect(fpA).not.toBe(fpB);
  });

  it("falls back to fingerprint when caseId is null (legacy URL)", async () => {
    const caption = defaultCaption();
    const inputs = defaultMSInputs();
    await recordOriginatedHandoff(null, inputs, caption);
    expect(await isOriginatorBrowser(null, inputs, caption)).toBe(true);
  });

  it("cross-browser returns false even with matching caseId when no token recorded", async () => {
    const caseId = "0".repeat(32);
    const caption = defaultCaption();
    expect(await isOriginatorBrowser(caseId, defaultMSInputs(), caption)).toBe(false);
  });
});
