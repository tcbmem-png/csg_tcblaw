
# Pre-Publication Audit Plan — TN + MS Calculators

The brief asks for a *plan*, not a rebuild. This plan organizes the audit into nine workstreams (A–I from the brief), front-loads the three gaps I can already see from the codebase, and recommends what to fix vs. soften before submission Wed–Fri.

Timeline fits the window: workstreams run in parallel, gap closure happens Mon–Tue evening, soak Wed.

---

## Known gaps spotted during planning (read these first)

Three things I can already see from the current code that conflict with article language. None require rebuilding the calculator; all need a decision now.

### Gap 1 — "Free, including PDF generation" is no longer literally true (Audit H — CRITICAL)

We just shipped the lead-capture gate (`requestFreeWorksheet` + `beta_leads` table). Print/Save PDF is now blocked behind a required name + email form on both TN and MS. The article says: *"The calculator is free. No paywall, no premium tier… Including PDF generation."*

Email capture isn't a paywall in the colloquial sense, but a practitioner opening the calculator with the article in hand will hit a form before they can print, and that is a gap between print and product.

**Three options, decision needed:**
1. **Remove the gate before publication** — flip `useIsUnlocked()` back to `() => true`, restore the "Free during beta" panel. Keeps the article literally true. Loses the lead capture you just asked for. *Small.*
2. **Keep the gate, soften article copy** — change to "Free to use. We ask for a name and email before emailing/printing a filing-ready PDF, during the beta." Honest and short. *Article edit only.*
3. **Make the gate optional** — show the form, but add a "Skip and print anyway" link that sets the unlock token without submitting. Captures most leads, preserves the literal claim. *Small.*

Recommendation: **Option 2 or 3.** Option 1 wastes the work you just authorized.

### Gap 2 — TN Income Module is specced but not fully shipped (Audits B, E, F)

`docs/TN_Income_Module.md` describes a six-path router (Simple / Variable / Self-employed / Complicated / Imputed / Special) with progressive disclosure and a methodology-documented worksheet appendix. The deployed `IncomeHelperPanel` is a single collapsible helper — it does not yet present the six branching paths as separate router options the article enumerates, and the appendix `income-methodology-appendix.tsx` exists but I need to confirm what it actually renders end-to-end.

The article makes a load-bearing claim: *"routes through six paths… simple steady salary (with the W-2 Box 5 catch as the first question), variable income, self-employment, complicated multi-source income, imputed income, special situations such as SSI-only."*

This is the gap most likely to embarrass us if a reader clicks through.

**Two options:**
1. **Soften the article** to describe the income module as helper-driven with the Box 5 catch surfaced explicitly, and call the six-path router "in active development" — matches what's deployed today.
2. **Ship the six-path router this week** — this is medium-to-large work; the spec is already written but the UI doesn't exist. Probably doesn't fit the Wed/Thu window.

Recommendation: **Option 1.** Soften, then ship the full router as the follow-up the article hints at.

### Gap 3 — Imputation side-by-side (Audit F)

`scenarios.ts` already computes the `imputed` vs `actual` pair, and `comparison.tsx` / `comparison-appendix.tsx` exist. I need to verify what the user actually sees:

- Is the comparison surfaced **side-by-side on the main results page** (article's claim), or only in a separate "comparison" tab / appendix the user has to opt into?
- Does the PDF carry both columns?

If it's only in the appendix, the fix is small: hoist the comparison onto the main results panel when `hasImputation(inputs)` is true. *Small.*

If it's already there, no change.

---

## The audit, workstream by workstream

### A. Five worked cases — numeric verification

For each of Stories 1–5 from §3 of the brief, I will:

1. Construct the `CalcInputs` object that matches the story.
2. Run `calculate(inputs)` directly in a temp script (faster than driving the UI) AND cross-check by entering it via the live UI at the preview URL.
3. Compare every cited number (BCSO, presumptive, PI%, statutory excess, cross-credit) against the article.
4. Tolerance: ±$5 rounding.

Output: a 5-row table of `claim vs computed vs delta`, with any delta > $5 flagged. If a story doesn't match, I dig into whether it's a math bug, a rule-edge case (e.g. health insurance pro-rata direction), or an article copy error.

**Risk:** Story 5 (ultra-high income, $125k AGI, 80-day ARP) exercises above-cap + statutory cap + standard parenting all at once. Most likely place for a discrepancy.

### B. Rule citation coverage audit

For Chapter 1240-02-04, I'll produce a coverage matrix:

| Rule | Implemented? | Where in code | Visible citation in worksheet? |
|---|---|---|---|

Built from `src/lib/calc/citations.ts`, `calc.ts`, `bcso.ts`, and the worksheet renderer. Special focus on the brief's list: above-cap (.09(2)(d)), statutory cap (§ 36-5-101(e)(1)(B)), Box 5 catch, 50/50 cross-credit (.04(7)(b)(2)(i)), SSR, SSI-only, imputation carve-outs, PTA thresholds. For each, I confirm both *the math is right* and *the worksheet/output cites the rule on the line that produces the number*.

For rules NOT implemented (split parenting, non-parent caretaker), confirm the calculator either prompts or refuses rather than silently producing a wrong number.

### C. Output format audit (AOC alignment)

1. Download the current AOC Child Support Worksheet PDF from tncourts.gov.
2. Generate a PDF from the calculator for Story 2 (good coverage: above-cap, add-ons, standard parenting).
3. Diff field-by-field, label-by-label.
4. Flag any AOC structural element missing from our output, or any label mismatch ("Adjusted BCSO" vs "Pro-Rata BCSO" etc.).

Prior session already aligned Line 7 + 7% threshold + footnote. This pass confirms nothing regressed and the full form still tracks.

### D. Transparency / annotation audit

For one Story's PDF output, walk every numeric line and confirm a visible rule citation or visible derivation from cited values. The article's "every formula is annotated" claim is load-bearing — `citations.ts` already exists, the question is *coverage*.

Output: list of any line lacking a citation; small edits to `citations.ts` + worksheet renderer for any gaps. Almost certainly *small*.

### E. Income module audit

Confirm what the live `IncomeHelperPanel` actually exposes today vs. the six-path spec (see Gap 2). Document concretely:
- Is the Box-5 question the first thing a user sees in the helper? (Per current code: it's inside the expanded panel — confirm it's the *first* prompt.)
- Are the six paths reachable as the spec describes, or is it a single freeform panel?
- Does the worksheet appendix (`income-methodology-appendix.tsx`) actually record which path was used + what methodology, for each parent?

Output: a one-page "what ships today vs. what the article says" for §3.E, feeding the soften-vs-build decision in Gap 2.

### F. Imputation side-by-side

Per Gap 3 above: confirm where the comparison renders (main results panel vs. appendix vs. PDF only). One small UI lift if needed.

### G. Open-source repo audit

Check externally:
1. `https://github.com/tcb-law/tn-child-support-calculator` is public and resolves.
2. `LICENSE` is MIT.
3. `README.md` covers deploy / env / build steps.
4. Tests in `src/lib/calc/__tests__/calc.test.ts` and `src/lib/calc/ms/__tests__/calc.test.ts` pass on a clean clone — and ideally include the five worked Stories as fixtures. (Right now there's one TN test file and one MS test file; the five Stories are not codified. **Recommend adding them as test fixtures** — small, high-value: it locks the article's claims into CI.)
5. `schedule-2022.ts` matches the official DHS workbook SCHEDULE_BCSO range and SCHEDULEEXTENSION rates (`constants.ts` already shows the rates — confirm against the .xlsm).

If the GitHub repo is private or the README is sparse, that's a publication blocker — the article points readers there explicitly.

### H. Pricing / free access

Per Gap 1 above. Decision needed; mechanical work is small either way.

### I. Mississippi parity

For `https://csg.tcblaw.org/ms`:
1. Confirm live + accessible.
2. Run a sample § 43-19-101 flat-percentage calc through the deployed UI, verify output.
3. Confirm the deviation worksheet surfaces all ten § 43-19-103 factors. `docs/MS_Deviation_Worksheet_v2.md` is the spec — diff against the deployed `deviation-factor-form.tsx`.
4. Confirm 2022 § 43-19-101(5) imputation framework and 2023 § 43-19-36 incarceration suspension are present (`imputation-basis.tsx`, `incarceration-check.tsx` both exist — confirm logic).
5. Confirm the MS lead-capture gate decision from Gap 1 applies symmetrically.

Also: the TN article says additional states are "in the planning stages." If AL/AR/LA aren't actually planned imminently, recommend softening to "we expect adding states to be a matter of days once the legal spec is complete; no other states are currently in development."

---

## Deliverables

I'll produce a single audit report at `/mnt/documents/audit-report.md` containing:

1. **Current-state assessment** — one short section per workstream A–I, with file/line references for anything verified in code and screenshot/URL references for anything verified in the UI.
2. **Gap list** — every place the deployed product diverges from article copy, with severity (blocker / soften / nit).
3. **Remediation plan** — for each gap, the smallest change that closes it, sized S / M / L, with a fix-vs-soften recommendation.
4. **Five-stories table** — exact numbers (BCSO, presumptive, FCSO direction, deltas) for Stories 1–5.
5. **Rule coverage matrix** — Chapter 1240-02-04 rule → implemented? → cited in output?
6. **Pre-publication checklist** — one-page TL;DR the author can hand the editor.

---

## Sequencing (fits the Wed–Fri window)

- **Mon (today, after plan approval):** Workstreams A, B, G, I in parallel — pure verification, no code changes. Gap 1 decision from you.
- **Tue:** Workstreams C, D, E, F — likely small UI/citation/appendix tweaks. Codify Stories 1–5 as test fixtures (G.4).
- **Tue evening:** First full pass of the audit report. Soften any article language flagged for soften.
- **Wed:** MS soak + final regression. Submit MS article.
- **Thu/Fri:** TN soak. Submit TN article.

If A turns up a math discrepancy or G turns up a missing repo / private repo, that's a stop-the-line moment — we reschedule rather than ship.

---

## What I need from you before executing

1. **Gap 1 decision** — keep gate + soften article copy (recommended), make gate optional with a skip-link, or remove the gate.
2. **Gap 2 decision** — soften income-module language to match what's deployed (recommended), or attempt the six-path router this week.
3. **Confirm the GitHub repo URL** — `github.com/tcb-law/tn-child-support-calculator`. If the org or repo name differs, I need the actual URL before workstream G.

Everything else I can verify and remediate without a decision.
