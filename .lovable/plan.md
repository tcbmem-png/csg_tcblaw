
## Goal

The live audit confirms all F1–F9 are fixed. Lock that in so the adapter (`src/lib/pdf/worksheet-field-map.ts`) can't silently regress, and finish the cheap spot-checks the tester flagged as "not yet run".

## (b) Spot-check — already verified, no code change

Both AOC buttons call the same generator:

- `src/components/calculator/result-sidebar.tsx` (sidebar button)
- `src/components/calculator/pdf-download-buttons.tsx` (Worksheet tab button)

Each dynamically imports `downloadOfficialWorksheet` from `@/lib/pdf/official-fillable-pdf` and feeds it `buildWorksheetData(inputs, outputs, worksheetUiFromCaption(inputs, caption))`. Same template, same field map, same filename pattern (`<matter>-AOC.pdf`). No divergence to fix.

## (c) Regression test suite

New file: `src/lib/pdf/__tests__/worksheet-field-map.test.ts`

Pure-function tests against `buildWorksheetData(i, o, ui)` — no PDF rendering, no DOM. Each test constructs a minimal `CalcInputs` + `CalcOutputs` fixture and asserts the specific cells the audit cared about. This catches every F-finding regression in milliseconds.

### Cases covered (one `describe` per finding + the untested scenarios)

1. **F1 — Line 11 == Line 12 for the obligor** (no $1 gap). Baseline 11k/11k, ARP=Father.
2. **F2 — Line 4 BCSO populates in the PRP (non-obligor) column**, blank in obligor column.
3. **F3 / F9 — pure private-school deviation:** Line 12=477, Line 14=−340, Line 15=137; 12+14=15 reconciles.
4. **F4 — statutory cap note** appears in `comments` when `pcsoExceedsStatutoryMax` is true, with the §36-5-101(e)(1)(B) text + dollar figures.
5. **F5 — reason text gating:** `deviations_specify` is `undefined` when `includePrivateSchool=false` even if `privateSchoolReason` is non-empty.
6. **F6 — comma formatting:** large dollar fields (80,000) include thousands separators.
7. **F7 — federal benefit:** Line 1a=600, Line 12=615, Line 14 blank, Line 15=615, Line 16=15 (benefit not double-subtracted, not on Line 14).
8. **F8 — SSR / minimum order:** Line 12=0, Line 14 blank, Line 15=100, `low_income="Y"`, comments mention the minimum order / SSR — floor NOT mislabeled as a deviation.
9. **Obligor-direction parity** (mirrors audit Cases 2/3): when ARP=Mother, obligor columns flip to A and Column B is empty.
10. **Swap routing** (audit Case 4): when `parentARole="father"`, `mother_name` resolves to Parent B, paid-by routing (`split_pro_rata`, single-payer) lands in the correct columns.
11. **Untested-by-tester scenarios** (cheap to cover here):
    - Equal 50/50 parenting: obligor derived from `presumptiveDirection` when `arpIdentity` is unset.
    - Zero/empty income inputs: no NaN, no crash, numeric fields are `undefined` or `"0"`.
    - Long unicode parent/child names: passed through verbatim (no truncation, no escape mangling).
    - `narrativeOverride` precedence: when provided, it leads the comments box (cap note can still be appended via the existing `.filter(Boolean).join("\n\n")` chain — assert order).

### Fixture helpers

Small in-file helpers (no new modules):

```ts
const baseInputs = (): CalcInputs => ({ ...defaultInputs(), /* overrides per test */ });
const mkOutputs = (over: Partial<CalcOutputs>): CalcOutputs => ({ /* zeroed defaults */, ...over });
```

`defaultInputs` already exists in `src/lib/calc/calc.ts`. For `CalcOutputs`, build a minimal zeroed object literal in the test file (the adapter only reads a known subset of fields; we don't need a full engine run for any of these assertions). Where a case needs real engine output (cap, SSR, federal benefit), call `calculate(inputs)` from `@/lib/calc/calc` instead of hand-rolling outputs — this also guards against engine/adapter drift.

### Run

Existing `bunx vitest run` picks the new file up; no config changes.

## Files

- **add** `src/lib/pdf/__tests__/worksheet-field-map.test.ts` (only file changed)

## Out of scope

- No production code changes — the audit says F1–F9 are clean.
- No PDF rendering in tests (slow + flaky; the adapter is the only thing that can regress).
- No browser/e2e — the tester already covered that against the live site.
