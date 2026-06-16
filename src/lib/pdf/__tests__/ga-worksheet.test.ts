import { describe, expect, it } from "vitest";
import { incomeShares } from "@/lib/calc/core/income-shares";
import { GA_INCOME_SHARES_SPEC } from "@/lib/calc/states/ga/spec";
import type { IncomeSharesInputs } from "@/lib/calc/core/types";
import gaFixtures from "@/lib/calc/states/ga/fixtures.json";
import { buildGaWorksheetModel, renderGaWorksheetPdf } from "@/lib/pdf/ga-worksheet-pdf";

/**
 * GA worksheet reproduce gate: the reproduced line values must equal the engine
 * output and the live GA Commission oracle. The renderer's visual layout still
 * wants a human eyeball vs the official specimen.
 */
function fx(id: string): IncomeSharesInputs {
  const f = (gaFixtures as Array<{ id: string; inputs: IncomeSharesInputs }>).find(
    (x) => x.id === id,
  );
  if (!f) throw new Error(`missing GA fixture ${id}`);
  return f.inputs;
}
const run = (i: IncomeSharesInputs) => incomeShares(GA_INCOME_SHARES_SPEC, i);

describe("GA worksheet reproduce", () => {
  it("baseline (90/275): Line 5/6 and order match engine + oracle", () => {
    const i = fx("GA-baseline-1child-ordinary-visitation");
    const o = run(i);
    const m = buildGaWorksheetModel(i, o, { ncpName: "Anna Payor", cpName: "Bob Recipient" });

    expect(m.bcso).toBe(1150);
    expect(m.orderCents).toBeCloseTo(652.35, 2); // == engine == oracle Line 8/10
    expect(m.line6).toBeCloseTo(-66.4, 2); // oracle Line 6
    // Line 5 NCP share = 0.625 * 1150 = 718.75; cross-check 718.75 + line6 == order.
    expect(718.75 + m.line6).toBeCloseTo(m.orderCents, 2);
    expect(m.orderWhole).toBe(652);
    expect(m.summary).toBe("Anna Payor pays Bob Recipient $652 a month");
  });

  it("NCP column binds to the obligor (parent_a here)", () => {
    const i = fx("GA-baseline-1child-ordinary-visitation");
    const o = run(i);
    const m = buildGaWorksheetModel(i, o, { ncpName: "NCP", cpName: "CP" });
    const line1 = m.worksheet.find((l) => l.n === "1")!;
    // Obligor A's gross (5000) sits in the NCP (col1) column, not the CP column.
    expect(line1.col1).toBe("$5,000.00");
    expect(line1.col2).toBe("$3,000.00");
  });

  it("high-income (80/285): Schedule C adjustment matches the official specimen (-$129.11)", () => {
    const i = fx("GA-high-income-above-40k-cap");
    const o = run(i);
    const m = buildGaWorksheetModel(i, o);
    expect(m.line6).toBeCloseTo(-129.11, 2); // GA specimen Final NCP Adjustment
    expect(m.orderCents).toBeCloseTo(2939.52, 2);
  });

  it("multichild + add-ons: Lines 5/6/7 reconcile to the engine order", () => {
    const i = fx("GA-multichild-2-addons-heavy");
    const o = run(i);
    const m = buildGaWorksheetModel(i, o);
    // bcsoNcp (0.625*1723=1076.88) + line6 (-99.48) + line7Ncp (0.625*600=375) == order.
    expect(0.625 * 1723 + m.line6 + 0.625 * 600).toBeCloseTo(m.orderCents, 2);
    expect(m.orderCents).toBeCloseTo(1352.4, 2);
  });

  it("renders a non-empty PDF", () => {
    const i = fx("GA-baseline-1child-ordinary-visitation");
    const bytes = renderGaWorksheetPdf(i, run(i), { ncpName: "A", cpName: "B" });
    expect(bytes.length).toBeGreaterThan(800);
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF");
  });
});
