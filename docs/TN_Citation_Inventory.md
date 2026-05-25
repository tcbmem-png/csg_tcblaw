# TN Citation Inventory

**Post-audit (P1.5, 2026-05-25):** every row below has been verified against the Oct 2021 chapter PDF (`1240-02-04.20211001.pdf` — the current revision on the TN Secretary of State site; the hypothesized `20231215` file does not exist). See `docs/TN_Citation_Audit.md` for the row-by-row diff and corrections applied. The rule references in `src/lib/calc/citations.ts` now use the rule's own numbering convention: parenthesized digit at the top level `(3)`, lowercase letter in parens at the 2nd `(a)`, **arabic numeral + period** at the 3rd `2.`, **lowercase roman in parens** at the 4th `(iv)`, capital Roman at the 5th `(III)`, and so on.

Produced by walking `OfficialWorksheet` (in-app render), `official-worksheet-pdf.ts`, `aoc-worksheet.tsx`, and `ResultSidebar`. Every line below resolves through the shared `manifestFor()` helper in `src/lib/calc/citation-resolvers.ts`; the corresponding `CITATIONS[key]` entries live in `src/lib/calc/citations.ts`. The mechanical test at `src/lib/calc/__tests__/citations.test.ts` walks the same manifest, fails CI if any numeric line lacks a registered citation, and asserts every `rule` string matches the paragraph-format regex or starts with `Tenn. Code Ann. §`.


## Conventions

- "Match: yes" — the rule the worksheet displays is paragraph-specific, audit-confirmed, and matches the brief's Lines-1-12 target list.
- "Match: upgrade" — pre-P1 the line displayed a chapter-only cite (e.g. `.04`); P1.5 displays the audit-confirmed paragraph-specific cite (e.g. `.04(7)(b)2.(i)`). No math changed.
- "Practitioner input" — the line is user-supplied identification, not a rule application; intentionally non-cited (the brief explicitly permits this, "don't fabricate a citation").

---

## I — Identification

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 1 | Parent labels | (none) | (none — practitioner input) | yes |
| 2 | Parenting time | `Rule .04(7)` | `Rule .04(7)(b)2.(i)` (equal) / `Rule .04(7)(h)` (≥92 ARP days) / `Rule .04(7)(i)` (≤68 ARP days) / `Rule .04(7)(a)` (standard) — resolved via `citationForParentingMode` | upgrade |

## II — Adjusted Gross Income

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 3 | Gross monthly income | `Rule .04(3)` | `Rule .04(3)` (general) plus per-parent path resolver: `.04(3)(a)1.` simple/multi-source · `.04(3)(a)3.` self-employment · `.04(3)(b)` variable · `.04(3)(a)2.(ii)` prior-earnings imputation · `.04(3)(a)2.(iii)` vocational imputation · `.04(3)(a)2.(i)(III)` asset imputation · `.04(3)(a)2.(ii)(I)II.` incarceration carve-out · `.04(3)(c)2.` means-tested carve-out · `.04(3)(a)5.` federal benefit paid to child | upgrade |
| 3a | Self-employment tax credit | `Rule .04(4)` (chapter-only) | `Rule .04(4)` with subparts `.04(4)(b)` (6.2% FICA + 1.45% Medicare deduction) and `.04(4)(e)` (½-of-annual-maximum ceiling) | upgrade |
| 3b | Pre-existing child support paid | `Rule .04(5)` | `Rule .04(5)(e)2.` (not-in-home qualified other children) | upgrade (corrected — pre-audit cited `.04(5)(b)(2)`, which does not exist in the rule's numbering) |
| 3c | In-home children credit | `Rule .04(6)` | `Rule .04(5)(e)1.` | upgrade (corrected — `.04(6)` is the BCSO schedule paragraph, not the credit paragraph) |
| 4 | Adjusted Gross Income (AGI) | (none) | `Rule .02(1)` (definition) | upgrade |
| 5 | Percentage of income (PI) | (none) | `Rule .02(20)` (definition) | upgrade |

## III — Basic Child Support Obligation

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 6 | BCSO (schedule lookup) | `Rule .09` | `Rule .04(6)(a)` (schedule lookup) or `Rule .09` (above-schedule formula in the appendix), resolved via `citationForBcso` | upgrade (corrected — Rule `.09` has no `(2)(a)/(d)` subdivisions; lookup lives at `.04(6)(a)`) |
| — | Schedule row used | (none) | `Rule .04(6)(b)` (combined-AGI round-up rule) | upgrade (corrected — was `.09(2)(c)`) |
| — | Above-cap rate × excess | `Rule .09(2)(d)` | `Rule .09` (schedule appendix; 6.81% / 7.22% / 7.77% / 8.05% / 8.66% for 1–5+ children above $28,250) | upgrade (corrected) |
| 7 | Pro-rata share of BCSO | `Rule .04` | `Rule .02(20)` (PI definition) / `.02(23)` ("pro rata" definition) | upgrade |

## IV — Parenting Time Adjustment

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 8 | Parenting time band | `Rule .04(7)(b)(2)(i)` / `.04(7)(h)` / `.04(7)(i)` / `.04(7)(a)` | `Rule .04(7)(b)2.(i)` / `.04(7)(h)` / `.04(7)(i)` / `.04(7)(a)` — paragraph-specific, format corrected to match the rule's own arabic+period at the 3rd level | yes (format amend) |
| — | Day-threshold constants | (none) | `Rule .04(7)(a), (h), (i)` — 80-day baseline at (a); 92-day threshold + 2/182.5 per-diem at (h); 68-day threshold + 365 denominator at (i) | upgrade |
| 9 | Net presumptive child support | (none) | `Rule .02(20)` (PI applied to BCSO) | upgrade |
| — | SSR note | `Rule .02(25)` | `Rule .02(25)` (definition) + shaded-area comparison at `.04(7)(h)5.` / `.04(7)(i)2.` | yes (definition kept; shaded-area cross-ref added in plain-English text) |
| — | $100 minimum order | `Rule .04(12)` | `Rule .04(12)` | yes |

## V — Mandatory Add-Ons

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 10 | Health insurance | `Rule .04(8)(b)` | `Rule .04(8)(b)` | yes |
| 11 | Recurring uninsured medical | `Rule .04(8)(d)` | `Rule .04(8)(d)` | yes |
| 12 | Work-related childcare | `Rule .04(8)(c)` | `Rule .04(8)(c)` | yes |

## VI — Discretionary Deviations

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 13 | Private school tuition | `Rule .07(2)(d)` | `Rule .07(2)(d)1.` (extraordinary educational expenses) | upgrade |
| 14 | Special expenses (7% threshold) | `Rule .07(2)(d)` | `Rule .07(2)(d)2.` (special expenses 7%-of-BCSO threshold) | upgrade |
| — | General deviation framework | (none) | `Rule .07(1)` (consideration of best interests + required written findings) | upgrade |

## VII — Final Order

| Line | Label | Pre-P1 displayed | Post-audit displayed | Match |
|---|---|---|---|---|
| 15 | All-in monthly obligation | (none) | `Rule .02(13)` (FCSO = PCSO adjusted by any granted deviations; equals PCSO when none granted) | upgrade |
| 16 | Annual | (derived from line 15) | (none — display-only conversion) | yes |
| — | Statutory PCSO cap exceeded | `§ 36-5-101(e)(1)(B)` | `Tenn. Code Ann. § 36-5-101(e)(1)(B)` + cross-reference to Rule `.07(2)(g)1.(i)–(v)` for the per-child dollar caps + case-law footnote (Nash 1993 / Richardson 2005 / Smallman 2023) | upgrade |
| — | Means-tested-only zero order | (none) | `Rule .04(3)(c)2.` | upgrade (corrected — pre-audit cited `.04(3)(a)(2)(iv)`, which the rule renumbered out from under us) |

---

## Categorical determinations now cited

Beyond dollar numbers, the brief calls for cites on categorical choices. These resolve through the manifest:

- **Income basis selected** — `citationForIncomePath(methodology)` returns the audit-confirmed paragraph for each of the income paths (see Section II above).
- **Parenting-time mode** — `citationForParentingMode(outputs)` returns `.04(7)(a)` / `.04(7)(b)2.(i)` / `.04(7)(h)` / `.04(7)(i)`.
- **SSR engaged** — `Rule .02(25)` (definition), displayed alongside the SSR explanatory note that cross-references the shaded-area logic at `.04(7)(h)5.` / `.04(7)(i)2.`.
- **$100 minimum order applies / does not apply** — `Rule .04(12)`.
- **Statutory cap exceeded** — `Tenn. Code Ann. § 36-5-101(e)(1)(B)` plus the case-law footnote in the cap panel.
- **Means-tested-only carve-out** — `Rule .04(3)(c)2.`.
- **Incarceration carve-out** — `Rule .04(3)(a)2.(ii)(I)II.` (resolved when special-situation income path is incarceration).
- **Federal benefit paid to child** — `Rule .04(3)(a)5.`.
- **Each add-on type** — health `.04(8)(b)` / childcare `.04(8)(c)` / medical `.04(8)(d)`.

## Explicitly non-cited lines (practitioner input)

- Case caption (matter, docket, court, client, prepared-by)
- Parent labels (line 1)
- Annual rollup (line 16 — display-only conversion of line 15)
- The schedule-effective-date metadata header

These lines are user input or display arithmetic, not rule applications. The brief's instruction — *"if no rule basis exists, label it explicitly — do not fabricate a citation"* — is followed.

## Hyperlink policy

Every TN regulation citation links to the chapter-level PDF at the TN Secretary of State:

```
https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20211001.pdf
```

(Pre-P1.5 the inventory referenced a hypothesized `1240-02-04.20231215.pdf`; that file does not exist on the SoS publications server. The Oct 2021 revision is the current rule.)

No paragraph-anchor deep links (the URL structure does not support stable anchors). Case citations (Nash / Richardson / Smallman) display as plain text in the cap-panel footnote.

## Share-URL stability

No `share.ts` schema changes. Citations are computed from `inputs`/`outputs` at render time. Production `v: 1` and `v: 2` URLs decode unchanged and render with the audit-corrected paragraph-specific citations automatically — no `migrateCitations`, no state mutation. This is the share-URL stability discipline established in P1: pre-P1.5 share links open in P1.5 and display the corrected citations on the fly.
