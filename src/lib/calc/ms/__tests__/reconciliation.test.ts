import { describe, it, expect } from "vitest";
import { defaultMSInputs, defaultDeviation } from "../calc";
import type { MSInputs, MSDeviation, MSFactorLetter } from "../types";
import {
  buildReconciliation,
  computeAvgMonthsRemaining,
  summarizeRow,
} from "../reconciliation";

function withDeviation(
  base: MSInputs,
  side: "A" | "B",
  letter: MSFactorLetter,
  patch: Partial<MSDeviation>,
): MSInputs {
  const slate =
    side === "A" ? base.deviationsA : base.deviationsB ?? base.deviationsA.map((d) => defaultDeviation(d.letter));
  const next = slate.map((d) => (d.letter === letter ? { ...d, ...patch } : d));
  return side === "A"
    ? { ...base, deviationsA: next }
    : { ...base, comparisonMode: "side_by_side", deviationsB: next };
}

describe("computeAvgMonthsRemaining", () => {
  it("returns null when no ages provided", () => {
    expect(computeAvgMonthsRemaining([])).toBeNull();
  });

  it("computes mean(max(0, 21 - age)) * 12 rounded", () => {
    // mean(21-10, 21-15) = mean(11, 6) = 8.5 yrs => 102 months
    expect(computeAvgMonthsRemaining([10, 15])).toBe(102);
  });

  it("clamps emancipated children to 0 months remaining", () => {
    // mean(21-25, 21-18) = mean(0, 3) = 1.5 yrs => 18 months
    expect(computeAvgMonthsRemaining([25, 18])).toBe(18);
  });

  it("caps at 21 years (252 months) for newborns", () => {
    expect(computeAvgMonthsRemaining([0])).toBe(252);
  });

  it("ignores non-finite or negative entries", () => {
    expect(computeAvgMonthsRemaining([Number.NaN, -3, 10])).toBe(132); // 11 yr * 12
  });
});

describe("buildReconciliation", () => {
  it("classifies a single-side assertion as obligor_only", () => {
    const inputs = withDeviation(defaultMSInputs(), "A", "a", {
      applicable: true,
      proposedMonthly: 300,
    });
    const report = buildReconciliation(inputs);
    const row = report.rows.find((r) => r.letter === "a")!;
    expect(row.inPlay).toBe("obligor_only");
    expect(row.obligor.amount).toBe(300);
    expect(row.gapMonthly).toBe(300);
    expect(report.activeRows).toHaveLength(1);
  });

  it("classifies matching amounts on both sides as 'agree'", () => {
    let inputs = withDeviation(defaultMSInputs(), "A", "f", {
      applicable: true,
      proposedMonthly: 150,
    });
    inputs = withDeviation(inputs, "B", "f", {
      applicable: true,
      proposedMonthly: 150,
    });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "f")!;
    expect(row.inPlay).toBe("agree");
    expect(row.gapMonthly).toBe(0);
  });

  it("classifies differing amounts on both sides as 'both' with gap", () => {
    let inputs = withDeviation(defaultMSInputs(), "A", "h", {
      applicable: true,
      proposedMonthly: 400,
    });
    inputs = withDeviation(inputs, "B", "h", {
      applicable: true,
      proposedMonthly: 100,
    });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "h")!;
    expect(row.inPlay).toBe("both");
    expect(row.gapMonthly).toBe(300);
  });

  it("suppresses cumulative when child ages are missing", () => {
    const inputs = withDeviation(defaultMSInputs(), "A", "a", {
      applicable: true,
      proposedMonthly: 200,
    });
    const totals = buildReconciliation(inputs).totals;
    expect(totals.avgMonthsRemaining).toBeNull();
    expect(totals.cumulativeNetDifference).toBeNull();
  });

  it("computes cumulative net difference from listed child ages", () => {
    let inputs = withDeviation(defaultMSInputs(), "A", "a", {
      applicable: true,
      proposedMonthly: 500,
    });
    inputs = withDeviation(inputs, "B", "a", {
      applicable: true,
      proposedMonthly: 200,
    });
    inputs = { ...inputs, childAges: [10, 15] }; // 102 mo avg
    const totals = buildReconciliation(inputs).totals;
    expect(totals.netDifferenceMonthly).toBe(300);
    expect(totals.avgMonthsRemaining).toBe(102);
    expect(totals.cumulativeNetDifference).toBe(300 * 102);
  });
});

describe("summarizeRow", () => {
  it("produces a 'neither' line when nobody asserts", () => {
    const inputs = defaultMSInputs();
    const row = buildReconciliation(inputs).rows[0];
    expect(summarizeRow(row, "Mom", "Dad")).toMatch(/Neither/i);
  });

  it("names both parties when amounts differ", () => {
    let inputs = withDeviation(defaultMSInputs(), "A", "b", {
      applicable: true,
      proposedMonthly: 100,
    });
    inputs = withDeviation(inputs, "B", "b", {
      applicable: true,
      proposedMonthly: 250,
    });
    const row = buildReconciliation(inputs).rows.find((r) => r.letter === "b")!;
    const text = summarizeRow(row, "Mom", "Dad");
    expect(text).toContain("Mom");
    expect(text).toContain("Dad");
    expect(text).toContain("$150"); // gap
  });
});
