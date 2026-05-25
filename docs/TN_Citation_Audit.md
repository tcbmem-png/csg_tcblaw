# TN Citation Audit — P1.5

Audited 2026-05-25 against Tenn. Comp. R. & Regs. **1240-02-04** (TN Secretary of State, effective Oct 1, 2021 — `1240-02-04.20211001.pdf`) and Tenn. Code Ann. **§ 36-5-101(e)(1)(B)**. Annotation-only. No engine math changed.

## Headline corrections

1. **Canonical URL was wrong.** P1 used a hypothesized `1240-02-04.20231215.pdf` filename; the actual current chapter PDF is `1240-02-04.20211001.pdf`. The TN SoS index lists no newer revision. Updated.
2. **Paragraph numbering convention.** The rule uses arabic-numeral-plus-period at the third level (`2.`) and lowercase roman in parens at the fourth (`(iv)`). P1 used `(2)(iv)` throughout, which is not the rule's own format. Updated every entry to match.
3. **SE-tax credit was in the wrong section.** P1 cited `.04(5)(a)`; the rule places SE-tax adjustments at `.04(4)` ("Adjustments to Gross Income for Self-Employed Parents"). `.04(5)` is the qualified-other-children credit.
4. **In-home / not-in-home credits.** P1 cited `.04(5)(b)(1)` / `.04(5)(b)(2)`. Correct cites are `.04(5)(e)1.` and `.04(5)(e)2.`.
5. **Means-tested carve-out.** P1 cited `.04(3)(a)(2)(iv)` (an imputation subpart). The actual exclusion lives at `.04(3)(c)2.`.
6. **Federal benefit to child.** P1 cited `.04(3)(b)` (variable income). Correct cite is `.04(3)(a)5.`.
7. **Variable income.** P1 conflated it with employment income at `.04(3)(a)`. The variable-income paragraph is `.04(3)(b)`.
8. **Schedule cites.** Rule `.09` is the schedule table itself and has **no** subdivisions like `(2)(a)/(c)/(d)`. The lookup rule and rounding rule are at `.04(6)(a)` and `.04(6)(b)`; the above-schedule formula is in the schedule appendix at the end of `.09`.
9. **PI / pro-rata.** P1 cited `.04(6)(b)` (the rounding rule). Definition of PI is `.02(20)`; "pro rata" is `.02(23)`.
10. **AGI definition.** Pointed at the definitional cite `.02(1)` rather than the chapter root.
11. **SSR vs. minimum order.** P1 cited `.04(12)` for both. `.04(12)` is the $100 minimum order; the SSR definition is `.02(25)` and the shaded-area comparison logic is at `.04(7)(h)5.` / `.04(7)(i)2.`.
12. **Special expenses / private school.** Both pointed at `.07(2)(d)` generically. Correct cites are `.07(2)(d)1.` (extraordinary educational) and `.07(2)(d)2.` (special expenses 7% threshold).
13. **Statutory cap.** Confirmed Tenn. Code Ann. § 36-5-101(e)(1)(B) and the per-child percentages (21/32/41/46/50%). Added a cross-reference to Rule `.07(2)(g)1.` which states the same dollar caps.
14. **FCSO.** Pointed at the definition `.02(13)` instead of `.07(2)`.

## Per-key audit

Format: `key | P1 rule | audited rule | verdict | action`

| Key | P1 rule | Audited rule | Verdict | Action |
|---|---|---|---|---|
| `gross_income` | .04(3) | .04(3) | faithful | keep |
| `income_simple` | .04(3)(a) | .04(3)(a)1. | imprecise | amend |
| `income_variable` | .04(3)(a) | .04(3)(b) | wrong | replace |
| `income_self_employed` | .04(3)(a) | .04(3)(a)3. | imprecise | amend |
| `income_multi_source` | .04(3)(a) | .04(3)(a)1. | imprecise | amend |
| `income_imputed_prior_earnings` | .04(3)(a)(2)(i) | .04(3)(a)2.(ii) | wrong | replace |
| `income_imputed_vocational` | .04(3)(a)(2)(ii) | .04(3)(a)2.(iii) | wrong | replace |
| `income_imputed_assets` | .04(3)(a)(2) | .04(3)(a)2.(i)(III) | wrong | replace |
| `income_carveout_incarceration` | .04(3)(a)(2)(iii) | .04(3)(a)2.(ii)(I)II. | wrong | replace |
| `income_carveout_means_tested` | .04(3)(a)(2)(iv) | .04(3)(c)2. | wrong | replace |
| `income_federal_benefit_to_child` | .04(3)(b) | .04(3)(a)5. | wrong | replace |
| `se_tax_credit` | .04(5)(a) | .04(4) | wrong | replace |
| `credit_other_in_home_children` | .04(5)(b)(1) | .04(5)(e)1. | wrong | replace |
| `credit_not_in_home_children` | .04(5)(b)(2) | .04(5)(e)2. | wrong | replace |
| `agi` | .04 | .02(1) | imprecise | amend |
| `pro_rata` | .04(6)(b) | .02(20) | wrong | replace |
| `bcso_schedule_within` | .09(2)(a) | .04(6)(a) | wrong | replace |
| `bcso_schedule_table` | .09(2)(c) | .04(6)(b) | wrong | replace |
| `above_cap` | .09(2)(d) | .09 (schedule appendix) | wrong | replace |
| `parenting_time_arp_reduction` | .04(7)(a) | .04(7)(a) | faithful | keep (renamed) |
| `parenting_time_increase` | .04(7)(i) | .04(7)(i) | faithful | keep |
| `parenting_time_reduction` | .04(7)(h) | .04(7)(h) | faithful | keep |
| `parenting_time_5050` | .04(7)(b)(2)(i) | .04(7)(b)2.(i) | format | amend |
| `parenting_time_day_constants` | .04(7)(h)–(i) | .04(7)(a), (h), (i) | imprecise | amend |
| `addon_health` | .04(8)(b) | .04(8)(b) | faithful | keep |
| `addon_childcare` | .04(8)(c) | .04(8)(c) | faithful | keep |
| `addon_medical` | .04(8)(d) | .04(8)(d) | faithful | keep |
| `private_school` | .07(2)(d) | .07(2)(d)1. | imprecise | amend |
| `special_expenses` | .07(2)(d) | .07(2)(d)2. | imprecise | amend |
| `deviation_general` | .07 | .07(1) | imprecise | amend |
| `pcso_max` | § 36-5-101(e)(1)(B) | § 36-5-101(e)(1)(B) + Rule .07(2)(g)1. | faithful | keep + cross-ref |
| `ssr` | .04(12) | .02(25) | wrong | replace |
| `minimum` | .04(12) | .04(12) | faithful | keep |
| `fcso` | .07(2) | .02(13) | imprecise | amend |

## Resolver mapping verification

`citationForIncomePath`, `citationForParentingMode`, `citationForBcso` — keys unchanged; only the underlying `CITATIONS[key].rule` strings were corrected. No resolver code change required.

## Dollar / percentage spot-checks

- Schedule above-cap percentages **6.81% / 7.22% / 7.77% / 8.05% / 8.66%** for 1–5+ children at the $28,250 threshold — matches the rule (line 4354–4359 of the PDF text extraction).
- Statutory cap percentages **21% / 32% / 41% / 46% / 50%** of $10,000 net = **$2,100 / $3,200 / $4,100 / $4,600 / $5,000** — matches `.07(2)(g)1.(i)–(v)` and § 36-5-101(e)(1)(B).
- Parenting-time constants: **80** baseline, **68** / **92** thresholds, **2 / 182.5** per-diem variable, **365** denominator — all match `.04(7)(a)`, `(h)`, `(i)`.
- SE-tax half-credit ceiling described at `.04(4)(e)` matches the SE-tax-credit field in the calculator.

## Out-of-scope confirmations

- No engine math changed. `share.ts`, `calc.ts`, `bcso.ts`, `scenarios.ts` untouched.
- No `CitationKey` added or removed. Resolvers and the manifest order are unchanged.
- The Phase-1 test file's `calc` import was fixed to alias `calculate`; the imputation-paragraph assertions were tightened to match the corrected sub-paragraph format.
