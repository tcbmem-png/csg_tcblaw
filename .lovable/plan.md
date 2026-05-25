# TN Income Module — Phase 2 (Paths B–F)

Build all five remaining income paths in a single cycle, on top of the existing simple-path helper. URL state stays canonical (no DB). Path E extends the already-shipped imputation infrastructure; Path F exposes already-shipped engine logic. No "Help me decide" triage — six labeled cards self-route.

## Scope

In scope:
1. **Path B — Variable income** (bonuses/commissions/OT, year averaging)
2. **Path C — Self-employed** (gross receipts − ordinary expenses + add-backs)
3. **Path D — Multi-source** (sum of arbitrary annual income sources)
4. **Path E — Imputed income** (basis-driven; writes through to existing `useImputationForA/B` + `parentA/BActualGrossMonthly`)
5. **Path F — Special situations** (SSI-only, incarcerated, military, federal benefit to child — UI exposure of existing engine logic)
6. **401(k) add-back input** on the existing Simple path
7. **Worksheet methodology appendix** extended for all new paths
8. **Share URL** extended to round-trip the per-parent path state with back-compat

Out of scope:
- `income_components` DB migration (deferred indefinitely)
- "Help me decide" triage flow
- Citation framework / dual PDF output (separate future cycles)
- Any change to BCSO / parenting-time / cap / SSR / federal-benefit-offset engine logic
- Audit of already-verified math

## Architectural Constraints (non-negotiable)

**(1) Path E extends, does not duplicate.** The existing `useImputationForA/B`, `parentA/BActualGrossMonthly`, `ImputationMiniSummary`, `ComparisonView`, `hasImputation`, `computeScenarioPair`, and the cumulative-through-majority chart all already work. Path E's only job is to provide a UI that *sets* these fields. After Path E writes, the existing Comparison tab and sidebar light up automatically. No parallel comparison view, no parallel sidebar, no parallel chart. This is the lesson learned from the MS `migrateSlate` revert.

**(2) Path F exposes, does not reimplement.** SSI-only $0-order, incarceration carve-outs, military BAH/BAS treatment, and federal-benefit-to-child line 16 offset already exist in the engine. Path F gives them a guided UI on TN that writes into existing inputs (`parentAMeansTestedOnly`, `parentAFederalBenefit`, etc.) — no new engine code.

**(3) No triage.** Six clearly labeled path cards. Practitioners self-route.

## File Plan

### New files

- `src/components/calculator/income/path-router.tsx` — six labeled cards (Simple / Variable / Self-employed / Multi-source / Imputed / Special situations) replacing the current "Set up {label}'s income →" button inside each `ParentCard`.
- `src/components/calculator/income/path-simple-form.tsx` — extracted from current `SimplePathForm` in `income-helper-panel.tsx` + new 401(k) add-back field.
- `src/components/calculator/income/path-variable-form.tsx` — Path B: years table (1–5 rows), averaging method (3-yr / 5-yr / custom), rationale, computed monthly.
- `src/components/calculator/income/path-self-employed-form.tsx` — Path C: business type, gross receipts, ordinary expenses, per-line add-backs (depreciation / §179 / vehicle / meals / home office), optional multi-year averaging, computed monthly.
- `src/components/calculator/income/path-multi-source-form.tsx` — Path D: dynamic list of `{ label, annual, methodology }` rows summed to monthly.
- `src/components/calculator/income/path-imputed-form.tsx` — Path E: basis radio (Voluntary underemployment / Failure to produce evidence / Substantial non-income-producing assets), basis-specific sub-flow:
  - *Prior-year earnings* → embed Path B averaging
  - *Vocational capacity* → occupation, area, hours/wk, rationale, proposed monthly
  - *Asset-based* → assets, rate of return, computed annual ÷ 12
  - On apply: writes `parentXActualGrossMonthly = current real income (collected separately)`, `parentXGrossMonthly = imputed`, `useImputationForX = true`.
- `src/components/calculator/income/path-special-form.tsx` — Path F: four sub-flows (SSI-only / Incarcerated / Military / Federal benefit to child). Writes into existing flags + `parentXFederalBenefit`. Includes incarceration reason flags (DV / abuse / criminal nonpayment) + means-to-pay exception, consistent with the MS incarceration UX.

### Modified files

- `src/components/calculator/income-helper-panel.tsx` — replace inline SimplePathForm with router → form dispatch; per-parent active form is one of six. Drop the "Phase 1 covers simple" footer note.
- `src/lib/calc/types.ts` — extend `IncomeMethodology` to a discriminated union over `path: "simple" | "variable" | "self_employed" | "multi_source" | "imputed" | "special"`. All new variant fields optional. Preserve existing `"simple"` shape verbatim plus a new optional `voluntaryRetirementMonthly` field for the 401(k) add-back.
- `src/lib/calc/share.ts` — bump payload to `v: 2`. `decodeShare` accepts both `v: 1` (legacy, methodology fields read straight through unchanged) and `v: 2`. Round-trip guarantee: any `v: 1` URL decodes to identical state and re-encodes as `v: 2` without data loss.
- `src/components/calculator/income-methodology-appendix.tsx` — render path-specific blocks for variable / self-employed / multi-source / imputed / special. Imputed block cross-references the existing Comparison Appendix.
- `src/lib/calc/__tests__/` — add `income-paths.test.ts` covering: each path's computed monthly arithmetic; Path E sets the imputation triple; Path F SSI sets means-tested flag; share v1→v2 round-trip; 401(k) add-back arithmetic.

### Untouched

- `src/lib/calc/calc.ts`, `bcso.ts`, `scenarios.ts` — engine unchanged.
- `src/components/calculator/comparison.tsx`, `result-sidebar.tsx` — already render correctly when Path E flips the flags.
- All MS files.

## Methodology Appendix Structure (per path)

| Path | Appendix content |
|---|---|
| Simple | (existing) + 401(k) add-back amount if > 0 |
| Variable | Years table, averaging method, rationale, arithmetic |
| Self-employed | Business type, gross receipts, expenses, itemized add-backs, arithmetic, "subject to verification against business return" footnote |
| Multi-source | Each source: label + annual + methodology note |
| Imputed | Rule .04(3)(a)(2) sub-paragraph cite, basis, inputs, rationale, final imputed figure. Cross-ref to Comparison Appendix. |
| Special | Situation, rule cite, carve-out applied |

Each parent renders independently — Parent A may be Path B while Parent B is Path F.

## Acceptance Criteria

- All six labeled path cards render and route to the correct form.
- Each path's computed monthly updates live as the user fills inputs and applies to `parentA/BGrossMonthly`.
- Path E correctly sets `useImputationForA/B`, `parentA/BGrossMonthly` (imputed), and `parentA/BActualGrossMonthly` (real). The existing Comparison tab, sidebar `ImputationMiniSummary`, and cumulative chart light up automatically — no parallel components created.
- Path F SSI-only writes `parentXMeansTestedOnly = true`. Federal-benefit sub-flow writes `parentXFederalBenefit`. Incarcerated/military sub-flows write nothing to calc inputs that wasn't already wired; they capture rationale for the appendix.
- 401(k) add-back input on Simple path adds to entered monthly gross before write; appendix documents both entered gross and add-back.
- Worksheet methodology appendix renders per-parent path-specific blocks.
- Share URLs round-trip: `v: 1` URLs from production decode identically; new `v: 2` URLs decode losslessly.
- All existing TN tests still pass; new `income-paths.test.ts` passes.
- No edits to `calc.ts`, `bcso.ts`, `scenarios.ts`, `comparison.tsx`, `result-sidebar.tsx`.

## Verification

After implementation, run the full TN+MS test suite. Confirm:
- Existing comparison view continues to work for Path E users.
- A `v: 1` share URL captured from current production round-trips through `v: 2`.
- Each path's appendix renders with the correct math shown to the user.

Ready to implement on approval.
