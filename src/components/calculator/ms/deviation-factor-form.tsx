/**
 * Structured sub-forms for the 10 § 43-19-103 deviation factors.
 * Per MS_Deviation_Worksheet_v2 §3. One component, switches on
 * factor letter to render the appropriate field set.
 *
 * The free-text "Additional context" + signed proposed monthly $
 * always render at the bottom — those drive the worksheet total.
 */
import type {
  MSDeviation,
  MSDeviationStructured,
  MSFactorLetter,
  MSStructuredA,
  MSStructuredB,
  MSStructuredC,
  MSStructuredD,
  MSStructuredE,
  MSStructuredF,
  MSStructuredG,
  MSStructuredH,
  MSStructuredI,
  MSStructuredJ,
  MSExpenseDuration,
} from "@/lib/calc/ms/types";
import {
  NumInput,
  PlainNumInput,
  TextInput,
  TextArea,
  Field,
  Check,
  Radio,
  Grid,
} from "./form-primitives";

export function defaultStructured(letter: MSFactorLetter): MSDeviationStructured {
  switch (letter) {
    case "a":
      return {
        letter: "a",
        types: { medical: false, psychological: false, educational: false, dental: false },
        description: "",
        currentMonthlyCost: 0,
        anticipatedDuration: "",
        documentation: { bills: false, eobs: false, treatmentPlan: false, other: false, otherNote: "" },
        insuranceCovered: 0,
        outOfPocket: 0,
        currentlyPaidBy: "",
        allocationObligorPct: 50,
      };
    case "b":
      return {
        letter: "b",
        earnedMonthly: 0,
        ssBenefitsMonthly: 0,
        trustMonthly: 0,
        investmentMonthly: 0,
        otherMonthly: 0,
        otherNote: "",
        reliableRecurring: "",
        description: "",
      };
    case "c":
      return {
        letter: "c",
        status: "",
        currentMonthly: 0,
        basis: { courtOrder: false, propertySettlement: false, pendingDissolution: false, caseNumber: "" },
        description: "",
      };
    case "d":
      return {
        letter: "d",
        incomeVaries: false,
        expensesVary: false,
        whichParent: "",
        peakMonths: "",
        lowMonths: "",
        highMonthGross: 0,
        lowMonthGross: 0,
        source: "",
        approach: "",
        adjustedMonthlyAmount: 0,
        buildInNote: "",
      };
    case "e":
      return {
        letter: "e",
        ages: "",
        greaterPerChildCosts: false,
        greaterEducational: false,
        needsJustifyUpward: false,
        itemsNotCovered: "",
      };
    case "f":
      return {
        letter: "f",
        categories: { activities: false, religious: false, educationalEnrichment: false, travel: false, other: false },
        description: "",
        establishedPattern: "",
        monthlyCost: 0,
        evidence: { receipts: false, photos: false, testimony: false, other: false, otherNote: "" },
      };
    case "g":
      return {
        letter: "g",
        arrangement: "",
        arrangementOther: "",
        obligorOvernights: 0,
        obligeeOvernights: 0,
        directExpenses: {
          foodMonthly: 0,
          activitiesMonthly: 0,
          clothingMonthly: 0,
          transportationMonthly: 0,
          otherMonthly: 0,
          otherNote: "",
        },
        duplicatedExpenses: "",
        duplicatedExpensesNote: "",
        approach: "",
        downwardAmount: 0,
        approachOther: "",
      };
    case "h":
      return {
        letter: "h",
        obligor: { realEstate: 0, equity: 0, investments: 0, retirement: 0, business: 0, other: 0, otherNote: "" },
        obligee: { realEstate: 0, equity: 0, investments: 0, retirement: 0, business: 0, other: 0, otherNote: "" },
        child: { value: 0, note: "" },
        incomeFromAssets: "",
        partialNote: "",
        description: "",
      };
    case "i":
      return {
        letter: "i",
        reason: "",
        provider: "",
        monthlyCost: 0,
        hoursPerWeek: 0,
        childrenCoveredNote: "",
        taxCredit: "",
        netOutOfPocket: 0,
        allocation: "",
        allocationOther: "",
      };
    case "j":
      return {
        letter: "j",
        basisIsExistingDebt: false,
        basisIsOtherEquity: false,
        otherEquityNote: "",
        debtType: { obligorMarital: false, obligeeMarital: false, childRelated: false, other: false, otherNote: "" },
        currentMonthlyPayment: 0,
        remainingMonths: 0,
        originalPayee: "",
        whyDeviationWorthy: "",
      };
  }
}

interface Props {
  deviation: MSDeviation;
  onChange: (next: MSDeviation) => void;
}

/**
 * Legacy entry point — renders the structured per-factor fields plus the
 * "Additional context" textarea and a "Proposed monthly $" footer. Still
 * used by the experienced-user pick list when comparison mode is "single".
 */
export function MSStructuredFactorForm({ deviation, onChange }: Props) {
  return (
    <div className="space-y-4">
      <MSStructuredDetailFields deviation={deviation} onChange={onChange} />

      <div className="rounded-md border border-rule bg-background p-3">
        <Field label="Additional context (optional)">
          <TextArea
            value={deviation.description}
            onChange={(s) => onChange({ ...deviation, description: s })}
            placeholder="Anything that doesn't fit the structured fields above."
          />
        </Field>
      </div>

      <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <Field
          label="Proposed monthly $"
          help="Positive increases support; negative reduces it. This number drives the worksheet total."
        >
          <div className="max-w-[200px]">
            <NumInput
              value={deviation.proposedMonthly}
              onChange={(n) => onChange({ ...deviation, proposedMonthly: n })}
              allowNegative
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

/**
 * Just the structured FormA–FormJ fields, with no footer. Used by the
 * brief's per-party block as an optional "Detailed evidence" disclosure on
 * the Position A side.
 */
export function MSStructuredDetailFields({ deviation, onChange }: Props) {
  const structured =
    deviation.structured && deviation.structured.letter === deviation.letter
      ? deviation.structured
      : defaultStructured(deviation.letter);

  const setStructured = (next: MSDeviationStructured) =>
    onChange({ ...deviation, structured: next });

  return <div className="space-y-4">{renderForLetter(structured, setStructured)}</div>;
}

function renderForLetter(
  s: MSDeviationStructured,
  set: (n: MSDeviationStructured) => void,
): React.ReactNode {
  switch (s.letter) {
    case "a":
      return <FormA s={s} set={set} />;
    case "b":
      return <FormB s={s} set={set} />;
    case "c":
      return <FormC s={s} set={set} />;
    case "d":
      return <FormD s={s} set={set} />;
    case "e":
      return <FormE s={s} set={set} />;
    case "f":
      return <FormF s={s} set={set} />;
    case "g":
      return <FormG s={s} set={set} />;
    case "h":
      return <FormH s={s} set={set} />;
    case "i":
      return <FormI s={s} set={set} />;
    case "j":
      return <FormJ s={s} set={set} />;
  }
}

// ===== Factor (a) — extraordinary expenses =====
function FormA({ s, set }: { s: MSStructuredA; set: (n: MSStructuredA) => void }) {
  const u = (patch: Partial<MSStructuredA>) => set({ ...s, ...patch });
  return (
    <>
      <Field label="Type of expense (check all that apply)">
        <div className="grid gap-2 md:grid-cols-2">
          <Check checked={s.types.medical} onChange={(b) => u({ types: { ...s.types, medical: b } })} label="Medical (ongoing, beyond routine)" />
          <Check checked={s.types.psychological} onChange={(b) => u({ types: { ...s.types, psychological: b } })} label="Psychological / therapy" />
          <Check checked={s.types.educational} onChange={(b) => u({ types: { ...s.types, educational: b } })} label="Educational (specialized services)" />
          <Check checked={s.types.dental} onChange={(b) => u({ types: { ...s.types, dental: b } })} label="Dental (major work)" />
        </div>
      </Field>
      <Field label="Description of the specific expense">
        <TextArea value={s.description} onChange={(v) => u({ description: v })} />
      </Field>
      <Grid>
        <Field label="Current monthly cost"><NumInput value={s.currentMonthlyCost} onChange={(n) => u({ currentMonthlyCost: n })} /></Field>
        <Field label="Anticipated duration">
          <Radio<MSExpenseDuration | "">
            value={s.anticipatedDuration}
            onChange={(v) => u({ anticipatedDuration: v })}
            options={[
              { value: "3-6 months", label: "3–6 mo" },
              { value: "6-12 months", label: "6–12 mo" },
              { value: "1-2 years", label: "1–2 yr" },
              { value: "through age 21", label: "Thru 21" },
              { value: "other", label: "Other" },
            ]}
          />
        </Field>
      </Grid>
      <Field label="Documentation available">
        <div className="grid gap-2 md:grid-cols-2">
          <Check checked={s.documentation.bills} onChange={(b) => u({ documentation: { ...s.documentation, bills: b } })} label="Provider bills / estimates" />
          <Check checked={s.documentation.eobs} onChange={(b) => u({ documentation: { ...s.documentation, eobs: b } })} label="Insurance EOBs" />
          <Check checked={s.documentation.treatmentPlan} onChange={(b) => u({ documentation: { ...s.documentation, treatmentPlan: b } })} label="Treatment plan / IEP" />
          <Check checked={s.documentation.other} onChange={(b) => u({ documentation: { ...s.documentation, other: b } })} label="Other" />
        </div>
        {s.documentation.other && (
          <div className="mt-2"><TextInput value={s.documentation.otherNote} onChange={(v) => u({ documentation: { ...s.documentation, otherNote: v } })} placeholder="Describe other documentation" /></div>
        )}
      </Field>
      <Grid>
        <Field label="Insurance-covered portion / mo"><NumInput value={s.insuranceCovered} onChange={(n) => u({ insuranceCovered: n })} /></Field>
        <Field label="Out-of-pocket / mo"><NumInput value={s.outOfPocket} onChange={(n) => u({ outOfPocket: n })} /></Field>
      </Grid>
      <Grid>
        <Field label="Currently paid by">
          <Radio<"obligor" | "obligee" | "both" | "">
            value={s.currentlyPaidBy}
            onChange={(v) => u({ currentlyPaidBy: v })}
            options={[
              { value: "obligor", label: "Obligor" },
              { value: "obligee", label: "Obligee" },
              { value: "both", label: "Both" },
            ]}
          />
        </Field>
        <Field label={`Proposed obligor share (${s.allocationObligorPct}%)`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={s.allocationObligorPct}
            onChange={(e) => u({ allocationObligorPct: parseInt(e.target.value) })}
            className="w-full accent-primary"
          />
        </Field>
      </Grid>
    </>
  );
}

// ===== Factor (b) — child's independent income =====
function FormB({ s, set }: { s: MSStructuredB; set: (n: MSStructuredB) => void }) {
  const u = (p: Partial<MSStructuredB>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Child's independent income (monthly amounts)">
        <Grid>
          <Field label="Earned (job / self-employment)"><NumInput value={s.earnedMonthly} onChange={(n) => u({ earnedMonthly: n })} /></Field>
          <Field label="Social Security (non-SSI)"><NumInput value={s.ssBenefitsMonthly} onChange={(n) => u({ ssBenefitsMonthly: n })} /></Field>
          <Field label="Trust distributions"><NumInput value={s.trustMonthly} onChange={(n) => u({ trustMonthly: n })} /></Field>
          <Field label="Investment income"><NumInput value={s.investmentMonthly} onChange={(n) => u({ investmentMonthly: n })} /></Field>
          <Field label="Other"><NumInput value={s.otherMonthly} onChange={(n) => u({ otherMonthly: n })} /></Field>
          <Field label="Describe other"><TextInput value={s.otherNote} onChange={(v) => u({ otherNote: v })} /></Field>
        </Grid>
      </Field>
      <Field label="Is the income reliable and recurring?">
        <Radio<"yes" | "no" | "">
          value={s.reliableRecurring}
          onChange={(v) => u({ reliableRecurring: v })}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
        />
      </Field>
      <Field label="Description"><TextArea value={s.description} onChange={(v) => u({ description: v })} /></Field>
    </>
  );
}

// ===== Factor (c) — spousal + child support =====
function FormC({ s, set }: { s: MSStructuredC; set: (n: MSStructuredC) => void }) {
  const u = (p: Partial<MSStructuredC>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Is the obligor also paying spousal support to the obligee?">
        <Radio<"paying" | "pending" | "no" | "">
          value={s.status}
          onChange={(v) => u({ status: v })}
          options={[
            { value: "paying", label: "Yes — currently paying" },
            { value: "pending", label: "Pending, not yet ordered" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      {s.status === "paying" && (
        <Field label="Current monthly spousal support"><NumInput value={s.currentMonthly} onChange={(n) => u({ currentMonthly: n })} /></Field>
      )}
      {(s.status === "paying" || s.status === "pending") && (
        <Field label="Basis for spousal support">
          <div className="space-y-2">
            <Check checked={s.basis.courtOrder} onChange={(b) => u({ basis: { ...s.basis, courtOrder: b } })} label="Court order" />
            <Check checked={s.basis.propertySettlement} onChange={(b) => u({ basis: { ...s.basis, propertySettlement: b } })} label="Property settlement agreement" />
            <Check checked={s.basis.pendingDissolution} onChange={(b) => u({ basis: { ...s.basis, pendingDissolution: b } })} label="Pending dissolution proceeding" />
            {s.basis.courtOrder && (
              <Field label="Case number"><TextInput value={s.basis.caseNumber} onChange={(v) => u({ basis: { ...s.basis, caseNumber: v } })} /></Field>
            )}
          </div>
        </Field>
      )}
      <Field label="Description of the combined burden"><TextArea value={s.description} onChange={(v) => u({ description: v })} /></Field>
    </>
  );
}

// ===== Factor (d) — seasonal variation =====
function FormD({ s, set }: { s: MSStructuredD; set: (n: MSStructuredD) => void }) {
  const u = (p: Partial<MSStructuredD>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Type of variation">
        <div className="space-y-2">
          <Check checked={s.incomeVaries} onChange={(b) => u({ incomeVaries: b })} label="Income varies seasonally" />
          <Check checked={s.expensesVary} onChange={(b) => u({ expensesVary: b })} label="Expenses vary seasonally" />
        </div>
      </Field>
      <Field label="Which parent">
        <Radio<"obligor" | "obligee" | "both" | "">
          value={s.whichParent}
          onChange={(v) => u({ whichParent: v })}
          options={[
            { value: "obligor", label: "Obligor" },
            { value: "obligee", label: "Obligee" },
            { value: "both", label: "Both" },
          ]}
        />
      </Field>
      <Grid>
        <Field label="Peak income months (e.g. May, Jun, Jul)"><TextInput value={s.peakMonths} onChange={(v) => u({ peakMonths: v })} /></Field>
        <Field label="Low income months"><TextInput value={s.lowMonths} onChange={(v) => u({ lowMonths: v })} /></Field>
        <Field label="High-month gross"><NumInput value={s.highMonthGross} onChange={(n) => u({ highMonthGross: n })} /></Field>
        <Field label="Low-month gross"><NumInput value={s.lowMonthGross} onChange={(n) => u({ lowMonthGross: n })} /></Field>
      </Grid>
      <Field label="Source of variation"><TextArea value={s.source} onChange={(v) => u({ source: v })} placeholder="e.g. construction trade with weather-dependent project flow." /></Field>
      <Field label="Proposed approach">
        <Radio<"annualized" | "adjusted_monthly" | "build_in" | "">
          value={s.approach}
          onChange={(v) => u({ approach: v })}
          options={[
            { value: "annualized", label: "Annualized average" },
            { value: "adjusted_monthly", label: "Adjusted monthly figure" },
            { value: "build_in", label: "Build in seasonal adjustment" },
          ]}
        />
      </Field>
      {s.approach === "adjusted_monthly" && (
        <Field label="Adjusted monthly figure"><NumInput value={s.adjustedMonthlyAmount} onChange={(n) => u({ adjustedMonthlyAmount: n })} /></Field>
      )}
      {s.approach === "build_in" && (
        <Field label="Describe the seasonal build-in"><TextArea value={s.buildInNote} onChange={(v) => u({ buildInNote: v })} /></Field>
      )}
    </>
  );
}

// ===== Factor (e) — age of the child =====
function FormE({ s, set }: { s: MSStructuredE; set: (n: MSStructuredE) => void }) {
  const u = (p: Partial<MSStructuredE>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Ages of children (comma-separated)"><TextInput value={s.ages} onChange={(v) => u({ ages: v })} placeholder="e.g. 14, 16, 17" /></Field>
      <Field label="Greater-needs argument">
        <div className="space-y-2">
          <Check checked={s.greaterPerChildCosts} onChange={(b) => u({ greaterPerChildCosts: b })} label="Older children have greater per-child costs (activities, clothing, food, transportation)" />
          <Check checked={s.greaterEducational} onChange={(b) => u({ greaterEducational: b })} label="Older children have greater educational expenses" />
          <Check checked={s.needsJustifyUpward} onChange={(b) => u({ needsJustifyUpward: b })} label="Older children's needs justify an upward deviation" />
        </div>
      </Field>
      <Field label="Specific items the standard percentage may not cover"><TextArea value={s.itemsNotCovered} onChange={(v) => u({ itemsNotCovered: v })} /></Field>
    </>
  );
}

// ===== Factor (f) — special needs traditionally in family budget =====
function FormF({ s, set }: { s: MSStructuredF; set: (n: MSStructuredF) => void }) {
  const u = (p: Partial<MSStructuredF>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Type of special need">
        <div className="grid gap-2 md:grid-cols-2">
          <Check checked={s.categories.activities} onChange={(b) => u({ categories: { ...s.categories, activities: b } })} label="Activities (sports, music, arts)" />
          <Check checked={s.categories.religious} onChange={(b) => u({ categories: { ...s.categories, religious: b } })} label="Religious / cultural / community" />
          <Check checked={s.categories.educationalEnrichment} onChange={(b) => u({ categories: { ...s.categories, educationalEnrichment: b } })} label="Educational enrichment (tutoring, summer)" />
          <Check checked={s.categories.travel} onChange={(b) => u({ categories: { ...s.categories, travel: b } })} label="Travel (family visits, annual trips)" />
          <Check checked={s.categories.other} onChange={(b) => u({ categories: { ...s.categories, other: b } })} label="Other" />
        </div>
      </Field>
      <Field label="Description"><TextArea value={s.description} onChange={(v) => u({ description: v })} /></Field>
      <Field label="Established pattern (how long, frequency)"><TextArea value={s.establishedPattern} onChange={(v) => u({ establishedPattern: v })} /></Field>
      <Field label="Current monthly cost"><div className="max-w-[200px]"><NumInput value={s.monthlyCost} onChange={(n) => u({ monthlyCost: n })} /></div></Field>
      <Field label="Evidence of historical family practice">
        <div className="grid gap-2 md:grid-cols-2">
          <Check checked={s.evidence.receipts} onChange={(b) => u({ evidence: { ...s.evidence, receipts: b } })} label="Receipts / payment records" />
          <Check checked={s.evidence.photos} onChange={(b) => u({ evidence: { ...s.evidence, photos: b } })} label="Photos / records of participation" />
          <Check checked={s.evidence.testimony} onChange={(b) => u({ evidence: { ...s.evidence, testimony: b } })} label="Testimony of family members" />
          <Check checked={s.evidence.other} onChange={(b) => u({ evidence: { ...s.evidence, other: b } })} label="Other" />
        </div>
        {s.evidence.other && (
          <div className="mt-2"><TextInput value={s.evidence.otherNote} onChange={(v) => u({ evidence: { ...s.evidence, otherNote: v } })} /></div>
        )}
      </Field>
    </>
  );
}

// ===== Factor (g) — shared parental arrangement =====
function FormG({ s, set }: { s: MSStructuredG; set: (n: MSStructuredG) => void }) {
  const u = (p: Partial<MSStructuredG>) => set({ ...s, ...p });
  return (
    <>
      <div className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-xs text-ink">
        Mississippi has no statutory shared-parenting formula. Factor (g) is
        the vehicle for any custody-based adjustment. Expect this factor to
        be the most contested in shared-parenting cases.
      </div>
      <Field label="Custody arrangement">
        <Radio<"standard" | "substantially_shared" | "equal" | "other" | "">
          value={s.arrangement}
          onChange={(v) => u({ arrangement: v })}
          options={[
            { value: "standard", label: "Standard (one primary)" },
            { value: "substantially_shared", label: "60/40 to 50/50" },
            { value: "equal", label: "Equal 50/50" },
            { value: "other", label: "Other" },
          ]}
        />
      </Field>
      {s.arrangement === "other" && (
        <Field label="Describe the arrangement"><TextArea value={s.arrangementOther} onChange={(v) => u({ arrangementOther: v })} /></Field>
      )}
      {(s.arrangement === "substantially_shared" || s.arrangement === "equal" || s.arrangement === "other") && (
        <Grid>
          <Field label="Overnights / yr with obligor"><PlainNumInput value={s.obligorOvernights} onChange={(n) => u({ obligorOvernights: n })} max={366} /></Field>
          <Field label="Overnights / yr with obligee"><PlainNumInput value={s.obligeeOvernights} onChange={(n) => u({ obligeeOvernights: n })} max={366} /></Field>
        </Grid>
      )}
      <Field label="Direct expenses borne by obligor during their parenting time (monthly)">
        <Grid>
          <Field label="Food / groceries"><NumInput value={s.directExpenses.foodMonthly} onChange={(n) => u({ directExpenses: { ...s.directExpenses, foodMonthly: n } })} /></Field>
          <Field label="Activities"><NumInput value={s.directExpenses.activitiesMonthly} onChange={(n) => u({ directExpenses: { ...s.directExpenses, activitiesMonthly: n } })} /></Field>
          <Field label="Clothing / supplies"><NumInput value={s.directExpenses.clothingMonthly} onChange={(n) => u({ directExpenses: { ...s.directExpenses, clothingMonthly: n } })} /></Field>
          <Field label="Transportation"><NumInput value={s.directExpenses.transportationMonthly} onChange={(n) => u({ directExpenses: { ...s.directExpenses, transportationMonthly: n } })} /></Field>
          <Field label="Other"><NumInput value={s.directExpenses.otherMonthly} onChange={(n) => u({ directExpenses: { ...s.directExpenses, otherMonthly: n } })} /></Field>
          <Field label="Describe other"><TextInput value={s.directExpenses.otherNote} onChange={(v) => u({ directExpenses: { ...s.directExpenses, otherNote: v } })} /></Field>
        </Grid>
      </Field>
      <Field label="Duplicated expenses between households?">
        <Radio<"yes" | "no" | "">
          value={s.duplicatedExpenses}
          onChange={(v) => u({ duplicatedExpenses: v })}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
        />
      </Field>
      {s.duplicatedExpenses === "yes" && (
        <Field label="Describe duplicated expenses"><TextArea value={s.duplicatedExpensesNote} onChange={(v) => u({ duplicatedExpensesNote: v })} placeholder="Housing, utilities, child's bedroom in both homes…" /></Field>
      )}
      <Field label="Proposed approach">
        <Radio<"none" | "downward_direct" | "other" | "">
          value={s.approach}
          onChange={(v) => u({ approach: v })}
          options={[
            { value: "none", label: "No adjustment" },
            { value: "downward_direct", label: "Downward — direct expenses" },
            { value: "other", label: "Other approach" },
          ]}
        />
      </Field>
      {s.approach === "downward_direct" && (
        <Field label="Downward adjustment amount / mo"><div className="max-w-[200px]"><NumInput value={s.downwardAmount} onChange={(n) => u({ downwardAmount: n })} /></div></Field>
      )}
      {s.approach === "other" && (
        <Field label="Describe the other approach"><TextArea value={s.approachOther} onChange={(v) => u({ approachOther: v })} /></Field>
      )}
    </>
  );
}

// ===== Factor (h) — available assets =====
function FormH({ s, set }: { s: MSStructuredH; set: (n: MSStructuredH) => void }) {
  const u = (p: Partial<MSStructuredH>) => set({ ...s, ...p });
  const Block = ({ who, val, on }: { who: "obligor" | "obligee"; val: MSStructuredH["obligor"]; on: (p: Partial<MSStructuredH["obligor"]>) => void }) => (
    <div className="rounded-md border border-rule p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{who}</div>
      <Grid>
        <Field label="Real estate value"><NumInput value={val.realEstate} onChange={(n) => on({ realEstate: n })} /></Field>
        <Field label="Equity in real estate"><NumInput value={val.equity} onChange={(n) => on({ equity: n })} /></Field>
        <Field label="Investment accounts"><NumInput value={val.investments} onChange={(n) => on({ investments: n })} /></Field>
        <Field label="Retirement accounts"><NumInput value={val.retirement} onChange={(n) => on({ retirement: n })} /></Field>
        <Field label="Business interests"><NumInput value={val.business} onChange={(n) => on({ business: n })} /></Field>
        <Field label="Other significant assets"><NumInput value={val.other} onChange={(n) => on({ other: n })} /></Field>
      </Grid>
      {val.other > 0 && (
        <div className="mt-2"><TextInput value={val.otherNote} onChange={(v) => on({ otherNote: v })} placeholder="Describe other assets" /></div>
      )}
    </div>
  );

  return (
    <>
      <Block who="obligor" val={s.obligor} on={(p) => u({ obligor: { ...s.obligor, ...p } })} />
      <Block who="obligee" val={s.obligee} on={(p) => u({ obligee: { ...s.obligee, ...p } })} />
      <div className="rounded-md border border-rule p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Child</div>
        <Grid>
          <Field label="Total assets (UTMA, trust, 529, etc.)"><NumInput value={s.child.value} onChange={(n) => u({ child: { ...s.child, value: n } })} /></Field>
          <Field label="Describe"><TextInput value={s.child.note} onChange={(v) => u({ child: { ...s.child, note: v } })} /></Field>
        </Grid>
      </div>
      <Field label="Income from assets — already in AGI?">
        <Radio<"yes_in_agi" | "no_additional" | "partial" | "">
          value={s.incomeFromAssets}
          onChange={(v) => u({ incomeFromAssets: v })}
          options={[
            { value: "yes_in_agi", label: "Yes" },
            { value: "no_additional", label: "No (additional)" },
            { value: "partial", label: "Partial" },
          ]}
        />
      </Field>
      {s.incomeFromAssets === "partial" && (
        <Field label="Describe the partial inclusion"><TextArea value={s.partialNote} onChange={(v) => u({ partialNote: v })} /></Field>
      )}
      <Field label="Description of asset disparity"><TextArea value={s.description} onChange={(v) => u({ description: v })} /></Field>
    </>
  );
}

// ===== Factor (i) — obligee child-care costs =====
function FormI({ s, set }: { s: MSStructuredI; set: (n: MSStructuredI) => void }) {
  const u = (p: Partial<MSStructuredI>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Does the obligee pay child-care expenses?">
        <Radio<"employment" | "disability" | "no" | "">
          value={s.reason}
          onChange={(v) => u({ reason: v })}
          options={[
            { value: "employment", label: "Yes — for employment" },
            { value: "disability", label: "Yes — for obligee disability" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      {(s.reason === "employment" || s.reason === "disability") && (
        <>
          <Grid>
            <Field label="Provider"><TextInput value={s.provider} onChange={(v) => u({ provider: v })} /></Field>
            <Field label="Hours / week"><PlainNumInput value={s.hoursPerWeek} onChange={(n) => u({ hoursPerWeek: n })} max={168} /></Field>
            <Field label="Monthly cost"><NumInput value={s.monthlyCost} onChange={(n) => u({ monthlyCost: n })} /></Field>
            <Field label="Net out-of-pocket / mo"><NumInput value={s.netOutOfPocket} onChange={(n) => u({ netOutOfPocket: n })} /></Field>
          </Grid>
          <Field label="Children covered"><TextInput value={s.childrenCoveredNote} onChange={(v) => u({ childrenCoveredNote: v })} placeholder="e.g. children 1, 2, and 3" /></Field>
          <Field label="Federal tax credit applied?">
            <Radio<"yes" | "no" | "partial" | "">
              value={s.taxCredit}
              onChange={(v) => u({ taxCredit: v })}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "partial", label: "Partial" },
              ]}
            />
          </Field>
          <Field label="Allocation proposal">
            <Radio<"full" | "pro_rata" | "other" | "">
              value={s.allocation}
              onChange={(v) => u({ allocation: v })}
              options={[
                { value: "full", label: "Add full amount as upward deviation" },
                { value: "pro_rata", label: "Pro-rate based on AGI shares" },
                { value: "other", label: "Other" },
              ]}
            />
          </Field>
          {s.allocation === "other" && (
            <Field label="Describe"><TextArea value={s.allocationOther} onChange={(v) => u({ allocationOther: v })} /></Field>
          )}
        </>
      )}
    </>
  );
}

// ===== Factor (j) — catchall equity =====
function FormJ({ s, set }: { s: MSStructuredJ; set: (n: MSStructuredJ) => void }) {
  const u = (p: Partial<MSStructuredJ>) => set({ ...s, ...p });
  return (
    <>
      <Field label="Basis for the equitable adjustment">
        <div className="space-y-2">
          <Check checked={s.basisIsExistingDebt} onChange={(b) => u({ basisIsExistingDebt: b })} label="Reasonable and necessary existing expense or debt (statutory language)" />
          <Check checked={s.basisIsOtherEquity} onChange={(b) => u({ basisIsOtherEquity: b })} label="Other equity argument" />
        </div>
      </Field>
      {s.basisIsOtherEquity && (
        <Field label="Describe the other equity argument"><TextArea value={s.otherEquityNote} onChange={(v) => u({ otherEquityNote: v })} /></Field>
      )}
      {s.basisIsExistingDebt && (
        <>
          <Field label="Type of debt">
            <div className="grid gap-2 md:grid-cols-2">
              <Check checked={s.debtType.obligorMarital} onChange={(b) => u({ debtType: { ...s.debtType, obligorMarital: b } })} label="Marital debt paid by obligor" />
              <Check checked={s.debtType.obligeeMarital} onChange={(b) => u({ debtType: { ...s.debtType, obligeeMarital: b } })} label="Marital debt paid by obligee" />
              <Check checked={s.debtType.childRelated} onChange={(b) => u({ debtType: { ...s.debtType, childRelated: b } })} label="Child-related debt (medical, educational)" />
              <Check checked={s.debtType.other} onChange={(b) => u({ debtType: { ...s.debtType, other: b } })} label="Other" />
            </div>
            {s.debtType.other && (
              <div className="mt-2"><TextInput value={s.debtType.otherNote} onChange={(v) => u({ debtType: { ...s.debtType, otherNote: v } })} /></div>
            )}
          </Field>
          <Grid>
            <Field label="Current monthly payment"><NumInput value={s.currentMonthlyPayment} onChange={(n) => u({ currentMonthlyPayment: n })} /></Field>
            <Field label="Remaining term (months)"><PlainNumInput value={s.remainingMonths} onChange={(n) => u({ remainingMonths: n })} /></Field>
          </Grid>
          <Field label="Original creditor / payee"><TextInput value={s.originalPayee} onChange={(v) => u({ originalPayee: v })} /></Field>
        </>
      )}
      <Field label="Why this rises above ordinary financial obligations both parents have"><TextArea value={s.whyDeviationWorthy} onChange={(v) => u({ whyDeviationWorthy: v })} rows={3} /></Field>
    </>
  );
}
