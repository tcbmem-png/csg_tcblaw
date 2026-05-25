# MS Deviation Worksheet — Two-Attorney Handoff + § 43-19-103 letter fix

Two shippable items in one cycle:

1. **Statutory letter fix** for factors (g)/(h)/(i) — the structured forms are shape-correct but tagged with the wrong letter, so the deployed PDF mislabels them relative to Miss. Code Ann. § 43-19-103.
2. **Two-attorney asynchronous handoff** — a shareable URL that locks the originating side's slate so opposing counsel can fill in their own client's positions, producing a real two-party document for the chancellor.

---

## Item 1 — § 43-19-103 letter fix

Bug: in `src/lib/calc/ms/reconciliation.ts` plus `src/lib/calc/ms/types.ts` and `calc.ts`, the structured types are tagged:

- `MSStructuredG` (shared-parental fields) → `letter: "g"`  ❌ statute says (i)
- `MSStructuredH` (asset fields) → `letter: "h"`  ❌ statute says (g)
- `MSStructuredI` (childcare fields) → `letter: "i"`  ❌ statute says (h)

Statute correct mapping:

- (g) Total available assets of obligee, obligor, and the child
- (h) Payment by obligee of child care expenses (employment or disability)
- (i) The particular shared parental arrangement

### Changes

- **`src/lib/calc/ms/types.ts`** — swap the `letter` literals: assets struct becomes `letter: "g"`, childcare struct becomes `letter: "h"`, parental struct becomes `letter: "i"`. Rename the interface aliases for clarity (`MSStructuredAssets`, `MSStructuredChildcare`, `MSStructuredParental`) and keep `MSStructuredG/H/I` as type aliases pointing at the renamed interfaces so call sites don't churn.
- **`src/lib/calc/ms/reconciliation.ts`** — `FACTOR_TITLES` and `FACTOR_STATUTORY_TEXT` get the (g)/(h)/(i) text swapped to match the statute.
- **`src/lib/calc/ms/calc.ts`** — `defaultDeviation(letter)` factory: the branch arms for `g/h/i` now produce the correct struct shape per the new mapping. `defaultMSInputs` rebuilds `deviationsA` in the corrected `a..j` order (element [6]=assets, [7]=childcare, [8]=parental).
- **`src/components/calculator/ms/deviation-factor-form.tsx`, `party-factor-block.tsx`, `deviation-walkthrough.tsx`, `inputs.tsx`** — any `switch (letter)` or `letter === "g"` branches that select which structured sub-form to render are updated to the new mapping. Renderers select by struct *kind*, not by letter, wherever possible.
- **`src/lib/pdf/ms-deviation-pdf.ts`, `ms-worksheet-pdf.ts`** — no logic change; they already key off `letter` for label display, which now corresponds to the statute.

### Migration of existing share URLs

Pre-fix v2 URLs encoded the wrong-letter slate data. Safest path, consistent with the v1→v2 precedent already in `share.ts`: on decode, if any `deviationsA[i]/deviationsB[i]` element's `letter` mismatches the canonical position-to-letter mapping OR carries a struct shape that no longer matches the new letter, reset those three slots (g/h/i) to defaults and `console.warn` once. The other seven factors come through untouched. No silent data corruption.

### Tests

- `__tests__/reconciliation.test.ts` — extend with explicit assertions that `FACTOR_TITLES.g` mentions "assets," `FACTOR_TITLES.h` mentions "child care," `FACTOR_TITLES.i` mentions "parental arrangement."
- New `__tests__/letter-mapping.test.ts` — for each letter `a..j`, assert `defaultDeviation(letter).letter === letter` and that the struct shape matches the statute (presence of asset fields for g, monthlyCost+reason for h, overnight counts for i).
- Share round-trip test: encode a pre-fix-shaped payload (letter g carrying parental shape) and assert decode resets those slots.

---

## Item 2 — Two-attorney handoff

(Unchanged from the approved plan; clarifications C1/C2/C3 and the labeling confirmation folded in.)

### Data model (`types.ts`, `calc.ts`, `share.ts`)

Add `handoff` to `MSInputs`:

- `originatingSide: "A" | "B"` — which slate is owned by the originating attorney's client. **No implicit obligor/obligee semantics**; both slates are symmetrical and labeling derives from `caption.obligorLabel` / `caption.obligeeLabel`. A practitioner representing the obligee can originate from slate A without consequence.
- `originatingAttorney: string` — frozen at share time from `caption.preparedBy`.
- `receivingAttorney?: string` — captured optionally from the receiving landing banner (see C3).
- `status: "single" | "shared" | "completed"` — default `"single"`. Becomes `"shared"` when the originating side generates a handoff URL. Becomes `"completed"` on the first receiving-side edit.

Payload bumps to `v: 3`. v2 URLs hydrate cleanly because `handoff` is optional and defaults to `status: "single"`.

URL transport for the side identifier uses `?side=A|B` (Approach A — no signing, professional ethics is the deterrent per the brief). The calculator reads it on load and treats the *other* slate as read-only for the session.

When `handoff.status !== "single"`, force `comparisonMode === "side_by_side"` and ensure `deviationsB` exists.

### Originating flow

New `src/components/calculator/ms/handoff-share-dialog.tsx`, opened from a button in `result-sidebar.tsx` near the PDF actions, labeled **"Share with opposing counsel."** The dialog:

1. Confirms which side the originating attorney represents (default inferred from caption, fully editable — slate A or B, no obligor/obligee semantics baked in).
2. Per-factor checklist offering to clear the originating attorney's scratch entries on the *other* slate (default: clear), since those were one-sided characterizations.
3. Snapshots state, sets `handoff = { originatingSide, originatingAttorney: caption.preparedBy, status: "shared" }`, encodes, and produces `…/ms?s=<payload>&side=<receivingSide>`.
4. Copy-to-clipboard + plain-text URL preview.
5. **Local self-open detector (C2):** writes a short opaque token to `localStorage` keyed by a hash of the share payload. Purely client-local, no telemetry. If the same browser later loads the URL, the receiving banner shows a yellow one-liner: *"This browser generated this handoff URL. Entries you make here will be attributed to opposing counsel in the PDF."* No block, no other warning surface. Different browser → no signal at all, matching the brief's non-detection posture.

### Receiving flow (`src/routes/ms.tsx` + components)

On load, if `?side=` is present and `handoff.status !== "single"`:

- **Landing banner** above the calculator explaining context, naming the originating attorney and the side the recipient is expected to fill in (verbiage from brief §"Receiving Practitioner" item 1).
- **`receivingAttorney` capture (C3):** the banner contains an inline optional "Your name / firm" text field, captured before any editing happens. Blank is fine — PDF renders attribution as *"Per opposing counsel (name not provided): …"*. Never blocks editing.
- **Case info lock:** caption, child ages, AGI/income, statutory percentage, and health-insurance add-on render as read-only summary rows in `inputs.tsx` with a small lock affordance and a "flag to opposing counsel" hint (copy text only).
- **Per-party block lock:** in `party-factor-block.tsx` and `deviation-factor-form.tsx`, the originating slate's inputs are disabled and carry an attribution caption (*"Entered by counsel for the [Obligor|Obligee]"* — derived from caption labels + `originatingSide`) and a lock icon. The receiving slate stays fully editable.
- **In-play selector** stays independent per side (already structurally true).
- First receiving-slate edit flips `handoff.status` to `"completed"`.

### URL preservation (C1)

The auto-sync effect in `ms.tsx` always preserves `?side=` when re-writing `?s=` on the receiving practitioner's URL once `handoff.status === "completed"`. The completed worksheet is a record; anyone the receiving practitioner forwards the URL to (chancellor, mediator, co-counsel) sees the same locked originating slate. The originating "Share" dialog strips `?side=` when generating a *new* handoff URL.

### Reconciliation (`deviation-reconciliation.tsx`)

When `handoff.status === "shared"` and the receiving slate is empty, render an *"Awaiting opposing counsel's input"* placeholder in the receiving column and gray out gap / cumulative columns. Once any receiving entry exists, normal reconciliation resumes.

### PDF attribution (`ms-deviation-pdf.ts`, `ms-worksheet-pdf.ts`)

When `handoff.status === "completed"`:

- Header line under case caption: *"Worksheet prepared by [originatingAttorney] (counsel for the [side]) and [receivingAttorney or 'opposing counsel (name not provided)'] (counsel for the [other side]). Each side's positions on the § 43-19-103 factors were entered by counsel for that side."*
- Each non-empty per-party factor block prefixed *"Per counsel for the [Obligor|Obligee]: …"* — side labels derived from `caption.obligorLabel` / `caption.obligeeLabel` joined with the slate-to-side mapping.
- Reconciliation table and proposed final order: unchanged structurally.

When `status === "single"`: PDFs render exactly as today, no attribution lines, no prefixes. Two-party format is strictly opt-in via handoff.

### Tests

- `__tests__/share.test.ts` (new) — v3 round-trip with `handoff`; v2 → v3 hydration produces `status: "single"`; `?side=` parsing; `?side=` preservation invariant on re-encode.
- `__tests__/reconciliation.test.ts` — add a "shared, receiving empty" case asserting the report flags the receiving column as awaiting input.
- `__tests__/handoff.test.ts` (new) — scrubbing transform clears the other side's slate when the originating practitioner opts in; `originatingSide` carries no obligor/obligee semantics.

Browser-driven verification is left for the manual pass per the brief — single-attorney regression, originating-only, both-sides, originating-attorney-opens-own-URL edge case.

### Out of scope

No authentication, no signed tokens, no realtime collaboration, no server-side document storage, no secure document exchange. All explicit non-goals from the brief.

---

## File touch list (combined)

- `src/lib/calc/ms/types.ts`, `calc.ts`, `share.ts`, `reconciliation.ts`
- `src/components/calculator/ms/inputs.tsx`, `party-factor-block.tsx`, `deviation-factor-form.tsx`, `deviation-walkthrough.tsx`, `deviation-reconciliation.tsx`, `result-sidebar.tsx`
- `src/components/calculator/ms/handoff-share-dialog.tsx` (new)
- `src/routes/ms.tsx`
- `src/lib/pdf/ms-deviation-pdf.ts`, `ms-worksheet-pdf.ts`
- `src/lib/calc/ms/__tests__/reconciliation.test.ts` (extended)
- `src/lib/calc/ms/__tests__/letter-mapping.test.ts` (new)
- `src/lib/calc/ms/__tests__/share.test.ts` (new)
- `src/lib/calc/ms/__tests__/handoff.test.ts` (new)
