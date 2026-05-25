import { useState } from "react";
import type { MSDeviation, MSInputs } from "@/lib/calc/ms/types";
import { MSStructuredFactorForm, defaultStructured } from "./deviation-factor-form";
import { Radio, RadioStack } from "./form-primitives";

export const FACTOR_TITLES: Record<string, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of obligee, obligor, and child",
  i: "Payment by obligee of child care expenses for employment or disability",
  j: "Any other adjustment needed to achieve an equitable result",
};

type Decision = "yes" | "no" | "skip" | "pending";

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
  const [decisions, setDecisions] = useState<Decision[]>(
    () => inputs.deviationsA.map((d) => (d.applicable ? "yes" : "pending")),
  );
  const slate = inputs.deviationsA;
  const current = slate[idx];

  const updateCurrent = (next: MSDeviation) => {
    const nextSlate = slate.map((d, i) => (i === idx ? next : d));
    setInputs({ ...inputs, deviationsA: nextSlate });
  };

  const decide = (d: Decision) => {
    const nextDecisions = decisions.map((x, i) => (i === idx ? d : x));
    setDecisions(nextDecisions);
    if (d === "yes" && !current.applicable) {
      updateCurrent({
        ...current,
        applicable: true,
        structured: current.structured ?? defaultStructured(current.letter),
      });
      return; // stay on this screen so the user can fill the form
    }
    if (d === "no" && current.applicable) {
      updateCurrent({ ...current, applicable: false });
    }
    advance();
  };

  const advance = () => {
    if (idx < slate.length - 1) setIdx(idx + 1);
    else onFinish();
  };
  const back = () => setIdx(Math.max(0, idx - 1));

  const decision = decisions[idx];

  return (
    <div className="rounded-lg border border-rule bg-card p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Factor ({current.letter}) — {idx + 1} of {slate.length}
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="text-xs text-muted-foreground underline"
        >
          Skip walkthrough
        </button>
      </div>
      <h3 className="mt-2 font-serif text-lg text-ink">
        {FACTOR_TITLES[current.letter]}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Does this factor apply in your case?
      </p>

      <div className="mt-4">
        <RadioStack<Decision>
          value={decision}
          onChange={(v) => {
            if (v === "yes" || v === "no" || v === "skip") decide(v);
          }}
          options={[
            { value: "yes", label: "Yes, this factor applies" },
            { value: "no", label: "No, this factor does not apply" },
            { value: "skip", label: "Skip for now (decide later)" },
          ]}
        />
      </div>

      {decision === "yes" && current.applicable && (
        <div className="mt-6 border-t border-rule pt-4">
          <MSStructuredFactorForm deviation={current} onChange={updateCurrent} />
        </div>
      )}

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
          {idx === slate.length - 1 ? "Finish →" : "Continue →"}
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
