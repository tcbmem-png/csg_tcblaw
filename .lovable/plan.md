## P1 — TN Citation Framework Completion

Implements Part One of `TN_Rule_Citation_Dual_PDF_Brief.md`. Annotation-only — no math changes, no state migration, no share-URL schema bump.

### 1. Save the brief into the repo

- Add `docs/TN_Rule_Citation_Dual_PDF_Brief.md` (verbatim from the upload) so the spec lives next to the inventory.

### 2. Citation inventory — `docs/TN_Citation_Inventory.md`

Walk the rendered worksheet (`OfficialWorksheet`, `official-worksheet-pdf.ts`, and `ResultSidebar`) line by line. Each entry:

```
Line N — <label>
  Computation: <what the engine does>
  Currently displayed: <e.g. "Rule .04(7)">
  Correct: <e.g. "Rule .04(7)(b)(2)(i)">
  Match: yes | no
```

Lines that are practitioner input (parent labels, case caption, raw entered gross before path) are labeled "Practitioner input — no rule basis" rather than fabricated.

### 3. Rewrite `src/lib/calc/citations.ts`

Restructure to the brief's Lines-1-12 spec. Each `Citation` gains:

- `rule` — paragraph-specific (`.04(7)(b)(2)(i)`, `.09(2)(d)`, `.04(3)(a)(2)(iii)`, etc.)
- `name`, `plain` (kept)
- `url` — set on every entry to the chapter-level Secretary of State PDF: `https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20231215.pdf`. No paragraph anchors.
- `caseNote?` — only on `pcso_max`, containing the *Nash / Richardson / Smallman* footnote text + one-sentence standard.

Add entries the brief requires that don't exist yet: SE-tax credit `.04(5)(a)`, in-home/not-in-home credits `.04(5)(b)(1)/(2)`, pro-rata `.04(6)(b)`, schedule-within `.09(2)(a)`, schedule-table `.09(2)(c)`, ARP-reduction threshold `.04(7)(a)`, 92-day variable `.04(7)(b)`, day constants `.04(7)(h)/(i)`, add-on health `.04(8)(b)`, childcare `.04(8)(c)`, medical `.04(8)(d)`, special-expenses 7% `.07(2)(d)`, SSR `.04(12)`, FCSO-deviation `.07(2)(a-d)`, imputation sub-paragraphs (`.04(3)(a)(2)(i)` prior-year / `(ii)` vocational / `(iii)` incarceration carve-out / `(iv)` means-tested).

Imputation, income-path, parenting-mode resolvers (small pure helpers) live alongside `CITATIONS` so a methodology object → citation key is one call:

```
citationForIncomePath(m: IncomeMethodology, parent): CitationKey
citationForParentingMode(inputs): CitationKey
citationForBcso(outputs): CitationKey   // .09(2)(a) within-table vs .09(2)(c) row vs .09(2)(d) above-cap
citationForFcso(outputs): CitationKey | null
```

### 4. Render citations next to every number

- **`official-worksheet.tsx`** — every existing `<Line cite=…>` upgraded to the specific paragraph (using the new resolvers). The `.04(7)` placeholder on Line 2 (parenting time) resolves through `citationForParentingMode`. Source-line under Line 3 gets a per-parent paragraph cite via `citationForIncomePath`. Cap panel adds the case-note footnote when `pcsoExceedsStatutoryMax`.
- **`official-worksheet-pdf.ts`** — mirror the same resolver calls so each PDF line prints the format the brief requires: *"Line 4 BCSO: $6,043 — Tenn. Comp. R. & Regs. 1240-02-04-.09(2)(d) (above-cap formula)."* Citations in smaller font (existing 8-9pt style) immediately right-of-number or directly under the label.
- Categorical determinations the brief calls out (SSR engaged, cap exceeded, means-tested zero, incarceration/military carve-out, each add-on present) each emit their cite via the same `CITATIONS` table.

### 5. Interactive citation indicator — `<RuleInfo citation="key" />`

New small component in `src/components/calculator/rule-info.tsx`:

- Renders a 12px `ⓘ` glyph in `text-muted-foreground` (testing-agent nit D-2: small, doesn't compete with the dollar number).
- Wraps the existing shadcn `Tooltip` for desktop hover and `Popover` for mobile tap (one component, both behaviors).
- Tooltip body: `name` (bold) · `rule` · `plain` · "Open chapter PDF →" link (`target="_blank" rel="noopener"`) to the SoS URL.

Wire into `ResultSidebar` next to every dollar figure (BCSO, presumptive, add-ons, all-in monthly, cap excess, SSR note) and into `OfficialWorksheet` on every emphasized line. No layout reflow — indicator floats inline after the figure.

### 6. Mechanical test — `src/lib/calc/__tests__/citations.test.ts`

(Repo convention is `src/lib/calc/__tests__/`, not `src/lib/calc/tn/__tests__/` — there's no `tn/` subfolder. Same intent.)

- Run the engine over a curated fixture set (the five Stories + a synthetic above-cap + SSR + means-tested + imputation case).
- For each fixture, build a `WorksheetManifest` = the set of `{lineLabel, citationKey}` the renderers would emit. Both `OfficialWorksheet` and `official-worksheet-pdf.ts` import a single `manifestFor(inputs, outputs): ManifestEntry[]` helper so the test exercises the same source of truth the UI/PDF do — no parallel list.
- Assertions:
  1. Every entry's `citationKey` exists in `CITATIONS`.
  2. Every entry resolves to a rule string matching `/^(1240-02-04-\.\d+|Tenn\. Code Ann\.)/`.
  3. Every numeric line that is *not* practitioner-input has a non-null citation.
  4. The `url` on every citation equals the canonical SoS chapter URL (or is `undefined` for case-only citations).

CI fails if a new line is added to the manifest without a matching `CITATIONS` entry, mechanically enforcing the article's "every formula annotated" claim.

### 7. Share-URL stability

No `share.ts` changes. No `v: 3` bump. No `migrateCitations`. Citations are computed from `inputs`/`outputs` at render — old URLs decode unchanged and render with the upgraded paragraph-specific citations automatically. Add one regression test in the existing share suite that decodes a captured `v: 1` URL and asserts the manifest still passes the citation test.

### Files

**Created**
- `docs/TN_Rule_Citation_Dual_PDF_Brief.md`
- `docs/TN_Citation_Inventory.md`
- `src/lib/calc/citation-resolvers.ts` (small pure resolvers + `manifestFor`)
- `src/components/calculator/rule-info.tsx`
- `src/lib/calc/__tests__/citations.test.ts`

**Modified**
- `src/lib/calc/citations.ts` — paragraph-specific rules + `url` + `caseNote` + new entries
- `src/components/calculator/official-worksheet.tsx` — resolver-driven cites + `<RuleInfo>` on emphasized lines + cap-panel case footnote
- `src/lib/pdf/official-worksheet-pdf.ts` — mirror cites in the brief's format
- `src/components/calculator/result-sidebar.tsx` — `<RuleInfo>` next to each computed dollar

**Untouched**
- `calc.ts`, `bcso.ts`, `scenarios.ts`, `share.ts` (no schema bump), all MS files, P2 dual-PDF work.

### Out of scope

- Part Two (dual AOC + annotated PDF) — that's P2 after this lands.
- Any engine math change.
- 0-day minimum-floor issue.
- MS calculator.

### Acceptance

- Every computed cell in the worksheet PDF prints a paragraph-specific citation in the brief's format.
- `citations.test.ts` passes; removing a citation entry or adding an uncited manifest line fails CI.
- `docs/TN_Citation_Inventory.md` lists every line, current vs. correct, with non-rule lines explicitly labeled.
- Hover or tap on any sidebar/worksheet figure surfaces name + rule + plain-English + chapter-PDF link.
- A captured production `v: 1` share URL still renders, with upgraded citations and no state mutation.
- Cap panel displays *Nash / Richardson / Smallman* footnote when `pcsoExceedsStatutoryMax`.
