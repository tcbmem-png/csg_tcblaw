# MS v2 Changelog

Tracks each canonical-spec convention as v2 work lands. Each entry is tagged:

- **verified as-is** — v1 already implements the canonical spec; no code change required, only tests/assertions.
- **extended from v1** — v1 has the scaffolding; v2 fills in or hardens behavior.
- **net-new** — v2 is the first implementation.

Format mirrors what we want to carry forward to AL / AR / LA: knowing which patterns transferred cleanly informs how we approach the next state.

---

## Phase 1 — Surface-and-Confirm (steps 1–3)

### §1.1 AGI computation — **verified as-is**

`src/lib/calc/ms/calc.ts:91-216` implements the canonical formula verbatim:
`annualAGI = gross − taxes − ss − mandRet − priorSupport`, then
`monthlyAGI = max(0, annualAGI/12 − inHomeMonthly)`. The
voluntary-deferral non-deduction is enforced at the type layer
(`obligorAnnualMandatoryRetirement` is the only retirement input
fed into AGI; there is no voluntary slot in `MSInputs`).

No code change. Covered by `calc.test.ts` "§ 43-19-101 verification tests".

### §1.2 $10k / $100k annual thresholds — **verified as-is**

`MS_AGI_LOW_THRESHOLD = 10_000` and `MS_AGI_HIGH_THRESHOLD = 100_000` in
`data/percentages.ts`. `calc.ts:174-186` surfaces
`requiresFindingHighIncome` / `requiresFindingLowIncome` flags AND a
warning that quotes § 43-19-101(4) verbatim. Compared against AGI **annually**
per the canonical resolution.

No code change. Covered.

### §1.10 Asynchronous handoff with case-ID identity — **extended from v1**

v1 baseline (verified working):
- caseId minted via `randomToken(16)` on first Send and preserved on re-generate
  (`handoff-share-dialog.tsx:66-67`).
- `recordOriginatedHandoff` stores under `case:{caseId}` key.
- `isOriginatorBrowser` checks caseId first, falls back to fingerprint for
  legacy URLs without caseId.
- `resume.ts` already implements `saveReceivingDraft` / `probeResume` with
  3-state output (`none` | `resumable` | `diverged`) keyed off
  `baseShareHash` (not timestamps — correct per file's own commentary).

v2 extensions:
- New test file `__tests__/resume.test.ts` — 8 tests covering all three probe
  states, malformed-JSON guard, missing-field guard, `savedAt` semantics, and
  `clearReceivingDraft`.
- New test in `caseid-origin.test.ts`: "full round-trip — originator → receiver
  edits → originator still recognized as origin." Walks the full
  encode → mutate → re-encode → decode → `isOriginatorBrowser` flow. This is
  the regression test for the bug the caseId fix was written to prevent.
- New test in `caseid-origin.test.ts`: `randomToken(16)` returns a 32-hex
  string and is non-repeating.

§1.10 is now closed at 100%. Round-trip identity is a clean invariant the rest
of the build can rely on without filtering it as a separate concern.

### §1.8 Incarceration suspension — **verified as-is + regression tests**

`calc.ts:94-172` and `IncarcerationCheck` component implement § 43-19-36
verbatim:
- 180-day duration check.
- Three carve-outs (domestic violence § 97-3-7, child abuse § 97-5-39,
  criminal nonpayment § 97-5-3).
- Means-to-pay exception.
- Suspension finding language names "first day of the month following 60 days
  after release" — actually MORE precise than the canonical paraphrase
  (the spec says "60 days after release"; the code mirrors § 43-19-36(3)
  literally).

v2 added regression tests:
- `under_180` does NOT engage § 43-19-36 (normal calc proceeds, no warnings).
- Suspension reason text contains both "60 days after release" and "§ 43-19-36".

No production code change.

---

## Phase 2 — Extension Work (steps 4–6)

### §1.4 four-state classifier — **verified as-is**

`rowInPlay` in `reconciliation.ts:80-92` already produces the canonical
five-way classification (`neither` | `obligor_only` | `obligee_only` |
`both` | `agree`). v2 added a spec-mapped table check in
`__tests__/attribution.test.ts`; the exhaustive amount-comparison cases
were already covered in `reconciliation.test.ts`.

### §1.5 verbatim per-party position capture — **extended from v1**

v1 baseline: `MSPartyEntry` already captured `position`, `factsAsserted`,
`documentationReferenced`, `proposedMonthly`, `legalAuthority`.

v2 extensions (data layer + tests; UI wiring through `PartyColumn`
deferred to a follow-up — props are threaded but stamping is currently a
no-op in the component):
- Added optional `handoffRound`, `authoredAt`, `authoredByName`,
  `authoredByFirm` on `MSPartyEntry`.
- Added `HandoffState.handoffRound: number` (default 0) +
  `bumpHandoffRound` / `currentHandoffRound` helpers.
- New pure helpers `stampPartyEdit` and `stampSlatesAfterEdit` in
  `share.ts`: stamp only on material content change; no-op on identical
  re-saves.
- New test file `__tests__/attribution.test.ts` includes the round-trip
  contract test: Alice authors A.a + A.f in r1, Bob amends only A.a in
  r2, Alice amends only A.f in r3 — per-entry attribution is preserved
  across amendments (factor A.f keeps Alice's r1 stamp even after Bob's
  r2 edits to A.a).

### §1.6 cumulative projection + § 93-11-65 carve-outs — **net-new (within an extension shell)**

v1 baseline: flat `childAges: number[]` only; `computeAvgMonthsRemaining`
honored age-21 default only.

v2 work:
- New `MSChild` type with `emancipationStatus`
  (`none` | `marriage` | `military_service` | `qualifying_felony` |
  `school_discontinuance`) + optional `projectedEmancipationDate`.
- `MSInputs.children?: MSChild[]` added alongside legacy `childAges`.
- `monthsRemainingForChild(child, now)` honors all four § 93-11-65(8)
  carve-outs: occurred = 0 months; future projected date = months until
  date, capped at age-21 default for that child.
- `computeAvgMonthsRemainingFromInputs` prefers structured `children`
  when present; otherwise falls back to `childAges`.
- Share decoder back-fills `children` from `childAges` for legacy URLs.
- New `__tests__/emancipation.test.ts` (8 tests): each carve-out path,
  the age-21 cap, the structured-vs-flat preference, legacy decode.

**UI deferred to Phase 2.5**: per-child carve-out form (status selector
+ projected date + supporting note) is not yet surfaced in
`inputs.tsx`. Data model and back-end calculation are complete; the UI
is a thin form pass before the Phase 2/3 check-in.



---

## Phase 3 — Net-New (steps 7–8) — pending

### §1.9 chancellor decision surface — net-new
### §1.7 twelve-factor imputation slider — net-new

---

## Phase 4 — Output Pipeline (steps 9–11) — pending

### MS Deviation Worksheet PDF
### MS Behind the Scenes HTML (TCB brand palette w/ party tints)
### MS Sensitivity HTML (optional)

---

## Phase 5 — Verification — pending

### Full MS + TN test sweep
