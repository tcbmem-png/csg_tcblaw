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
  encodeMSShare,
  decodeMSShare,
  randomToken,
} from "../share";
import { defaultMSInputs } from "../calc";
import { defaultCaption } from "@/lib/calc/share";
import { defaultHandoffState } from "../types";
import type { HandoffState } from "../types";

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

  it("randomToken returns 16-byte / 32-hex tokens", () => {
    const t = randomToken(16);
    expect(t).toMatch(/^[0-9a-f]{32}$/);
    expect(t).not.toBe(randomToken(16));
  });

  it("full round-trip: originator → receiver edits → originator still recognized as origin", async () => {
    // 1. Originator mints caseId, builds payload, records origination.
    const caseId = randomToken(16);
    const caption = defaultCaption();
    const originalInputs = defaultMSInputs();
    const originatorHandoff: HandoffState = {
      ...defaultHandoffState(),
      status: "originated",
      originatingSide: "A",
      originatingAttorney: { name: "Jane Doe", firm: "Doe & Co." },
      createdAt: "2026-05-20T12:00:00.000Z",
      caseId,
    };
    await recordOriginatedHandoff(caseId, originalInputs, caption);
    const sentUrl = encodeMSShare(originalInputs, caption, originatorHandoff);

    // 2. Receiver decodes, mutates the slate, re-encodes with the SAME caseId.
    const received = decodeMSShare(sentUrl);
    expect(received).not.toBeNull();
    expect(received!.handoff.caseId).toBe(caseId);

    const mutatedInputs = {
      ...received!.inputs,
      numChildren: 4,
      obligorAnnualGross: 88000,
    };
    const receiverHandoff: HandoffState = {
      ...received!.handoff,
      status: "in_progress",
      receivingAttorney: { name: "John Roe", firm: "Roe LLP" },
      lastReceivingEditAt: "2026-05-22T15:30:00.000Z",
    };
    const returnedUrl = encodeMSShare(mutatedInputs, caption, receiverHandoff);

    // 3. Originator opens the returned URL — caseId preserved, content changed.
    const reopened = decodeMSShare(returnedUrl);
    expect(reopened).not.toBeNull();
    expect(reopened!.handoff.caseId).toBe(caseId);
    expect(reopened!.inputs.numChildren).toBe(4);
    expect(reopened!.inputs.obligorAnnualGross).toBe(88000);

    // 4. Originator's browser still recognizes the case as their own,
    //    even though inputs (and therefore the fingerprint) changed.
    const isOrigin = await isOriginatorBrowser(
      reopened!.handoff.caseId,
      reopened!.inputs,
      caption,
    );
    expect(isOrigin).toBe(true);
  });
});
