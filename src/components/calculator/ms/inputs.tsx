import type { MSInputs, MSDeviation } from "@/lib/calc/ms/types";
import { calculateMS, defaultDeviation } from "@/lib/calc/ms/calc";
import {
  NumInput,
  Section,
  Field,
  Grid,
  Toggle,
  Radio,
  TextInput,
} from "./form-primitives";
import { MSIncarcerationCheck } from "./incarceration-check";
import { MSImputationBasis } from "./imputation-basis";
import {
  MSDeviationModePicker,
  MSDeviationWalkthrough,
  FACTOR_TITLES,
} from "./deviation-walkthrough";
import { defaultStructured } from "./deviation-factor-form";
import { MSPartyFactorBlock } from "./party-factor-block";
import { MSDeviationReconciliation } from "./deviation-reconciliation";

type Setter = (next: MSInputs) => void;

function monthlyHint(annual: number): string {
  if (!annual || annual <= 0) return "";
  const m = Math.round(annual / 12);
  return `(≈ $${m.toLocaleString("en-US")}/mo)`;
}

const ALL_LETTERS: MSInputs["deviationsA"][number]["letter"][] = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
];

export function MSCalculatorInputs({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const u = (patch: Partial<MSInputs>) => setInputs({ ...inputs, ...patch });
  const suspensionApplies = calculateMS(inputs).suspensionApplies;

  return (
    <div>
      <Section title="Parties" cite="§ 43-19-101">
        <Grid>
          <Field label="Obligor (non-custodial parent) label">
            <TextInput
              value={inputs.obligorLabel}
              onChange={(v) => u({ obligorLabel: v })}
            />
          </Field>
          <Field label="Obligee (custodial parent) label">
            <TextInput
              value={inputs.obligeeLabel}
              onChange={(v) => u({ obligeeLabel: v })}
            />
          </Field>
        </Grid>
      </Section>

      <p className="mb-6 -mt-2 text-xs text-muted-foreground">
        Mississippi assumes the obligor is the non-custodial parent and
        applies the statutory percentage to their AGI; the number of custody
        days is not an input. For 50/50 arrangements, use the Factor (g)
        deviation below.
      </p>

      <MSIncarcerationCheck inputs={inputs} setInputs={setInputs} />

      {suspensionApplies && (
        <div className="mb-6 rounded-md border-l-4 border-primary bg-primary/10 p-4 text-sm text-ink">
          <strong>§ 43-19-36 suspension applies.</strong> The obligation is
          suspended by operation of law. You can keep filling in the rest of
          the form for the record, but the proposed monthly amount will be
          <strong> $0</strong> and the worksheet/PDF will print a suspension
          finding instead of Sections II–V.
        </div>
      )}

      <Section title="Children" cite="§ 43-19-101(1)">
        <Field label="Number of children before the court" help="Statutory percentages: 1→14%, 2→20%, 3→22%, 4→24%, 5+→26%.">
          <Radio
            value={String(Math.min(6, Math.max(1, inputs.numChildren))) as "1" | "2" | "3" | "4" | "5" | "6"}
            onChange={(v) => u({ numChildren: parseInt(v) })}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6+" },
            ]}
          />
        </Field>
      </Section>

      <Section title={`Adjusted Gross Income — ${inputs.obligorLabel}`} cite="§ 43-19-101(3)">
        <p className="text-xs text-muted-foreground">
          MS uses obligor-only AGI. All figures are <strong>annual</strong>{" "}
          except the in-home deduction. Use the obligor's actual tax liability,
          not over-withholding. <strong>Tip:</strong> If you have a monthly
          figure, multiply by 12 before entering. Each annual field below shows
          its monthly equivalent for sanity-checking.
        </p>
        <MSImputationBasis inputs={inputs} setInputs={setInputs} />
        <Grid>
          <Field
            label="Gross annual income (all sources)"
            help={`Wages, salary, bonuses, self-employment, rental income, etc. ${monthlyHint(inputs.obligorAnnualGross)}`}
          >
            <NumInput
              value={inputs.obligorAnnualGross}
              onChange={(n) => u({ obligorAnnualGross: n })}
            />
          </Field>
          <Field
            label="Annual federal + state + local taxes"
            help="Actual tax liability — NOT withholding. Use last year's return as a starting point."
          >
            <NumInput
              value={inputs.obligorAnnualTaxes}
              onChange={(n) => u({ obligorAnnualTaxes: n })}
            />
          </Field>
          <Field
            label="Annual Social Security & Medicare"
            help="W-2 Box 4 + Box 6. Self-employed: full 15.3% SE tax."
          >
            <NumInput
              value={inputs.obligorAnnualSocialSecurity}
              onChange={(n) => u({ obligorAnnualSocialSecurity: n })}
            />
          </Field>
          <Field
            label="Annual MANDATORY retirement / disability"
            help="Government pension contributions only. 401(k), 403(b), and other voluntary contributions are NOT deductible under § 43-19-101(3)(b)(iii)."
          >
            <NumInput
              value={inputs.obligorAnnualMandatoryRetirement}
              onChange={(n) => u({ obligorAnnualMandatoryRetirement: n })}
            />
          </Field>
          <Field
            label="Pre-existing court-ordered support / yr"
            help="For OTHER children in OTHER cases under a prior order. Annual amount."
          >
            <NumInput
              value={inputs.preexistingSupportAnnual}
              onChange={(n) => u({ preexistingSupportAnnual: n })}
            />
          </Field>
          <Field
            label="In-home other-children deduction / mo"
            help="Discretionary. No statutory formula — the chancellor decides. Leave 0 unless the obligor supports other biological/adopted children living in his/her home."
          >
            <NumInput
              value={inputs.inHomeChildrenDeductionMonthly}
              onChange={(n) => u({ inHomeChildrenDeductionMonthly: n })}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Health insurance for the children" cite="§ 43-19-101(6)">
        <Field label="Who provides health insurance for the children?">
          <Radio
            value={inputs.healthInsuranceProvidedBy}
            onChange={(v) => u({ healthInsuranceProvidedBy: v })}
            options={[
              { value: "neither", label: "Neither / not applicable" },
              { value: "obligor", label: inputs.obligorLabel },
              { value: "obligee", label: inputs.obligeeLabel },
            ]}
          />
        </Field>
        {inputs.healthInsuranceProvidedBy !== "neither" && (
          <Field
            label="Children's portion of monthly premium"
            help={
              inputs.healthInsuranceProvidedBy === "obligee"
                ? "Will be ADDED to the presumptive monthly award."
                : "Informational only. The chancellor may adjust the award to reflect the obligor's share of the premium."
            }
          >
            <NumInput
              value={inputs.healthInsuranceMonthly}
              onChange={(n) => u({ healthInsuranceMonthly: n })}
            />
          </Field>
        )}
      </Section>

      <Section title="Parenting arrangement" cite="§ 43-19-103(g)">
        <Toggle
          checked={inputs.sharedCustodyFlag}
          onChange={(b) => u({ sharedCustodyFlag: b })}
          label="Shared / 50-50 parenting"
        />
        {inputs.sharedCustodyFlag && (
          <div className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-sm text-ink">
            Mississippi has <strong>no statutory 50/50 formula</strong>. Any
            adjustment for shared parenting must be made as a discretionary
            deviation under Factor (g) below.
          </div>
        )}
      </Section>

      <MSDeviationsSection inputs={inputs} setInputs={setInputs} />
    </div>
  );
}

function MSDeviationsSection({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const updateMode = (m: typeof inputs.comparisonMode) => {
    if (m === "side_by_side" && !inputs.deviationsB) {
      setInputs({
        ...inputs,
        comparisonMode: m,
        deviationsB: ALL_LETTERS.map(defaultDeviation),
      });
    } else {
      setInputs({ ...inputs, comparisonMode: m });
    }
  };

  return (
    <Section title="Statutory deviations" cite="§ 43-19-103">
      <p className="text-xs text-muted-foreground">
        Toggle a factor on to propose a deviation from the presumptive amount.
        Positive values increase support; use a minus sign to decrease.
        Mississippi requires written findings before deviating —{" "}
        <em>these are your proposed numbers, not the court's order.</em>
      </p>

      <div className="rounded-md border border-rule bg-background p-4">
        <Field label="Comparison mode">
          <Radio<typeof inputs.comparisonMode>
            value={inputs.comparisonMode}
            onChange={updateMode}
            options={[
              { value: "single", label: "Single position" },
              { value: "side_by_side", label: "Side-by-side (two positions)" },
            ]}
          />
        </Field>
        {inputs.comparisonMode === "side_by_side" && (
          <Grid>
            <Field label="Position A label">
              <TextInput
                value={inputs.positionALabel}
                onChange={(v) => setInputs({ ...inputs, positionALabel: v })}
              />
            </Field>
            <Field label="Position B label">
              <TextInput
                value={inputs.positionBLabel}
                onChange={(v) => setInputs({ ...inputs, positionBLabel: v })}
              />
            </Field>
          </Grid>
        )}
      </div>

      <MSDeviationModePicker inputs={inputs} setInputs={setInputs} />

      {inputs.deviationEntryMode === "walkthrough" ? (
        <MSDeviationWalkthrough
          inputs={inputs}
          setInputs={setInputs}
          onFinish={() => {
            /* no-op: walkthrough flips itself; user can scroll on */
          }}
        />
      ) : (
        <DeviationPickList
          slate={inputs.deviationsA}
          onChange={(next) => setInputs({ ...inputs, deviationsA: next })}
          label={
            inputs.comparisonMode === "side_by_side"
              ? inputs.positionALabel
              : null
          }
        />
      )}

      {inputs.comparisonMode === "side_by_side" &&
        inputs.deviationEntryMode === "pick" &&
        inputs.deviationsB && (
          <DeviationPickList
            slate={inputs.deviationsB}
            onChange={(next) => setInputs({ ...inputs, deviationsB: next })}
            label={inputs.positionBLabel}
          />
        )}

      {inputs.comparisonMode === "side_by_side" && (
        <MSDeviationReconciliation inputs={inputs} />
      )}

      <ChildAgesInput inputs={inputs} setInputs={setInputs} />
    </Section>
  );
}

function ChildAgesInput({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const value = (inputs.childAges ?? []).join(", ");
  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <Field
        label="Children's ages (optional)"
        help="Comma-separated, e.g. 8, 11. Powers the reconciliation view's cumulative-impact estimate. Leave blank to skip."
      >
        <TextInput
          value={value}
          onChange={(s) => {
            const parsed = s
              .split(/[,\s]+/)
              .map((t) => parseInt(t, 10))
              .filter((n) => Number.isFinite(n) && n >= 0 && n <= 21);
            setInputs({ ...inputs, childAges: parsed });
          }}
          placeholder="8, 11"
        />
      </Field>
    </div>
  );
}
    </Section>
  );
}

function DeviationPickList({
  slate,
  onChange,
  label,
}: {
  slate: MSDeviation[];
  onChange: (next: MSDeviation[]) => void;
  label: string | null;
}) {
  const update = (letter: string, patch: Partial<MSDeviation>) => {
    onChange(slate.map((d) => (d.letter === letter ? { ...d, ...patch } : d)));
  };

  const total = slate
    .filter((d) => d.applicable)
    .reduce((s, d) => s + (Number(d.proposedMonthly) || 0), 0);

  return (
    <div className="space-y-3">
      {label && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          {label}
        </div>
      )}
      {slate.map((d) => (
        <div
          key={d.letter}
          className={
            "rounded-md border p-4 transition-colors " +
            (d.applicable
              ? "border-primary/40 bg-primary/5"
              : "border-rule bg-background")
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Factor ({d.letter})
              </div>
              <div className="mt-1 text-sm font-medium text-ink">
                {FACTOR_TITLES[d.letter]}
              </div>
            </div>
            <Toggle
              checked={d.applicable}
              onChange={(b) =>
                update(d.letter, {
                  applicable: b,
                  structured:
                    b && !d.structured ? defaultStructured(d.letter) : d.structured,
                })
              }
              label="Applicable"
            />
          </div>
          {d.applicable && (
            <div className="mt-4 border-t border-rule pt-4">
              <MSStructuredFactorForm
                deviation={d}
                onChange={(next) => update(d.letter, next)}
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between rounded-md border border-rule bg-cream px-4 py-3">
        <span className="text-sm text-ink">Net proposed deviations</span>
        <span className="font-mono text-base text-ink">
          {total < 0 ? "-" : ""}$
          {Math.abs(total).toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
          / mo
        </span>
      </div>
    </div>
  );
}
