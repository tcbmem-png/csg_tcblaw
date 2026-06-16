import { describe, expect, it } from "vitest";
import { loadFixtures } from "../fixtures";
import { incomeShares } from "../income-shares";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../types";
import { WA_INCOME_SHARES_SPEC } from "../../states/wa/spec";

/**
 * Washington (state #8) — income_shares_net, RCW 26.19 / RCW 26.19.020 (EHB
 * 1014, eff 1/1/2026). All 11 fixtures byte-checked against the live open WSCSS
 * calculator (fortress.wa.gov) 2026-06-16; see CSG/01_States/WA/WA_ByteCheck_Log.md.
 *
 * VERIFIED: WA_StateSpec.json meta.lastVerified = 2026-06-16 (Taylor's sign-off).
 * The engine is merge-cleared; WA's public calculator tile/route stays dark until
 * the cited worksheet ships (status "planned" in src/lib/states.ts, no route).
 * These tests guard the engine math.
 *
 * The fixtures exercise WA's structural firsts: per-child table (valuesArePerChild,
 * total BCSO = cell x N), nearest_100 lookup (<=49 down / >=50 up), 3-decimal
 * income-share rounding (the corrected $573 off-row case), the discretionary
 * $50,000 ceiling, and the RCW 26.19.065 low-income stack (45% cap -> obligor-net
 * SSR $2,394 -> $50/child minimum).
 */
function assertExpected(actual: Record<string, unknown>, expected: Record<string, unknown>) {
  for (const [key, want] of Object.entries(expected)) {
    const got = actual[key];
    if (typeof want === "number") {
      expect(got, key).toBeCloseTo(want, 2);
    } else {
      expect(got, key).toBe(want);
    }
  }
}

describe("WA fixtures reproduce through the generic income-shares core", () => {
  const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
    new URL("../../states/wa/fixtures.json", import.meta.url),
  );

  it("loaded all 11 WA calc fixtures", () => {
    expect(fixtures.length).toBe(11);
  });

  for (const fx of fixtures) {
    it(`${fx.id}`, () => {
      const out = incomeShares(WA_INCOME_SHARES_SPEC, fx.inputs as IncomeSharesInputs);
      expect(out.errors, "errors").toEqual([]);
      assertExpected(
        out as unknown as Record<string, unknown>,
        fx.expected as Record<string, unknown>,
      );
    });
  }
});
