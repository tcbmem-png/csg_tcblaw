import { useState } from "react";
import type {
  CalcInputs,
  SpecialMethodology,
  SpecialSituation,
} from "@/lib/calc/types";
import { ApplyBar, DollarInput, Field, fmt } from "./shared";

const SITUATION_LABELS: Record<SpecialSituation, string> = {
  ssi_only: "SSI-only obligor — no other income",
  incarcerated: "Incarcerated parent — imputation carve-out",
  military: "Active military servicemember — BAH/BAS included",
  federal_benefit_to_child: "Federal benefit paid TO the child on this parent's record",
};

const SITUATION_CITES: Record<SpecialSituation, string> = {
  ssi_only: "Rule .04(3)(c)(2) — means-tested only ⇒ $0 presumptive order",
  incarcerated: "Rule .04(3)(a)(2)(iii) — no imputation against incarcerated parents (carve-outs apply)",
  military: "Rule .04(3) — BAH/BAS counted in gross military income",
  federal_benefit_to_child: "TCA §36-5-101(a)(6) & Rule .04(10) — Line 16 offset (not AGI reduction)",
};

export function PathSpecialForm({
  parent,
  label,
  initial,
  currentGross,
  onCancel,
  onApply,
}: {
  parent: "A" | "B";
  label: string;
  initial?: SpecialMethodology;
  currentGross: number;
  onCancel: () => void;
  onApply: (updates: Partial<CalcInputs>, m: SpecialMethodology) => void;
}) {
  const [situation, setSituation] = useState<SpecialSituation>(
    initial?.situation ?? "ssi_only",
  );
  const [reason, setReason] = useState<NonNullable<SpecialMethodology["incarcerationReason"]>>(
    initial?.incarcerationReason ?? "other",
  );
  const [meansToPay, setMeansToPay] = useState<boolean>(initial?.hasMeansToPay ?? false);
  const [bah, setBah] = useState<number>(initial?.bahMonthly ?? 0);
  const [bas, setBas] = useState<number>(initial?.basMonthly ?? 0);
  const [milBase, setMilBase] = useState<number>(
    initial?.situation === "military" ? Math.max(0, (initial?.monthlyGrossResult ?? 0) - (initial?.bahMonthly ?? 0) - (initial?.basMonthly ?? 0)) : 0,
  );
  const [fedBenefit, setFedBenefit] = useState<number>(initial?.federalBenefitMonthly ?? 0);
  const [otherGross, setOtherGross] = useState<number>(
    initial?.situation === "federal_benefit_to_child" ? initial?.monthlyGrossResult ?? currentGross : currentGross,
  );
  const [rationale, setRationale] = useState(initial?.rationale ?? "");

  let result = 0;
  if (situation === "ssi_only") result = 0;
  else if (situation === "incarcerated") result = 0;
  else if (situation === "military") result = milBase + bah + bas;
  else if (situation === "federal_benefit_to_child") result = otherGross;

  const canApply =
    situation === "ssi_only" || situation === "incarcerated"
      ? true
      : result > 0;

  return (
    <div className="space-y-3 rounded-md border border-rule bg-background p-3 text-sm text-ink">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} · Special situation
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-ink">Situation</div>
        <div className="space-y-1">
          {(Object.keys(SITUATION_LABELS) as SpecialSituation[]).map((k) => (
            <label key={k} className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={situation === k}
                onChange={() => setSituation(k)}
              />
              <span className="text-xs text-ink">{SITUATION_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-accent/60 bg-accent/10 p-2 text-[11px] text-ink">
        <strong>Authority:</strong> {SITUATION_CITES[situation]}
      </div>

      {situation === "ssi_only" && (
        <p className="text-xs text-muted-foreground">
          SSI is means-tested. Setting this flag short-circuits the calculation
          to a $0 presumptive order for this parent's outflow. The engine
          already supports the means-tested flag — this form simply turns it on
          and documents the situation in the worksheet appendix.
        </p>
      )}

      {situation === "incarcerated" && (
        <div className="space-y-2">
          <div>
            <div className="mb-1 text-xs font-medium text-ink">Incarceration reason</div>
            <div className="space-y-1 text-xs">
              {([
                ["domestic_violence", "Domestic violence (no carve-out — imputation may still apply)"],
                ["child_abuse", "Child abuse (no carve-out)"],
                ["criminal_nonpayment", "Criminal nonpayment of support (no carve-out)"],
                ["other", "Other (carve-out applies — no imputation)"],
              ] as const).map(([k, l]) => (
                <label key={k} className="flex items-start gap-2">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={reason === k}
                    onChange={() => setReason(k)}
                  />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-1"
              checked={meansToPay}
              onChange={(e) => setMeansToPay(e.target.checked)}
            />
            <span>Parent has documented means to pay during incarceration (overrides carve-out)</span>
          </label>
        </div>
      )}

      {situation === "military" && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Base pay (monthly)">
            <DollarInput value={milBase} onChange={setMilBase} />
          </Field>
          <Field label="BAH (monthly)">
            <DollarInput value={bah} onChange={setBah} />
          </Field>
          <Field label="BAS (monthly)">
            <DollarInput value={bas} onChange={setBas} />
          </Field>
          <div className="col-span-3 rounded-md bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
            ${fmt(milBase)} + ${fmt(bah)} + ${fmt(bas)} = ${fmt(result)} / mo
          </div>
        </div>
      )}

      {situation === "federal_benefit_to_child" && (
        <div className="space-y-2">
          <Field
            label="This parent's other gross monthly income"
            help="The SSA/VA derivative paid TO the child also adds to this parent's Line 1 gross."
          >
            <DollarInput value={otherGross} onChange={setOtherGross} />
          </Field>
          <Field
            label="Monthly federal benefit paid TO child on this parent's record"
            help="Goes into Line 16 offset; the engine already credits this against the parent's FCSO."
          >
            <DollarInput value={fedBenefit} onChange={setFedBenefit} />
          </Field>
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-ink">Rationale / notes (optional)</span>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <ApplyBar
        result={result}
        canApply={canApply}
        resultLabel="Monthly gross applied"
        onCancel={onCancel}
        onApply={() => {
          const m: SpecialMethodology = {
            path: "special",
            situation,
            incarcerationReason: situation === "incarcerated" ? reason : undefined,
            hasMeansToPay: situation === "incarcerated" ? meansToPay : undefined,
            bahMonthly: situation === "military" ? bah : undefined,
            basMonthly: situation === "military" ? bas : undefined,
            federalBenefitMonthly:
              situation === "federal_benefit_to_child" ? fedBenefit : undefined,
            rationale: rationale.trim() || undefined,
            monthlyGrossResult: result,
          };
          const updates: Partial<CalcInputs> = {};
          if (parent === "A") {
            updates.parentAGrossMonthly = result;
            updates.parentAMeansTestedOnly = situation === "ssi_only";
            updates.parentAIncomeMethodology = m;
            if (situation === "federal_benefit_to_child") {
              updates.parentAFederalBenefit = fedBenefit;
            }
          } else {
            updates.parentBGrossMonthly = result;
            updates.parentBMeansTestedOnly = situation === "ssi_only";
            updates.parentBIncomeMethodology = m;
            if (situation === "federal_benefit_to_child") {
              updates.parentBFederalBenefit = fedBenefit;
            }
          }
          onApply(updates, m);
        }}
      />
    </div>
  );
}
