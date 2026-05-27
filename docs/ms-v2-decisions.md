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

