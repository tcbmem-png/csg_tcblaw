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
 * Re-pinned 2026-06-16 against the live DCFS OBWS oracle (Worksheet A:
 * obwsWorkPad.html; Worksheet B: obwsWorkPadSC.html) on the 2025 schedule.
 * The earlier expectations were pinned to the 2021 schedule + full-precision
 * shares and were skipped pending this re-pin. All nine active fixtures now
 * reproduce to the cent via the plain income-shares product with LA's
 * shareRounding (0.01%) + nearest_cent order. The split-custody fixture stays
 * deferred (notUiExposed; the OBWS has no split mode, so no oracle to pin to).
 * The refreshed schedule itself is guarded by la-schedule-2025.test.ts.
 * See CSG/06_State_Forms/LA/LA_OBWS_repin_oracle.md.
 */
describe("LA fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/la/fixtures.json", import.meta.url),
  ) as Array<
    Fixture<IncomeSharesInputs, IncomeSharesOutputs> & {
      tolerance?: Record<string, number>;
      deferred?: boolean;
    }
  >;

  it("loaded all 10 LA fixtures", () => {
    expect(fixtures.length).toBe(10);
  });

  for (const fx of fixtures) {
    const run = fx.deferred ? it.skip : it;
    run(`${fx.id}`, () => {
      const out = incomeShares(LA_INCOME_SHARES_SPEC, fx.inputs as IncomeSharesInputs);
      expect(out.errors, "errors").toEqual([]);
      assertExpected(
        out as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
        fx.tolerance,
      );
    });
  }
});
