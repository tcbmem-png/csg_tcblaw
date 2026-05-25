# TN $100 Minimum Floor vs. Self-Support Reserve — Resolution

**Status:** Resolved. The $100 minimum order applies when SSR collapses the
obligor's pro-rata BCSO to $0.
**Engine state:** Floor enforced in `src/lib/calc/calc.ts`; test
`src/lib/calc/__tests__/calc.test.ts` ("low-income obligor at 0 days still
respects the $100 minimum floor") unskipped and passing.
**Related:** P1.5 citation audit (`docs/TN_Citation_Audit.md`); task
`653307b2`.

## The question

When the alternate residential parent (ARP) has very low income (AGI within
the Child Support Schedule's shaded SSR area) and minimal/zero parenting
time, the Self-Support Reserve drives the obligor-only BCSO to $0. The
engine previously stopped there and emitted a "$0 presumptive — floor does
not apply" explainer. The parked test asserted the order should still be at
least $100. Which interpretation is correct?

## Authority 1 — Rule text

**Source:** Tenn. Comp. R. & Regs. 1240-02-04 (Oct. 2021 revised chapter).
URL: <https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20211001.pdf>

### § 1240-02-04-.04(12) — Minimum Child Support Order

> (a) It is the obligation of all parents to contribute to the support of
> their children with a minimum child support order of at least one hundred
> ($100) per month unless as indicated in parts (b) and (d) below.
>
> (b) This provision does not apply:
>
>   1. If the obligor's only source of income is Supplemental Security
>      Income (SSI);
>   2. When the federal benefit for a child results in a calculation of
>      support owed to be less than the minimum amount; or
>   3. When the Parenting Time Adjustment results in an amount less than
>      the minimum child support order.
>
> (c) The Tribunal shall make a written finding upon evidence submitted and
> taking all circumstances into consideration to set the current obligation
> at the minimum order amount.
>
> (d) In its discretion, the Court may deviate from the minimum child
> support order by either setting a higher or lower support order.

### § 1240-02-04-.03(b)2. — Self-Support Reserve

> (i) The guidelines include a SSR that ensures obligors have sufficient
> income to maintain a minimum standard of living based on 90% of the 2020
> federal poverty level for one person ($957 gross income per month).
>
> (iii) If the obligation using only the obligor's monthly gross income is
> an obligation within the shaded area of the CS Schedule, that amount
> shall be compared to the obligor's proportionate share using both
> parents' monthly gross incomes. **The lesser amount establishes the
> BCSO.** If the SSR is applied, the obligor will not receive the parenting
> time credit.

**Plain reading.** The (b) exceptions to the floor are an exhaustive,
enumerated list: SSI-only income, federal benefit, and PTA-driven
reduction. SSR collapse is not on the list. The PTA exception in (b)3
contemplates the *reduction* multiplier under .04(7)(h) (ARP days ≥ 92),
not the *increase* band of .04(7)(i) (ARP days ≤ 68), which is where a
0-day ARP falls. Nothing in .03(b)2. or .04(12) treats SSR as superseding
the minimum-order floor. **The $100 floor applies.**

## Authority 2 — DHS official worksheet guidance

**Source:** Tennessee Department of Human Services, *A Guide to Tennessee's
Child Support Worksheet for Guidelines Effective as of October 1, 2021
Edition.*
URL: <https://www.tn.gov/content/dam/tn/human-services/documents/A%20Guide%20to%20Tennessee%27s%20Child%20Support%20Worksheet.pdf>

The DHS-published xlsm worksheet referenced in earlier code comments
(`Income_Shares_Worksheet_2022_v1_0_*.xlsm`) is no longer hosted as a
downloadable file; TN DHS replaced it with a web-based calculator. We
therefore used the DHS Worksheet Guide — the same Department's official
written instructions to tribunals — as the authoritative practitioner
source.

### Worksheet Line 4b vs Line 15

- **Line 4b ("BCSO if Self-Support Reserve (SSR) is applied")** records the
  SSR-adjusted BCSO when the obligor's AGI is in the shaded area. The
  Guide does not say Line 4b extinguishes the order.
- **Line 15 ("Adjusted for Minimum Order (Y/N)")** is a separate, terminal
  step. The Guide states:

> 'Y' for Yes should be placed on the Worksheet if the minimum order
> should be applied. **Once a 'Y' is placed on the Worksheet, the Final
> Child Support Order will be set at $100.** 'N' for No should be placed
> on the Worksheet if the minimum order is not applied.

The DHS instruction treats Line 15 as the floor stage. SSR lowers Line 4b;
the .04(12) floor at Line 15 then catches it. DHS-aligned practitioner
behavior is the $100 order, with a written finding under .04(12)(c).

## Authority 3 — Venohr 2025 quadrennial review

**Finding: no 2025 Venohr review is publicly available.** The most current
substantive Venohr/CPR economic review of Tennessee's guidelines is the
*Tennessee Child Support Guidelines Review — Findings and Recommendations*,
April 2019 (Revised June 2020), hosted by TN DHS at
<https://www.tn.gov/content/dam/tn/human-services/documents/Tennessee%20Child%20Support%20Guidelines_report_6.17.2020.pdf>.

We checked TN DHS, the TN Administrative Office of the Courts, and general
web search for a 2024 or 2025 quadrennial review. None has been published
as of this resolution. This is itself a documented gap: federal regulation
45 C.F.R. § 302.56(e) requires states to review guidelines at least once
every four years, which would put the next Tennessee review in or around
2023–2024; nothing newer than the 2019/2020 report has been posted.

The 2019/2020 Venohr report discusses the SSR amount and the rationale for
the schedule's shaded area, but does not analyze the SSR-vs-floor boundary
condition directly. It is consistent with the rule text and DHS Guide
reading — it never suggests SSR extinguishes the minimum order.

## Convergence

| Authority | $100 floor applies when SSR collapses BCSO? |
| --- | --- |
| Rule text (.04(12)(b) enumerated exceptions) | Yes |
| DHS Worksheet Guide (Line 15 sets FCSO to $100) | Yes |
| Venohr 2019/2020 (no contrary analysis; 2025 not published) | Consistent |

Rule text and DHS guidance agree; the Venohr record is silent but
non-contrary. No conflict to surface.

## Engine change

`src/lib/calc/calc.ts`:

1. The SSR block records whether the final SSR-adjusted amount collapsed
   to ≈$0 (`ssrCollapsedToZero`) and which parent was the obligor before
   collapse (`ssrObligorIsA`).
2. The minimum-order branch now has two cases:
   - Pre-existing: `0 < |presumptive| < $100` → lift up to $100.
   - New: `presumptive == $0 && ssrCollapsedToZero` → set order to $100 in
     the original obligor's direction (ARP → PRP).
3. The "$0 presumptive — floor does not apply" explainer no longer fires
   when `ssrCollapsedToZero` is true (it would contradict the floor).

The change does **not** affect the genuine non-earner-ARP case
(`nonEarnerArpNote`), where the ARP has essentially zero income; there is
no obligor with capacity to pay, so the .04(12) floor still does not reach
that scenario.

## Test

`src/lib/calc/__tests__/calc.test.ts` — the previously-skipped test
("low-income obligor at 0 days still respects the $100 minimum floor") is
now active and asserts:

- `allInMonthly >= 100`
- `minimumOrderApplied === true`
- `allInDirection === "parent_a_to_b"` (A is ARP at 0 days, $500/mo AGI)

Full suite: 118/118 passing, 0 skipped.

## Open practitioner note (not blocking)

Rule .04(12)(c) requires a written finding when the tribunal sets the
order at the minimum amount. The worksheet annotation surfaces this via
the warning text. Whether the UI should surface a separate dedicated
"written finding required" callout for the SSR-collapse case is a follow-up
question for the input-side RuleInfo work, not for this resolution.
