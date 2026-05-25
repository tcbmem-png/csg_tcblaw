/**
 * Share encoding/decoding tests for v2 ↔ v3 compatibility and the handoff
 * payload.
 *
 * v2 URLs (pre-handoff) round-trip through the v3 decoder with
 * handoff.status === "none" and slates preserved verbatim — no per-slot
 * migration runs because the on-disk letter mapping (g/h/i) now matches
 * the 2024 § 43-19-103 statutory order. v3 URLs preserve the full
 * HandoffState. ?side= is a parser/normalizer only.
 */
import { describe, it, expect } from "vitest";
import {
  decodeMSShare,
  encodeMSShare,
  parseSideParam,
  otherSide,
  scrubOppositeSlate,
} from "../share";
import { defaultMSInputs } from "../calc";
import { defaultHandoffState } from "../types";
import { defaultCaption } from "@/lib/calc/share";
import type { HandoffState, MSInputs } from "../types";

// Tiny polyfill: vitest's node env has btoa/atob in Node 18+ but we still
// guard against missing globals in older runtimes.
function ensureB64() {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (s: string) =>
      Buffer.from(s, "binary").toString("base64");
  }
  if (typeof globalThis.atob === "undefined") {
    globalThis.atob = (s: string) =>
      Buffer.from(s, "base64").toString("binary");
  }
}
ensureB64();

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("MS share — v3 round-trip", () => {
  it("encodes and decodes inputs + caption + handoff verbatim", () => {
    const inputs = defaultMSInputs();
    inputs.numChildren = 3;
    inputs.obligorAnnualGross = 60000;
    inputs.deviationsA = inputs.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 250, description: "Orthodontia" }
        : d,
    );

    const caption = { ...defaultCaption(), matterName: "Smith v. Smith" };

    const handoff: HandoffState = {
      status: "in_progress",
      originatingSide: "A",
      originatingAttorney: { name: "Jane Doe", firm: "Doe & Co." },
      receivingAttorney: { name: "John Roe", firm: "Roe LLP" },
      createdAt: "2026-05-20T12:00:00.000Z",
      lastReceivingEditAt: "2026-05-22T15:30:00.000Z",
      completedAt: null,
    };

    const encoded = encodeMSShare(inputs, caption, handoff);
    const decoded = decodeMSShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.numChildren).toBe(3);
    expect(decoded!.inputs.obligorAnnualGross).toBe(60000);
    expect(decoded!.inputs.deviationsA[0].applicable).toBe(true);
    expect(decoded!.inputs.deviationsA[0].proposedMonthly).toBe(250);
    expect(decoded!.caption.matterName).toBe("Smith v. Smith");
    expect(decoded!.handoff).toEqual(handoff);
  });

  it("default handoff round-trips with status === 'none'", () => {
    const encoded = encodeMSShare(defaultMSInputs(), defaultCaption());
    const decoded = decodeMSShare(encoded);
    expect(decoded!.handoff.status).toBe("none");
  });
});

describe("MS share — v2 → v3 upgrade (no migration)", () => {
  it("synthesizes handoff.status === 'none' for a v2 payload", () => {
    const v2Payload = {
      v: 2,
      s: "MS",
      i: defaultMSInputs(),
      c: defaultCaption(),
    };
    const encoded = b64urlEncode(JSON.stringify(v2Payload));
    const decoded = decodeMSShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.handoff).toEqual(defaultHandoffState());
  });

  it("preserves a v2 deviation slate verbatim (no per-slot reset)", () => {
    const inputs = defaultMSInputs();
    inputs.deviationsA = inputs.deviationsA.map((d) =>
      d.letter === "g"
        ? { ...d, applicable: true, proposedMonthly: 100, description: "Parental arrangement" }
        : d.letter === "h"
          ? { ...d, applicable: true, proposedMonthly: 250, description: "Asset gap" }
          : d,
    );
    const v2Payload = { v: 2, s: "MS", i: inputs, c: defaultCaption() };
    const encoded = b64urlEncode(JSON.stringify(v2Payload));
    const decoded = decodeMSShare(encoded);
    const gSlot = decoded!.inputs.deviationsA.find((d) => d.letter === "g")!;
    const hSlot = decoded!.inputs.deviationsA.find((d) => d.letter === "h")!;
    expect(gSlot.applicable).toBe(true);
    expect(gSlot.proposedMonthly).toBe(100);
    expect(hSlot.applicable).toBe(true);
    expect(hSlot.proposedMonthly).toBe(250);
  });
});



describe("MS share — ?side= helpers", () => {
  it("parseSideParam accepts only 'A' or 'B'", () => {
    expect(parseSideParam("A")).toBe("A");
    expect(parseSideParam("B")).toBe("B");
    expect(parseSideParam(null)).toBeNull();
    expect(parseSideParam("")).toBeNull();
    expect(parseSideParam("a")).toBeNull();
    expect(parseSideParam("X")).toBeNull();
  });

  it("otherSide flips A↔B", () => {
    expect(otherSide("A")).toBe("B");
    expect(otherSide("B")).toBe("A");
  });

  it("preserves ?side= across all four handoff states via re-encode/decode", () => {
    const statuses: HandoffState["status"][] = [
      "none",
      "originated",
      "in_progress",
      "completed",
    ];
    for (const status of statuses) {
      const h: HandoffState = {
        ...defaultHandoffState(),
        status,
        originatingSide: "A",
      };
      const decoded = decodeMSShare(
        encodeMSShare(defaultMSInputs(), defaultCaption(), h),
      );
      expect(decoded!.handoff.status).toBe(status);
      expect(decoded!.handoff.originatingSide).toBe("A");
    }
  });
});

describe("MS share — scrubOppositeSlate", () => {
  it("originatingSide=A scrubs slate B and preserves slate A", () => {
    const base: MSInputs = {
      ...defaultMSInputs(),
      comparisonMode: "side_by_side",
    };
    base.deviationsA = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 200, description: "Keep me" }
        : d,
    );
    base.deviationsB = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 500, description: "Scrub me" }
        : { ...d },
    );

    const scrubbed = scrubOppositeSlate(base, "A");
    expect(scrubbed.deviationsA[0].applicable).toBe(true);
    expect(scrubbed.deviationsA[0].proposedMonthly).toBe(200);
    expect(scrubbed.deviationsA[0].description).toBe("Keep me");

    expect(scrubbed.deviationsB![0].applicable).toBe(false);
    expect(scrubbed.deviationsB![0].proposedMonthly).toBe(0);
    expect(scrubbed.deviationsB![0].description).toBe("");
    expect(scrubbed.deviationsB![0].party?.factsAsserted).toBe("");
  });

  it("originatingSide=B scrubs slate A and preserves slate B", () => {
    const base: MSInputs = {
      ...defaultMSInputs(),
      comparisonMode: "side_by_side",
    };
    base.deviationsA = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 300, description: "Scrub me" }
        : d,
    );
    base.deviationsB = base.deviationsA.map((d) =>
      d.letter === "a"
        ? { ...d, applicable: true, proposedMonthly: 400, description: "Keep me" }
        : { ...d },
    );

    const scrubbed = scrubOppositeSlate(base, "B");
    expect(scrubbed.deviationsA[0].applicable).toBe(false);
    expect(scrubbed.deviationsA[0].proposedMonthly).toBe(0);
    expect(scrubbed.deviationsB![0].applicable).toBe(true);
    expect(scrubbed.deviationsB![0].proposedMonthly).toBe(400);
    expect(scrubbed.deviationsB![0].description).toBe("Keep me");
  });
});
