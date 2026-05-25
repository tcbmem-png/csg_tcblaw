# TN Citation Inventory

**Post-audit (P1.5, 2026-05-25):** every row below has been verified against the Oct 2021 chapter PDF. See `docs/TN_Citation_Audit.md` for the row-by-row diff and corrections applied. The rule references in `src/lib/calc/citations.ts` now use the rule's own numbering convention (arabic+period at the 3rd level, lowercase roman in parens at the 4th).

Produced by walking `OfficialWorksheet` (in-app render), `official-worksheet-pdf.ts`, and `ResultSidebar`. Every line below resolves through the shared `manifestFor()` helper in `src/lib/calc/citation-resolvers.ts`; the corresponding `CITATIONS[key]` entries live in `src/lib/calc/citations.ts`. The mechanical test at `src/lib/calc/__tests__/citations.test.ts` walks the same manifest and fails CI if any numeric line lacks a registered citation or if a `rule` string fails the paragraph-format regex.


## Conventions

- "Match: yes" — the rule the worksheet now displays is paragraph-specific and matches the brief's Lines-1-12 target list.
- "Match: upgrade" — pre-P1 the line displayed a chapter-only cite (e.g. `.04`); P1 upgrades it to a paragraph-specific cite (e.g. `.04(7)(b)(2)(i)`). No math changed.
- "Practitioner input" — the line is user-supplied identification, not a rule application; intentionally non-cited (the brief explicitly permits this, "don't fabricate a citation").

---

## I — Identification

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 1 | Parent labels | (none) | (none — practitioner input) | yes |
| 2 | Parenting time | `Rule .04(7)` | `Rule .04(7)(b)(2)(i)` (equal) / `Rule .04(7)(h)` (≥92 ARP days) / `Rule .04(7)(i)` (≤68 ARP days) / `Rule .04(7)(a)` (standard) — resolved via `citationForParentingMode` | upgrade |

## II — Adjusted Gross Income

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 3 | Gross monthly income | `Rule .04(3)` | `Rule .04(3)` (general) with per-parent path resolver: `.04(3)(a)` simple/variable/SE/multi-source · `.04(3)(a)(2)(i)` prior-earnings · `.04(3)(a)(2)(ii)` vocational · `.04(3)(a)(2)(iii)` incarceration carve-out · `.04(3)(a)(2)(iv)` means-tested · `.04(3)(b)` federal benefit to child | upgrade |
| 3a | Self-employment tax credit | `Rule .04(4)` | `Rule .04(5)(a)` | upgrade (also a correction — SE credit is `.04(5)(a)`, not `.04(4)`) |
| 3b | Pre-existing child support paid | `Rule .04(5)` | `Rule .04(5)(b)(2)` (not-in-home children) | upgrade |
| 3c | In-home children credit | `Rule .04(6)` | `Rule .04(5)(b)(1)` | upgrade (also a correction — `.04(6)` is the PI/pro-rata section) |
| 4 | Adjusted Gross Income (AGI) | (none) | `Rule .04` | upgrade (now annotated) |
| 5 | Percentage of income (PI) | (none) | `Rule .04(6)(b)` | upgrade (now annotated) |

## III — Basic Child Support Obligation

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 6 | BCSO (schedule lookup) | `Rule .09` | `Rule .09(2)(a)` (schedule lookup) or `Rule .09(2)(d)` (above-cap), resolved via `citationForBcso` | upgrade |
| — | Schedule row used | (none) | `Rule .09(2)(c)` (combined-AGI row rounding) | upgrade |
| — | Above-cap rate × excess | `Rule .09(2)(d)` | `Rule .09(2)(d)` | yes |
| 7 | Pro-rata share of BCSO | `Rule .04` | `Rule .04(6)(b)` | upgrade |

## IV — Parenting Time Adjustment

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 8 | Parenting time band | `Rule .04(7)(b)(2)(i)` / `.04(7)(h)` / `.04(7)(i)` / `.04(7)(a)` | same — already paragraph-specific | yes |
| — | Day-threshold constants | (none) | `Rule .04(7)(h)–(i)` (categorical only when band ≠ standard) | upgrade |
| 9 | Net presumptive child support | (none) | `Rule .04(6)(b)` (pro-rata application) | upgrade |
| — | SSR note | `Rule .02(25)` | `Rule .04(12)` | upgrade (correction — SSR is `.04(12)`, the `.02(25)` definition is the dollar value of the reserve only) |

## V — Mandatory Add-Ons

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 10 | Health insurance | `Rule .04(8)(b)` | `Rule .04(8)(b)` | yes |
| 11 | Recurring uninsured medical | `Rule .04(8)(d)` | `Rule .04(8)(d)` | yes |
| 12 | Work-related childcare | `Rule .04(8)(c)` | `Rule .04(8)(c)` | yes |

## VI — Discretionary Deviations

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 13 | Private school tuition | `Rule .07(2)(d)` | `Rule .07(2)(d)` | yes |
| 14 | Special expenses (7% threshold) | `Rule .07(2)(d)` | `Rule .07(2)(d)` | yes |

## VII — Final Order

| Line | Label | Currently displayed | Correct (P1) | Match |
|---|---|---|---|---|
| 15 | All-in monthly obligation | (none) | `Rule .07(2)` (FCSO; when no deviation, equals PCSO) | upgrade |
| 16 | Annual | (derived from line 15) | (none — display-only conversion) | yes |
| — | Statutory PCSO cap exceeded | `§ 36-5-101(e)(1)(B)` | `Tenn. Code Ann. § 36-5-101(e)(1)(B)` + case-law footnote (Nash / Richardson / Smallman) | upgrade |
| — | Means-tested-only zero order | (none) | `Rule .04(3)(a)(2)(iv)` | upgrade |

---

## Categorical determinations now cited

Beyond dollar numbers, the brief calls for cites on categorical choices. These now resolve through the manifest:

- **Income basis selected** — `citationForIncomePath(methodology)` returns the specific paragraph for each of the six income paths.
- **Parenting-time mode** — `citationForParentingMode(outputs)` returns `.04(7)(a)` / `(b)(2)(i)` / `(h)` / `(i)`.
- **SSR engaged** — `Rule .04(12)`, displayed alongside the SSR explanatory note.
- **Statutory cap exceeded** — `Tenn. Code Ann. § 36-5-101(e)(1)(B)` plus the case-law footnote in the cap panel.
- **Means-tested-only carve-out** — `Rule .04(3)(a)(2)(iv)`.
- **Incarceration carve-out** — `Rule .04(3)(a)(2)(iii)` (resolved when special-situation income path is incarceration).
- **Federal benefit to child** — `Rule .04(3)(b)`.
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
https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20231215.pdf
```

No paragraph-anchor deep links (the URL structure does not support stable anchors). Case citations (Nash / Richardson / Smallman) display as plain text in the cap-panel footnote.

## Share-URL stability

No `share.ts` schema changes. Citations are computed from `inputs`/`outputs` at render time. Production `v: 1` and `v: 2` URLs decode unchanged and render with the upgraded paragraph-specific citations automatically — no `migrateCitations`, no state mutation.
