import type {
  MSInputs,
  MSDeviation,
  HandoffSide,
  HandoffAttorney,
} from "@/lib/calc/ms/types";
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
} from "./deviation-walkthrough";
import { MSPartyFactorBlock } from "./party-factor-block";
import { MSDeviationReconciliation } from "./deviation-reconciliation";
import { MSChildrenRoster } from "./children-roster";

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
  lockedSide = null,
  handoffRound = 0,
  currentAuthor = null,
}: {
  inputs: MSInputs;
  setInputs: Setter;
  /** When non-null, the named slate is read-only (two-attorney handoff). */
  lockedSide?: HandoffSide | null;
  /** §1.5 audit-trail context — propagates to MSPartyFactorBlock for stamping. */
  handoffRound?: number;
  currentAuthor?: HandoffAttorney | null;
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

      <MSDeviationsSection
        inputs={inputs}
        setInputs={setInputs}
        lockedSide={lockedSide}
        handoffRound={handoffRound}
        currentAuthor={currentAuthor}
      />
    </div>
  );
}

function MSDeviationsSection({
  inputs,
  setInputs,
  lockedSide,
  handoffRound,
  currentAuthor,
}: {
  inputs: MSInputs;
  setInputs: Setter;
  lockedSide: HandoffSide | null;
  handoffRound: number;
  currentAuthor: HandoffAttorney | null;
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
          <p className="mt-3 text-xs text-muted-foreground">
            Each factor will show {inputs.obligorLabel || "the obligor"}'s
            proposed amount alongside {inputs.obligeeLabel || "the obligee"}'s.
          </p>
        )}
      </div>

      <MSDeviationModePicker inputs={inputs} setInputs={setInputs} />

      {inputs.deviationEntryMode === "walkthrough" ? (
        <MSDeviationWalkthrough
          inputs={inputs}
          setInputs={setInputs}
          handoffRound={handoffRound}
          currentAuthor={currentAuthor}
          onFinish={() => {
            /* no-op: walkthrough flips itself; user can scroll on */
          }}
        />
      ) : (
        <DeviationPickList
          inputs={inputs}
          setInputs={setInputs}
          lockedSide={lockedSide}
          handoffRound={handoffRound}
          currentAuthor={currentAuthor}
        />
      )}

      {/*
        Reconciliation / chancellor decision row renders whenever any factor
        is asserted — not only in side-by-side mode. In single-position mode
        the obligee column is suppressed internally, and the chancellor
        decision pills + pending-count badge + cumulative-through-emancipation
        projection are the doctrinally important surfaces regardless of
        whether obligee has populated a counter-slate.
      */}
      <MSDeviationReconciliation inputs={inputs} setInputs={setInputs} />

      <MSChildrenRoster inputs={inputs} setInputs={setInputs} />
    </Section>
  );
}

function DeviationPickList({
  inputs,
  setInputs,
  lockedSide,
  handoffRound,
  currentAuthor,
}: {
  inputs: MSInputs;
  setInputs: Setter;
  lockedSide: HandoffSide | null;
  handoffRound: number;
  currentAuthor: HandoffAttorney | null;
}) {
  const sideBySide =
    inputs.comparisonMode === "side_by_side" && !!inputs.deviationsB;
  const slateA = inputs.deviationsA;
  const slateB = inputs.deviationsB;

  const setObligor = (letter: string) => (next: MSDeviation) =>
    setInputs({
      ...inputs,
      deviationsA: slateA.map((d) => (d.letter === letter ? next : d)),
    });

  const setObligee = (letter: string) => (next: MSDeviation) => {
    if (!slateB) return;
    setInputs({
      ...inputs,
      deviationsB: slateB.map((d) => (d.letter === letter ? next : d)),
    });
  };

  const totalA = slateA
    .filter((d) => d.applicable)
    .reduce((s, d) => s + (Number(d.proposedMonthly) || 0), 0);
  const totalB = (slateB ?? [])
    .filter((d) => d.applicable)
    .reduce((s, d) => s + (Number(d.proposedMonthly) || 0), 0);

  return (
    <div className="space-y-3">
      {slateA.map((dA, i) => {
        const dB = slateB ? slateB[i] : undefined;
        return (
          <MSPartyFactorBlock
            key={dA.letter}
            letter={dA.letter}
            obligor={dA}
            setObligor={setObligor(dA.letter)}
            obligee={dB}
            setObligee={dB ? setObligee(dA.letter) : undefined}
            obligorLabel={inputs.obligorLabel || "Obligor"}
            obligeeLabel={inputs.obligeeLabel || "Obligee"}
            sideBySide={sideBySide}
            buildContextInputs={() => inputs}
            obligorLocked={lockedSide === "A"}
            obligeeLocked={lockedSide === "B"}
            handoffRound={handoffRound}
            currentAuthor={currentAuthor}
          />
        );
      })}
      <div className="flex items-center justify-between rounded-md border border-rule bg-cream px-4 py-3">
        <span className="text-sm text-ink">
          {sideBySide
            ? `Net proposed (${inputs.obligorLabel} / ${inputs.obligeeLabel})`
            : "Net proposed deviations"}
        </span>
        <span className="font-mono text-base text-ink">
          {sideBySide ? (
            <>
              {totalA < 0 ? "-" : ""}$
              {Math.abs(totalA).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
              /{" "}
              {totalB < 0 ? "-" : ""}$
              {Math.abs(totalB).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
              / mo
            </>
          ) : (
            <>
              {totalA < 0 ? "-" : ""}$
              {Math.abs(totalA).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
              / mo
            </>
          )}
        </span>
      </div>
    </div>
  );
}
