# TN Calculator UX Consolidation (revised)

Single-source-of-truth refactor: kill the redundant "Filing Details" intake, fold its three remaining responsibilities (Mother/Father role, per-child rows, deviation narrative) into the upstream sections that already collect the same facts, and reorganize the input flow.

## New section order on /tn

```text
1. Case caption                           (matter / docket / court / prepared by / client)
2. Parties, parenting plan & children     (NEW combined section — see below)
3. Income — Parent A                      (Income Helper as collapsible sub-panel)
4. Income — Parent B                      (Income Helper as collapsible sub-panel)
5. Adjustments (credits)                  (unchanged)
6. Mandatory add-ons (pro-rata)           (per-toggle "why" textareas added)
7. Discretionary deviations               (per-toggle "why" textareas added)
```

"Filing Details (AOC form)" section is deleted entirely. Income Helper moves under each parent's income section (still collapsible, default collapsed). The `comments` field on Case Caption is also deleted (its only use was a Part VI overflow that is now auto-composed).

## Section 2: combined "Parties, parenting plan & children"

Three sub-blocks **in this order** so each step pre-seeds the next.

### 2a. Parties (required role per parent)

Per parent row: label text input **+ required role segmented control** `[Mother] [Father]`. Roles are mutually exclusive across the two parents — selecting Mother on Parent A forces Parent B to Father (and vice versa), implemented as a paired toggle, not two independent radios. Until both are set, an inline notice appears ("Pick which parent is Mother — required for the AOC form"); does not block math.

Role drives AOC PDF column assignment only. Engine math stays parent-A/parent-B neutral.

### 2b. Parenting plan (ARP / PRP — picked BEFORE child DOBs)

Required choice **before** the child list expands. Three options:

- **Standard schedule** — one parent has the children most of the year (default 285 / 80).
- **Equal 50/50** — children split time equally.
- **Custom days** — different totals per parent.

#### ARP / PRP terminology + paired toggle

First time the section renders, show a one-line glossary inline:

> Tennessee labels the parent the children live with most as the **PRP** (Primary Residential Parent). The other parent is the **ARP** (Alternate Residential Parent). Support generally flows from ARP to PRP.

For Standard and Custom, render a **single paired toggle** keyed by role-qualified labels (no parent-A-vs-parent-B ambiguity):

```text
Who is the ARP (paying parent)?
  [ Jane / Mother ]   [ John / Father ]
                ARP            PRP
```

Selecting one side instantly flips the labels under the buttons so the user can see at a glance that picking "Jane / Mother = ARP" makes "John / Father = PRP". This is a single state variable (`arpForStandard`), surfaced as a toggle so they can't set both or neither. Labels use the format `${parentLabel} / ${role}` — pulls from 2a, so it can't drift.

For Equal 50/50, the ARP/PRP toggle hides and is replaced by a read-only note: "50/50 — neither parent is the ARP; cross-credit applies."

### 2c. Children (auto-seeded from 2b)

"Number of children" stepper (1–5). For each child added, the row pre-fills days **from the 2b decision**:

- Standard, ARP = Father → every child seeds `daysWithMother = 285`, `daysWithFather = 80`.
- Equal 50/50 → every child seeds 182 / 183 (or labeled "≈ 182.5 each").
- Custom (parent-level days entered) → every child seeds those parent-level days.

User can override a single child's days if that child's schedule actually differs. Override appears as a small "differs from plan" badge on that row.

**Edge case (different days per child): explicitly out of scope.** When per-child days are inconsistent, the engine still uses the parent-level day totals from 2b for math (per current behavior). The per-child override is captured for the AOC form's per-child day cells only, with an inline note: *"Per-child schedules that differ from the overall plan are recorded on the AOC form but do not change the math — consult counsel."* No new engine code paths.

Each child row also captures name + DOB. "Age of youngest child" is derived from the youngest DOB when present; falls back to a single stepper otherwise.

## Per-toggle deviation "why" capture (kills the standalone narrative)

`caption.deviationNarrative` (a single bottom-of-page textbox) is replaced by inline "Why is this a deviation?" textareas next to each toggle:

- "Mandatory add-ons" → private school toggle → inline reason.
- Same for special expenses, and any future deviation toggle.

AOC Part VI narrative is auto-composed at PDF render time with rule citations prepended:

```text
Private school tuition deviation per Rule .07(2)(d): {private school reason}.
Special expenses deviation per Rule .07(2)(d): {special expenses reason}.
```

A single "Edit composed narrative" expander lets the user override the composed text (rare). No standalone narrative box anywhere in the UI.

## What gets deleted

- `src/components/calculator/filing-details.tsx` — entire file.
- `caption.comments` — field + all UI references.
- `caption.deviationNarrative` — replaced by per-toggle `*Reason` fields on `CalcInputs`.
- "Comments / rebuttal notes" field in `case-caption.tsx`.
- `<FilingDetailsForm>` import + render in `src/routes/tn.tsx`.

`preparer_*` on the AOC PDF is filled from `caption.preparedBy` (already in Case Caption). No second preparer input.

## Backend / share-payload changes

`CaseCaption` becomes:
```ts
interface CaseCaption {
  matterName: string;
  docketNumber: string;
  court: string;
  preparedBy: string;
  client: string;
  parentARole: "mother" | "father" | null;
  parentBRole: "mother" | "father" | null;  // enforced opposite of A
  children: ChildEntry[];                    // name + dob + per-child days (override-only)
}
```

`CalcInputs` gains per-toggle reason fields:
```ts
privateSchoolReason: string;
specialExpensesReason: string;
```

### Share-link back-compat
`decodeShare` keeps reading legacy `comments` and `deviationNarrative` from v1/v2 payloads and folds them into a single "Imported narrative" override on the composed Part VI text, so existing shared URLs keep producing the same PDF output. Writing new payloads stops emitting those fields — payload bumps to `v: 3`.

## AOC PDF fill (downstream of this refactor)

This refactor produces the inputs the fillable-PDF plan needs:
- Mother/Father columns: from required `parentARole` / `parentBRole`.
- Per-child rows 1–6: from `caption.children[]` (name + DOB + per-role days, auto-seeded or overridden).
- Part VI narrative: from auto-composed per-toggle reasons.
- Preparer: from `caption.preparedBy`.

## Out of scope

- Fillable-PDF wiring (the prior Phase B). This PR is the intake-side prerequisite.
- Engine changes — math is identical. **Different days per child does NOT introduce a new math path**; per-child overrides are captured for AOC form display only.
- MS calculator — same pattern could apply later.

## Files touched

- `src/lib/calc/share.ts` — `CaseCaption` shape, `v: 3` payload, back-compat reader, paired role validator.
- `src/lib/calc/types.ts` — add reason fields to `CalcInputs`.
- `src/lib/calc/calc.ts` — `defaultInputs()` adds empty reason strings.
- `src/components/calculator/case-caption.tsx` — remove comments field.
- `src/components/calculator/inputs.tsx` — replace Parents / Children / Parenting Time sections with the combined section (2a → 2b → 2c order, paired role toggle, paired ARP/PRP toggle, child rows auto-seeded from plan, per-child "differs from plan" override). Add inline "why" textareas next to deviation toggles.
- `src/routes/tn.tsx` — drop `<FilingDetailsForm>`, reorder per the new outline.
- `src/components/calculator/filing-details.tsx` — **deleted**.
- `src/components/calculator/official-worksheet.tsx` + `src/lib/pdf/official-worksheet-pdf.ts` — read role + per-child rows + composed narrative from new sources; drop comments.
- Tests: update `src/lib/calc/__tests__/calc.test.ts`; add `share-backcompat.test.ts` for v1/v2 payloads carrying `comments` / `deviationNarrative`; add `parties-children-seed.test.tsx` (RTL) for the auto-seed-on-plan-change behavior; add a paired-toggle test ensuring Parent A = Mother forces Parent B = Father.

## Implementation phases

- **Phase A** — types + share back-compat + Case Caption comments removal + reason fields on inputs (no UI swap yet; existing UI keeps working).
- **Phase B** — build the combined Section 2 (2a → 2b → 2c) and the per-toggle "why" textareas; delete `filing-details.tsx`; wire AOC PDF to new sources.
- **Phase C** — move Income Helper into per-parent sections (collapsed by default).
- **Phase D** — test pass + manual QA against an existing v2 shared URL to confirm back-compat.

Pause after Phase B for a UI sanity check before C and D.
