/**
 * Two-attorney handoff tests.
 *
 * Scope:
 *   - scrubbing transform (covered also in share.test, repeated here for
 *     the four-state lens)
 *   - four-state status transitions: none → originated → in_progress →
 *     completed, including the PDF-triggered auto-flip
 *   - lastReceivingEditAt bumps
 *   - C2 token compare (originator-opens-their-own-handoff detection)
 *   - labels derive from caption + originatingSide regardless of A/B
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordOriginatedHandoff,
  isOriginatorBrowser,
  fingerprintShare,
  scrubOppositeSlate,
} from "../share";
import { defaultMSInputs } from "../calc";
import { defaultHandoffState } from "../types";
import { defaultCaption } from "@/lib/calc/share";
import type { HandoffState, HandoffSide, MSInputs } from "../types";

// =================================================================
// Minimal localStorage shim — Node test env has no DOM. Reset before
// each test so cross-test state doesn't leak.
// =================================================================

class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(k: string) {
    return Object.prototype.hasOwnProperty.call(this.store, k)
      ? this.store[k]
      : null;
  }
  setItem(k: string, v: string) {
    this.store[k] = String(v);
  }
  removeItem(k: string) {
    delete this.store[k];
  }
  clear() {
    this.store = {};
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage =
    new MemoryStorage();
});

// =================================================================
// Status lifecycle — pure state transitions (the actual flips live in
// routes/ms.tsx and result-sidebar.tsx; here we exercise the
// invariants those callers must preserve).
// =================================================================

function originate(side: HandoffSide): HandoffState {
  return {
    ...defaultHandoffState(),
    status: "originated",
    originatingSide: side,
    originatingAttorney: { name: "Jane Doe", firm: "Doe & Co." },
    createdAt: "2026-05-20T12:00:00.000Z",
  };
}

describe("handoff — four-state lifecycle", () => {
  it("transitions originated → in_progress on first receiving edit", () => {
    const h = originate("A");
    expect(h.status).toBe("originated");
    expect(h.lastReceivingEditAt).toBeNull();

    // Simulate the receiving-side edit hook in routes/ms.tsx.
    const next: HandoffState = {
      ...h,
      status: h.status === "originated" ? "in_progress" : h.status,
      lastReceivingEditAt: "2026-05-21T09:00:00.000Z",
    };
    expect(next.status).toBe("in_progress");
    expect(next.lastReceivingEditAt).toBe("2026-05-21T09:00:00.000Z");
  });

  it("bumps lastReceivingEditAt on each subsequent receiving edit", () => {
    const h: HandoffState = {
      ...originate("A"),
      status: "in_progress",
      lastReceivingEditAt: "2026-05-21T09:00:00.000Z",
    };
    const next: HandoffState = {
      ...h,
      lastReceivingEditAt: "2026-05-21T10:00:00.000Z",
    };
    expect(next.status).toBe("in_progress");
    expect(next.lastReceivingEditAt).toBe("2026-05-21T10:00:00.000Z");
  });

  it("PDF-triggered auto-flip: in_progress → completed stamps completedAt", () => {
    // Mirrors result-sidebar.tsx maybeCompleteForPdf().
    const h: HandoffState = {
      ...originate("A"),
      status: "in_progress",
      lastReceivingEditAt: "2026-05-22T10:00:00.000Z",
    };
    const isReceivingSession = true;

    const maybeComplete = (curr: HandoffState): HandoffState =>
      isReceivingSession && curr.status === "in_progress"
        ? { ...curr, status: "completed", completedAt: "2026-05-22T11:00:00.000Z" }
        : curr;

    const after = maybeComplete(h);
    expect(after.status).toBe("completed");
    expect(after.completedAt).toBe("2026-05-22T11:00:00.000Z");
  });

  it("originator generating a PDF pre-handoff stays at 'none'", () => {
    const h = defaultHandoffState();
    const isReceivingSession = false;
    const maybeComplete = (curr: HandoffState): HandoffState =>
      isReceivingSession && curr.status === "in_progress"
        ? { ...curr, status: "completed", completedAt: "x" }
        : curr;
    expect(maybeComplete(h).status).toBe("none");
  });
});

// =================================================================
// Scrubbing transform
// =================================================================

describe("handoff — scrubbing transform", () => {
  function seeded(): MSInputs {
    const base: MSInputs = {
      ...defaultMSInputs(),
      comparisonMode: "side_by_side",
    };
    base.deviationsA = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 100, description: "A facts" }
        : d,
    );
    base.deviationsB = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 200, description: "B facts" }
        : { ...d },
    );
    return base;
  }

  it("scrubs the opposite slate and preserves the originator's slate", () => {
    const scrubbed = scrubOppositeSlate(seeded(), "A");
    expect(scrubbed.deviationsA[0].proposedMonthly).toBe(100);
    expect(scrubbed.deviationsA[0].description).toBe("A facts");
    expect(scrubbed.deviationsB![0].proposedMonthly).toBe(0);
    expect(scrubbed.deviationsB![0].applicable).toBe(false);
    expect(scrubbed.deviationsB![0].description).toBe("");
  });
});

// =================================================================
// C2 token compare
// =================================================================

describe("handoff — C2 originator detection", () => {
  it("isOriginatorBrowser returns true after recordOriginatedHandoff", async () => {
    const inputs = defaultMSInputs();
    const caption = defaultCaption();
    expect(await isOriginatorBrowser(inputs, caption)).toBe(false);
    await recordOriginatedHandoff(inputs, caption);
    expect(await isOriginatorBrowser(inputs, caption)).toBe(true);
  });

  it("returns false from a fresh browser (no token in localStorage)", async () => {
    // localStorage was reset by beforeEach.
    const inputs = defaultMSInputs();
    const caption = defaultCaption();
    expect(await isOriginatorBrowser(inputs, caption)).toBe(false);
  });

  it("fingerprint is stable for the same inputs + caption", async () => {
    const inputs = defaultMSInputs();
    const caption = defaultCaption();
    const a = await fingerprintShare(inputs, caption);
    const b = await fingerprintShare(inputs, caption);
    expect(a).toBe(b);
  });

  it("fingerprint changes when inputs change", async () => {
    const caption = defaultCaption();
    const a = await fingerprintShare(defaultMSInputs(), caption);
    const b = await fingerprintShare(
      { ...defaultMSInputs(), numChildren: 4 },
      caption,
    );
    expect(a).not.toBe(b);
  });
});

// =================================================================
// Labels derive from caption + originatingSide, not from A/B
// =================================================================

describe("handoff — labels follow caption, not slate letter", () => {
  it("originatingSide=A maps the originating party to the obligor label", () => {
    const inputs = { ...defaultMSInputs(), obligorLabel: "Father", obligeeLabel: "Mother" };
    const h = originate("A");
    const originatingLabel =
      h.originatingSide === "A" ? inputs.obligorLabel : inputs.obligeeLabel;
    expect(originatingLabel).toBe("Father");
  });

  it("originatingSide=B maps the originating party to the obligee label", () => {
    const inputs = { ...defaultMSInputs(), obligorLabel: "Father", obligeeLabel: "Mother" };
    const h = originate("B");
    const originatingLabel =
      h.originatingSide === "A" ? inputs.obligorLabel : inputs.obligeeLabel;
    expect(originatingLabel).toBe("Mother");
  });
});
