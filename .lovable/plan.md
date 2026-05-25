## Goal

Replace the current `/tn/how-it-works/income` page with the longer reference content from `TN_How_It_Works_Income.md` (11 numbered sections + Quick Answer + Authorities appendix), structured for three reading depths (skim, focused read, deep audit).

## What changes

Single file: `src/routes/tn_.how-it-works.income.tsx`.

Everything else (route registration, nav, the income helper panel, the methodology appendix on the worksheet) stays as-is. Word count goes from ~900 to ~3,300.

## Page structure

1. Eyebrow + H1 + "Just want to use the calculator?" link back to `/tn`
2. **Quick Answer** boxed callout (counts / does not count / Box 5 reminder) — the "skim" layer
3. Section 1 — Why this matters more than you'd think
4. Section 2 — What counts as gross income (with the retirement and federal-benefits-to-child clarifications)
5. Section 3 — What does not count (SSI vs SSDI distinction)
6. Section 4 — The W-2 Box 5 question (keep the worked example callout from the current page)
7. Section 5 — Variable income and averaging (with the rules-of-thumb sub-list)
8. Section 6 — Self-employment income
9. Section 7 — When the court assigns income you don't actually earn (imputation)
10. Section 8 — Statutory default income figures
11. Section 9 — Adjustments from gross income to AGI
12. Section 10 — Three-year tax return convention
13. Section 11 — What this means for your case
14. **Authorities and Citations** appendix (rule subsections, statute, DHS guide, case reference) — the "deep audit" layer
15. Footer disclaimer + CTA back to `/tn`

Tailwind: stay with the existing typographic tokens (`font-serif` headings, `text-ink`, `text-muted-foreground`, `border-rule`, `bg-accent/10` for the Quick Answer and Box 5 callouts, `bg-cream` for the closing CTA). Use `<h2>` for section headers, `<h3>` only inside section 5 (the income-type rules of thumb) and section 7 (the imputation sub-grounds and carve-outs). Max width stays `max-w-3xl` for readability.

Head metadata: keep the existing title / description / og: tags and canonical URL — they already describe this page correctly.

## Open questions before I write it

1. The uploaded copy ends with **"github.com/tcb-law/tn-child-support-calculator under the MIT License"** and references `/calculator` (we use `/tn`). I'll normalize the calculator links to `/tn`. **Should I keep the GitHub / MIT line, drop it, or replace with the TCB Law site?**
2. The copy references Phase-2-only features as future tense ("when it ships the self-employment path in Phase 2"). **Keep that forward-looking phrasing, or soften to "the helper currently covers steady income; self-employment is a planned addition"?** Phase 2 is not built yet, so option B is more honest.
3. The uploaded *Authorities* appendix cites *Massey v. Casals*, 315 S.W.3d 788 (Tenn. Ct. App. 2009). I have not independently verified that pin cite. **Keep as written (your responsibility to verify), or strip the case reference to be safe?**

If you don't flag these in your response I'll default to: (1) drop the GitHub/MIT line, (2) soften Phase-2 references, (3) keep the case cite as written.