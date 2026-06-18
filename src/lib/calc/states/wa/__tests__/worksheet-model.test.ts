import { describe, expect, it } from "vitest";
import { loadFixtures } from "../../../core/fixtures";
import { incomeShares } from "../../../core/income-shares";
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../../../core/types";
import { WA_INCOME_SHARES_SPEC } from "../spec";
import { buildWaWorksheetModel } from "../worksheet-model";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const line = (m: ReturnType<typeof buildWaWorksheetModel>, id: string) =>
  m.lines.find((l) => l.line === id)!;

const fixtures = loadFixtures<IncomeSharesInputs, IncomeSharesOutputs>(
  new URL("../fixtures.json", import.meta.url),
);

describe("WA cited-worksheet model reproduces the byte-checked engine", () => {
  it("loaded all 11 WA fixtures", () => {
    expect(fixtures.length).toBe(11);
  });

  for (const fx of fixtures) {
    it(`${fx.id}: per-line model matches engine (no forced values)`, () => {
      const inputs = fx.inputs as IncomeSharesInputs;
      const o = incomeShares(WA_INCOME_SHARES_SPEC, inputs);
      expect(o.errors, "errors").toEqual([]);
      const m = buildWaWorksheetModel(inputs, o);

      // Line 17 (transfer) is the live-WSCSS byte-checked figure, to the dollar.
      const expected = fx.expected as {
        allInMonthly: number;
        bcso: number;
        piA: number;
        piB: number;
      };
      expect(m.transfer, "Line 17 transfer").toBe(expected.allInMonthly);
      expect(line(m, "17").combined, "Line 17 prints the order").toContain(
        money(expected.allInMonthly),
      );

      // Line 5 = per-child × N (the WA structural first). Total equals engine bcso.
      const l5 = line(m, "5");
      expect(l5.combined, "Line 5 total").toBe(money(o.bcso));
      expect(l5.derivation, "Line 5 shows per-child × N").toContain(
        money(o.bcso / inputs.numChildren),
      );
      expect(l5.derivation).toContain(`× ${inputs.numChildren}`);

      // Line 6 = 3-decimal income share (nearest_0.1pct), matching pinned piA/piB.
      const l6 = line(m, "6");
      expect(l6.col1, "Line 6 share P1").toBe(o.piA.toFixed(3));
      expect(l6.col2, "Line 6 share P2").toBe(o.piB.toFixed(3));
      expect(o.piA.toFixed(3)).toBe(expected.piA.toFixed(3));

      // Line 7 = share × total, whole dollars.
      expect(line(m, "7").col1).toBe(money(o.piA * o.bcso));
    });
  }
});

describe("WA cited-worksheet model carries verified authority + [VERIFY] discipline", () => {
  const o = incomeShares(WA_INCOME_SHARES_SPEC, {
    parentAGrossMonthly: 4000,
    parentBGrossMonthly: 2000,
    numChildren: 1,
    parentingType: "standard",
    arpForStandard: "parent_a",
  });
  const m = buildWaWorksheetModel(
    {
      parentAGrossMonthly: 4000,
      parentBGrossMonthly: 2000,
      numChildren: 1,
      parentingType: "standard",
      arpForStandard: "parent_a",
    },
    o,
  );

  it("line 5 cites the economic table (RCW 26.19.020) and a verified case", () => {
    const l5 = line(m, "5");
    expect(l5.authority.rcw).toContain("RCW 26.19.020");
    expect(
      l5.authority.cases.some((c) => /McCausland/.test(c.cite) && c.status === "verified"),
    ).toBe(true);
  });

  it("line 6 cites the apportionment statute", () => {
    expect(line(m, "6").authority.rcw).toContain("RCW 26.19.080(1)");
  });

  it("self-support reserve line surfaces a verbatim [VERIFY] label and the $2,394 figure", () => {
    const l8 = line(m, "8 (SSR)");
    expect(l8.combined).toBe("$2,394");
    expect(l8.verify, "SSR is statute-only / pending case law").toMatch(/^\[VERIFY/);
  });

  it("line 19 (25% medical cap) is flagged [VERIFY] (subsection pending)", () => {
    expect(line(m, "19").verify).toMatch(/^\[VERIFY/);
    expect(line(m, "19").informational).toBe(true);
  });

  it("exposes the verified-pack caveat", () => {
    expect(m.authorityCaveat.length).toBeGreaterThan(0);
  });
});
