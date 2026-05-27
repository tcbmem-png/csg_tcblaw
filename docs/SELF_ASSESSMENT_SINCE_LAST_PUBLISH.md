# Self-Assessment — Divergence From Last Published Build

**Date:** 2026-05-27
**Last publish commit:** `b83c51d` — *"Update site info for publish"* (2026-05-24 03:26 UTC, ~3 days ago)
**Current HEAD:** `3f9d99e` — *"Fixed drift in section builders"*
**Aggregate diff:** **761 commits, 165 files, +35,239 / -1,012 lines**

> The live site at https://tn-child-support-helper.lovable.app and https://csg.tcblaw.org is still serving the `b83c51d` build. Nothing in this 3-day workstream has been deployed.

---

## TL;DR for the "numbers were working" concern

You're right to flag it. The pure calculation code in `src/lib/calc/` has been touched in three structurally significant ways since the last publish:

1. **`calc.ts` core engine: +241 / −38 lines** across ~36 commits.
2. **A brand-new "WDM" (Worksheet Data Model) layer** was inserted between `calc.ts` and every consumer (UI worksheet, AOC PDF, annotated PDF). The UI worksheet was **rewired to read from WDM** rather than directly from `calc.ts` results (`5f0cfa4 "Rewired worksheet to WDM"`).
3. **PCSO definition was changed in the last hour** (`5a712be`) so that `calculatedPCSO` now reflects the *pre-deviation* magnitude, and `bcsoAmount` was added as a new field. This was done in service of the annotated-PDF rewrite, not in service of the calculator UI, and it crosses a number-bearing seam.

If the worksheet showed correct numbers in the b83c51d build, those numbers are now flowing through ~1,250 new lines of TypeScript before they reach the screen. They may still be correct — there is a baseline regression test suite (`worksheet-baselines.test.tsx` against six HTML snapshots) — but they have not been re-validated against the published build's output, and the baselines themselves were regenerated during the WDM cutover, so they prove internal consistency, not parity with what users last saw.

**Recommended next move before any further building:** check out `b83c51d`, run the calculator on a known fixture (e.g. f01 standard mid-income), screenshot the result, then check out HEAD and diff. That is the only honest way to answer the "are the numbers the same?" question.

---

## What's actually changed, by area

### 1. Calculator engine and data layer (HIGH RISK for "the numbers")

| File | Δ | Why it matters |
|---|---|---|
| `src/lib/calc/calc.ts` | +241 / −38 | Core engine. Touched by "Fixed equal band logic and SSR", "Implemented $100 floor for SSR=0", "Fixed parenting-time formula", "Fixed PDF calc errors", "Reworked TN income paths". |
| `src/lib/calc/wdm/build.ts` | +853 (new) | Brand new layer. Now the single source of truth for the worksheet UI and both PDFs. Modified 4× in the last 13 minutes (PCSO redefinition, `bcsoAmount` added, deviation-narrative changes). |
| `src/lib/calc/wdm/types.ts` | +258 (new) | New shape; touched twice in the last 12 minutes. |
| `src/lib/calc/types.ts` | +148 | Calculator types extended. |
| `src/lib/calc/share.ts` | +41 / − | Share-link payload changes. |
| `src/lib/calc/citations.ts` | +394 | Citation inventory rewritten ("Corrected 14 citation refs", "Fixed citation inventory data"). |
| `src/lib/calc/citation-resolvers.ts` | +304 (new) | New module. |
| `src/lib/calc/deviations-narrative.ts` | +142 (new) | New module; touched 3× in last 2h with drift fixes. |

**Regression coverage that exists:** `src/lib/calc/wdm/__tests__/build.test.ts` (+750 lines), `worksheet-baselines.test.tsx` (+99 lines) with six HTML baselines in `__baselines__/`. These baselines were regenerated *after* the WDM cutover, so they pin the new behavior, not parity with the published behavior.

### 2. Mississippi calculator (NEW — did not exist in last publish)

An entire second state has been built since 2026-05-24:

- `src/lib/calc/ms/` — `calc.ts`, `share.ts`, `reconciliation.ts`, `resume.ts`, `moment.ts`, `types.ts`, `data/percentages.ts` (+~2,000 lines) with six new test files (~1,000 lines of tests).
- `src/components/calculator/ms/` — 18 new component files (~4,300 lines): deviation walkthrough, factor forms, handoff banners, share dialog, reconciliation, worksheet preview, result sidebar, etc.
- Routes: `ms.tsx`, `ms_.about.tsx`, `ms_.how-it-works.tsx`, `ms_.how-it-works.income.tsx`, plus mirror `tn.*` routes.
- "Migrated MS to obligor/obligee" terminology pass.
- Deviation PickList, structured factor form, statutory § 93-11-65(8) tooltip, Berger imputed flow.

This is the single largest body of work in the diff. It is **invisible to anyone visiting the published site today** because it ships behind routes that don't exist there yet.

### 3. PDF subsystem

Two parallel PDF pipelines were built (both new since b83c51d):

- **AOC fillable / overlay renderer** (~6 hours of work earlier today): `src/lib/pdf/aoc-field-map.ts` (new, refactored to v2), `overlay-renderer.ts` (new), `public/forms/cs-1-fillable.pdf`, `tn-cs-worksheet-fillable.pdf`, `tn-cs-worksheet-blank.pdf`, DejaVu Sans fonts bundled. "Fixed C1 pixel defects", "Fixed margin annotation pos", "Fixed AOC fillable tint bug".
- **Annotated worksheet PDF** (current Phase D+E work, last ~90 minutes): `src/lib/pdf/annotated/` — 13 builders, registry, layout/document/flow modules, citation gating, rule recital prose. Not yet sign-off complete; latest checkpoint flagged drift in three builders, was re-submitted, awaiting your review of the regenerated samples.

### 4. Site, content, routing

- New content routes: `tn_.how-it-works.tsx`, `tn_.how-it-works.income.tsx`, `tn_.why-we-built-this.tsx`, `tn_.about.tsx`, plus MS equivalents.
- `ar.tsx` (Arabic? AR landing?), `unsubscribe.tsx`, `email/unsubscribe.ts`, `sitemap[.]xml.ts`.
- `index.tsx` rewritten (+242 lines), `about.tsx` rewritten (+173), `calculator.tsx` (+151), `how-it-works.tsx` (+135), `__root.tsx` (+54).
- `routeTree.gen.ts` regenerated (+368).
- Income helper / "How It Works → Income" pages, TN manifesto route, mother/father toggle, favicon on all pages, footer open-source link, 5 worked examples, "TN cap overlay notes".
- "Hidden Lovable badge on site" (3029d64).

### 5. Backend / infrastructure (NEW)

- **16 Supabase migrations** between 2026-05-24 and 2026-05-25, headlined by `20260524032938_email_infra.sql` (+292 lines). Mix of email infra, suppression lists, RLS adjustments.
- **Email pipeline routes:** `src/routes/lovable/email/queue/process.ts`, `suppression.ts`, `transactional/preview.ts`, `transactional/send.ts` (+~570 lines combined).
- "Set up email infrastructure", "Bypassed Resend gateway auth", "Switched to Resend sandbox", "Updated FROM_EMAIL to noreply", "Fixed admin email senders", "Fixed PDF attachment delivery".
- "Removed payments & unlock" — the Stripe paywall that was live at b83c51d has been **removed**. "Flipped gate to free always", "Added free worksheet flow", "Enabled free PDF downloads", "Added dual PDF download buttons". The published site still has the paywall code path; HEAD does not.
- "Fixed security issues", "Fixed rate limit & admin key", "Fixed discovered security issues".
- `.env`, `.env.production`, `.env.development` deleted from repo; `.gitignore` updated.

### 6. Tests added since publish

- `src/lib/calc/__tests__/citations.test.ts` (+168)
- `src/lib/calc/__tests__/income-paths.test.ts` (+228)
- `src/lib/calc/__tests__/stories.test.ts` (+64)
- `src/lib/calc/__tests__/calc.test.ts` (+95)
- `src/lib/calc/ms/__tests__/*` — 6 files, ~1,000 lines
- `src/lib/calc/wdm/__tests__/build.test.ts` (+750)
- `src/lib/calc/wdm/__tests__/worksheet-baselines.test.tsx` (+99)

This is genuinely strong coverage for the new code. It is **not** a substitute for an A/B against the published build.

---

## Honest risk ranking, highest to lowest

1. **Calculator number output may have drifted.** Same inputs → possibly different displayed numbers, because the worksheet now flows through WDM rather than directly from `calc.ts`. The very recent PCSO redefinition (`5a712be`, 13 min ago) is the most worrying single change because it was made in service of PDF prose and crosses into the WDM's number contract. Mitigation: A/B the two builds on a fixture before publishing.
2. **Paywall removal is a deliberate product change.** If you publish HEAD as-is, Stripe checkout disappears and PDFs become free for everyone. This appears to be intentional (multiple commits over multiple days, `1b26341 "Removed payments & unlock"`) but you should confirm before publishing.
3. **Mississippi calculator goes from "doesn't exist" to "live."** Large new surface area for users to find bugs in; tests exist but no production traffic has touched it.
4. **Email infrastructure is unproven in production.** Resend was put into sandbox mode at some point ("Switched to Resend sandbox"); confirm it's pointed at live before relying on order/notification emails.
5. **AOC fillable PDF and annotated PDF are mid-flight.** Annotated PDF is mid-checkpoint (Phase D+E, drift re-submission). AOC fillable is further along but only fully test-validated in dev. Neither is on the live site today.
6. **16 unapplied Supabase migrations.** Test ↔ Live divergence; need to confirm migration state on the Live environment.

---

## What I recommend doing right now (in order)

1. **Stop building new things** until the parity question is answered.
2. **Snapshot the published build's calculator output** for fixtures f01–f06 (we have six baseline fixtures defined). One screenshot per fixture, taken from https://csg.tcblaw.org.
3. **Snapshot HEAD's calculator output** for the same six fixtures from your local preview.
4. **Diff line-by-line.** If numbers match, you can publish with confidence and the WDM refactor is validated as side-effect-free. If they differ, the diff localizes whether it's the WDM build path, the recent PCSO change, the income-path rework, or the citation/deviation narrative changes.
5. **Decide on paywall.** Publishing HEAD removes it. If that's intended, also make sure the "Removed payments & unlock" migrations are coherent with the live database.
6. **Only then** return to the annotated-PDF checkpoint.

---

## Method note

There is no first-class API in this environment that returns "the git SHA serving the current published site." I identified `b83c51d` as the last publish point by its commit message — *"Update site info for publish"* — which is the only commit in the recent history that names publishing explicitly. The previous commit, `8cf8d7d "Deployed email queue route"`, also strongly implies a deploy moment. If the actual last published commit differs from `b83c51d`, the file counts above shift slightly but the structural picture (WDM cutover, MS calculator, paywall removal, PDF rewrites, email infra) does not.
