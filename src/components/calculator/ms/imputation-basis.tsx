import type { MSInputs, MSAgiBasis } from "@/lib/calc/ms/types";
import { Field, Check, Radio, TextArea } from "./form-primitives";

export function MSImputationBasis({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: (n: MSInputs) => void;
}) {
  const updateBasis = (patch: Partial<MSInputs["imputationBasis"]>) =>
    setInputs({
      ...inputs,
      imputationBasis: { ...inputs.imputationBasis, ...patch },
    });

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
        <div className="mt-4 space-y-3">
          <Field label="Basis for the imputed amount (check all that apply)">
            <div className="grid gap-2 md:grid-cols-2">
              <Check
                checked={inputs.imputationBasis.pastEarnings}
                onChange={(b) => updateBasis({ pastEarnings: b })}
                label="Past earnings and employment history"
              />
              <Check
                checked={inputs.imputationBasis.jobSkills}
                onChange={(b) => updateBasis({ jobSkills: b })}
                label="Job skills and educational attainment"
              />
              <Check
                checked={inputs.imputationBasis.localMarket}
                onChange={(b) => updateBasis({ localMarket: b })}
                label="Local job market & prevailing earnings"
              />
              <Check
                checked={inputs.imputationBasis.availableEmployers}
                onChange={(b) => updateBasis({ availableEmployers: b })}
                label="Available employers willing to hire"
              />
              <Check
                checked={inputs.imputationBasis.other}
                onChange={(b) => updateBasis({ other: b })}
                label="Other factors under § 43-19-101(5)"
              />
            </div>
          </Field>

          {inputs.imputationBasis.other && (
            <Field label="Describe the other factors">
              <TextArea
                value={inputs.imputationBasis.note}
                onChange={(s) => updateBasis({ note: s })}
                placeholder="Assets, residence, age, health, criminal record, record of seeking work, etc."
              />
            </Field>
          )}

          <div className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-xs text-ink">
            Mississippi law (effective July 1, 2022) requires that imputation
            be based on specific fact-gathering rather than on a standard
            amount. Be prepared to document the factual basis for the
            imputed figure.
          </div>
        </div>
      )}
    </div>
  );
}
