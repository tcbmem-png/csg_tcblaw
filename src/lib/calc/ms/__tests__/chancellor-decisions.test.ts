/**
 * §1.9 chancellor decision surface — unit + end-to-end cascade tests.
 *
 * The integration test at the bottom of this file is the "Berger-equivalent"
 * fixture exercise called for in the build spec: load a side-by-side case
 * with positions on all ten factors, set decisions across every row, and
 * assert the chancellor running total + cumulative-through-emancipation
 * match the canonical per-factor sum exactly. That single test catches
 * drift between decisionContribution and the rendering aggregation.
 */
import { describe, it, expect } from "vitest";
import { defaultMSInputs, defaultDeviation } from "../calc";
import { buildReconciliation } from "../reconciliation";
import {
  CUSTOM_AMOUNT_MAX,
  CUSTOM_AMOUNT_MIN,
  availableDecisions,
  computeChancellorTotals,
  decisionContribution,
  defaultChancellorDecision,
  defaultChancellorDecisions,
  recordDecision,
} from "../chancellor-decisions";
import type { MSDeviation, MSFactorLetter, MSInputs } from "../types";

function setSide(
  base: MSInputs,
  side: "A" | "B",
  letter: MSFactorLetter,
  patch: Partial<MSDeviation>,
): MSInputs {
  const slate =
    side === "A"
      ? base.deviationsA
      : base.deviationsB ?? base.deviationsA.map((d) => defaultDeviation(d.letter));
  const next = slate.map((d) => (d.letter === letter ? { ...d, ...patch } : d));
  return side === "A"
    ? { ...base, deviationsA: next }
    : { ...base, comparisonMode: "side_by_side", deviationsB: next };
}

describe("availableDecisions", () => {
  it("collapses `agree` to two buttons (accept_agreed + decline)", () => {
    expect(availableDecisions("agree")).toEqual(["accept_agreed", "decline"]);
  });

  it("offers all five buttons on `both` (in dispute)", () => {
    expect(availableDecisions("both")).toEqual([
      "adopt_obligor",
      "adopt_obligee",
      "split",
      "custom",
      "decline",
    ]);
  });

  it("offers three buttons on single-side assertions (no split, no adopt-other)", () => {
    expect(availableDecisions("obligor_only")).toEqual([
      "adopt_obligor",
      "custom",
      "decline",
    ]);
    expect(availableDecisions("obligee_only")).toEqual([
      "adopt_obligee",
      "custom",
      "decline",
    ]);
  });

  it("renders no row when neither party asserts", () => {
    expect(availableDecisions("neither")).toEqual([]);
  });
});

describe("decisionContribution", () => {
  let inputs: MSInputs;
  beforeEachSetup();
  function beforeEachSetup() {
    inputs = defaultMSInputs();
  }

  it("returns 0 for pending and declined decisions", () => {
    inputs = setSide(inputs, "A", "a", { applicable: true, proposedMonthly: 300 });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "a")!;
    expect(
      decisionContribution(row, { ...defaultChancellorDecision("a") }),
    ).toBe(0);
    expect(
      decisionContribution(row, recordDecision(defaultChancellorDecision("a"), { decision: "decline" })),
    ).toBe(0);
  });

  it("adopt_obligor uses obligor's amount; falls back to 0 when not applicable", () => {
    inputs = setSide(inputs, "A", "a", { applicable: true, proposedMonthly: 400 });
    inputs = setSide(inputs, "B", "a", { applicable: false, proposedMonthly: 0 });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "a")!;
    expect(
      decisionContribution(row, recordDecision(defaultChancellorDecision("a"), { decision: "adopt_obligor" })),
    ).toBe(400);
    expect(
      decisionContribution(row, recordDecision(defaultChancellorDecision("a"), { decision: "adopt_obligee" })),
    ).toBe(0);
  });

  it("split averages the two applicable positions on `both`", () => {
    inputs = setSide(inputs, "A", "h", { applicable: true, proposedMonthly: 600 });
    inputs = setSide(inputs, "B", "h", { applicable: true, proposedMonthly: 200 });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "h")!;
    expect(
      decisionContribution(row, recordDecision(defaultChancellorDecision("h"), { decision: "split" })),
    ).toBe(400);
  });

  it("custom decision uses the chancellor's signed amount, clamped to ±$50k", () => {
    inputs = setSide(inputs, "A", "j", { applicable: true, proposedMonthly: 0 });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "j")!;
    expect(
      decisionContribution(
        row,
        recordDecision(defaultChancellorDecision("j"), { decision: "custom", customAmount: -1250 }),
      ),
    ).toBe(-1250);
    expect(
      decisionContribution(
        row,
        recordDecision(defaultChancellorDecision("j"), { decision: "custom", customAmount: 1_000_000 }),
      ),
    ).toBe(CUSTOM_AMOUNT_MAX);
    expect(
      decisionContribution(
        row,
        recordDecision(defaultChancellorDecision("j"), { decision: "custom", customAmount: -1_000_000 }),
      ),
    ).toBe(CUSTOM_AMOUNT_MIN);
  });

  it("accept_agreed adopts the stipulated amount on an `agree` row", () => {
    inputs = setSide(inputs, "A", "f", { applicable: true, proposedMonthly: 150 });
    inputs = setSide(inputs, "B", "f", { applicable: true, proposedMonthly: 150 });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "f")!;
    expect(row.inPlay).toBe("agree");
    expect(
      decisionContribution(
        row,
        recordDecision(defaultChancellorDecision("f"), { decision: "accept_agreed" }),
      ),
    ).toBe(150);
  });
});

describe("recordDecision — audit trail timestamping", () => {
  it("stamps decidedAt on any non-`none` decision and clears it on revert", () => {
    const prev = defaultChancellorDecision("a");
    const adopted = recordDecision(prev, { decision: "adopt_obligor" }, new Date("2026-05-27T15:32:18Z"));
    expect(adopted.decidedAt).toBe("2026-05-27T15:32:18.000Z");
    expect(adopted.decision).toBe("adopt_obligor");
    const reverted = recordDecision(adopted, { decision: "none" });
    expect(reverted.decidedAt).toBeNull();
  });

  it("custom decision retains the chancellor's amount (clamped); non-custom zeros it", () => {
    const prev = defaultChancellorDecision("j");
    const custom = recordDecision(prev, { decision: "custom", customAmount: -750 });
    expect(custom.customAmount).toBe(-750);
    const swap = recordDecision(custom, { decision: "decline" });
    expect(swap.customAmount).toBe(0);
  });
});

describe("computeChancellorTotals — running total + pending tracking", () => {
  it("sums per-factor contributions and counts active vs. pending rows", () => {
    let inputs = defaultMSInputs();
    inputs = setSide(inputs, "A", "a", { applicable: true, proposedMonthly: 300 });
    inputs = setSide(inputs, "A", "h", { applicable: true, proposedMonthly: 600 });
    inputs = setSide(inputs, "B", "h", { applicable: true, proposedMonthly: 200 });
    const rows = buildReconciliation(inputs).rows;
    const decisions = defaultChancellorDecisions();
    decisions.a = recordDecision(decisions.a, { decision: "adopt_obligor" });
    // factor h left pending
    const totals = computeChancellorTotals(rows, decisions);
    expect(totals.totalMonthly).toBe(300);
    expect(totals.activeCount).toBe(2);
    expect(totals.pendingCount).toBe(1);
    expect(totals.perFactor.a).toBe(300);
    expect(totals.perFactor.h).toBe(0);
  });
});

// ============================================================
// End-to-end cascade fixture (Berger-equivalent).
//
// Ten-factor side-by-side with mixed in-play states; chancellor decisions
// across every row. The expected cumulative is computed by summing the
// per-factor decision contribution and multiplying by avgMonthsRemaining.
// Drift between decisionContribution and the rendering layer fails here.
// ============================================================

describe("integration — chancellor cascade across all ten factors", () => {
  it("matches canonical per-factor sum × months-remaining exactly", () => {
    let inputs: MSInputs = { ...defaultMSInputs(), childAges: [10, 15] };
    inputs.comparisonMode = "side_by_side";
    inputs.deviationsB = inputs.deviationsA.map((d) => defaultDeviation(d.letter));

    // Mixed scenario: 3 agreed, 3 in-dispute, 2 obligor-only, 1 obligee-only, 1 not-asserted.
    const setup: { letter: MSFactorLetter; a?: number; b?: number }[] = [
      { letter: "a", a: 300, b: 100 },  // both — dispute, split → 200
      { letter: "b", a: 50, b: 50 },    // agree → accept 50
      { letter: "c", a: 200 },          // obligor_only → adopt_obligor 200
      { letter: "d", b: 150 },          // obligee_only → adopt_obligee 150
      { letter: "e", a: 75, b: 75 },    // agree → accept 75
      { letter: "f", a: 400, b: 200 },  // both — adopt_obligor 400
      { letter: "g", a: -300, b: -100 },// both — custom -250
      { letter: "h", a: 100, b: 100 },  // agree → decline (overridden) → 0
      { letter: "i", a: 250 },          // obligor_only → decline → 0
      { letter: "j", /* neither */ },   // not asserted
    ];
    for (const s of setup) {
      if (s.a !== undefined) inputs = setSide(inputs, "A", s.letter, { applicable: true, proposedMonthly: s.a });
      if (s.b !== undefined) inputs = setSide(inputs, "B", s.letter, { applicable: true, proposedMonthly: s.b });
    }

    const report = buildReconciliation(inputs);
    const decisions = defaultChancellorDecisions();
    decisions.a = recordDecision(decisions.a, { decision: "split" });            // +200
    decisions.b = recordDecision(decisions.b, { decision: "accept_agreed" });    // +50
    decisions.c = recordDecision(decisions.c, { decision: "adopt_obligor" });    // +200
    decisions.d = recordDecision(decisions.d, { decision: "adopt_obligee" });    // +150
    decisions.e = recordDecision(decisions.e, { decision: "accept_agreed" });    // +75
    decisions.f = recordDecision(decisions.f, { decision: "adopt_obligor" });    // +400
    decisions.g = recordDecision(decisions.g, { decision: "custom", customAmount: -250 }); // -250
    decisions.h = recordDecision(decisions.h, { decision: "decline" });          // 0
    decisions.i = recordDecision(decisions.i, { decision: "decline" });          // 0
    // j stays "none" — not asserted, no contribution either way

    const totals = computeChancellorTotals(report.rows, decisions);
    const expectedMonthly = 200 + 50 + 200 + 150 + 75 + 400 - 250 + 0 + 0;
    expect(totals.totalMonthly).toBe(expectedMonthly);

    // Active rows: a, b, c, d, e, f, g, h, i = 9. j is "neither" → not active.
    expect(totals.activeCount).toBe(9);
    expect(totals.pendingCount).toBe(0);

    // Cumulative-through-emancipation: ages [10,15] → avg 102 months.
    expect(report.totals.avgMonthsRemaining).toBe(102);
    const expectedCumulative = expectedMonthly * 102;
    expect(totals.totalMonthly * report.totals.avgMonthsRemaining!).toBe(expectedCumulative);
  });
});
