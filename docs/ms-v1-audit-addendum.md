# MS v1 Audit Addendum

*Phase 0 deliverable for the MS v2 build (per `docs/ms-v2-build-prompt.md` §1).*
*Sources of truth ingested: `docs/ms-canonical-spec.md`, `docs/ms-williams-reference.html`, `docs/ms-v2-build-prompt.md`, `docs/tn-calculator-v1-audit.md` (prior cycle).*

This addendum is intentionally short — the shared chassis is documented in the TN v1 audit. Only MS-specific deltas are recorded here.

---

## 1. MS calc-engine inventory (`src/lib/calc/ms/*`)

| File | Lines | One-line summary |
|---|---|---|
| `types.ts` | 377 | `MSInputs` / `MSOutputs` / `MSDeviation` / `MSPartyEntry` / `HandoffState`. Already includes the per-party 6-field block (`MSPartyEntry`: position, factsAsserted, documentationReferenced, proposedMonthly, legalAuthority) and the per-factor structured sub-forms (`MSStructuredA…J`). `HandoffState.caseId` already present. |
| `calc.ts` | 218 | Pure `calculateMS(inputs)`. Implements the § 43-19-36 suspension gate, the AGI computation, statutory-percentage lookup, health-insurance add-on, signed-deviation summation, side-by-side Position B, the $10K/$100K finding flags, the imputation-basis warning. No emancipation / cumulative math here. |
| `data/percentages.ts` | 26 | `msStatutoryPercentage(n)` returns 14/20/22/24/26 % (caps 6+ at 26 %). `MS_AGI_HIGH_THRESHOLD = 100_000`, `MS_AGI_LOW_THRESHOLD = 10_000`. **Matches canonical §1.1 / §1.2 verbatim.** |
| `share.ts` | 346 | URL encoder/decoder. Two payload versions: `v: 2` (pre-handoff) and `v: 3` (adds `h: HandoffState`). Legacy `positionA/BLabel` migration, scrub-opposite-slate transform, **caseId-based origin detection with legacy fingerprint fallback already implemented** (`recordOriginatedHandoff` / `isOriginatorBrowser` / `resolveOriginKey`). |
| `reconciliation.ts` | 182 | `FACTOR_TITLES`, `FACTOR_STATUTORY_TEXT` (verbatim § 43-19-103 letters with the v6 inversion fixed), `buildReconciliation`, `summarizeRow`, `computeAvgMonthsRemaining(ages) = mean(max(0, 21 − age)) × 12`. **The cumulative-through-emancipation math from canonical §1.6 already exists here** — but uses naïve 21-year horizon, no early-emancipation carve-outs (§ 93-11-65) yet. |
| `moment.ts` | 88 | Maps `(HandoffState, activeSide, isOriginator) → moment` (5-moment UX). |
| `resume.ts` | 97 | localStorage `ms.handoff.draft.<caseId>` save/resume scaffolding for receiving-side. |
| `__tests__/*.ts` (6 files, 1,007 lines) | — | See §5 below. |

### Convention coverage matrix (canonical §1.1–§1.10)

| Convention | Status in v1 | Notes |
|---|---|---|
| §1.1 AGI deductions | **Partial** | Mandatory retirement deducted; voluntary not separately captured; in-home other children captured as `inHomeChildrenDeductionMonthly` (no rationale field). |
| §1.2 $10K / $100K annual thresholds | **Done** | `requiresFindingHighIncome` / `requiresFindingLowIncome` set against annual AGI; warnings cite § 43-19-101(4). |
| §1.3 Health insurance add-on | **Done** | Obligee-provided premium added; obligor-provided emits informational warning. |
| §1.4 Four-state factor classifier | **Partial** | `reconciliation.ts::FactorInPlay` already encodes the five states (`neither` / `obligor_only` / `obligee_only` / `both` / `agree`). Canonical asks for `not_asserted` / `obligor_only` / `obligee_only` / `both_agreed` / `both_disagreed` — same five categories, different names. UI surfacing for the four-state badge does not yet exist. |
| §1.5 Verbatim per-party position capture | **Mostly done** | `MSPartyEntry` already has 5 of the 6 canonical fields (position, factsAsserted, documentationReferenced, proposedMonthly, legalAuthority). Missing: explicit `attribution` field; explicit `narrative` field (currently overloaded onto `MSDeviation.description`). |
| §1.6 Cumulative-through-emancipation | **Partial** | `computeAvgMonthsRemaining` exists; sticky live-bar exists in the Williams reference HTML but not yet in the actual `/ms` worksheet UI. § 93-11-65 carve-outs not yet wired (no `emancipationStatus` per-child enum). |
| §1.7 Imputation framework | **Partial** | Boolean toggle + 5-field rationale (`pastEarnings/jobSkills/localMarket/availableEmployers/other` + note). Canonical wants the full **twelve-factor § 43-19-101(5)** form + a **0–100 % application-percentage slider** — not yet present. No "default imputed amount" was ever shipped (good — canonical prohibits it). |
| §1.8 Incarceration suspension | **Done** | Full §43-19-36 gate including 3 carve-outs (DV / child abuse / criminal nonpayment) and means-to-pay exception. Auto-floor to $0 + auto-warning text. |
| §1.9 Chancellor's decision surface | **Not started** | No per-factor "adopt obligor / adopt obligee / split / custom / decline" decision surface exists. |
| §1.10 Case-ID identity + save-and-resume | **Mostly done** | `caseId` on `HandoffState`; origin detection keyed off `case:<caseId>` with `fp:<fingerprint>` fallback; receiving-side `resume.ts` scaffolds `ms.handoff.draft.<caseId>`. UI prompt "Continue from where you left off?" exists (`handoff-resume-prompt.tsx`). |

**Net read**: v1 is closer to canonical than the build prompt's mod taxonomy implies. The two genuinely net-new pieces of work are **§1.7 (twelve-factor imputation + percentage slider)** and **§1.9 (chancellor decision surface)**. Everything else is refinement of existing scaffolding.

---

## 2. MS UI inventory

### Routes
- `src/routes/ms.tsx` (339 lines) — calculator shell. Tab switcher (Inputs / Worksheet), case caption, handoff banners, sidebar with result + share dialog.
- `src/routes/ms_.about.tsx` (72) · `src/routes/ms_.how-it-works.tsx` (138) · `src/routes/ms_.how-it-works.income.tsx` (646).

### Components (`src/components/calculator/ms/*`, 15 files / ~3,800 lines)
- **Inputs.** `inputs.tsx`, `incarceration-check.tsx`, `imputation-basis.tsx`.
- **Deviation worksheet.** `deviation-walkthrough.tsx`, `deviation-factor-form.tsx` (707 lines — biggest single file), `party-factor-block.tsx`, `form-primitives.tsx`, `deviation-comparison.tsx` (shim → `deviation-reconciliation.tsx`), `deviation-reconciliation.tsx` (current reconciliation table).
- **Handoff.** `handoff-action-panel.tsx`, `handoff-landing-banner.tsx`, `handoff-status-banner.tsx`, `handoff-share-dialog.tsx`, `handoff-resume-prompt.tsx`.
- **Output.** `worksheet-preview.tsx` (469 lines), `result-sidebar.tsx`.

### Divergence from `ms-williams-reference.html`
The Williams reference is the **target visual / behavioral spec**. v1's current worksheet does *not* yet match it on the following:
1. **Sticky bottom-line live-bar** at top of document (presumptive · current proposed final · cumulative). The reference uses a 3-column oxblood/brown sticky bar; v1's `worksheet-preview.tsx` has no equivalent.
2. **Side-by-side per-factor cards** with obligor (blue) and obligee (purple) columns flanking a center column of verbatim statute text. v1 has a reconciliation *table* (`deviation-reconciliation.tsx`) but not per-factor card columns.
3. **Four-state status badges** per factor card.
4. **Per-factor chancellor decision row** with 5 buttons (adopt obligor / adopt obligee / split / custom / decline).
5. **Authority footer** with verbatim statute pin-cites for the four pillar provisions.
6. Williams reference uses a different color system (`--accent: #5a3a14`, `--obligor: #2b5d8f`, `--obligee: #7a3a8f`, paper `#faf8f3`). v1 uses the shared TCB Law oxblood/cream tokens. **Decision needed:** override Williams colors to project tokens, or import the Williams oxblood/blue/purple as MS-only tokens. (Recorded for `ms-v2-decisions.md` once we get to implementation.)

---

## 3. MS share-link v3 schema, verbatim

From `src/lib/calc/ms/share.ts`:

```ts
interface MSSharePayloadV2 {
  v: 2;
  s: "MS";
  i: MSInputs;
  c: CaseCaption;
}

interface MSSharePayloadV3 {
  v: 3;
  s: "MS";
  i: MSInputs;
  c: CaseCaption;
  h: HandoffState;
}
```

`HandoffState` includes `caseId: string | null` — already in v1. The decoder accepts both `v: 2` and `v: 3`, synthesizes a `defaultHandoffState()` for v2, and warns (without rejecting) on unknown versions. **v2 → v4 upgrade path is unobstructed**: the decoder is already version-tolerant; v2 inputs will absorb `v: 4` extensions via `{ ...base, ...parsed.i }` merge.

---

## 4. MS localStorage shapes, verbatim

| Key | Shape | Used by |
|---|---|---|
| `ms.handoff.origins` | `{ [originKey: string]: token16hex }` where `originKey` is either `case:<caseId>` (preferred) or `fp:<sha256(inputs+caption)>` (legacy). | `recordOriginatedHandoff` / `isOriginatorBrowser` in `share.ts`. |
| `ms.handoff.draft.<caseId>` | (Per `resume.ts`) JSON snapshot of receiving-side in-progress slate. Created on debounced edit; consumed by `handoff-resume-prompt.tsx`. | Save-and-resume flow. |

Both shapes align with TN v1 audit §9.4. No drift detected.

---

## 5. MS test fixtures (verbatim summary)

Six test files, 1,007 lines total. Reproducing the full test bodies inline would balloon this addendum; the files themselves are the verbatim record. Test-suite titles:

**`calc.test.ts` (246 lines)** — math-equivalence acceptance criteria:
- *§ 43-19-101 verification:* Test 1 ($30K / 2 kids → $402.33/mo), Test 2 ($250K / 3 kids → high-income flag), Test 3 ($14K + $2,400 prior → low-income flag), Test 4 ($80K / 2 kids + $300 health by obligee → $1,300.67/mo).
- *Additional invariants:* 6+ kids caps at 26 %; signed deviation summation; final award floored at $0; shared-custody flag emits a § 43-19-103(g) note (regression guard against the v6 (i)-inversion).
- *§ 43-19-36 suspension (Test D):* >180 days + no carve-out + no means → $0 floor.
- *§ 43-19-36 carve-out (Test E):* DV preserves full obligation; means-to-pay preserves full obligation.
- *Imputation basis flag (Test F):* `agiBasis: imputed` emits a § 43-19-101(5) warning.
- *Side-by-side comparison (Test C):* Position A and B compute independently from the same presumptive base.
- *Default presumption:* shared-custody flag has zero effect on the formula.

**`handoff.test.ts` (220 lines)** — four-state lifecycle (originated → in_progress on first receiving edit; `lastReceivingEditAt` bumps; PDF auto-flips in_progress → completed); scrubbing transform; legacy fingerprint origin detection; labels follow caption not slate letter.

**`caseid-origin.test.ts` (62 lines)** — caseId-keyed origin detection survives receiver mutation; falls back to fingerprint when caseId is null; cross-browser returns false even with matching caseId.

**`letter-mapping.test.ts` (79 lines)** — `FACTOR_TITLES` and `FACTOR_STATUTORY_TEXT` for (g)/(h)/(i) match the statute; rejects the v6 inversion explicitly; (a)–(f) and (j) unaffected.

**`reconciliation.test.ts` (139 lines)** — `computeAvgMonthsRemaining` math (mean × 12, clamps emancipated, caps at 252 months, ignores invalid entries); `buildReconciliation` classifications (`obligor_only` / `agree` / `both` + gap); cumulative suppressed when ages missing; `summarizeRow` line strings.

**`share.test.ts` (261 lines)** — v3 round-trip; v2 → v3 upgrade (no migration; deviation slate preserved verbatim); `?side=` helpers (parseSideParam / otherSide / preservation across all four handoff states); `scrubOppositeSlate`; legacy positionA/BLabel migration.

**All of the above is the math-equivalence acceptance set for v2.** No test fixture is to be modified unless an existing test reflects a bug v2 is fixing (none flagged).

---

## 6. Anything surprising

1. **The statutory percentage table is already correct.** 14/20/22/24/26 % matches canonical §1.1 verbatim. No drift, no surprise constants.
2. **`caseId` is already on `HandoffState`.** The build-prompt taxonomy lists "M1 — case-ID identity for asynchronous handoff" as a v2 *modification*; in fact this landed in v1. v2 work is **promoting `caseId` from optional to mandatory on new shares**, not introducing it.
3. **Receiving-side save-and-resume scaffolding exists** (`resume.ts` + `handoff-resume-prompt.tsx`). "M2" is similarly already partially landed.
4. **Cumulative math exists but uses a naïve 21-year horizon.** Canonical §1.6 + § 93-11-65 require four early-emancipation carve-outs (death, marriage, military, court order before 21). v2 must add a per-child `emancipationStatus` enum and wire it through `computeAvgMonthsRemaining`.
5. **The Williams reference HTML uses MS-only colors** (oxblood-brown accent, blue-obligor, purple-obligee) that conflict with the shared TCB Law cream/oxblood tokens. Need a design decision before §1.9 UI work — either treat MS as a styling exception (Williams palette) or remap Williams to project tokens. **Flagging for review before any worksheet-preview UI changes.**
6. **`FactorInPlay` already enumerates the five categories** canonical §1.4 needs. v2's "four-state classifier" work is naming + UI surfacing, not new logic.
7. **No telemetry, no analytics, no Supabase writes from the MS routes.** Calculation is 100 % client-side; only the shared email/unsubscribe routes touch the database. Aligns with canonical §0 / build-prompt §6.
8. **No chancellor-decision data shape exists anywhere.** §1.9 is genuinely greenfield — needs a new `MSChancellorDecision` type, a per-factor decision enum, and a result-recomputation hook.

---

## 7. Recommendation

**Proceed to v2 implementation.** No surprises invalidate the canonical's conventions. The build prompt's implementation-order checklist (§4 of the build prompt) is sound; the only two refinements I'd suggest:

- **Reorder §1.10 case-ID work earlier** (it's almost done — finishing it first removes a class of round-trip bugs that would otherwise complicate testing of §1.4–§1.9 UI changes).
- **Resolve the Williams-palette-vs-shared-tokens decision before §1.5 / §1.9 UI work begins** — that's a one-question conversation that gates ~3 components.

Awaiting your confirmation to proceed to v2 implementation per build-prompt §4.
