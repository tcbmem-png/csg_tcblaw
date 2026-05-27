# MS v2 Decisions

Design-level decisions taken during v2 build. One entry per decision;
each names the alternative considered and the reason for the call.

---

## D-001: Williams party-column palette → remap to TCB brand, preserve distinction via tint

**Date:** 2026-05-27
**Status:** decided

**Context.** The MS_Deviation_Worksheet_Williams.html reference uses
blue/purple party-column colors. The shared TCB Law system (oxblood
`#7A1F2B`, cream `#F7F2E8`, ochre `#C9A24B`, Lora headings, Inter body)
ships with v1 on both `/tn` and `/ms`.

**Alternatives:**
1. Implement MS-only token overrides matching Williams's blue/purple.
2. Drop party-column color distinction entirely; rely on column headers.
3. **(Chosen)** Remap to TCB tokens; preserve party distinction via
   subtle warm/cool tints that stay within the brand palette.

**Decision.** Option 3.

- **Obligor column** — warm cream-with-oxblood-wash background,
  oklch(0.96 0.015 30) direction. Small-caps oxblood column heading.
- **Obligee column** — cool cream-with-slight-grey-wash background,
  oklch(0.96 0.008 240) direction. Small-caps ink column heading.
- Obligor always renders left, obligee always right.
- Explicit attribution line in each column header
  ("Per counsel for Obligor — [name]").
- Status accents (amber "in-dispute", green "agreed", muted
  "not-asserted") map to existing destructive/accent project tokens —
  these are status indicators, not party identity.
- Red-green color-sensitivity check required before finalizing:
  the tints must be perceptible without depending on hue.

**Why.** Single brand identity across the calculator (TN and MS) is the
right move. The chancellor's at-a-glance party identification is preserved
through tint + position + explicit attribution, none of which depends on
introducing non-brand color.

---

## D-002: Implementation order — close §1.10 before extension/net-new work

**Date:** 2026-05-27
**Status:** decided

**Context.** Audit recommended reordering §1.10 (case-ID + save-and-resume)
to the front because it's ~90% complete and the round-trip identity contract
is a prerequisite for clean testing of §1.4, §1.5, §1.9.

**Decision.** Closed §1.10 in Phase 1 alongside the §1.1/§1.2 verification
pass and §1.8 regression tests. All downstream conventions can now be tested
without filtering out "did the URL come back correctly?" as a separate
concern.

---

## D-003: `caseId` lives on `HandoffState`, not at payload root

**Date:** 2026-05-27
**Status:** decided (deviates from canonical spec §1.10)

**Context.** Canonical spec §1.10 describes `MSSharePayloadV4` with
`caseId` at the payload root. v1 places `caseId` on `HandoffState`
(nullable, defaulting to `null`).

**Decision.** Keep `caseId` on `HandoffState`. Do not bump the share payload
schema to v4. Reason:

1. v1's structure already passes all round-trip and origin-detection tests.
2. The originator flow already mints + preserves caseId correctly
   (`handoff-share-dialog.tsx:66`).
3. Bumping the payload schema to v4 would require migrations of every URL
   currently in the wild for marginal-to-zero behavioral benefit.

The canonical spec will be updated in a future revision to reflect the
implementation; functionally there is no difference — caseId is preserved
across re-generates and is part of the encoded URL state either way.

---

## D-004: §1.8 suspension language is more precise than the canonical paraphrase

**Date:** 2026-05-27
**Status:** noted

**Context.** Canonical spec §1.8 says "the obligation resumes 60 days after
release." The actual statute (§ 43-19-36(3)) says "the first day of the
month following 60 days after release." v1's `suspensionReason` text mirrors
the statute literally.

**Decision.** Keep the literal statutory phrasing in
`suspensionReason`. The chancellor sees the precise formula. Canonical spec
text will be corrected to match the statute in a future revision.

---

## D-005: Canonical spec patch — § 43-19-36 resumption language

**Date:** 2026-05-27
**Status:** decided (canonical-patch item; no code impact)

**Context.** Canonical spec §1.8 paraphrases the post-incarceration
resumption rule as "the obligation resumes 60 days after release." The
statute (§ 43-19-36(3)) actually specifies "the first day of the month
following 60 days after release." The distinction matters at the
arrearage-timing level: resumption falls on a calendar-aligned date, not
a sliding 60-day window.

**Decision.** Patch the canonical spec to mirror the statute literally.
Code matched the statute pre-v2 (see D-004); only the spec text needs
updating. No code or test changes required.

**Source.** Miss. Code Ann. § 43-19-36(3) text.

---

## D-006: Phase 4 PDF rendering library — options framed, decision pending

**Date:** 2026-05-27
**Status:** open (trade-offs documented; selection deferred to Phase 4 kickoff)

**Context.** Phase 4 ships the MS output pipeline: (a) the official MDHS
worksheet fill (formulaic, tabular, single-page) and (b) the § 43-19-103
deviation memorandum (narrative, multi-page, headed for chancery filing
as a potential exhibit). The TN v2 baseline uses client-side rendering
(`jsPDF` for the AOC form fill, `html2canvas` for the worksheet preview)
to sidestep the Workers / Chromium gap — there is no server-side
headless-browser option on this runtime, so all PDF generation must run
in the browser or be built from a pure-JS renderer that runs in either.

The Phase 4 question is whether to extend the TN approach to MS or
split the toolchain so the deviation memo gets filing-grade typography
while the worksheet fill stays mechanical. Three options on the table,
evaluated against the four axes that matter here.

### Evaluation axes

1. **Rasterization quality** — does output look crisp at print scale
   (300 DPI), or does it betray screenshot origin (anti-aliasing
   artifacts, scaled raster, soft type edges)?
2. **Selectable-text requirement** — is the PDF a real text document
   (copy/paste, search, screen-reader, OCR-friendly for opposing
   counsel) or a flattened image-of-text?
3. **Template-rewrite surface** — how much of the existing MS
   worksheet-preview / deviation-preview React tree has to be ported
   into the renderer's primitives? Lower is better.
4. **Bundle weight** — gzipped JS shipped to the browser. Matters
   because the calculator's value proposition includes "loads on a
   chancellor's courtroom laptop without ceremony."

### Option A — jsPDF + html2canvas (TN baseline, extended to MS)

- **Quality.** Acceptable for the AOC fill (mechanical form layout).
  Marginal for the deviation memo: html2canvas rasterizes the React
  tree, so type renders as a flattened image. At 2× scale on a
  300-DPI print path the artifacts are perceptible — visible kerning
  inconsistency, soft anti-aliased edges, lossy on the small caps
  used in column headers.
- **Selectable text.** No. Output is an image embedded in PDF
  chrome. Opposing counsel can't text-search, the screen-reader path
  is broken, and OCR is the only fallback for digital intake.
- **Template surface.** Zero. The existing
  `worksheet-preview.tsx` / deviation preview render as-is; the PDF
  is literally a screenshot of the React tree.
- **Bundle weight.** ~150 KB gzipped (jsPDF ~85 KB + html2canvas
  ~65 KB). Already in the bundle for TN, so MS adds nothing
  incremental.

### Option B — @react-pdf/renderer (filing-grade, separate template)

- **Quality.** Filing-grade. Native PDF text rendering, real font
  embedding, vector primitives. Indistinguishable from a Word-
  exported PDF at print scale. The right ceiling for a document
  that may land in a chancery exhibit binder.
- **Selectable text.** Yes. Real PDF text objects. Search,
  copy/paste, screen-reader, and OCR-free digital intake all work.
- **Template surface.** High. `<View>` / `<Text>` / `<StyleSheet>`
  primitives — Tailwind classes do not carry over. The deviation
  memo template (~600 LOC of preview JSX, plus the reconciliation
  table) has to be rewritten against the @react-pdf component set,
  with its own stylesheet. The worksheet-preview React tree stays
  as the on-screen rendering; the PDF becomes a parallel template.
- **Bundle weight.** ~440 KB gzipped (renderer + embedded font
  subsetter + PDF primitives). This is the cost line item — roughly
  3× the TN baseline, and the largest single dependency in the
  bundle by a meaningful margin. Code-splitting via dynamic
  `import()` on the deviation-PDF button is feasible and would keep
  the initial route bundle clean (load on intent, not on calculator
  open). With splitting, first-paint cost is zero; the chancellor
  pays the 440 KB only when they click "Download deviation memo,"
  which is acceptable.

### Option C — pdfmake (declarative middle ground)

- **Quality.** Native PDF text (no rasterization), so substantially
  better than Option A. Below Option B on typographic control —
  layout primitives are document-flow oriented (tables, columns,
  stacks) rather than the box-model React shape of the existing
  preview. Good enough for filing in most chancery contexts;
  perceptibly less polished than @react-pdf at the small-caps /
  rule-line detail.
- **Selectable text.** Yes. Same advantages as Option B.
- **Template surface.** High, and differently shaped from Option B.
  pdfmake uses a JSON document-definition format, not React
  primitives — the deviation memo has to be rewritten as a content
  array with style aliases, not as a component tree. Less idiomatic
  for this codebase; the rewrite is comparable in size to Option B
  but discards more of the React-native mental model.
- **Bundle weight.** ~260 KB gzipped (with default Roboto font
  subset; ~180 KB without fonts but then we ship our own).
  Lighter than @react-pdf, heavier than the TN baseline.

### Side-by-side

```text
                       │ Option A          │ Option B           │ Option C
                       │ jsPDF+html2canvas │ @react-pdf/renderer│ pdfmake
─────────────────────────┼───────────────────┼────────────────────┼──────────────
Rasterization quality  │ marginal          │ filing-grade       │ good
Selectable text         │ no                │ yes                │ yes
Template-rewrite surface│ zero              │ high               │ high
Bundle weight (gzipped) │ ~150 KB (sunk)    │ ~440 KB            │ ~260 KB
Code-split friendly     │ n/a               │ yes (dynamic import)│ yes
```

### Lean (not a decision)

User lean: **Option B for the deviation memorandum**, on the basis
that chancery-filing-grade typography matters for a document headed
for an exhibit binder and the selectable-text requirement is binding
(opposing counsel digital intake). Open question is bundle weight.
Recommendation to be resolved at Phase 4 kickoff:

- **Hybrid: A for the worksheet fill, B for the deviation memo,
  code-split.** Keeps the AOC form on the TN-proven path (zero
  incremental cost, mechanical layout where rasterization is
  acceptable), routes the deviation memo through @react-pdf behind
  a dynamic `import()` so the 440 KB only loads on click. First-
  paint and calculator-open bundle stay flat; the cost is paid
  only by users who actually export a memo, which is the right
  trade for the document that earns the quality.

No code change in this entry. Phase 4 opens with the selection
recorded as a follow-up D-007 once locked.

---

## D-008: Chancellor-decisions engine wiring — legacy URL migration semantics

**Date:** 2026-05-27
**Status:** decided (shipped in Slice 1)

**Context.** Slice 1 switched `calculateMS` from "sum the obligor's
applicable deviations" to "sum the chancellor's per-factor decisions
via `computeChancellorTotals(buildReconciliation(inputs).rows,
inputs.chancellorDecisions)`." This is the right default for new
cases (Option C semantics: pending = $0 contribution, no implicit
adoption of either party's slate) but it raises a backward-compat
question for share links in the wild that predate the
`chancellorDecisions` field.

**Decision.** Two-track behavior, gated on the presence of
`inputs.chancellorDecisions`:

- **New / current cases** (`chancellorDecisions` present, even when
  all entries are `"none"`): drive the final order off the decision
  map. A fresh case with deviations asserted but no chancellor
  ruling shows the presumptive baseline, not either party's
  proposal. The pending-count badge ("N of M pending decisions")
  makes the gap visible.
- **Legacy URLs** (`chancellorDecisions` absent entirely): fall back
  to `sumDeviations(inputs.deviationsA)` — the pre-Slice-1 behavior.
  Every existing share link continues to render the same number it
  rendered before the engine change.

The branch lives in `src/lib/calc/ms/calc.ts`:

```ts
let totalDeviationsMonthly: number;
if (inputs.chancellorDecisions) {
  const report = buildReconciliation(inputs);
  const chancellor = computeChancellorTotals(
    report.rows,
    inputs.chancellorDecisions,
  );
  totalDeviationsMonthly = chancellor.totalMonthly;
} else {
  totalDeviationsMonthly = sumDeviations(inputs.deviationsA);
}
```

**Why the fallback is sound.** `defaultMSInputs()` now seeds
`chancellorDecisions` via `defaultChancellorDecisions()`, so every
new case constructed in-app takes the decision-map branch. The only
inputs that hit the legacy branch are URL payloads decoded from a
share link that pre-dates the v2 surface — exactly the population
the fallback exists to protect. As legacy URLs naturally age out (or
are re-shared after a round-trip through the new UI, which re-encodes
with the decision map), the fallback branch becomes vestigial. It
can be removed in a future cleanup once analytics confirm zero
legacy-URL traffic, but there is no urgency.

**Pending UI cost.** The Option C semantics make the default
display jump from "the obligor's proposed final" to "the
presumptive baseline" for any in-progress case. The pending-count
badge ("N of M pending decisions") and the per-row "pending"
chancellor cell carry the explanation. Without that badge, $4,600
on a Williams-shaped case looks like a final answer rather than a
floor; with it, the user sees that the chancellor has not yet
ruled on N factors and the displayed number will move once they do.

**Source.** Slice 1 implementation; see
`src/lib/calc/ms/__tests__/calc.test.ts` "pending chancellor
decisions contribute $0" and "applicable deviations sum and apply
(signed) when chancellor adopts them" for the boundary tests.


## D-010 — Canonical-vs-runtime enum reconciliation for chancellor decisions

**Status.** Decided. Adopt runtime strings as the canonical spec.

**Context.** Two enum vocabularies were drifting:

| Surface          | Decision identifiers used                                                                       |
|------------------|-------------------------------------------------------------------------------------------------|
| Canonical §1.9   | `adopt_obligor`, `adopt_obligee`, `split_difference`, `custom`, `decline`, `accept_agreed`      |
| Runtime          | `adopt_obligor`, `adopt_obligee`, `split`, `custom`, `decline`, `accept_agreed`                 |

The only delta is `split_difference` (canonical) vs `split`
(runtime). A test agent constructing a share-URL payload from the
canonical doc set `decision: "split_difference"`; the URL
hydrator silently dropped the unrecognized kind back to `"none"`,
the chancellor totals reported every row as pending, and the
pending-count badge surfaced "N of N" instead of "0 of N". The
symptom looked like a missing UI surface; the root cause was an
enum-name mismatch — the same architectural class of defect as the
`comparisonMode === "side_by_side"` gate (Slice 1) and the
`status: "long"` vs `"over_180"` mismatch (Slice 3).

**Decision.** Rename **the canonical doc** to match runtime
(`split`, not `split_difference`). Runtime stays as-is.

**Why runtime wins this one.** The general rule is the inverse —
canonical is the spec, implementation tracks it — but the practical
cost asymmetry here is large:

- 28 call sites and ~190 lines of test assertions in
  `src/lib/calc/ms/__tests__/chancellor-decisions.test.ts` and
  `reconciliation.test.ts` use the literal string `"split"`.
- The wire-format string is persisted in shared URLs and in any
  saved-case payload encoded since Slice 1. Renaming the runtime
  identifier silently invalidates existing share links.
- The canonical doc has one source of the `split_difference`
  spelling and zero downstream consumers other than this drift.

The doc edit is one file; the runtime rename is a multi-file change
that breaks persisted state. Doc moves.

**Guardrail.** Add an exhaustive enum-name table to the canonical
spec next to §1.9 so a future test agent constructing a payload from
the spec uses the exact runtime strings. The table is the contract;
prose around it is illustrative. If the canonical and runtime ever
drift again, the table is the source of truth and the runtime is
checked against it in CI (future: a typegen step that emits the
canonical table from `MSChancellorDecisionKind`).

**Related pattern — pending-badge wording.** The badge renders
`Pending decisions | X of N` (header + value layout), not
`X of N pending decisions` (inline phrasing). A grep-based audit
for "pending decisions" matches; a grep for "of N pending" misses.
Future visual audits should DOM-click the surface rather than
grep for guessed phrasing — same posture the test agent now uses
for the imputation surface.

**Related pattern — cumulative-through-emancipation gate.** The
cumulative figure is gated on `chancellorCumulative !== null`,
which requires `totals.avgMonthsRemaining` to be non-null, which
requires at least one child with an age set in the children
roster. This is correct behavior — the cumulative figure is
meaningless without a months-remaining horizon — but it means a
share-URL payload that omits child ages renders the panel
**without** the cumulative line, and the helper copy
"Enter the children's ages above to see the cumulative impact"
takes its place. The Williams reproduction sets ages 14/10 and
the cumulative line renders correctly ($302,400 = $2,800 × 108
mo). No gate fix needed; the conditional is doing its job.

**Source.** This decision; no code change in this slice. Canonical
spec patch lives in `docs/ms-canonical-spec.md` §1.9 enum table
(follow-up edit).

---

## D-011 — Three-line cumulative-through-emancipation treatment

**Question.** Does "Cumulative through emancipation" mean (a) the
total order the obligor will pay over the projected period — i.e.
`finalOrderMonthly × avgMonthsRemaining` — or (b) the deviation
impact alone — i.e. `chancellorNetMonthly × avgMonthsRemaining`?
Slice 1 shipped (b) under the label "Cumulative through emancipation".
The Williams reference doc names (a) as the canonical anchor
($2,800 × 108 mo = $302,400). Both are useful; they answer
different questions.

**Decision.** Render all three readings, with (a) as the headline
and (b)+(c) as supporting context, under an unambiguous label:

```
Total order through emancipation     $302,400   ← headline (final × 108)
  Presumptive baseline                $496,800   ← doctrinal anchor
  Chancellor's deviation impact      (−$194,400) ← negotiation anchor
```

- **Headline** (`finalOrderMonthly × months`) answers a chancellor's
  bench question: "what am I ordering."
- **Presumptive baseline** (`presumptiveMonthly × months`) shows the
  doctrinal anchor the chancellor's deviations move from.
- **Deviation impact** (`chancellorNetMonthly × months`) answers a
  mediator's question: "what are we fighting over."

The previous label "Cumulative through emancipation" was too
ambiguous for either reading to be self-evident — a self-rep user
reading "−$194,400" plausibly interprets it as "owe negative money
over the period." Renamed to "Total order through emancipation"
regardless of which version ships.

**Source.** Phase 3.5 review (this loop); implemented in
`deviation-reconciliation.tsx`. Canonical Williams anchor confirmed:
ages 14/10 → 108 mo average → $2,800/mo final order × 108 = $302,400.

---

## D-012 — InPlayBadge consistency (verification, no code change)

**Question.** Does the §1.4 four-state classifier render
identically across every surface (factor card header pill,
reconciliation table row, party-block summary background)?

**Decision.** Yes — verified. All three surfaces consume
`inPlayPresentation()` from `src/lib/calc/ms/in-play-labels.ts`,
which is the single source of truth for label string, chip class,
border class, and background class per state. No drift possible by
construction: any rename or color change propagates everywhere
from one table. `result-sidebar.tsx` and `worksheet-preview.tsx`
do not render the badge (intentional — they show monetary results,
not factor-classification chips), so the consistency contract is
satisfied across all surfaces that currently render the state.

**Source.** Slice 5 verification pass.

---

## D-013 — Round-bump call sites (Slice 5.5)

**Decision.** `bumpHandoffRound` is invoked at exactly two state
transitions in the live UI:

1. **Originator first send** — `handoff-share-dialog.tsx::build()` sets
   `handoffRound: max(1, prior)` when minting the initial "originated"
   handoff. Round 1 = the originator's authored draft (implicit from
   the column header — no "Amended in round 1" line renders by design).

2. **Either side sends back** — `handoff-action-panel.tsx::copySendBackUrl()`
   bumps the round once per send-back, persisting both into the encoded
   URL and the local `handoff` state via `setHandoff(result.handoff)`.
   Receiver send-back → round 2. Originator revisions → round 3. And
   so on for each subsequent round trip.

**Why.** The §1.5 stamping helpers (`stampPartyEdit`,
`stampSlatesAfterEdit`) were wired and tested end-to-end since Phase 2.5,
but the `handoffRound` field on `HandoffState` was never advanced past
its default `0`. Consequences cascaded:

- `PartyColumn.updateParty` guards stamping on `handoffRound > 0`, so
  every receiver edit silently skipped stamping.
- Even when stamping ran (via test URLs that pre-set `handoffRound: 1`),
  the "Amended in round N by [name]" render gate is `> 1`, so round-1
  stamps suppressed the line — the correct doctrinal behavior for the
  authored draft, but masking the absent round-bump on send-back.

**Same architectural class** as the gate-disguised-as-mismatch family
documented under D-009 / D-010: the data-layer contract was honored
end-to-end (storage, encoding, decoding, render gate), but a single
state transition that should advance the contract was never invoked.
The fifth instance in that catalog.

**Source.** Slice 5.5 — attribution rendering gap surfaced by Phase 3.5
test agent after Slice 5 verification confirmed stamping helpers without
exercising the round-bump call site.

---

## D-014 — Gate-pattern instance #6: attribution render-gate field-shape contract

**Symptom.** Phase 3.5 test agent constructed a URL payload modeling
the "Maria Lopez amends factor (e)" scenario, hydrated cleanly, but
the "Amended in round N by …" line in `PartyColumn` never rendered.
Sixth instance of the gate-disguised-as-mismatch family (D-009 enum
mismatch; D-010 `split_difference`→`split`; Slice 1 `comparisonMode`;
Slice 3 `status: "long"`→`over_180`; D-013 missing round-bump call
sites; this one).

**Diagnosis posture (now standardized).** When URL state round-trips
correctly but a render surface does not fire, the diagnosis sequence is:

  (a) Open the render surface and identify the conditional gate verbatim.
  (b) Compare the gate's read predicates against the URL-state field
      shape the test agent constructed.
  (c) Classify the mismatch as one of:
      - **Field-shape mismatch** — gate reads `foo.bar`, payload sets
        `foo.baz` or `foo.bar` is a nested object where runtime expects
        a flat string. Fix: align payload to runtime, OR rename runtime
        to canonical (D-010 style) when call-site cost permits.
      - **Mode-switch gate** — gate hidden behind a feature-flag-as-mode
        switch (Slice 1 `comparisonMode === "side_by_side"`). Fix: remove
        the gate or expose the mode in the test setup.
      - **Action-gated by design** — gate reads a sentinel only a reducer
        sets (round-bump, signed token, etc.). Not a bug: URL injection
        is doctrinally insufficient and the test must exercise the full
        action flow.

**Resolution of this instance.** The gate in
`src/components/calculator/ms/party-factor-block.tsx` line 286 is:

```tsx
{party.handoffRound && party.handoffRound > 1 ? (
  <div>Amended in round {party.handoffRound}
       {party.authoredByName ? ` by ${party.authoredByName}` : ""}</div>
) : null}
```

Two requirements for the line to render via URL injection:

1. `party.handoffRound > 1` (strictly greater — round 1 = originator's
   authored draft, implicit from the column header).
2. `party.authoredByName` populated as a **flat string** at
   `deviationsA[i].party.authoredByName` (or `deviationsB[i].party.…`).
   The runtime field shape is NOT `lastEditedBy.name` or `amendedBy.name`;
   the canonical-prose phrases "amended by" / "last edited by" map to
   the flat `authoredByName: string | null` field on `MSPartyEntry`.

The render gate does not check any sentinel, localStorage token, or
side-detection probe. URL-state injection is structurally sufficient
once the field shape matches — this is a Type A (field-shape) mismatch,
not Type C (action-gated). The doctrinal forgeability question that
naturally arises here is logged separately as D-015.

**Source-of-truth.** The runtime field-shape contract for URL-state
test injection now lives in `docs/ms-canonical-spec.md` Appendix A
("URL-state payload schema and test-injection contract"). Future test
agents construct payloads from that table; future runtime refactors
that rename a field must update the appendix in the same commit.

**Future guardrail (carries D-010's proposal forward).** A typegen
step that emits the `MSPartyEntry` flat-string field roster and the
`MSChancellorDecisionKind` enum table directly from `src/lib/calc/ms/types.ts`
and `src/lib/calc/ms/chancellor-decisions.ts` into the canonical
appendix would close field-shape drift at the source. Mode-switch
gates and action-gated renders are orthogonal categories and remain
caught by the (a)–(c) diagnosis posture above.

---

## D-015 — URL-state is unsigned (integrity model: attorney signature, not crypto)

**Posture.** The MS calculator does NOT cryptographically guarantee
the provenance of any field carried in a share URL. The render layer
displays whatever the URL hydrates: if a payload sets
`party.handoffRound = 2` and `party.authoredByName = "Maria Lopez"`,
the worksheet renders "Amended in round 2 by Maria Lopez" regardless
of whether Maria Lopez ever touched the case. The hydrator could
enforce integrity (signed tokens, HMAC over the payload, server-side
round-bump) but deliberately does not.

**Why this is the right posture.** The calculator is a negotiation
aid, not a system of record. The integrity model for documents
leaving the tool is the same model that governs every other document
attorneys exchange — NDAs, position papers, mediation briefs,
settlement proposals: **counsel signs the preparer's-use-only block
on the worksheet, and that signature vouches for the contents,
including attribution metadata.** The chancellor reads the signed
worksheet; the signing attorney is on the hook for accuracy. URL
crypto would not add integrity that attorney signature does not
already provide, and would add operational complexity (key
management, token rotation, server-side state) that contradicts the
"frontend + URL only, no auth, no server storage" design premise
documented at `MSInputs`-adjacent types.

**Three useful effects of making this explicit.**

  1. **Honest framing** of what the tool is and is not. It is a math
     calculator with a deviation-worksheet narrative layer, not a
     tamper-evident notary.
  2. **Points users at the correct integrity layer.** If counsel has
     concerns about a received worksheet's attribution, the question
     is "who signed this?" — not "is the URL signed?".
  3. **Preempts future scope creep.** The "why doesn't it have signed
     tokens?" question gets a settled answer rather than re-litigation.
     If a future jurisdiction (or a future MS rule change) requires
     cryptographically-verifiable attribution, that becomes a Phase-N
     policy change with explicit canonical revision, not a quiet
     hydrator patch.

**Operational consequence for testing.** Phase 3.5 test agents (and
all future test agents) construct URL payloads directly per the
Appendix A field-shape contract. Exercising the full
originator → send → receiver → amend → send-back flow via the actual
UI buttons remains the appropriate test for the round-bump call sites
(D-013), but the **render surfaces** themselves (attribution line,
in-play badge, chancellor decision pills, pending-count badge,
cumulative-through-emancipation block) are all URL-injection-testable
by construction, because none of them gate on a reducer-only sentinel.

**Out of scope (explicitly deferred).** Signed handoff tokens.
Server-side round-bump enforcement. Tamper-evident audit log. Any
of these can be added later as a Phase-N feature with explicit
policy rationale; none are required for the Phase 3.5 / Phase 4 scope.
