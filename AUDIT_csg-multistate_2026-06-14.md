# csg.tcblaw.org — Real-Repo Audit & Multi-State Core-Extraction Plan

*Branch: `csg-multistate`. Date: 2026-06-14. Read-only audit — no engine code changed. Earlier audits were done from the wrong directory and inferred the engine from the live site; this one reads the actual source.*

---

## 0. How to read this

This is a grounding pass for a config-driven refactor: one generic income-shares core parameterized by a per-state `StateSpec` (see `04_Agent_Pipeline/StateSpec_Contract.md` v1.1), plus the existing MS percentage engine. Bottom line up front:

- **The tree is asymmetric.** TN lives at the calc **root**; MS is **namespaced** under `ms/`. The earlier "pasted I/O contract" (root paths) was right about TN; Lovable's "handoff contract" (per-state folders) describes the *target*, not today.
- **TN generalizes at the skeleton, not as a drop-in.** Its parenting-time model, SSR path, and a large block of embedded legal prose are the resistant parts. The refactor is real work, not a rename.
- **The regression guard is strong.** ~180 vitest tests, many pinning exact dollar outputs, so any extraction that moves a number fails loudly.

---

## 1. Map of `src/lib/calc/` — the asymmetry, resolved

```
src/lib/calc/
  calc.ts                 # TN ENGINE — calculate(inputs): outputs            (663 L)
  bcso.ts                 # TN schedule lookup (binary search, round-up)       (59 L)
  types.ts                # TN CalcInputs / CalcOutputs / IncomeMethodology   (274 L)
  citations.ts            # TN citation registry (CITATIONS keyed by CitationKey)(370 L)
  citation-resolvers.ts   # TN worksheet line→citation MANIFEST builder        (304 L)
  scenarios.ts            # TN scenario presets                                 (40 L)
  share.ts                # TN URL state round-trip                            (189 L)
  data/
    constants.ts          # TN: cap, SSR, parenting bands, PCSO max, imputation(52 L)
    schedule-2022.ts      # TN BCSO schedule — 2,815-row tuple array          (576 L)
  __tests__/              # calc(21) income-paths(14) citations(8) stories(3)
  ms/                     # MS ENGINE — fully namespaced
    calc.ts               # calculateMS(inputs): outputs                      (266 L)
    types.ts              # MSInputs / MSOutputs / MSDeviation                (540 L)
    reconciliation.ts     # § 43-19-103 per-factor gap aggregator (DEV TOOL)  (233 L)
    chancellor-decisions.ts # decision surface + running totals (DEV TOOL)    (203 L)
    share.ts(450) resume.ts(97) moment.ts(88) in-play-labels.ts(68)
    imputation-labels.ts(49)
    data/percentages.ts   # statutory % by child count — a function, not a table(26 L)
    __tests__/            # 11 suites, ~112 tests
```

**Answer to the open question:** TN is **not** namespaced — `calc.ts`, `bcso.ts`, `types.ts`, `data/schedule-2022.ts` sit at the calc root. MS **is** namespaced under `src/lib/calc/ms/`. Relocating TN into `states/tn/` is therefore *step zero* of any refactor, and it must be done with re-export shims so the ~dozen import sites (routes, components, PDF, share) don't break.

---

## 2. TN income-shares engine, walked (file:line)

All in `src/lib/calc/calc.ts` unless noted. Sign convention throughout: **signed flow from Parent A's perspective** (positive ⇒ A pays B). This convention is clean and worth keeping in the core.

| Step | Where | What it does |
|---|---|---|
| Income determination | `calc.ts:135-149` | `AGI = max(0, gross − SECredit − priorSupport − inhomeCredit)`. **The engine does not compute income** — gross, SE credit, etc. arrive pre-computed as inputs. |
| Combined income | `calc.ts:149` | `combinedAGI = aAGI + bAGI`; guards ≤0 (`calc.ts:151-156`). |
| Pro-rata (PI) | `calc.ts:158-159` | `piA = aAGI/combinedAGI`. |
| Schedule lookup | `bcso.ts:18-59` | Binary search for smallest row ≥ combinedAGI → **round UP to next row** (`bcso.ts:30-32`). Cap `$28,250` (`constants.ts:7`). Above cap: `bcsoAtCap + excess×rate` (`bcso.ts:50-58`, rates `constants.ts:10-16`). |
| **Between-rows convention** | `bcso.ts:30-32` | **Round up to next $50 row, hardcoded.** Cited to Rule .04(6)(b) (`citations.ts:216`). This is exactly the per-state `schedule.lookup` knob the contract calls out — TN = `round_up`. |
| Parenting-time | `computePresumptive`, `calc.ts:30-82` | Bands `standard/neutral/reduction/increase/equal`. Reduction = variable multiplier `(2/182.5)×ARPdays` (`constants.ts:43`); increase = `((68−days)/365)` bump; 50/50 deems Parent B the ARP at 182.5 days. **Deeply TN-specific.** |
| Add-ons (Rule .04(8)) | `calc.ts:266-290` | Health, uninsured-medical, childcare — each via `reimbursementFromA` (pro-rata of whoever pays). Three hardcoded add-ons, not an array. |
| Self-employment | *not in engine* | `IncomeMethodology` union (`types.ts:11-106`) captures the SE path but is **explicitly not consumed by the math** (`types.ts:5-10`) — it only annotates the worksheet appendix. The engine sees a monthly gross + a pre-computed `SECredit`. |
| Imputation | *not in engine* | `useImputationForA/B` + actual-gross are stored; the imputed figure simply occupies the gross slot. `IMPUTATION_DEFAULT_ANNUAL` (`constants.ts:31-34`) exists but is **unused** by `calc.ts`. Imputation is a UI scenario, not engine math. |
| SSR / low-income | `calc.ts:227-264` | Obligor-**only** shaded-cell lookup (`calc.ts:245`), takes lesser of pro-rata vs alt BCSO, preserves `SSR_AMOUNT=$957` (`constants.ts:28`). TN-specific shape. |
| $100 minimum floor | `calc.ts:474-494` | Rule .04(12); plus the SSR-collapsed-to-zero special case (`calc.ts:484-493`). |
| Federal-benefit offset | `calc.ts:448-466` | SSA/VA derivative benefit offsets the obligor's obligation, capped, no direction flip. |
| PCSO statutory cap | `calc.ts:327-364` | §36-5-101(e)(1)(B); generates a graduated case-law narrative. |
| Above-cap breakdown | `calc.ts:366-379` | Surfaces the above-schedule formula components. |

**Material observation:** roughly 40% of `calc.ts` (lines ~336-436) is **embedded legal prose** — `pcsoCapNote`, `equalParentingLowSupportNote`, `nonEarnerArpNote`, `zeroPresumptiveNote`, with case citations inline. This is not math; it does not belong in a generic core, and it is the single biggest extraction hazard.

---

## 3. MS percentage engine + the deviation-streamlining tooling

**Core math** (`ms/calc.ts:93-264`): `monthlyAGI = (gross − taxes − SS − mandatoryRet − priorSupport)/12 − inHomeMonthly`; `presumptive = monthlyAGI × pct(numChildren)` (`ms/calc.ts:134-138`). Pre-check: § 43-19-36 incarceration suspension (`ms/calc.ts:96-103`). Imputation is a linear **blend slider** between actual and imputed gross (`ms/calc.ts:113-127`) — modeled as a scenario, with a warning that it isn't a court determination.

**The deviation-streamlining feature** (the predictability tooling) is two pure modules wired into the final order:

1. **`ms/reconciliation.ts`** — for each of the ten § 43-19-103 factors (a–j, titles verbatim `:17-41`), builds a row comparing the obligor's asserted position vs. the obligee's, classified by `FactorInPlay` = `neither | obligor_only | obligee_only | both | agree` (`:80-92`), with a per-factor `gapMonthly` and a case-lifetime `cumulativeNetDifference` = net monthly × average months remaining (`:60-71`, emancipation-aware `:163-184`). This is the "show both sides the size of each disagreement, in dollars over the life of the order" surface.
2. **`ms/chancellor-decisions.ts`** — each factor carries a chancellor decision `none | adopt_obligor | adopt_obligee | split | custom | decline | accept_agreed` (`:31-38`); `decisionContribution` (`:88-116`) projects the ruling into a signed dollar amount; `computeChancellorTotals` (`:160-179`) sums contributions and tracks `pendingCount`/`activeCount`. The decision options offered are gated by the row's in-play state (`:132-147`) — an `agree` row collapses to two buttons, a `both` row offers all five.

The final order consumes this when present: `calculateMS` calls `buildReconciliation` + `computeChancellorTotals` for the deviation total (`ms/calc.ts:162-172`), and **falls back to summing the obligor's slate only for legacy URLs lacking a decision map** (`ms/calc.ts:170-171`) — a real backward-compat surface to preserve. The HTML companion (`src/lib/html/ms-behind-the-scenes-html.ts`) renders this whole structure (the "Williams reference").

---

## 4. Data + citation storage

**Schedule (TN):** `data/schedule-2022.ts` — a `readonly [agi, b1, b2, b3, b4, b5, shadedBitmask][]` tuple array, **auto-generated from `bcso_schedule_2022.csv` via `scripts/build-schedule.ts`** (`schedule-2022.ts:1-12`), 2,815 rows, "shaded" packed as a bitmask (`bcso.ts:41-42`). Compact and fast, but **does not match** the contract's `schedule.rows: [{combinedMin, combinedMax, byChildren}]` object shape.

**Schedule (MS):** there is no table — `ms/data/percentages.ts` is a `switch` returning a decimal by child count (`:13-23`). Maps to the contract's `percentage_by_children`.

**Citations:** `citations.ts` holds a `CITATIONS: Record<CitationKey, Citation>` registry (rule, name, plain-English, url, optional caseNote). `citation-resolvers.ts:92-299` (`manifestFor`) builds the canonical **line → citation manifest** consumed by the on-screen worksheet, the PDF, *and* `__tests__/citations.test.ts` (which mechanically asserts every non-practitioner line carries a paragraph-specific citation). **This is precisely the mechanism `StateSpec.worksheetLines` is meant to drive** — the structure already exists, but today it is hand-coded TN logic (a `switch` over income paths/bands), not data. Turning it into spec data is its own slice.

---

## 5. Output layer — what's generic vs. bespoke

| Surface | File | Generic or per-state? |
|---|---|---|
| AcroForm fill engine | `pdf/official-fillable-pdf.ts` | **Generic.** `fillOfficialWorksheet(data, opts)` takes a field-name→value map and is state-agnostic (`:8-33`). |
| TN field map | `pdf/worksheet-field-map.ts` | **Per-state adapter.** `buildWorksheetData(inputs, outputs, ui)` maps TN `CalcInputs/CalcOutputs` → exact AcroField names. The 18-test suite guards this. |
| TN fillable template | `public/forms/TN_Child_Support_Worksheet_fillable.pdf` | TN only. **No MS or other-state fillable template exists.** |
| TN hand-drawn fallback | `pdf/worksheet-pdf.ts` + `pdf/simple-pdf.ts` | Bespoke layout on shared primitives. |
| MS worksheet + deviation PDFs | `pdf/ms-worksheet-pdf.ts` (582 L), `pdf/ms-deviation-pdf.ts` (756 L) | **Bespoke, hand-drawn** — MS publishes no fillable form. |
| "Behind the Scenes" HTML | `html/ms-behind-the-scenes-html.ts`, `html/ms-sensitivity-html.ts` | **MS-only and bespoke.** TN has *no* HTML companion — its equivalent is the on-screen `components/calculator/official-worksheet.tsx` + the citation manifest. |

So the PDF *fill* path is generic-with-config; the *layout/drawing* and the HTML companion are per-state. The contract's `pdf.template`/`fieldMap` fields map cleanly onto the fill path. The HTML companion is **not** generalizable as-is — it is welded to the MS deviation tooling.

---

## 6. Tests

Harness: **vitest** (`bunx vitest run`; `npx vitest run` also works). ~**180 tests** across 17 files.

- **TN math:** `calc.test.ts` (21 — schedule lookup, above-cap, parenting bands, SSR/floor, special-expenses 7%, means-tested, sole-custody), `income-paths.test.ts` (14), `citations.test.ts` (8 — mechanical manifest coverage), `stories.test.ts` (3). PDF adapter: `worksheet-field-map.test.ts` (18).
- **MS math + tooling:** `ms/calc.test.ts` (17), plus the deviation-streamlining suites — `chancellor-decisions` (13), `reconciliation` (12), `emancipation` (12), `handoff` (11), `share` (12), `resume` (8), `letter-mapping` (8), `imputation` (7), `attribution` (7), `caseid-origin` (5). MS is the more heavily-tested half.

**Fixture format today:** inline object literals spread over `defaultInputs()` / `defaultMSInputs()`, asserted with `expect`. **There is no external `fixtures.json` infrastructure** — the contract's JSON-fixture-per-state model does not exist yet and is net-new infra (a loader + a generic harness that runs `states/<code>/fixtures` through the core).

**Coverage gaps worth noting:** SE-income, imputation, and multi-source income paths are *not* engine-tested (the engine doesn't compute them — correct). The **federal-benefit offset** (`calc.ts:448-466`) has no obvious dedicated test in `calc.test.ts` — confirm before refactoring near it.

---

## 7. THE DELIVERABLE — core-extraction plan

### 7a. Does TN genuinely generalize? — Honest assessment

**The skeleton generalizes; three things resist parameterization.**

Generalizable as-is: AGI assembly, combined-income, PI, schedule lookup (convention is already a knob in disguise), pro-rata allocation, the A-perspective signed-flow convention, the PCSO/above-cap params, add-ons (once turned into a loop), deviations (once turned into a loop + per-state threshold).

**Resists parameterization — must become strategies, not config flags:**

1. **Parenting-time.** `computePresumptive` (`calc.ts:30-82`) *is* TN's own model (variable multiplier + increase formula + 50/50 ARP designation). The contract already enumerates four *other* models (`threshold_bands`, `cross_credit` for GA, `gross_up_1_5` for FL, `offset_dual_worksheet` for AR). You cannot parameterize TN's formula into those — they're different math. **Make parenting-time a pluggable strategy keyed by `spec.parentingTime.model`, and register TN's as one strategy (`tn_variable_multiplier`).**
2. **Low-income / SSR.** TN's obligor-only shaded-cell SSR (`calc.ts:227-264`) is one of the contract's three `lowIncome.model` options. Same treatment: **strategy, not flag.**
3. **The embedded legal prose** (`calc.ts:~336-436`). ~40% of the file is TN narrative with inline case law. This **must move out of the math** into a per-state annotator that runs *after* the core returns numbers. If it stays in the core, every state inherits TN's prose.

So the recommendation is **yes, refactor — but as a strategy-based core, not a single parameterized TN function.** A "just add a spec" state is achievable for the *next income-shares states that share TN's model*; states with genuinely different parenting/low-income math (GA, FL, AR) need their strategy authored once, then reused.

### 7b. Proposed layout

```
src/lib/calc/
  core/
    types.ts                 # StateInputs / StateOutputs (shared shapes)
    spec.ts                  # StateSpec TS type mirroring the contract
    income-shares.ts         # generic skeleton: (spec, inputs) -> outputs
    percentage.ts            # generic obligor-% model (MS-shaped)
    schedule.ts              # lookup honoring spec.schedule.lookup + rounding
    parenting/
      index.ts               # registry: model id -> strategy fn
      tn-variable-multiplier.ts
      threshold-bands.ts
      cross-credit.ts        # GA (days^2.5)
      gross-up-1-5.ts        # FL
      offset-dual.ts         # AR
    low-income/
      self-support-reserve.ts
      schedule-floor.ts
  states/
    tn/  { spec.ts, schedule.ts, fixtures.ts, notes.ts, field-map.ts, share.ts }
    ms/  { spec.ts, percentages.ts, fixtures.ts, reconciliation.ts, chancellor-decisions.ts, ... }
    ar/  { spec.ts, schedule.ts, fixtures.ts }     # DATA ONLY — new state target
```

`notes.ts` per state is where the prose annotators live (extracted from `calc.ts`). The PDF fill engine (`pdf/official-fillable-pdf.ts`) stays generic; each state keeps a `field-map.ts`.

### 7c. Migration order — keep TN and MS green at every step

Each step is independently shippable and gated by the existing ~180 tests (the 21 TN calc + 18 field-map tests pin exact dollars, so a number that moves fails loudly).

1. **Add `core/types.ts` + `core/spec.ts`.** Pure additions, zero behavior change. Green.
2. **Relocate TN to `states/tn/` behind re-export shims** at the old root paths (`calc.ts` re-exports from `states/tn/calc.ts`). Resolves the asymmetry without touching importers. Green.
3. **Extract `core/schedule.ts`**, parameterized by `spec.schedule.lookup` + `spec.rounding`; TN spec selects `round_up`. Add a spec-row→tuple compile step (reuse the `scripts/build-schedule.ts` pattern) so authoring stays JSON-ish but runtime stays tuple-fast. Green.
4. **Extract parenting-time strategies**; register `tn_variable_multiplier`; `income-shares.ts` delegates by `spec.parentingTime.model`. The 21 calc tests are the guard. Green.
5. **Extract low-income/SSR strategy.** Green.
6. **Turn add-ons + deviations into spec-driven loops** (`spec.addOns`, `spec.deviations`, per-state thresholds like TN's 7%). Green.
7. **Move prose notes to `states/tn/notes.ts`** annotator invoked post-math. Green.
8. **Stand up the fixture harness** (loader + generic runner over `states/<code>/fixtures`), and **author AR** as spec + schedule + fixtures only. New state = data.
9. **Normalize MS:** relocate to `states/ms/`, wrap `calculateMS` behind `core/percentage.ts`'s signature, **preserve the legacy no-decision-map fallback** (`ms/calc.ts:170-171`).

### 7d. Blockers that would change the plan

- **Prose coupling (highest risk).** If the narrative notes can't be cleanly severed from the math (some read intermediate values like `presumptiveAfterSsr`), step 7 grows. Budget for it; it's the crux.
- **Schedule format decision.** Contract authors row-objects; runtime wants tuples+bitmask. Recommend authoring JSON, compiling to tuples — don't make the hot path walk objects.
- **`worksheetLines`/citations not yet data-driven.** `manifestFor` is hand-coded TN logic. Making it spec-driven is a separate slice; until then, each state hand-writes its manifest.
- **No fixture infra.** The contract's `fixtures.json` model is net-new. Build the harness (step 8) before promising "a state is done when fixtures pass."
- **Federal-benefit offset untested** — add a pin test before refactoring near `calc.ts:448-466`.

---

## 8. Seam check vs. Lovable's handoff contract

Confirmed against the real tree:

| Owner | Surface | Status |
|---|---|---|
| **Claude Code** | `src/lib/calc/**` (engine + per-state data), `src/lib/pdf/*` field maps, `src/components/calculator/**` | ✓ matches |
| **Lovable** | `src/routes/<state>.tsx` + `<state>_.*.tsx`, `src/routes/index.tsx` homepage card, `src/components/site-chrome.tsx` `detectState`, `src/routes/sitemap[.]xml.ts`, Publish | ✓ matches |

**Frontend friction a new state hits (all Lovable-owned, all small but real):**
- `detectState` is a hardcoded `if` chain (`site-chrome.tsx:6-10`, TN/MS only) — needs a case per state.
- Homepage grid is `md:grid-cols-2` (`index.tsx:56`) and **`StateCard.to` is typed as the literal union `"/tn" | "/ms"`** (`index.tsx:147`) — strict TS will **hard-fail the build** when you add `/ar` until that type is widened. This is the most likely "half a state breaks the build" trap.
- `/ar` already exists as a route but is **not** in the homepage grid (roadmap stub).

No backend/schema work: the calculators are fully client-side and stateless (no DB rows back TN or MS math), so a new state touches no Supabase schema, env, or migration.

---

## Appendix — verification status of this audit

- Tree, engine internals, data formats, citation mechanism, PDF/HTML split, and seam: **read directly from source on `csg-multistate`**, file:line cited above.
- Test counts: from `grep` over `*.test.ts`. **Live `vitest` run on this branch: 17 files, 195 tests, all passing** (deps installed via npm for this audit; the npm lockfile is git-ignored and not committed). The earlier "~180" estimate was a grep undercount; the runner reports 195.
