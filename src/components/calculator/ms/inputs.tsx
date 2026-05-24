import type { MSInputs } from "@/lib/calc/ms/types";

type Setter = (next: MSInputs) => void;

function fmt$(n: number): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function NumInput({
  value,
  onChange,
  placeholder,
  allowNegative,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  allowNegative?: boolean;
}) {
  const display = value === 0 ? "" : fmt$(value);
  return (
    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <span className="mr-1 text-muted-foreground">$</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
        value={display}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const cleaned = e.target.value.replace(
            allowNegative ? /[^0-9.\-]/g : /[^0-9.]/g,
            "",
          );
          const n = parseFloat(cleaned);
          onChange(isNaN(n) ? 0 : n);
        }}
      />
    </div>
  );
}

function Section({
  title,
  cite,
  children,
}: {
  title: string;
  cite?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-lg border border-rule bg-card p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        {cite && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {cite}
          </span>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-ink">{label}</div>
      {children}
      {help && <div className="mt-1 text-xs text-muted-foreground">{help}</div>}
    </label>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors " +
          (checked
            ? "border-primary bg-primary"
            : "border-input bg-background")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform " +
            (checked ? "translate-x-4" : "translate-x-0.5")
          }
        />
      </button>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

function Radio<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "rounded-md border px-3 py-1.5 text-sm transition-colors " +
            (value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-ink hover:bg-accent/40")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MSCalculatorInputs({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const u = (patch: Partial<MSInputs>) => setInputs({ ...inputs, ...patch });

  return (
    <div>
      <Section title="Parties" cite="§ 43-19-101">
        <Grid>
          <Field label="Obligor (non-custodial parent) label">
            <input
              type="text"
              value={inputs.obligorLabel}
              onChange={(e) => u({ obligorLabel: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Obligee (custodial parent) label">
            <input
              type="text"
              value={inputs.obligeeLabel}
              onChange={(e) => u({ obligeeLabel: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </Grid>
      </Section>

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
          not over-withholding.
        </p>
        <Grid>
          <Field
            label="Gross annual income (all sources)"
            help="Wages, salary, bonuses, self-employment, rental income, etc."
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

      <MSDeviations inputs={inputs} setInputs={setInputs} />
    </div>
  );
}

const FACTOR_TITLES: Record<string, string> = {
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

function MSDeviations({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const update = (letter: string, patch: Partial<typeof inputs.deviations[number]>) => {
    setInputs({
      ...inputs,
      deviations: inputs.deviations.map((d) =>
        d.letter === letter ? { ...d, ...patch } : d,
      ),
    });
  };

  const total = inputs.deviations
    .filter((d) => d.applicable)
    .reduce((s, d) => s + (Number(d.proposedMonthly) || 0), 0);

  return (
    <Section title="Statutory deviations" cite="§ 43-19-103">
      <p className="text-xs text-muted-foreground">
        Toggle a factor on to propose a deviation from the presumptive amount.
        Positive values increase support; use a minus sign to decrease.
        Mississippi requires written findings before deviating —{" "}
        <em>these are your proposed numbers, not the court's order.</em>
      </p>
      {inputs.deviations.map((d) => (
        <div
          key={d.letter}
          className={
            "rounded-md border p-4 transition-colors " +
            (d.applicable ? "border-primary/40 bg-primary/5" : "border-rule bg-background")
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
              onChange={(b) => update(d.letter, { applicable: b })}
              label="Applicable"
            />
          </div>
          {d.applicable && (
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-ink">
                  Description / supporting facts
                </div>
                <textarea
                  rows={2}
                  value={d.description}
                  onChange={(e) => update(d.letter, { description: e.target.value })}
                  placeholder={d.letter === "g" ? "e.g. 50/50 schedule; obligor has children 182 nights/yr." : "Brief description of the basis for this deviation."}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-medium text-ink">
                  Proposed monthly $
                </div>
                <NumInput
                  value={d.proposedMonthly}
                  onChange={(n) => update(d.letter, { proposedMonthly: n })}
                  allowNegative
                />
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Negative reduces support.
                </div>
              </label>
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between rounded-md border border-rule bg-cream px-4 py-3">
        <span className="text-sm text-ink">Net proposed deviations</span>
        <span className="font-mono text-base text-ink">
          {total < 0 ? "-" : ""}${Math.abs(total).toLocaleString("en-US", { maximumFractionDigits: 0 })} / mo
        </span>
      </div>
    </Section>
  );
}
