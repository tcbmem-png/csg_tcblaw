import type { MSInputs, MSIncarcerationStatus } from "@/lib/calc/ms/types";
import { Section, Field, Check, RadioStack } from "./form-primitives";

export function MSIncarcerationCheck({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: (n: MSInputs) => void;
}) {
  const inc = inputs.incarceration;
  const update = (patch: Partial<MSInputs["incarceration"]>) =>
    setInputs({ ...inputs, incarceration: { ...inc, ...patch } });
  const updateReasons = (
    patch: Partial<MSInputs["incarceration"]["reasons"]>,
  ) =>
    setInputs({
      ...inputs,
      incarceration: { ...inc, reasons: { ...inc.reasons, ...patch } },
    });

  const hasCarveOut =
    inc.reasons.domesticViolence ||
    inc.reasons.childAbuse ||
    inc.reasons.criminalNonpayment;
  const suspensionApplies =
    inc.status === "over_180" && !hasCarveOut && !inc.hasMeansToPay;

  return (
    <Section
      title={`Is ${inputs.obligorLabel} incarcerated?`}
      cite="§ 43-19-36"
    >
      <Field
        label="Current status"
        help="Mississippi suspends the support obligation by operation of law for incarceration exceeding 180 days, with three carve-outs and a means-to-pay exception."
      >
        <RadioStack<MSIncarcerationStatus>
          value={inc.status}
          onChange={(v) => update({ status: v })}
          options={[
            { value: "none", label: "No — proceed with the standard calculation." },
            { value: "under_180", label: "Yes, but for less than 180 days.", help: "Calculator proceeds normally; § 43-19-36 does not engage." },
            { value: "over_180", label: "Yes — incarceration is or will exceed 180 consecutive days.", help: "May trigger suspension by operation of law." },
          ]}
        />
      </Field>

      {inc.status === "over_180" && (
        <>
          <Field
            label="Reason for incarceration (check all that apply)"
            help="Any of these three offenses removes the suspension and preserves the full obligation under § 43-19-36(2)(b)."
          >
            <div className="space-y-2">
              <Check
                checked={inc.reasons.domesticViolence}
                onChange={(b) => updateReasons({ domesticViolence: b })}
                label="Domestic violence (§ 97-3-7)"
              />
              <Check
                checked={inc.reasons.childAbuse}
                onChange={(b) => updateReasons({ childAbuse: b })}
                label="Child abuse (§ 97-5-39)"
              />
              <Check
                checked={inc.reasons.criminalNonpayment}
                onChange={(b) => updateReasons({ criminalNonpayment: b })}
                label="Criminal nonpayment of child support (§ 97-5-3)"
              />
            </div>
          </Field>

          <Field
            label="Does the obligor have means to pay during incarceration?"
            help="Rare — prison earnings or independent income. If yes, § 43-19-36(2)(a) preserves the obligation."
          >
            <Check
              checked={inc.hasMeansToPay}
              onChange={(b) => update({ hasMeansToPay: b })}
              label="Yes — obligor has means to pay"
            />
            {inc.hasMeansToPay && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Rationale for means-to-pay finding
                  <span className="ml-1 font-normal text-muted-foreground/70">
                    (carries into the worksheet)
                  </span>
                </label>
                <textarea
                  value={inc.meansToPayRationale ?? ""}
                  onChange={(e) => update({ meansToPayRationale: e.target.value })}
                  rows={3}
                  placeholder="E.g. obligor receives ongoing royalty income unrelated to employment; prison-wage records dated …"
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>
            )}
          </Field>

          <div
            className={
              "rounded-md border-l-4 p-4 text-sm " +
              (suspensionApplies
                ? "border-primary bg-primary/10 text-ink"
                : "border-accent bg-accent/10 text-ink")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              § 43-19-36 finding
            </div>
            <div className="mt-1 font-medium">
              {suspensionApplies
                ? "Suspension applies by operation of law."
                : hasCarveOut
                  ? "A statutory carve-out applies — obligation continues."
                  : inc.hasMeansToPay
                    ? "Means-to-pay exception applies — obligation continues."
                    : "Conditions for suspension not yet met."}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The obligation resumes the first day of the month following 60
              days after release. § 43-19-36(3).
            </p>
          </div>
        </>
      )}
    </Section>
  );
}
