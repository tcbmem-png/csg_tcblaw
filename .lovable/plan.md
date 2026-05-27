
# Phase D + E — Approved Plan (build-ready)

All six investigation approvals received. Plan below incorporates the calibrations from the approvals message; on "Implement plan" I will execute steps 0→8 in order with a hard stop at step 3 (sample-prose checkpoint) per §3 ack.

## 0. Commit canonical plan doc

- Commit `docs/TN_PDF_Architecture_Plan_v1.0.md` verbatim from the attachment. No edits during commit. Future cycles cite by section number from this committed copy.
- Operative authority order: committed plan § wins; cycle prompt §A is supplementary; this investigation §2 supersedes plan §7 until plan is updated post-cycle.

## 1. Library + CITATIONS additions

- Add `pdfmake` (pure JS, Worker-safe). DejaVu Sans embedded via base64 VFS for § / → / ↑ glyph parity with the AOC. AOC pipeline untouched.
- Cycle report will include annotated-PDF bundle-size delta (cold-start budget note only; no premature optimization).
- Extend `CitationKey` and `CITATIONS` in `src/lib/calc/citations.ts` (additive only — `pcso_max.caseNote` left intact for now):
  - `case.nash_v_mulle` — *Nash v. Mulle*, 846 S.W.2d 803 (Tenn. 1993)
  - `case.richardson_v_spanos` — *Richardson v. Spanos*, 189 S.W.3d 720 (Tenn. Ct. App. 2005)
  - `case.smallman_v_smallman` — *Smallman v. Smallman*, 689 S.W.3d 845 (Tenn. Ct. App. 2023)
  - `case.massey_v_casals` — *Massey v. Casals*, 315 S.W.3d 788 (Tenn. Ct. App. 2009), perm. app. denied (Tenn. May 17, 2010)
- Builders consume these by key; no string-literal citations anywhere downstream.
- Any further authority needs surface in the cycle report under drift-prevention rule #10; no silent additions.

## 2. Builder file layout

```
src/lib/pdf/annotated/
  index.ts                      // renderAnnotatedPdf(primary, alternative?)
  registry.ts                   // ordered Section[] + gates + dispatch
  layout/
    document.ts                 // pdfmake docDef shell, header/footer, fonts
    flow.ts                     // heading | paragraph | citation | table | bullet | spacer | unbreakable
  builders/
    case-background.ts
    01-income-determination.ts
    02-agi.ts
    03-combined-agi.ts
    04-bcso.ts
    05-parenting-time.ts
    06-add-ons.ts
    07-deviations.ts
    08-statutory-cap.ts
    09-final-order.ts
    appendix-a-imputed.ts       // (primary, alternative) signature
    appendix-b-income-method.ts
    authority-block.ts
  __tests__/                    // per-builder pure-function tests
    *.test.ts
```

Registry uses a union type:
```ts
type Section =
  | { id; title; gate: (w: WDM) => boolean; build: (w: WDM) => Block[] }
  | { id; title; gate: (p: WDM, a: WDM|null) => boolean;
      build: (p: WDM, a: WDM|null) => Block[]; mode: 'compare' };
```
The compare-mode shape is the only deviation from the uniform signature, isolated to scenario-comparison appendices per plan §1.5.

Per-builder unit tests live under `src/lib/pdf/annotated/__tests__/` and assert: pure-function determinism, structural response to varying WDM content, no fixture identity awareness. Rendered-PDF assertions live with the six-family tests in step 6.

## 3. Sample-prose checkpoint (HARD STOP)

Build only:
- `layout/document.ts` + `layout/flow.ts`
- `registry.ts` (with entries for the three sections below registered)
- `builders/05-parenting-time.ts`, `07-deviations.ts`, `08-statutory-cap.ts`
- Per-builder unit tests for those three

Render four sample PDFs (each builder × {F02 WDM, F04 WDM}) packaged as one review bundle in `/mnt/documents/annotated-sample/`, plus source diff. **Stop. Wait for sign-off.** No further sections built until checkpoint passes.

Reinforcement: builders are fixture-agnostic; F02/F04 are just two WDM inputs we render to expose structural responsiveness.

## 4. Remaining builder set (post-checkpoint)

Build the rest of §§I–IX + Appendix A (compare-mode) + Appendix B + Authority Block per the registry. All builders pure, all citations via `CITATIONS[key]`, all factor lists from WDM verbatim, no editorial voice (§9 rule 9), no silent inference (§9 rule 10).

## 5. Rule coverage matrix v1

`src/lib/calc/__tests__/rule-coverage-matrix.ts` — one `RuleCoverageEntry` per `CitationKey` (~34 including the four new case keys), plus deferred entries:
- SPLIT custody — `deferred: { reason: 'v1.1 — TBJ Editorial Note 111' }`
- Non-parent caretaker — same reason

## 6. Six-family test scaffolding

```
src/lib/calc/__tests__/
  rule-coverage-matrix.ts
  family-1-consistency.test.ts
  family-2-citation-completeness.test.ts
  family-3-aoc-purity.test.ts
  family-4-advocacy-audit.test.ts
  family-5-branch-roundtrip.test.ts
  family-6-rule-traceability.test.ts        // forward + reverse; SKIPS deferred rows
  fixtures/
    loader.ts
    index.ts
    f01..fNN/inputs.ts
  utils/
    pdf-text.ts
    advocacy-lexicon.ts
```

Family-6 reverse coverage explicitly skips matrix entries flagged `deferred` (confirmed per §4 calibration).

## 7. Fixture set (~14–18)

Sampling matrix per investigation §2 across the eight dimensions. Per-fixture `inputs.ts` headers name dimension coordinates only — no Berger/TBJ identity tagging. Mandatory cap-engagement coverage:
- ≥1 above-cap fixture where user elects **"schedule cap controls"** (PCSO held at statutory max)
- ≥1 above-cap fixture where user elects **"additional support warranted"** (PCSO at calculated above-cap figure)
Both exercise the burden-shift Category-C judgment branches in §VIII.

## 8. Sign-off run

- All six test families green across full fixture set.
- Rule coverage matrix forward + reverse green (deferred rows excluded from reverse).
- Cycle report:
  - Test output summary.
  - Gap-additions ledger (only items already approved: the four `case.*` keys; any further additions stopped the cycle for explicit ack per §5).
  - pdfmake bundle-size delta + cold-start note.
  - Drift-prevention checklist (cycle prompt §F) signed off line by line.
  - Updated `docs/TN_PDF_Architecture_Plan_v1.0.md` if any edits proposed (none planned; plan §7 update deferred to post-cycle).

## Out of scope
- Pressure / boundary / random-input testing (Phase F).
- Engine refactors; bugs surface as separate issues.
- New CITATIONS keys beyond the four approved without explicit ack.
- Fixture-targeting anywhere.
- Touching `pcso_max.caseNote` or any existing AOC pipeline behavior.
