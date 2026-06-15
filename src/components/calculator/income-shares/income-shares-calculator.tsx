import { useMemo, useState } from "react";
import { incomeShares } from "@/lib/calc/core/income-shares";
import type { IncomeSharesSpec } from "@/lib/calc/core/spec";
import type { IncomeSharesInputs } from "@/lib/calc/core/types";

/**
 * Generic income-shares calculator UI, driven entirely by a StateSpec through
 * core/income-shares. Reused by every income_shares_gross state (AR now;
 * AL/GA next). State-specific text comes in via `meta`; the math comes from
 * the spec. No per-state components needed.
 */
export interface IncomeSharesStateMeta {
  code: string;
  name: string;
  modelLabel: string;
  /** Short citation line under the kicker. */
  cite: string;
  effectiveDate?: string;
  /** One-line description of how this state's parenting adjustment works. */
  parentingNote?: string;
}

type Tab = "inputs" | "worksheet";
type PaidBy = "parent_a" | "parent_b" | "split_pro_rata";

interface FormState {
  grossA: string;
  grossB: string;
  numChildren: number;
  parentingType: "standard" | "equal" | "custom";
  payor: "parent_a" | "parent_b";
  daysA: string;
  daysB: string;
  health: string;
  healthPaidBy: PaidBy;
  childcare: string;
  childcarePaidBy: PaidBy;
  medical: string;
  medicalPaidBy: PaidBy;
  deviation: string;
  deviationDir: "increase" | "decrease";
}

const A_LABEL = "Parent A";
const B_LABEL = "Parent B";

const num = (s: string): number => {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number): string =>
  "$" + Math.round(n).toLocaleString("en-US");
const pct = (n: number): string => (n * 100).toFixed(1) + "%";

export function IncomeSharesCalculator({
  spec,
  meta,
}: {
  spec: IncomeSharesSpec;
  meta: IncomeSharesStateMeta;
}) {
  const maxChildren = spec.schedule.maxChildren;
  const [tab, setTab] = useState<Tab>("inputs");
  const [f, setF] = useState<FormState>({
    grossA: "",
    grossB: "",
    numChildren: 1,
    parentingType: "standard",
    payor: "parent_a",
    daysA: "",
    daysB: "",
    health: "",
    healthPaidBy: "parent_b",
    childcare: "",
    childcarePaidBy: "parent_b",
    medical: "",
    medicalPaidBy: "split_pro_rata",
    deviation: "",
    deviationDir: "increase",
  });
  const set = (patch: Partial<FormState>) => setF((p) => ({ ...p, ...patch }));

  const inputs: IncomeSharesInputs = useMemo(() => {
    const addOns = [
      { id: "health_insurance", monthly: num(f.health), paidBy: f.healthPaidBy },
      {
        id: "work_related_childcare",
        monthly: num(f.childcare),
        paidBy: f.childcarePaidBy,
      },
      { id: "uninsured_medical", monthly: num(f.medical), paidBy: f.medicalPaidBy },
    ].filter((a) => a.monthly > 0);
    const directDeviations =
      num(f.deviation) > 0
        ? [
            {
              id: "deviation",
              amount: num(f.deviation),
              direction: f.deviationDir,
            },
          ]
        : [];
    return {
      parentAGrossMonthly: num(f.grossA),
      parentBGrossMonthly: num(f.grossB),
      numChildren: f.numChildren,
      parentingType: f.parentingType,
      arpForStandard: f.payor,
      parentADays: f.parentingType === "custom" ? num(f.daysA) : undefined,
      parentBDays: f.parentingType === "custom" ? num(f.daysB) : undefined,
      addOns,
      directDeviations,
    };
  }, [f]);

  const out = useMemo(() => incomeShares(spec, inputs), [spec, inputs]);
  const hasIncome = inputs.parentAGrossMonthly + inputs.parentBGrossMonthly > 0;

  const directionLabel = (d: string): string =>
    d === "parent_a_to_b"
      ? `${A_LABEL} pays ${B_LABEL}`
      : d === "parent_b_to_a"
        ? `${B_LABEL} pays ${A_LABEL}`
        : "No support owed";

  return (
    <div>
      <div className="border-b border-rule bg-cream no-print">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <a
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            ← All calculators
          </a>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-3 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {meta.name} {meta.modelLabel}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {meta.cite}
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Calculator</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80">
            Enter both parents' monthly gross incomes, the number of children,
            and the parenting arrangement. The calculator combines income, reads
            the basic obligation off the {meta.code} schedule, prorates by
            income share, and applies add-ons, the parenting adjustment, and any
            deviation you specify. Free, no signup.
          </p>
          {meta.effectiveDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              Schedule effective {meta.effectiveDate}.{" "}
              <a
                href={`/${meta.code.toLowerCase()}/how-it-works`}
                className="underline decoration-rule underline-offset-2 hover:text-primary"
              >
                How it works
              </a>
              {" · "}
              <a
                href={`/${meta.code.toLowerCase()}/about`}
                className="underline decoration-rule underline-offset-2 hover:text-primary"
              >
                About this calculator
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-6 flex gap-2 border-b border-rule no-print">
            <TabBtn active={tab === "inputs"} onClick={() => setTab("inputs")}>
              Inputs
            </TabBtn>
            <TabBtn
              active={tab === "worksheet"}
              onClick={() => setTab("worksheet")}
            >
              Worksheet
            </TabBtn>
          </div>

          {tab === "inputs" ? (
            <div className="space-y-8">
              <Section title="Income">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyField
                    label={`${A_LABEL} — monthly gross`}
                    value={f.grossA}
                    onChange={(v) => set({ grossA: v })}
                  />
                  <MoneyField
                    label={`${B_LABEL} — monthly gross`}
                    value={f.grossB}
                    onChange={(v) => set({ grossB: v })}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter each parent's adjusted gross monthly income. Imputed or
                  self-employment income should already be resolved to a monthly
                  figure.
                </p>
              </Section>

              <Section title="Children & parenting">
                <label className="block text-sm">
                  <span className="font-medium text-ink">Number of children</span>
                  <select
                    className="mt-1 block w-full rounded border border-rule bg-background px-3 py-2 text-sm"
                    value={f.numChildren}
                    onChange={(e) =>
                      set({ numChildren: Number(e.target.value) })
                    }
                  >
                    {Array.from({ length: maxChildren }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <fieldset className="mt-4">
                  <legend className="text-sm font-medium text-ink">
                    Parenting arrangement
                  </legend>
                  <div className="mt-2 space-y-2 text-sm">
                    <Radio
                      name="pt"
                      checked={f.parentingType === "standard"}
                      onChange={() => set({ parentingType: "standard" })}
                      label="Standard — one parent is the residential/custodial parent"
                    />
                    <Radio
                      name="pt"
                      checked={f.parentingType === "equal"}
                      onChange={() => set({ parentingType: "equal" })}
                      label="Approximately equal / shared (50-50)"
                    />
                    <Radio
                      name="pt"
                      checked={f.parentingType === "custom"}
                      onChange={() => set({ parentingType: "custom" })}
                      label="Custom — specify overnights with each parent"
                    />
                  </div>
                  {meta.parentingNote && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {meta.parentingNote}
                    </p>
                  )}
                </fieldset>

                {f.parentingType === "standard" && (
                  <label className="mt-4 block text-sm">
                    <span className="font-medium text-ink">
                      Paying (non-residential) parent
                    </span>
                    <select
                      className="mt-1 block w-full rounded border border-rule bg-background px-3 py-2 text-sm"
                      value={f.payor}
                      onChange={(e) =>
                        set({ payor: e.target.value as FormState["payor"] })
                      }
                    >
                      <option value="parent_a">{A_LABEL}</option>
                      <option value="parent_b">{B_LABEL}</option>
                    </select>
                  </label>
                )}

                {f.parentingType === "custom" && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label={`${A_LABEL} — overnights/yr`}
                      value={f.daysA}
                      onChange={(v) => set({ daysA: v })}
                    />
                    <NumberField
                      label={`${B_LABEL} — overnights/yr`}
                      value={f.daysB}
                      onChange={(v) => set({ daysB: v })}
                    />
                  </div>
                )}
              </Section>

              <Section title="Add-ons (pro-rated by income share)">
                <AddOnRow
                  label="Health insurance (children's portion)"
                  amount={f.health}
                  onAmount={(v) => set({ health: v })}
                  paidBy={f.healthPaidBy}
                  onPaidBy={(v) => set({ healthPaidBy: v })}
                />
                <AddOnRow
                  label="Work-related childcare"
                  amount={f.childcare}
                  onAmount={(v) => set({ childcare: v })}
                  paidBy={f.childcarePaidBy}
                  onPaidBy={(v) => set({ childcarePaidBy: v })}
                />
                <AddOnRow
                  label="Extraordinary uninsured medical"
                  amount={f.medical}
                  onAmount={(v) => set({ medical: v })}
                  paidBy={f.medicalPaidBy}
                  onPaidBy={(v) => set({ medicalPaidBy: v })}
                />
              </Section>

              <Section title="Deviation (optional)">
                <p className="mb-2 text-xs text-muted-foreground">
                  A court-ordered adjustment to the presumptive amount, supported
                  by written findings. Enter a monthly dollar amount.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyField
                    label="Deviation amount / mo"
                    value={f.deviation}
                    onChange={(v) => set({ deviation: v })}
                  />
                  <label className="block text-sm">
                    <span className="font-medium text-ink">Direction</span>
                    <select
                      className="mt-1 block w-full rounded border border-rule bg-background px-3 py-2 text-sm"
                      value={f.deviationDir}
                      onChange={(e) =>
                        set({
                          deviationDir: e.target
                            .value as FormState["deviationDir"],
                        })
                      }
                    >
                      <option value="increase">Increase the order</option>
                      <option value="decrease">Decrease the order</option>
                    </select>
                  </label>
                </div>
              </Section>
            </div>
          ) : (
            <Worksheet out={out} hasIncome={hasIncome} aLabel={A_LABEL} bLabel={B_LABEL} />
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start no-print">
          <div className="rounded-lg border border-rule bg-cream p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {meta.name} support order
            </p>
            {!hasIncome ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Enter both parents' incomes to see the calculated order.
              </p>
            ) : out.errors.length > 0 ? (
              <p className="mt-3 text-sm text-destructive">{out.errors[0]}</p>
            ) : (
              <>
                <p className="mt-2 font-serif text-4xl text-ink">
                  {money(out.allInMonthly)}
                  <span className="text-base text-muted-foreground">/mo</span>
                </p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {directionLabel(out.allInDirection)}
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-rule pt-4 text-sm">
                  <Row k="Combined income" v={money(out.combinedAGI)} />
                  <Row
                    k="Income shares"
                    v={`${pct(out.piA)} / ${pct(out.piB)}`}
                  />
                  <Row
                    k="Basic obligation (BCSO)"
                    v={
                      money(out.bcso) +
                      (out.bcsoSource === "above_cap" ? " (above cap)" : "")
                    }
                  />
                  <Row
                    k="Presumptive"
                    v={money(out.netPresumptiveSupport)}
                  />
                  {out.addOnsTotalFromA !== 0 && (
                    <Row
                      k="Add-ons (net)"
                      v={money(Math.abs(out.addOnsTotalFromA))}
                    />
                  )}
                  {out.deviationsTotalFromA !== 0 && (
                    <Row
                      k="Deviation"
                      v={money(out.deviationsTotalFromA)}
                    />
                  )}
                </dl>
                {(out.ssrApplied || out.minimumOrderApplied) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {out.ssrApplied && "Self-support reserve applied. "}
                    {out.minimumOrderApplied && "Minimum order applied."}
                  </p>
                )}
                <button
                  onClick={() => setTab("worksheet")}
                  className="mt-4 text-sm font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
                >
                  View worksheet →
                </button>
              </>
            )}
          </div>
          {out.warnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-rule bg-background p-4 text-xs text-muted-foreground">
              <p className="font-medium text-ink">Notes</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {out.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Worksheet({
  out,
  hasIncome,
  aLabel,
  bLabel,
}: {
  out: ReturnType<typeof incomeShares>;
  hasIncome: boolean;
  aLabel: string;
  bLabel: string;
}) {
  if (!hasIncome) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter incomes on the Inputs tab to generate the worksheet.
      </p>
    );
  }
  const rows: Array<[string, string]> = [
    [`${aLabel} adjusted gross`, money(out.parentAAGI)],
    [`${bLabel} adjusted gross`, money(out.parentBAGI)],
    ["Combined adjusted gross", money(out.combinedAGI)],
    [`${aLabel} income share`, pct(out.piA)],
    [`${bLabel} income share`, pct(out.piB)],
    [
      "Basic child support obligation (BCSO)",
      money(out.bcso) +
        (out.bcsoSource === "above_cap" ? " — above-chart floor" : ""),
    ],
    ["Presumptive support", money(out.netPresumptiveSupport)],
    ["Add-ons (net from payor)", money(out.addOnsTotalFromA)],
    ["Deviation (net from payor)", money(out.deviationsTotalFromA)],
    ["Final order", money(out.allInMonthly) + "/mo"],
  ];
  return (
    <div className="rounded-lg border border-rule">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr
              key={k}
              className={
                (i === rows.length - 1 ? "font-medium text-ink " : "") +
                "border-b border-rule last:border-0"
              }
            >
              <td className="px-4 py-2.5 text-ink/80">{k}</td>
              <td className="px-4 py-2.5 text-right font-mono">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <div className="mt-1 flex items-center rounded border border-rule bg-background">
        <span className="pl-3 text-muted-foreground">$</span>
        <input
          inputMode="decimal"
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        inputMode="numeric"
        className="mt-1 block w-full rounded border border-rule bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </label>
  );
}

function AddOnRow({
  label,
  amount,
  onAmount,
  paidBy,
  onPaidBy,
}: {
  label: string;
  amount: string;
  onAmount: (v: string) => void;
  paidBy: PaidBy;
  onPaidBy: (v: PaidBy) => void;
}) {
  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
      <MoneyField label={label} value={amount} onChange={onAmount} />
      <label className="block text-sm">
        <span className="font-medium text-ink">Paid by</span>
        <select
          className="mt-1 block w-full rounded border border-rule bg-background px-3 py-2 text-sm"
          value={paidBy}
          onChange={(e) => onPaidBy(e.target.value as PaidBy)}
        >
          <option value="parent_a">{A_LABEL}</option>
          <option value="parent_b">{B_LABEL}</option>
          <option value="split_pro_rata">Split pro-rata</option>
        </select>
      </label>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span className="text-ink/90">{label}</span>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono text-ink">{v}</dd>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-ink")
      }
    >
      {children}
    </button>
  );
}
