/**
 * Washington surface — composes the honest-assessment front door with the cited
 * worksheet beneath it. The intro and the renderer ship as ONE unit.
 *
 * HELD DARK: this component is intentionally NOT mounted at a public route.
 * Per CSG/04_Agent_Pipeline/Repo_Lane_Boundary.md (protected invariant #1) and
 * the WA spec, there is no src/routes/wa.tsx and states.ts keeps WA
 * status:"planned" until the cited worksheet ships AND Taylor flips it. Mounting
 * this at /wa is the single go-step Taylor takes — do not light up a WA landing
 * without this renderer beneath it.
 */
import { useMemo, useState } from "react";
import { incomeShares } from "@/lib/calc/core/income-shares";
import { WA_INCOME_SHARES_SPEC } from "@/lib/calc/states/wa/spec";
import { buildWaWorksheetModel } from "@/lib/calc/states/wa/worksheet-model";
import { WaHonestAssessment } from "./wa-honest-assessment";
import { WaCitedWorksheet } from "./wa-cited-worksheet";

export function WaWorksheetSurface() {
  const [phase, setPhase] = useState<"intro" | "worksheet">("intro");
  const [p1Net, setP1Net] = useState(4000);
  const [p2Net, setP2Net] = useState(2000);
  const [numChildren, setNumChildren] = useState(1);

  // WA is income_shares_net; the parent enters monthly NET income directly
  // (gross with the RCW 26.19.071(5) deductions already removed).
  const model = useMemo(() => {
    const inputs = {
      parentAGrossMonthly: p1Net,
      parentBGrossMonthly: p2Net,
      numChildren,
      parentingType: "standard" as const,
      arpForStandard: "parent_a" as const,
    };
    const o = incomeShares(WA_INCOME_SHARES_SPEC, inputs);
    if (o.errors.length) return null;
    return buildWaWorksheetModel(inputs, o);
  }, [p1Net, p2Net, numChildren]);

  if (phase === "intro") {
    return <WaHonestAssessment onContinue={() => setPhase("worksheet")} />;
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <fieldset className="grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-medium">Your monthly net income</legend>
          <label className="text-sm">
            Parent 1 net / month
            <input
              type="number"
              value={p1Net}
              onChange={(e) => setP1Net(Number(e.target.value) || 0)}
              className="mt-1 block w-full rounded border border-input bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Parent 2 net / month
            <input
              type="number"
              value={p2Net}
              onChange={(e) => setP2Net(Number(e.target.value) || 0)}
              className="mt-1 block w-full rounded border border-input bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Number of children
            <select
              value={numChildren}
              onChange={(e) => setNumChildren(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-input bg-background px-2 py-1"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </div>
      {model ? (
        <WaCitedWorksheet model={model} />
      ) : (
        <p className="mx-auto max-w-5xl px-6 py-10 text-ink">
          Enter both parents' monthly net income to compute the worksheet.
        </p>
      )}
    </div>
  );
}
