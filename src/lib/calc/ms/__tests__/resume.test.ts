/**
 * Save-and-resume probe (§1.10).
 *
 * Verifies the three-state contract of probeResume():
 *   - `none`      → no draft for this caseId
 *   - `resumable` → draft's baseShareHash equals the current URL's hash
 *   - `diverged`  → draft exists but the URL has changed since save
 *                   (originator sent a new revision; receiver must pick)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveReceivingDraft,
  loadReceivingDraft,
  clearReceivingDraft,
  probeResume,
} from "../resume";
import { defaultMSInputs } from "../calc";
import { defaultHandoffState } from "../types";

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

const CASE_ID = "feedfacefeedfacefeedfacefeedface";

function seedDraft(baseShareHash: string) {
  saveReceivingDraft(CASE_ID, {
    inputs: defaultMSInputs(),
    handoff: defaultHandoffState(),
    baseShareHash,
  });
}

describe("probeResume (§1.10 save-and-resume)", () => {
  it("returns 'none' when no draft exists", () => {
    expect(probeResume(CASE_ID, "anyhash").status).toBe("none");
  });

  it("returns 'none' when caseId is null", () => {
    seedDraft("hash1");
    expect(probeResume(null, "hash1").status).toBe("none");
  });

  it("returns 'resumable' when the current URL hash matches the draft", () => {
    seedDraft("hashAAA");
    const probe = probeResume(CASE_ID, "hashAAA");
    expect(probe.status).toBe("resumable");
    expect(probe.draft).not.toBeNull();
    expect(probe.draft!.baseShareHash).toBe("hashAAA");
  });

  it("returns 'diverged' when the URL hash differs from the draft", () => {
    seedDraft("hashOLD");
    const probe = probeResume(CASE_ID, "hashNEW");
    expect(probe.status).toBe("diverged");
    expect(probe.draft).not.toBeNull();
  });

  it("clearReceivingDraft removes the draft", () => {
    seedDraft("h");
    expect(loadReceivingDraft(CASE_ID)).not.toBeNull();
    clearReceivingDraft(CASE_ID);
    expect(loadReceivingDraft(CASE_ID)).toBeNull();
    expect(probeResume(CASE_ID, "h").status).toBe("none");
  });

  it("savedAt timestamp is set on save", () => {
    const before = Date.now();
    seedDraft("h");
    const draft = loadReceivingDraft(CASE_ID);
    expect(draft).not.toBeNull();
    const t = Date.parse(draft!.savedAt);
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("ignores malformed JSON in storage", () => {
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.setItem(
      "ms.handoff.draft." + CASE_ID,
      "{not valid json",
    );
    expect(loadReceivingDraft(CASE_ID)).toBeNull();
    expect(probeResume(CASE_ID, "h").status).toBe("none");
  });

  it("ignores payload missing required shape fields", () => {
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.setItem(
      "ms.handoff.draft." + CASE_ID,
      JSON.stringify({ savedAt: "x" }), // no baseShareHash / inputs / handoff
    );
    expect(loadReceivingDraft(CASE_ID)).toBeNull();
  });
});
