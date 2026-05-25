# P1.5 — Citation Audit

Verify every entry in `citations.ts` and every resolver mapping in `citation-resolvers.ts` matches the actual text of Tenn. Comp. R. & Regs. **1240-02-04** (TN Secretary of State chapter PDF, 2023-12-15 effective date) and Tenn. Code Ann. **§ 36-5-101(e)(1)(B)**. Annotation-only. No engine math, no schema bump, no UI restructure.

## In scope

1. **Fetch authoritative source.** Pull the chapter PDF from `publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20231215.pdf` and parse it. Cross-check the statutory cap text from the TN Code annotated for `§ 36-5-101(e)(1)(B)` to confirm the per-child dollar amounts (currently asserted as $2,100 / $3,200 / $4,100 / $4,600 / $5,000) and the burden-of-proof language.

2. **Line-by-line verification.** For every key in `CITATIONS` (29 keys), confirm:
   - The paragraph reference (e.g. `.04(7)(b)(2)(i)`) exists in the rule and addresses the topic claimed.
   - The `name` matches the rule's actual heading/topic.
   - The `plain` explanation is faithful to the rule text (no overstatement, no missing exceptions).
   - The `url` is the canonical chapter PDF (already uniform, but reconfirm).
   - For `pcso_max`, the `caseNote` cites the three cases correctly (Nash 1993, Richardson 2005, Smallman 2023) and the cap dollar amounts agree with current statute.

3. **Resolver mapping verification.** Walk each branch of `citationForIncomePath`, `citationForParentingMode`, `citationForBcso` and confirm the returned key is the right paragraph for that input state. Spot-check edge cases:
   - 50/50 parenting → `.04(7)(b)(2)(i)` (cross-credit subparagraph).
   - 92+ ARP days → `.04(7)(h)` (reduction formula) — confirm `(h)` vs `(g)`/`(i)` in the actual rule.
   - ≤68 ARP days → `.04(7)(i)` — confirm direction (increase vs reduction).
   - Above-cap BCSO → `.09(2)(d)` — confirm the per-child percentages (6.81% / 7.22% / 7.77% / 8.05% / 8.66%) match the schedule appendix.
   - SE tax credit → `.04(5)(a)` (previously `.04(4)`, flagged as correction).
   - In-home credit → `.04(5)(b)(1)` (previously `.04(6)`, flagged as correction).
   - SSR → `.04(12)` (previously `.02(25)`, flagged as correction).

4. **Manifest coverage check.** Walk `manifestFor()` for representative input fixtures (standard, above-cap, 50/50, SSR-engaged, federal-benefit, means-tested) and confirm every emitted line resolves to a citation that the audit confirmed as correct.

5. **Deliverables.**
   - **`docs/TN_Citation_Audit.md`** — single audit report. One row per `CITATIONS` key with columns: key, claimed rule, audited rule, claimed topic vs rule heading, plain-English verdict (faithful / overstated / understated / wrong), action (keep / amend / replace).
   - **Citation corrections** — for any "amend" or "replace" row, edit the corresponding `CITATIONS[key]` entry. Resolver mappings only change if a key is renamed.
   - **`docs/TN_Citation_Inventory.md`** — update the "Currently displayed → Correct" table to reflect post-audit values; any rows where the audit confirmed P1's upgrade flip from "upgrade" to "yes" once verified.
   - **`src/lib/calc/__tests__/citations.test.ts`** — extend with a regex assertion that every `rule` either matches `/^1240-02-04-\.\d{2}(\([^)]+\))*$/` or starts with `Tenn. Code Ann. § `, catching malformed paragraphs in future edits.

## Out of scope

- Engine math, BCSO/AGI/parenting-time formulas — annotation-only audit.
- `share.ts` schema, state migration, URL versioning.
- P2 (dual AOC + annotated PDF), MS calculator, any UI restyle.
- Adding new `CitationKey` entries unless the audit finds a rule paragraph that's referenced by an existing resolver but missing from `CITATIONS`.

## Risks / known unknowns

- The official chapter PDF is the December 2023 version. If the rule has been amended since, the audit will flag the discrepancy and we'll decide together whether to pin to the 2023 effective date (current behavior) or update to a newer version.
- Two paragraph numbers I want to double-check against the actual rule text: `.04(7)(h)` vs `.04(7)(g)` for the reduction formula, and `.04(3)(a)(2)(iv)` vs `.04(3)(a)(2)(v)` for means-tested-only — older drafts of the rule numbered these differently.
- If the audit surfaces a citation that's *materially wrong* (not just imprecise), the fix is still annotation-only; no engine number changes, so no recalculation of any saved or shared scenario.

## Technical notes

- I'll fetch the chapter PDF with `document--parse_document` and grep for paragraph headers; if that's not granular enough I'll fall back to a targeted `websearch--web_search` on TN SoS for the specific paragraph.
- The audit report is the source of truth for which entries change; edits to `CITATIONS` will be small surgical replacements per key, not a wholesale rewrite of the file.
- The new regex test goes in the existing `citations.test.ts` (already created in P1) so CI gains the check with one file edit.
