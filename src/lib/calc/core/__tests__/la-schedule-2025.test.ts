import { describe, expect, it } from "vitest";
import { lookupScheduleAmount } from "../schedule";
import { LA_SCHEDULE_CONFIG } from "../../states/la/spec";

/**
 * HARD ASSERT — guards the 2026-06-15 Louisiana schedule refresh.
 *
 * These four (combined monthly income / # children -> basic obligation) anchors
 * were read straight off the official Louisiana DCFS OBWS "Child Support
 * Estimator" (table dated 2024-12-16, the ~Jan. 1, 2025 revision). If any of
 * them stops matching, the LA schedule data has regressed (e.g. someone restored
 * the stale 2021 table) — fail the build rather than ship understated orders.
 * See CSG/06_State_Forms/LA/LA_Oracle_Check_FINDING.md.
 */
describe("LA 2025 BCSO schedule anchors (DCFS OBWS, table 2024-12-16)", () => {
  const cases: Array<[number, number, number]> = [
    [7000, 1, 1127],
    [8000, 2, 1845],
    [40000, 1, 3147],
    [1050, 1, 43],
  ];

  it("schedule cap is the 2025 table top ($50,000)", () => {
    expect(LA_SCHEDULE_CONFIG.cap).toBe(50000);
  });

  for (const [income, children, expected] of cases) {
    it(`combined $${income} / ${children} child(ren) = $${expected}`, () => {
      const { bcso } = lookupScheduleAmount(
        LA_SCHEDULE_CONFIG,
        income,
        children,
      );
      expect(bcso).toBe(expected);
    });
  }
});
