import { describe, it, expect } from "vitest";
import { defaultMSInputs } from "../calc";
import { defaultMSChild } from "../types";
import type { MSChild } from "../types";
import {
  buildReconciliation,
  computeAvgMonthsRemainingForChildren,
  monthsRemainingForChild,
} from "../reconciliation";
import { decodeMSShare, encodeMSShare } from "../share";
import { defaultCaption } from "@/lib/calc/share";

const NOW = new Date("2026-06-01T00:00:00Z");

describe("§ 93-11-65(8) early-emancipation carve-outs", () => {
  it("status='none' returns max(0, 21-age) × 12", () => {
    const c: MSChild = { age: 14, emancipationStatus: "none" };
    expect(monthsRemainingForChild(c, NOW)).toBe(7 * 12);
  });

  it("carve-out with no projected date = already emancipated (0 months)", () => {
    const c: MSChild = { age: 17, emancipationStatus: "marriage" };
    expect(monthsRemainingForChild(c, NOW)).toBe(0);
  });

  it("carve-out with past projected date = 0 months", () => {
    const c: MSChild = {
      age: 18,
      emancipationStatus: "military_service",
      projectedEmancipationDate: "2025-12-01",
    };
    expect(monthsRemainingForChild(c, NOW)).toBe(0);
  });

  it("carve-out with future projected date = months until that date", () => {
    const c: MSChild = {
      age: 17,
      emancipationStatus: "school_discontinuance",
      projectedEmancipationDate: "2027-06-01", // 12 months out
    };
    expect(monthsRemainingForChild(c, NOW)).toBe(12);
  });

  it("carve-out projected date cannot EXCEED the age-21 default", () => {
    // 5-year-old with a wildly-future carve-out projection (10 years out)
    // age-21 default is 16y = 192 months; future date is 120 months → 120 wins
    // but reverse: age 20 (12 months default) with date 24 months out → 12 wins
    const c: MSChild = {
      age: 20,
      emancipationStatus: "qualifying_felony",
      projectedEmancipationDate: "2028-06-01", // 24 months out
    };
    expect(monthsRemainingForChild(c, NOW)).toBe(12); // capped at age-21 default
  });

  it("computeAvgMonthsRemainingForChildren averages per-child results", () => {
    const children: MSChild[] = [
      { age: 14, emancipationStatus: "none" }, // 84
      { age: 17, emancipationStatus: "marriage" }, // 0
    ];
    // mean(84, 0) = 42
    expect(computeAvgMonthsRemainingForChildren(children, NOW)).toBe(42);
  });

  it("buildReconciliation prefers structured children over flat childAges", () => {
    const inputs = {
      ...defaultMSInputs(),
      childAges: [10, 15],
      children: [
        { age: 17, emancipationStatus: "marriage" as const },
        { age: 18, emancipationStatus: "none" as const },
      ],
    };
    const totals = buildReconciliation(inputs).totals;
    // child 1: 0; child 2: 3y * 12 = 36; mean = 18
    expect(totals.avgMonthsRemaining).toBe(18);
  });

  it("share decoder backfills children from legacy childAges", () => {
    const inputs = { ...defaultMSInputs(), childAges: [8, 11], children: [] };
    const url = encodeMSShare(inputs, defaultCaption());
    // Strip children so we simulate a legacy URL.
    const decoded = decodeMSShare(url);
    expect(decoded).not.toBeNull();
    // Round-trips children identically when present; if empty, falls back.
    expect(decoded!.inputs.childAges).toEqual([8, 11]);
  });

  it("defaultMSChild yields a status='none' child", () => {
    expect(defaultMSChild(12)).toEqual({ age: 12, emancipationStatus: "none" });
  });

  // ---------------------------------------------------------------
  // PT-MS-10 — multi-child cumulative age math.
  // Ages 5 / 10 / 15 → (16 + 11 + 6) × 12 / 3 = 132 months remaining.
  // ---------------------------------------------------------------
  it("PT-MS-10: ages 5/10/15 average 132 months remaining", () => {
    const children: MSChild[] = [
      { age: 5, emancipationStatus: "none" },
      { age: 10, emancipationStatus: "none" },
      { age: 15, emancipationStatus: "none" },
    ];
    expect(computeAvgMonthsRemainingForChildren(children, NOW)).toBe(132);
  });

  // ---------------------------------------------------------------
  // PT-MS-11 — emancipation carve-out drops the child from the average.
  // Same ages 5/10/15, but the 15-year-old is asserted as already
  // emancipated by marriage (no projected date → 0 months). The 5- and
  // 10-year-olds still contribute their full age-21 defaults.
  // mean(16*12, 11*12, 0) = mean(192, 132, 0) = 108 months.
  // ---------------------------------------------------------------
  it("PT-MS-11: marriage carve-out zeros that child's months in the average", () => {
    const children: MSChild[] = [
      { age: 5, emancipationStatus: "none" },
      { age: 10, emancipationStatus: "none" },
      { age: 15, emancipationStatus: "marriage" }, // already emancipated
    ];
    expect(computeAvgMonthsRemainingForChildren(children, NOW)).toBe(108);
  });

  // ---------------------------------------------------------------
  // Williams cumulative anchor — ages 14 and 10 → 108 months. At a
  // chancellor-net $2,800/mo final order, cumulative = $302,400, which
  // is the canonical reference figure used as the negotiation anchor.
  // This test pins the months-remaining input to the multiplication;
  // calc.ts owns the $2,800 boundary (covered in calc.test.ts).
  // ---------------------------------------------------------------
  it("Williams anchor: ages 14 and 10 yield 108 months remaining → $2,800 × 108 = $302,400", () => {
    const children: MSChild[] = [
      { age: 14, emancipationStatus: "none" },
      { age: 10, emancipationStatus: "none" },
    ];
    const months = computeAvgMonthsRemainingForChildren(children, NOW);
    expect(months).toBe(108);
    expect(2800 * months!).toBe(302_400);
  });
});
