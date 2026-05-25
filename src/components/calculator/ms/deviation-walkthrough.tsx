import { useState } from "react";
import type { MSDeviation, MSInputs } from "@/lib/calc/ms/types";
import { Radio } from "./form-primitives";
import { MSPartyFactorBlock } from "./party-factor-block";
import { FACTOR_TITLES as FACTOR_TITLES_FROM_RECONCILIATION } from "@/lib/calc/ms/reconciliation";

export const FACTOR_TITLES: Record<string, string> =
  FACTOR_TITLES_FROM_RECONCILIATION;

export function MSDeviationWalkthrough({
  inputs,
  setInputs,
  onFinish,
}: {
  inputs: MSInputs;
  setInputs: (n: MSInputs) => void;
  onFinish: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const slateA = inputs.deviationsA;
  const slateB = inputs.deviationsB;
  const sideBySide = inputs.comparisonMode === "side_by_side" && !!slateB;
  const current = slateA[idx];
  const currentB = slateB ? slateB[idx] : undefined;

  const setObligor = (next: MSDeviation) =>
    setInputs({
      ...inputs,
      deviationsA: slateA.map((d, i) => (i === idx ? next : d)),
    });

  const setObligee = (next: MSDeviation) => {
    if (!slateB) return;
    setInputs({
      ...inputs,
      deviationsB: slateB.map((d, i) => (i === idx ? next : d)),
    });
  };

  const advance = () => {
    if (idx < slateA.length - 1) setIdx(idx + 1);
    else onFinish();
  };
  const back = () => setIdx(Math.max(0, idx - 1));

  return (
    <div className="rounded-lg border border-rule bg-card p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Factor ({current.letter}) — {idx + 1} of {slateA.length}
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="text-xs text-muted-foreground underline"
        >
          Skip walkthrough
        </button>
      </div>

      <div className="mt-4">
        <MSPartyFactorBlock
          letter={current.letter}
          obligor={current}
          setObligor={setObligor}
          obligee={currentB}
          setObligee={currentB ? setObligee : undefined}
          obligorLabel={inputs.obligorLabel || "Obligor"}
          obligeeLabel={inputs.obligeeLabel || "Obligee"}
          sideBySide={sideBySide}
          buildContextInputs={() => inputs}
        />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
        <button
          type="button"
          onClick={back}
          disabled={idx === 0}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm text-ink disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={advance}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {idx === slateA.length - 1 ? "Finish →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}


export function MSDeviationModePicker({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: (n: MSInputs) => void;
}) {
  return (
    <div className="rounded-lg border border-rule bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        How would you like to work through the deviations?
      </div>
      <div className="mt-3">
        <Radio<"walkthrough" | "pick">
          value={inputs.deviationEntryMode}
          onChange={(v) => setInputs({ ...inputs, deviationEntryMode: v })}
          options={[
            { value: "walkthrough", label: "Walk me through all ten factors" },
            { value: "pick", label: "Let me pick the factors I want to address" },
          ]}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        § 43-19-103 lists ten factors. Most cases involve only one or two.
        The walk-through asks about each in turn; pick mode shows the full list.
      </p>
    </div>
  );
}
