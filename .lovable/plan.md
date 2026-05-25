## Scope

Per your answers: **Full Phase 1 + Phase 2**, **save spec**, **rename without shim** (old MS share URLs will lose deviations — accepted).

## What ships

### 1. Spec preserved
- `docs/MS_Deviation_Worksheet_v2.md` — copy of the uploaded spec, alongside the existing `docs/TN_Income_Module.md`.

### 2. Type & calc rewrite (`src/lib/calc/ms/`)

`types.ts`:
- Rename `deviations` → `deviationsA`; add optional `deviationsB` for side-by-side.
- Add `comparisonMode: 'single' | 'side_by_side'`, `positionALabel`, `positionBLabel`.
- Add `MSDeviationStructured` discriminated union (one variant per factor a–j) with the fields from spec §3.1–§3.10. `MSDeviation` gets optional `structured` plus the existing `description` + `proposedMonthly` (kept).
- Add `agiBasis: 'actual' | 'imputed'` + `imputationBasis: {pastEarnings, jobSkills, localMarket, availableEmployers, other}` flags + optional `imputationBasisNote`.
- Add `incarceration: { status: 'none' | 'under_180' | 'over_180', reasons: { domesticViolence, childAbuse, criminalNonpayment }, hasMeansToPay: boolean }`.
- `MSOutputs` adds: `suspensionApplies: boolean`, `suspensionReason: string | null`, and (for side-by-side) optional `positionBComputation` mirror of the deviation totals + final.

`calc.ts`:
- Pre-check incarceration. If `status === 'over_180'` AND no carve-out reason AND `!hasMeansToPay` → short-circuit: `suspensionApplies=true`, `proposedFinalMonthly=0`, set warning citing § 43-19-36(2) and the 60-day resumption rule.
- Otherwise compute as today, but using `deviationsA`. If side-by-side, also compute Position B totals.
- `defaultMSInputs()` updated for new fields.
- Update unit tests in `src/lib/calc/ms/__tests__/calc.test.ts` for incarceration scenarios (tests D and E) and renamed field.

### 3. Share encoding
- `src/lib/calc/ms/share.ts` bumps to schema v2 with new field names. Old `v: 1` payloads parse to defaults (deviations lost) — no shim, per your call. Decoder logs a one-line warning to console.

### 4. UI components (`src/components/calculator/ms/`)

New files:
- `incarceration-check.tsx` — top-of-AGI gate with the three-radio status and conditional carve-out checklist + means-to-pay. Renders the live finding banner.
- `imputation-basis.tsx` — actual vs imputed radio under the gross-income field with the five basis checkboxes and the § 43-19-101(5) note.
- `deviation-mode-picker.tsx` — the "walk me through / let me pick" radio, plus the single vs side-by-side picker.
- `deviation-walkthrough.tsx` — sequential 1-of-10 stepper. Yes/No/Skip per factor; "Yes" reveals the structured sub-form inline; Back/Continue nav; end-of-walkthrough summary.
- `deviation-factor-form.tsx` — single component that switches on factor letter and renders the structured sub-form for that letter (all 10 forms in one file with a `switch` to keep file count sane — spec suggests one file per factor but a discriminated render is cleaner and matches our existing patterns). Free-text "Additional context" + signed monthly amount stay at the bottom.
- `deviation-comparison.tsx` — side-by-side two-column renderer per factor with per-factor gap + aggregate gap footer.

Edit `src/components/calculator/ms/inputs.tsx`:
- Wire in incarceration check (top), imputation basis (in AGI section), deviation mode picker + walkthrough OR card list + side-by-side toggle.
- Suppress the rest of the form when suspension applies, except in informational mode.

Edit `src/components/calculator/ms/worksheet-preview.tsx` and `result-sidebar.tsx`:
- Render suspension state ("Obligation suspended — § 43-19-36") instead of a monthly number.
- Render structured sub-fields per applicable factor.
- Render side-by-side two-column block per factor with gap + aggregate gap when in comparison mode.

### 5. PDF (`src/lib/pdf/ms-worksheet-pdf.ts`)
- Suspension short-circuit: cover-style finding page with citation, no Sections II–V.
- Section IV rewritten to print structured sub-fields per applicable factor (per spec §7), not just description + amount.
- New side-by-side mode: cover note + two-column factor blocks + aggregate gap summary.
- Imputed-AGI line in Section I notes basis when `agiBasis === 'imputed'`.

### 6. Copy updates
- `src/routes/ms_.how-it-works.income.tsx` — Section 6 retitled and rewritten around § 43-19-101(5); strike the Gillespie attribution; add a new subsection on § 43-19-36 incarceration suspension with the 180-day/60-day rules and the three carve-outs.
- `src/routes/ms_.about.tsx` — note the 2022 imputation amendment and remove any implication that incarceration is unhandled; add `/ms` known-limitations cleanup.
- `src/routes/ms_.how-it-works.tsx` — surface the walk-through + side-by-side and link to the new statutory sections.
- (Bar journal draft is not in the repo; skipping per scope.)

### 7. Verification
Build runs clean. Add/extend unit tests for: incarceration short-circuit (tests D + E), imputed-AGI flag round-trip, side-by-side totals and gap math, and walkthrough state machine reducer if extracted. Visual QA the PDF in both single-party and side-by-side modes; verify suspension renders.

## Out of scope (explicit)
- v1 share-URL shim for deviations (you chose clean break).
- Bar journal draft edits (file not in repo).
- New routes — everything lands at the existing `/ms`, `/ms/how-it-works`, `/ms/how-it-works/income`, `/ms/about`.

## Open question while I build
None blocking. If the walkthrough state grows past a simple reducer in one component, I may extract `use-deviation-walkthrough.ts` — minor and won't bounce back for approval.

## File list

Created:
- `docs/MS_Deviation_Worksheet_v2.md`
- `src/components/calculator/ms/incarceration-check.tsx`
- `src/components/calculator/ms/imputation-basis.tsx`
- `src/components/calculator/ms/deviation-mode-picker.tsx`
- `src/components/calculator/ms/deviation-walkthrough.tsx`
- `src/components/calculator/ms/deviation-factor-form.tsx`
- `src/components/calculator/ms/deviation-comparison.tsx`

Edited:
- `src/lib/calc/ms/types.ts`
- `src/lib/calc/ms/calc.ts`
- `src/lib/calc/ms/share.ts`
- `src/lib/calc/ms/__tests__/calc.test.ts`
- `src/components/calculator/ms/inputs.tsx`
- `src/components/calculator/ms/worksheet-preview.tsx`
- `src/components/calculator/ms/result-sidebar.tsx`
- `src/components/calculator/ms/unlock-pdf-panel.tsx` (only if payload shape changes need it)
- `src/lib/pdf/ms-worksheet-pdf.ts`
- `src/routes/ms_.how-it-works.income.tsx`
- `src/routes/ms_.how-it-works.tsx`
- `src/routes/ms_.about.tsx`
