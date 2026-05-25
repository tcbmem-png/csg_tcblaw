/**
 * Per-factor two-party block per MS_Deviation_Worksheet_Build_Brief §
 * "The Two-Party Frame". Provides:
 *   • In-play selector (4-state when side-by-side, 2-state in single mode)
 *   • Per-party editor with: position, facts asserted, documentation,
 *     proposed monthly $, legal authority
 *   • Optional "Detailed evidence" disclosure (Position A only) that
 *     surfaces the existing FormA–FormJ structured fields
 *   • Real-time comparison summary line
 *
 * The block writes through `proposedMonthly` on the underlying MSDeviation
 * for each side so calculateMS continues to derive the worksheet total
 * from `deviationsA[*].proposedMonthly` without change.
 */
import { useState } from "react";
import type {
  MSDeviation,
  MSFactorLetter,
  MSPartyEntry,
  MSPartyPosition,
} from "@/lib/calc/ms/types";
import {
  FACTOR_STATUTORY_TEXT,
  FACTOR_TITLES,
  buildReconciliation,
  summarizeRow,
} from "@/lib/calc/ms/reconciliation";
import {
  Field,
  NumInput,
  RadioStack,
  TextArea,
  TextInput,
} from "./form-primitives";
import { MSStructuredDetailFields } from "./deviation-factor-form";

const POSITION_OPTIONS: { value: MSPartyPosition; label: string; help?: string }[] = [
  { value: "downward", label: "Apply — downward deviation" },
  { value: "upward", label: "Apply — upward deviation" },
  {
    value: "apply_no_amount",
    label: "Apply — no specific amount proposed yet",
  },
  { value: "oppose", label: "Oppose application of this factor" },
];

const FACTOR_HELP: Record<MSFactorLetter, string> = {
  a: "What specific expense? What does it cost monthly? What portion is covered by insurance? What portion is out of pocket?",
  b: "What is the source of the child's income? What is the monthly amount?",
  c: "What is the monthly alimony obligation? Temporary or permanent? Court order or agreement?",
  d: "Describe the seasonal pattern. What months are high-earning vs. low-earning? Annual vs. monthly pattern?",
  e: "What ages are the children? What specific age-related expenses justify deviation?",
  f: "Describe the special need. How has the family historically met it? What is the monthly cost?",
  g: "Describe the parenting arrangement. Number of overnights, direct expenses each parent covers, any duplicated expenses.",
  h: "Describe the asset picture for both parties and the child. Real estate, investments, retirement, business interests.",
  i: "What is the monthly childcare cost? Is the obligee employed, seeking employment, or disabled?",
  j: "Describe the circumstance and explain why it justifies a deviation. Equitable adjustments require specific findings.",
};

type InPlay = "neither" | "obligor" | "obligee" | "both";

function inPlayFrom(dA: MSDeviation, dB: MSDeviation | undefined): InPlay {
  if (dA.applicable && dB?.applicable) return "both";
  if (dA.applicable) return "obligor";
  if (dB?.applicable) return "obligee";
  return "neither";
}

function defaultParty(): MSPartyEntry {
  return {
    position: "",
    factsAsserted: "",
    documentationReferenced: "",
    proposedMonthly: 0,
    legalAuthority: "",
  };
}

interface BlockProps {
  letter: MSFactorLetter;
  obligor: MSDeviation;
  setObligor: (next: MSDeviation) => void;
  obligee?: MSDeviation;
  setObligee?: (next: MSDeviation) => void;
  obligorLabel: string;
  obligeeLabel: string;
  sideBySide: boolean;
  buildContextInputs: () => Parameters<typeof buildReconciliation>[0];
  /** Two-attorney handoff lock — read-only slate for the originating side. */
  obligorLocked?: boolean;
  obligeeLocked?: boolean;
}

export function MSPartyFactorBlock({
  letter,
  obligor,
  setObligor,
  obligee,
  setObligee,
  obligorLabel,
  obligeeLabel,
  sideBySide,
  buildContextInputs,
  obligorLocked = false,
  obligeeLocked = false,
}: BlockProps) {
  const inPlay = inPlayFrom(obligor, obligee);

  const setInPlay = (next: InPlay) => {
    const wantA = next === "obligor" || next === "both";
    const wantB = next === "obligee" || next === "both";
    setObligor({
      ...obligor,
      applicable: wantA,
      party: obligor.party ?? defaultParty(),
    });
    if (sideBySide && setObligee && obligee) {
      setObligee({
        ...obligee,
        applicable: wantB,
        party: obligee.party ?? defaultParty(),
      });
    }
  };

  // Compute the live reconciliation row for this factor for the summary line.
  const report = buildReconciliation(buildContextInputs());
  const row = report.rows.find((r) => r.letter === letter)!;
  const summary = summarizeRow(row, obligorLabel, obligeeLabel);

  const showSelector = sideBySide
    ? [
        { value: "neither" as const, label: "Not asserted by either party" },
        { value: "obligor" as const, label: `Asserted by ${obligorLabel}` },
        { value: "obligee" as const, label: `Asserted by ${obligeeLabel}` },
        { value: "both" as const, label: "Asserted by both parties" },
      ]
    : [
        { value: "neither" as const, label: "Not asserted in this case" },
        { value: "obligor" as const, label: "This factor applies" },
      ];

  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <header className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          § 43-19-103({letter})
        </div>
        <h4 className="mt-1 font-serif text-base text-ink">
          {FACTOR_TITLES[letter]}
        </h4>
        <p className="mt-1 text-xs italic text-muted-foreground">
          "{FACTOR_STATUTORY_TEXT[letter]}"
        </p>
      </header>

      <Field label="Is this factor in play?">
        <RadioStack<InPlay>
          value={inPlay}
          onChange={setInPlay}
          options={showSelector}
        />
      </Field>

      {inPlay !== "neither" && (
        <div
          className={
            "mt-4 grid gap-4 " +
            (sideBySide && setObligee && obligee
              ? "md:grid-cols-2"
              : "grid-cols-1")
          }
        >
          {(inPlay === "obligor" || inPlay === "both") && (
            <div className={obligorLocked ? "pointer-events-none opacity-60" : ""}>
              {obligorLocked && (
                <div className="mb-1 text-[11px] text-muted-foreground">
                  Locked — from originating counsel
                </div>
              )}
              <PartyColumn
                header={obligorLabel}
                accent="obligor"
                factorLetter={letter}
                deviation={obligor}
                onChange={setObligor}
                showDetailDisclosure
              />
            </div>
          )}
          {sideBySide &&
            setObligee &&
            obligee &&
            (inPlay === "obligee" || inPlay === "both") && (
              <div className={obligeeLocked ? "pointer-events-none opacity-60" : ""}>
                {obligeeLocked && (
                  <div className="mb-1 text-[11px] text-muted-foreground">
                    Locked — from originating counsel
                  </div>
                )}
                <PartyColumn
                  header={obligeeLabel}
                  accent="obligee"
                  factorLetter={letter}
                  deviation={obligee}
                  onChange={setObligee}
                />
              </div>
            )}
        </div>
      )}

      <div className="mt-4 rounded border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs text-ink">
        {summary}
      </div>
    </div>
  );
}

function PartyColumn({
  header,
  accent,
  factorLetter,
  deviation,
  onChange,
  showDetailDisclosure = false,
}: {
  header: string;
  accent: "obligor" | "obligee";
  factorLetter: MSFactorLetter;
  deviation: MSDeviation;
  onChange: (n: MSDeviation) => void;
  showDetailDisclosure?: boolean;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const party = deviation.party ?? defaultParty();

  const updateParty = (patch: Partial<MSPartyEntry>) => {
    const next = { ...party, ...patch };
    onChange({
      ...deviation,
      party: next,
      // Keep MSDeviation.proposedMonthly in sync — this is the field
      // calculateMS reads from for the obligor-side total.
      proposedMonthly:
        patch.proposedMonthly !== undefined
          ? patch.proposedMonthly
          : deviation.proposedMonthly,
    });
  };

  return (
    <section
      className={
        "rounded-md border p-3 " +
        (accent === "obligor"
          ? "border-primary/30 bg-primary/[0.03]"
          : "border-accent/40 bg-accent/[0.05]")
      }
    >
      <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {header}
      </div>

      <div className="space-y-3">
        <Field label="Position">
          <RadioStack<MSPartyPosition>
            value={party.position}
            onChange={(v) => updateParty({ position: v })}
            options={POSITION_OPTIONS}
          />
        </Field>

        <Field
          label="Facts asserted"
          help={FACTOR_HELP[factorLetter]}
        >
          <TextArea
            value={party.factsAsserted}
            onChange={(s) => updateParty({ factsAsserted: s })}
            rows={3}
            placeholder="State the facts this party puts forward. Be specific — describe the circumstance, dollar amounts, and any documentation cited."
          />
        </Field>

        <Field label="Documentation referenced (optional)">
          <TextInput
            value={party.documentationReferenced}
            onChange={(s) => updateParty({ documentationReferenced: s })}
            placeholder="Exhibit numbers, document titles, etc."
          />
        </Field>

        <Field
          label="Proposed monthly $"
          help="Positive increases support; negative reduces it. Leave 0 if no specific amount is proposed yet."
        >
          <div className="max-w-[200px]">
            <NumInput
              value={party.proposedMonthly}
              onChange={(n) =>
                updateParty({ proposedMonthly: n })
              }
              allowNegative
            />
          </div>
        </Field>

        <Field label="Legal authority cited (optional)">
          <TextInput
            value={party.legalAuthority}
            onChange={(s) => updateParty({ legalAuthority: s })}
            placeholder="Case law, statute sections, secondary authority."
          />
        </Field>

        <Field label="Additional context (optional)">
          <TextArea
            value={deviation.description}
            onChange={(s) => onChange({ ...deviation, description: s })}
            rows={2}
            placeholder="Anything that doesn't fit the structured fields above."
          />
        </Field>

        {showDetailDisclosure && (
          <details
            open={showDetail}
            onToggle={(e) => setShowDetail((e.target as HTMLDetailsElement).open)}
            className="rounded border border-rule bg-background"
          >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-ink">
              {showDetail ? "Hide" : "Show"} detailed evidence form
              (optional, factor-specific fields)
            </summary>
            <div className="border-t border-rule p-3">
              <MSStructuredDetailFields
                deviation={deviation}
                onChange={onChange}
              />
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
