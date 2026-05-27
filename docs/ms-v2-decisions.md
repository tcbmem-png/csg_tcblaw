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
