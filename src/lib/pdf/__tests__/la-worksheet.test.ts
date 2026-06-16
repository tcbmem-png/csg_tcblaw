import { describe, expect, it } from "vitest";
import { incomeShares } from "@/lib/calc/core/income-shares";
import { LA_INCOME_SHARES_SPEC } from "@/lib/calc/states/la/spec";
import type { IncomeSharesInputs } from "@/lib/calc/core/types";
import laFixtures from "@/lib/calc/states/la/fixtures.json";
import { buildLaWorksheetModel, renderLaWorksheetPdf } from "@/lib/pdf/la-worksheet-pdf";

/**
 * LA Worksheet A reproduce gate: reproduced line values must equal the engine
 * output, which is itself live-confirmed against the DCFS OBWS calculator.
 */
function fx(id: string): IncomeSharesInputs {
  const f = (laFixtures as Array<{ id: string; inputs: IncomeSharesInputs }>).find(
    (x) => x.id === id,
  );
  if (!f) throw new Error(`missing LA fixture ${id}`);
  return f.inputs;
}
const run = (i: IncomeSharesInputs) => incomeShares(LA_INCOME_SHARES_SPEC, i);

describe("LA Worksheet A reproduce", () => {
  it("baseline: Line 4 BCSO, Line 9 order match engine + OBWS oracle", () => {
    const i = fx("LA-baseline-1child");
    const o = run(i);
    const m = buildLaWorksheetModel(i, o, { obligorName: "Pat", custodialName: "Dana" });
    expect(m.bcso).toBe(1127);
    expect(m.order).toBeCloseTo(643.97, 2);
    const line9 = m.lines.find((l) => l.n === "9")!;
    expect(line9.col1).toBe("$643.97");
    expect(m.summary).toBe("Pat pays Dana $643.97 a month");
  });

  it("obligor column binds to the obligor (parent_a here)", () => {
    const i = fx("LA-baseline-1child");
    const m = buildLaWorksheetModel(i, run(i));
    const line1 = m.lines.find((l) => l.n === "1")!;
    expect(line1.col1).toBe("$4,000.00"); // obligor A gross
    expect(line1.col2).toBe("$3,000.00");
  });

  it("multichild + add-ons: Line 6 total and Line 7 obligor share reconcile", () => {
    const i = fx("LA-multichild-addons-treatiseExA");
    const o = run(i);
    const m = buildLaWorksheetModel(i, o);
    const line6 = m.lines.find((l) => l.n === "6")!;
    const line7 = m.lines.find((l) => l.n === "7")!;
    expect(line6.combined).toBe("$2,445.00"); // 1845 + 600
    expect(line7.col1).toBe("$1,528.13"); // round(0.625 * 2445)
    expect(m.order).toBeCloseTo(1528.13, 2);
  });

  it("defers split custody (Worksheet C)", () => {
    const i = fx("LA-split-custody");
    const o = run(i);
    expect(() => buildLaWorksheetModel(i, o)).toThrow(/split custody/i);
  });

  it("renders a non-empty PDF", () => {
    const i = fx("LA-baseline-1child");
    const bytes = renderLaWorksheetPdf(i, run(i), { obligorName: "A", custodialName: "B" });
    expect(bytes.length).toBeGreaterThan(800);
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF");
  });
});
