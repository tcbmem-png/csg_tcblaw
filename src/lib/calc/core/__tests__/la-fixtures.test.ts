import { describe, expect, it } from "vitest";
import { loadFixtures, type Fixture } from "../fixtures";
import { incomeShares } from "../income-shares";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../types";
import { LA_INCOME_SHARES_SPEC } from "../../states/la/spec";

/**
 * Asserts each present field. A fixture may carry `tolerance: { field: n }` to
 * allow ±n on that field — used for the two [VERIFY-2] LA fixtures whose
 * income-share rounding order yields a documented ±$1 until pinned to an
 * official Worksheet B. Everything else is exact (money-tolerant).
 */
function assertExpected(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  tolerance: Record<string, number> | undefined,
) {
  for (const [key, want] of Object.entries(expected)) {
    const got = actual[key];
    if (typeof want === "number") {
      const tol = tolerance?.[key];
      if (tol != null) {
        expect(Math.abs((got as number) - want), `${key} within ±${tol}`).toBeLessThanOrEqual(tol);
      } else {
        expect(got, key).toBeCloseTo(want, 2);
      }
    } else {
      expect(got, key).toBe(want);
    }
  }
}

/**
 * STALE — SKIPPED PENDING RE-PIN (2026-06-15).
 *
 * Every LA fixture's expected BCSO / order figures were pinned against the prior
 * 2021 schedule (Acts 2020 No. 177). On 2026-06-15 the LA schedule data was
 * refreshed to the official DCFS OBWS 2025 table (dated 2024-12-16), which runs
 * ~10% higher, so these expectations now disagree with the engine BY DESIGN.
 *
 * Per the task, these are intentionally NOT silently rewritten. They must be
 * re-pinned against the free DCFS OBWS oracle (webapps.dcfs.la.gov/OBWS —
 * obwsWorkPad.html for sole/primary, obwsWorkPadSC.html for shared) and then
 * un-skipped. The engine LOGIC is unchanged; only the schedule anchors moved.
 * The refreshed schedule itself is guarded by la-schedule-2025.test.ts.
 * See CSG/06_State_Forms/LA/LA_Oracle_Check_FINDING.md.
 */
describe.skip("LA fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/la/fixtures.json", import.meta.url),
  ) as Array<
    Fixture<IncomeSharesInputs, IncomeSharesOutputs> & {
      tolerance?: Record<string, number>;
    }
  >;

  it("loaded all 10 LA fixtures", () => {
    expect(fixtures.length).toBe(10);
  });

  for (const fx of fixtures) {
    it(`${fx.id}`, () => {
      const out = incomeShares(
        LA_INCOME_SHARES_SPEC,
        fx.inputs as IncomeSharesInputs,
      );
      expect(out.errors, "errors").toEqual([]);
      assertExpected(
        out as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
        fx.tolerance,
      );
    });
  }
});
