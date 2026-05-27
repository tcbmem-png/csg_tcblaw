import type {
  MSInputs,
  MSAgiBasis,
  MSImputationAsserter,
  MSImputationFactors,
} from "@/lib/calc/ms/types";
import {
  MS_IMPUTATION_FACTOR_KEYS,
  MS_IMPUTATION_FACTOR_LABELS,
} from "@/lib/calc/ms/imputation-labels";
import { Field, NumInput, Radio, TextArea, TextInput } from "./form-primitives";

export function MSImputationBasis({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: (n: MSInputs) => void;
}) {
  const basis = inputs.imputationBasis;
  const updateBasis = (patch: Partial<MSInputs["imputationBasis"]>) =>
    setInputs({
      ...inputs,
      imputationBasis: { ...basis, ...patch },
    });
  const updateFactor = (k: keyof MSImputationFactors, v: string) =>
    updateBasis({ factors: { ...basis.factors, [k]: v } });

  const obligorLabel = inputs.obligorLabel || "Obligor";
  const obligeeLabel = inputs.obligeeLabel || "Obligee";

  const actual = Math.max(0, Number(inputs.obligorAnnualGross || 0));
  const imputed = Math.max(0, Number(basis.imputedAnnualGross || 0));
  const pct = Math.min(100, Math.max(0, Number(basis.applicationPct ?? 100)));
  const blended = actual * (1 - pct / 100) + imputed * (pct / 100);
  const fmt$ = (n: number) =>
    `$${Math.round(n).toLocaleString("en-US")}`;

  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <Field
        label="Is this gross income actual or imputed?"
        help="Per HB 1067 (2022), Mississippi added a statutory framework for imputation at § 43-19-101(5). Imputation must be based on fact-gathering, not a standard amount."
      >
        <Radio<MSAgiBasis>
          value={inputs.agiBasis}
          onChange={(v) => setInputs({ ...inputs, agiBasis: v })}
          options={[
            { value: "actual", label: "Actual — documented" },
            { value: "imputed", label: "Imputed — earning capacity" },
          ]}
        />
      </Field>

      {inputs.agiBasis === "imputed" && (
        <div className="mt-4 space-y-4">
          <Field
            label="Which party asserts imputation?"
            help="The asserting party documents the twelve-factor basis below in their own words. The other side may rebut on the chancellor's decision surface."
          >
            <Radio<MSImputationAsserter>
              value={basis.assertedBy || ""}
              onChange={(v) => updateBasis({ assertedBy: v })}
              options={[
                { value: "obligor", label: obligorLabel },
                { value: "obligee", label: obligeeLabel },
              ]}
            />
          </Field>

          <Field
            label="Proposed imputed annual gross income"
            help="The asserting party's proposed figure. § 43-19-101(5) forbids a standard amount in lieu of fact-gathering; document the basis below."
          >
            <NumInput
              value={basis.imputedAnnualGross}
              onChange={(n) => updateBasis({ imputedAnnualGross: n })}
            />
          </Field>

          <Field
            label={`Application — ${pct}%`}
            help="Scenario slider. 0% uses actual gross only; 100% uses the imputed figure only; intermediate values blend linearly. Chancellors rarely impute the full proposed amount — the slider quantifies the realistic range."
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={(e) =>
                updateBasis({ applicationPct: Number(e.target.value) })
              }
              className="w-full accent-primary"
              aria-label="Imputation application percentage"
            />
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded border border-rule bg-cream/40 p-2">
                <div className="text-muted-foreground">Actual</div>
                <div className="font-mono text-ink">{fmt$(actual)}/yr</div>
              </div>
              <div className="rounded border border-rule bg-cream/40 p-2">
                <div className="text-muted-foreground">Imputed (proposed)</div>
                <div className="font-mono text-ink">{fmt$(imputed)}/yr</div>
              </div>
              <div className="rounded border border-primary/40 bg-primary/5 p-2">
                <div className="text-muted-foreground">Blended (used)</div>
                <div className="font-mono text-ink">{fmt$(blended)}/yr</div>
              </div>
            </div>
          </Field>

          <fieldset className="rounded-md border border-rule p-3">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Twelve-factor basis — § 43-19-101(5)
            </legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Document each factor in the asserting party's own words. Blank
              factors are omitted from the worksheet. A "standard amount in
              lieu of fact-gathering" is statutorily prohibited; the more
              specific the documentation here, the more defensible the
              imputed figure.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {MS_IMPUTATION_FACTOR_KEYS.map((k) => (
                <Field key={k} label={MS_IMPUTATION_FACTOR_LABELS[k]}>
                  <TextInput
                    value={basis.factors[k]}
                    onChange={(s) => updateFactor(k, s)}
                    placeholder=""
                  />
                </Field>
              ))}
            </div>
          </fieldset>

          <Field label="Additional context (optional)">
            <TextArea
              value={basis.note}
              onChange={(s) => updateBasis({ note: s })}
              placeholder="Anything that doesn't fit the twelve factors above — e.g. industry-specific context, recent layoff, geographic constraints."
            />
          </Field>

          <div className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-xs text-ink">
            <strong>Scenario modeling — not a court determination.</strong>{" "}
            Downstream amounts reflect the asserting party's proposed
            imputation blended at {pct}%. The chancellor's decision surface on
            the factor under which imputation is asserted (typically
            § 43-19-103(g), (h), or (j)) is where the imputation is actually
            ruled on.
          </div>
        </div>
      )}
    </div>
  );
}
