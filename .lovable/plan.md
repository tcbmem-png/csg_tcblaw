## Remaining work to finish MS Phase 1 + Phase 2

Core types/calc/share/tests already landed. The build is currently broken because three files still reference the old `deviations` field. This plan closes that out and ships the copy + PDF updates.

### 1. Repair the build (rename fan-out)

- `src/components/calculator/ms/inputs.tsx`
  - Mount `MSIncarcerationCheck` at the top. When `suspensionApplies`, collapse the rest of the form to an informational banner (still editable, but de-emphasized).
  - Add `MSImputationBasis` under the AGI/gross-income block; bind to `agiBasis` + `imputationBasis`.
  - Add the comparison-mode toggle (single vs side-by-side) and `positionALabel` / `positionBLabel` inputs (shown only in side-by-side).
  - Add `MSDeviationModePicker`. If `deviationEntryMode === 'walkthrough'` render `MSDeviationWalkthrough`; otherwise render the existing card list rebuilt against `deviationsA` and using `MSStructuredFactorForm` inline when a factor is marked applicable.
  - In side-by-side mode, render a second deviation column bound to `deviationsB` (lazy-init from `deviationsA` defaults on first toggle).
  - Replace every `inputs.deviations` reference with `inputs.deviationsA`.

- `src/components/calculator/ms/worksheet-preview.tsx`
  - Suspension short-circuit: render the § 43-19-36 finding card and skip Sections II–V.
  - Section I: annotate AGI line with "(imputed — § 43-19-101(5))" when `agiBasis === 'imputed'` and list the basis checkboxes selected.
  - Section IV: iterate `deviationsA` and render structured sub-fields per factor via a small `<StructuredDeviationSummary />` helper local to this file.
  - In side-by-side mode, render `MSDeviationComparison` instead of the single column and append the aggregate-gap footer.

- `src/components/calculator/ms/result-sidebar.tsx`
  - When `outputs.suspensionApplies`, show "Obligation suspended — § 43-19-36" + the resumption note instead of the monthly figure.
  - In side-by-side mode, show A / B totals and the gap.

- `src/components/calculator/ms/unlock-pdf-panel.tsx`
  - Only touch if the unlock payload shape changed; otherwise leave alone. (Expect it stays as-is — payload is still `{inputs, outputs}`.)

### 2. PDF (`src/lib/pdf/ms-worksheet-pdf.ts`)

- Top of `renderMSWorksheetPDF`: if `outputs.suspensionApplies`, render a single-page finding ("Obligation suspended by operation of law — § 43-19-36(2)") with the resumption rule and stop. No Sections II–V.
- Section I: add an "Imputed under § 43-19-101(5)" note line + bullet list of selected basis factors when `agiBasis === 'imputed'`.
- Section IV: replace the current `description + amount` block with a structured printer that switches on `factor.structured.kind` and prints the spec §7 sub-fields. Fall back to `description` when `structured` is missing.
- New helper `renderSideBySide(doc, inputs, outputs)`: two-column factor blocks with per-factor gap and aggregate-gap summary. Invoked when `inputs.comparisonMode === 'side_by_side'`.
- Update the section index/TOC if there is one.

### 3. Copy updates

- `src/routes/ms_.how-it-works.income.tsx`
  - Retitle Section 6 around § 43-19-101(5) (2022 amendment); remove the Gillespie attribution.
  - Add a new subsection on § 43-19-36 incarceration suspension: 180-day trigger, 60-day post-release resumption, three carve-outs (§ 97-3-7, § 97-5-39, § 97-5-3), means-to-pay exception.
  - Update `head()` title/description to reflect the new content.

- `src/routes/ms_.about.tsx`
  - Note the 2022 imputation amendment and remove any implication that incarceration is unhandled. Trim the "known limitations" list accordingly.

- `src/routes/ms_.how-it-works.tsx`
  - Surface the walk-through + side-by-side features and link to the new income/incarceration sections.

### 4. Verification

- Re-run `src/lib/calc/ms/__tests__/calc.test.ts` (already extended) — confirm green.
- Type-check the project (auto-run by harness).
- Visual smoke: load `/ms`, exercise (a) walkthrough mode, (b) pick mode, (c) side-by-side, (d) incarceration > 180 days with no carve-out → suspension banner + PDF finding page.
- Generate a PDF in single and side-by-side modes; QA pages as images to confirm no clipped sub-fields and the suspension page renders standalone.

### Out of scope (still)

- v1 share-URL shim.
- Bar journal draft.
- New routes.

### Open question while building

If `inputs.tsx` grows unwieldy after wiring four new sub-components, I may extract a `ms-deviation-section.tsx` wrapper. Cosmetic — won't bounce back for approval.
