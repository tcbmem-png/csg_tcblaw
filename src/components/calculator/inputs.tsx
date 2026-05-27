import type { CalcInputs } from "@/lib/calc/types";
import { IMPUTATION_DEFAULT_ANNUAL } from "@/lib/calc/data/constants";
import { TheoreticalCreditHelper } from "./theoretical-credit-modal";

type Setter = (next: CalcInputs) => void;

function fmt$(n: number): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <span className="mr-1 text-muted-foreground">$</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
        value={value === 0 ? "" : fmt$(value)}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          const n = parseFloat(raw);
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

export function CalculatorInputs({
  inputs,
  setInputs,
}: {
  inputs: CalcInputs;
  setInputs: Setter;
}) {
  const u = (patch: Partial<CalcInputs>) => setInputs({ ...inputs, ...patch });

  return (
    <div>
      {/* Parents / Children / Parenting Time now live in the combined
          <PartiesPlanChildren> section rendered upstream in src/routes/tn.tsx.
          This component picks up at Income. */}



      <Section title={`Income — ${inputs.parentALabel}`} cite="Rule .04(3)">
        <Toggle
          checked={inputs.useImputationForA}
          onChange={(b) => u({ useImputationForA: b })}
          label="Impute income (voluntary underemployment)"
        />
        <Field
          label={
            inputs.useImputationForA
              ? "Imputed gross monthly income"
              : "Gross monthly income"
          }
          help="Use W-2 Box 5 (Medicare wages), NOT Box 1. Include all income from all sources before taxes and voluntary retirement."
        >
          <NumInput
            value={inputs.parentAGrossMonthly}
            onChange={(n) => u({ parentAGrossMonthly: n })}
          />
        </Field>
        {inputs.useImputationForA && (
          <>
            <Field
              label="Actual gross monthly income"
              help="The parent's real earnings. Used for the Comparison tab."
            >
              <NumInput
                value={inputs.parentAActualGrossMonthly ?? 0}
                onChange={(n) => u({ parentAActualGrossMonthly: n })}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink hover:bg-accent/40"
                onClick={() =>
                  u({ parentAGrossMonthly: IMPUTATION_DEFAULT_ANNUAL.female / 12 })
                }
              >
                TN default (female): ${fmt$(IMPUTATION_DEFAULT_ANNUAL.female)}/yr
              </button>
              <button
                type="button"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink hover:bg-accent/40"
                onClick={() =>
                  u({ parentAGrossMonthly: IMPUTATION_DEFAULT_ANNUAL.male / 12 })
                }
              >
                TN default (male): ${fmt$(IMPUTATION_DEFAULT_ANNUAL.male)}/yr
              </button>
            </div>
          </>
        )}
      </Section>

      <Section title={`Income — ${inputs.parentBLabel}`} cite="Rule .04(3)">
        <Toggle
          checked={inputs.useImputationForB}
          onChange={(b) => u({ useImputationForB: b })}
          label="Impute income (voluntary underemployment)"
        />
        <Field
          label={
            inputs.useImputationForB
              ? "Imputed gross monthly income"
              : "Gross monthly income"
          }
        >
          <NumInput
            value={inputs.parentBGrossMonthly}
            onChange={(n) => u({ parentBGrossMonthly: n })}
          />
        </Field>
        {inputs.useImputationForB && (
          <>
            <Field
              label="Actual gross monthly income"
              help="The parent's real earnings. Used for the Comparison tab."
            >
              <NumInput
                value={inputs.parentBActualGrossMonthly ?? 0}
                onChange={(n) => u({ parentBActualGrossMonthly: n })}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink hover:bg-accent/40"
                onClick={() =>
                  u({ parentBGrossMonthly: IMPUTATION_DEFAULT_ANNUAL.female / 12 })
                }
              >
                TN default (female): ${fmt$(IMPUTATION_DEFAULT_ANNUAL.female)}/yr
              </button>
              <button
                type="button"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink hover:bg-accent/40"
                onClick={() =>
                  u({ parentBGrossMonthly: IMPUTATION_DEFAULT_ANNUAL.male / 12 })
                }
              >
                TN default (male): ${fmt$(IMPUTATION_DEFAULT_ANNUAL.male)}/yr
              </button>
            </div>
          </>
        )}
      </Section>

      <Section title="Adjustments (credits)" cite="Rule .04(4)–(6)">
        <Grid>
          <Field label={`${inputs.parentALabel} SE tax credit / mo`}>
            <NumInput
              value={inputs.parentASECredit}
              onChange={(n) => u({ parentASECredit: n })}
            />
          </Field>
          <Field label={`${inputs.parentBLabel} SE tax credit / mo`}>
            <NumInput
              value={inputs.parentBSECredit}
              onChange={(n) => u({ parentBSECredit: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentALabel} prior support / not-in-home credit / mo`}
            help="Court-ordered prior child support actually being paid, OR documented support for other (not-in-home) qualified children. Maps to Line 1e on the official worksheet."
          >
            <NumInput
              value={inputs.parentAPriorSupport}
              onChange={(n) => u({ parentAPriorSupport: n })}
            />
            <TheoreticalCreditHelper
              mode="notinhome"
              parentLabel={inputs.parentALabel}
              parentGrossMonthly={inputs.parentAGrossMonthly}
              onApply={(n) => u({ parentAPriorSupport: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentBLabel} prior support / not-in-home credit / mo`}
            help="Court-ordered prior child support actually being paid, OR documented support for other (not-in-home) qualified children. Maps to Line 1e on the official worksheet."
          >
            <NumInput
              value={inputs.parentBPriorSupport}
              onChange={(n) => u({ parentBPriorSupport: n })}
            />
            <TheoreticalCreditHelper
              mode="notinhome"
              parentLabel={inputs.parentBLabel}
              parentGrossMonthly={inputs.parentBGrossMonthly}
              onApply={(n) => u({ parentBPriorSupport: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentALabel} in-home children credit / mo`}
            help="Theoretical support for qualified bio/adopted children who live in this parent's home and are not before the court. Line 1d."
          >
            <NumInput
              value={inputs.parentAInhomeCredit}
              onChange={(n) => u({ parentAInhomeCredit: n })}
            />
            <TheoreticalCreditHelper
              mode="inhome"
              parentLabel={inputs.parentALabel}
              parentGrossMonthly={inputs.parentAGrossMonthly}
              onApply={(n) => u({ parentAInhomeCredit: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentBLabel} in-home children credit / mo`}
            help="Theoretical support for qualified bio/adopted children who live in this parent's home and are not before the court. Line 1d."
          >
            <NumInput
              value={inputs.parentBInhomeCredit}
              onChange={(n) => u({ parentBInhomeCredit: n })}
            />
            <TheoreticalCreditHelper
              mode="inhome"
              parentLabel={inputs.parentBLabel}
              parentGrossMonthly={inputs.parentBGrossMonthly}
              onApply={(n) => u({ parentBInhomeCredit: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentALabel} SSA/VA benefit paid to child / mo`}
            help="Federal benefit paid to the child on this parent's disability/retirement record. Offsets that parent's final order at Line 16 (does not reduce AGI). Per TCA §36-5-101(a)(6) & Rule .04(10)."
          >
            <NumInput
              value={inputs.parentAFederalBenefit}
              onChange={(n) => u({ parentAFederalBenefit: n })}
            />
          </Field>
          <Field
            label={`${inputs.parentBLabel} SSA/VA benefit paid to child / mo`}
            help="Federal benefit paid to the child on this parent's disability/retirement record. Offsets that parent's final order at Line 16."
          >
            <NumInput
              value={inputs.parentBFederalBenefit}
              onChange={(n) => u({ parentBFederalBenefit: n })}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Mandatory add-ons (pro-rata)" cite="Rule .04(8)">
        <Grid>
          <Field label="Health insurance premium (children's portion) / mo">
            <NumInput
              value={inputs.healthPremiumMonthly}
              onChange={(n) => u({ healthPremiumMonthly: n })}
            />
          </Field>
          <Field label="Premium paid by">
            <Radio
              value={inputs.healthPaidBy}
              onChange={(v) => u({ healthPaidBy: v })}
              options={[
                { value: "parent_a", label: inputs.parentALabel },
                { value: "parent_b", label: inputs.parentBLabel },
              ]}
            />
          </Field>
          <Field
            label="Recurring uninsured medical / mo"
            help="Pro-rata reimbursement to the parent who pays out-of-pocket. Choose 'Split pro-rata' if both parents already pay their share directly."
          >
            <NumInput
              value={inputs.uninsuredMedicalMonthly}
              onChange={(n) => u({ uninsuredMedicalMonthly: n })}
            />
          </Field>
          <Field label="Uninsured medical paid by">
            <Radio
              value={inputs.uninsuredMedicalPaidBy}
              onChange={(v) => u({ uninsuredMedicalPaidBy: v })}
              options={[
                { value: "parent_a", label: inputs.parentALabel },
                { value: "parent_b", label: inputs.parentBLabel },
                { value: "split_pro_rata", label: "Split pro-rata" },
              ]}
            />
          </Field>
          <Field label="Work-related childcare / mo">
            <NumInput
              value={inputs.childcareMonthly}
              onChange={(n) => u({ childcareMonthly: n })}
            />
          </Field>
          <Field label="Childcare paid by">
            <Radio
              value={inputs.childcarePaidBy}
              onChange={(v) => u({ childcarePaidBy: v })}
              options={[
                { value: "parent_a", label: inputs.parentALabel },
                { value: "parent_b", label: inputs.parentBLabel },
              ]}
            />
          </Field>
          <Field
            label="Childcare payment method"
            help="Payroll-deducted (Line 8c) vs paid out-of-pocket (Line 8d) on the official AOC worksheet. No effect on the calculation."
          >
            <Radio
              value={inputs.childcarePayrollDeducted ? "yes" : "no"}
              onChange={(v) => u({ childcarePayrollDeducted: v === "yes" })}
              options={[
                { value: "no", label: "Out-of-pocket (8d)" },
                { value: "yes", label: "Payroll-deducted (8c)" },
              ]}
            />
          </Field>
        </Grid>
      </Section>

      <Section
        title="Private school (discretionary deviation)"
        cite="Rule .07(2)(d)"
      >
        <Toggle
          checked={inputs.includePrivateSchool}
          onChange={(b) => u({ includePrivateSchool: b })}
          label="Include private school as a deviation"
        />
        {inputs.includePrivateSchool && (
          <>
            <Grid>
              <Field
                label="Annual tuition (combined)"
                help="Pro-rata to income share if granted."
              >
                <NumInput
                  value={inputs.privateSchoolAnnual}
                  onChange={(n) => u({ privateSchoolAnnual: n })}
                />
              </Field>
              <Field label="Paid by">
                <Radio
                  value={inputs.privateSchoolPaidBy}
                  onChange={(v) => u({ privateSchoolPaidBy: v })}
                  options={[
                    { value: "parent_a", label: inputs.parentALabel },
                    { value: "parent_b", label: inputs.parentBLabel },
                    { value: "split_pro_rata", label: "Split pro-rata" },
                  ]}
                />
              </Field>
            </Grid>
            <Field
              label="Why is this a deviation?"
              help="Composed into the AOC Part VI narrative automatically with the Rule .07(2)(d) citation prepended."
            >
              <textarea
                value={inputs.privateSchoolReason}
                onChange={(e) => u({ privateSchoolReason: e.target.value })}
                placeholder="e.g. Westminster School; parties stipulate; in the child's best interest given continuity of curriculum."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="rounded-md border border-accent/40 bg-accent/10 p-3 text-xs text-ink">
              Private school is a <strong>discretionary deviation</strong>.
              The court must make written findings that it is in the child's
              best interest and consistent with the parents' financial
              circumstances. It is NOT a mandatory add-on.
            </div>
          </>
        )}
      </Section>


      <Section title="Special expenses (7% threshold)" cite="Rule .07(2)(d)">
        <Toggle
          checked={inputs.includeSpecialExpenses}
          onChange={(b) => u({ includeSpecialExpenses: b })}
          label="Include special expenses"
        />
        {inputs.includeSpecialExpenses && (
          <>
            <Grid>
              <Field
                label="Annual total"
                help="Camp, lessons, travel, school clubs/athletics — annual total across all children."
              >
                <NumInput
                  value={inputs.specialExpensesAnnual}
                  onChange={(n) => u({ specialExpensesAnnual: n })}
                />
              </Field>
              <Field label="Paid by">
                <Radio
                  value={inputs.specialExpensesPaidBy}
                  onChange={(v) => u({ specialExpensesPaidBy: v })}
                  options={[
                    { value: "parent_a", label: inputs.parentALabel },
                    { value: "parent_b", label: inputs.parentBLabel },
                    { value: "split_pro_rata", label: "Split pro-rata" },
                  ]}
                />
              </Field>
            </Grid>
            <Toggle
              checked={inputs.specialExpensesWaiveThreshold}
              onChange={(b) => u({ specialExpensesWaiveThreshold: b })}
              label="Parties have agreed to waive the 7% threshold"
            />
          </>
        )}
      </Section>
    </div>
  );
}
