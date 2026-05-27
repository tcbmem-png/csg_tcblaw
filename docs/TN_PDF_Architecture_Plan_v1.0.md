# TN PDF Architecture Plan v1.0 — Consolidated Source of Truth

*Single authoritative reference for the TN PDF architecture work (csg.tcblaw.org/tn). Consolidates the originating Lovable testing-mode prompt (`Lovable_Prompt_TN_PDF_Architecture_Fix.md`), every decision reached during the C1/Phase-A through C1v3 cycles, and the design principles surfaced as drift-prevention rules. If anything in any future cycle prompt conflicts with this document, this document wins. Update this document — don't fork it.*

*Last updated: 2026-05-27 (post-C1v3 inspection, pre-C1v4 round).*

---

## 0. The two non-negotiable principles (the things that prevent drift)

### 0.1 — Rule-derivation. The calculator does not think.

**Every computed value, every threshold, every flag, every default, every narrative phrase, every UI label, every PDF cell, and every conditional appendix traces to a rule, statute, or case citation. The calculator executes the rules and surfaces the user's elections. It does not encode opinions about what the right answer should be. It does not embed "best practices" that aren't in the rules. It does not paraphrase the rule's factors into the team's preferred framing. It does not pick sides in any judgment call.**

Operational consequences:

- When the rule says "the court shall consider X, Y, and Z," the narrative lists X, Y, and Z verbatim (to the extent fair use permits — paraphrase only when copyright requires it, and then preserve substance exactly).
- When the rule says "may be averaged over a reasonable period of time consistent with the circumstances of the case," the narrative uses that language and names the user's chosen averaging period as the user's election.
- When case law fills in a standard, the case is cited and the standard is quoted to the extent fair use permits.
- When the user has to make a judgment call, the rule that *asks the question* is cited, the factors the rule supplies are listed neutrally, and the user supplies the answer.
- When a default is shown in the UI (e.g., a pre-selected averaging period), the default has to itself trace to a rule's stated preference; if no rule preference exists, no default — the user must affirmatively elect.

Behaviors that cannot be traced to a rule require **explicit user acknowledgment before shipping**. The C1v3 "ARP = fewer-days parent; ties → unchecked" inference is the canonical example: the rule didn't speak to ties, the agent made a judgment call, the agent surfaced the inference for ack, the user approved, and the inference is now documented. If an agent (human or AI) finds themselves making a judgment call to fill in a gap the rules don't address, **the right move is to surface the gap, not silently embed the inference.** See drift-prevention rule #10 in §9.

This is the upstream filter every cycle prompt has to satisfy. Before any phase ships, the question is not "did we make the right call?" — it's "is every behavior traceable to a rule, and where the rule asks the user to make a call, did we surface the question and recite the user's election?"

### 0.2 — Document boundary. AOC carries numbers; annotated carries citations. (Downstream of 0.1.)

**The AOC PDF is a clean, pixel-faithful filing-ready replica of the official Tennessee Child Support Worksheet (CS-1/CS-102). It carries numbers, checkmarks, and structural cells only. It does not carry rule citations, factor recitations, narrative explanation, judgment-call framing, or any advocacy. The Comments block can carry the *what* (numbers, election, branch) in plain prose but never the *why under what authority* — the *why* belongs on the annotated PDF.**

**The annotated PDF is the narrative legal memorandum. It carries the rule citations, the case law, the factor recitations, the judgment-call framing, the methodology rationale, and the appendices. It is the brief; the AOC is the form.**

This boundary is a *consequence* of 0.1. Once you accept that the system only executes rules and surfaces elections, the question of where rule citations go becomes "the annotated PDF, because surfacing what rule was executed is the annotated PDF's job; the AOC is the executed result." The boundary is not arbitrary — it follows from how the system works.

Any time a cycle proposes putting rule citations, factor lists, or argumentative-leaning prose on the AOC PDF, stop and re-read this section. The boundary is the architecture. If we erode the boundary, both documents lose their distinct purpose and the calculator drifts back toward the "two parallel templates" failure mode that the entire architecture refactor was designed to prevent.

The single exception that proves the rule: a *pointer* on the AOC may indicate "see annotated worksheet" so the chancellor knows where to go for the narrative. A pointer is not a citation.

---

## 1. The architecture

### 1.1 One canonical engine output: the Worksheet Document Model (WDM)

A typed object that captures every computed value, every user input, every flag, every methodology rationale produced by the engine for a single scenario. Three consumers render from it:

1. **On-screen Worksheet view** — styled HTML with citations rendered inline. Already worked correctly before the refactor; remains the visual reference for what the annotated PDF should communicate.
2. **AOC-format PDF** — pixel-faithful reproduction of the official DHS form. Reads WDM through an explicit field map (`src/lib/pdf/aoc-field-map.ts`). Fillable-PDF approach (see §1.3).
3. **Annotated PDF** — narrative legal memorandum generated from the WDM. Reads the same WDM but renders prose explanation with rule citations and case law.

**The consistency contract.** Any value that appears in both PDFs traces to the same WDM field. The annotated PDF can rename, expand, or cite next to it — but the *number* matches the AOC PDF byte-for-byte. A test fixture asserts this.

### 1.2 WDM v2.1 structure (the canonical shape)

Built by `buildWDM(inputs, outputs, caption?)` — a pure derived view model, not an engine refactor. Every value carries a `WDMValue<T>`:

```
WDMValue<T> = {
  value: T,
  category: 'mechanical' | 'structural' | 'judgment',
  ruleCitation?: string,        // only relevant for category != 'mechanical' simple math
  factors?: string[],           // populated when category === 'judgment'
  userElection?: string,        // REQUIRED when category === 'judgment'
}
```

Required panels on `wdm.panels`:
- `parentRoleCheckboxes` — Mother/Father/Caretaker × PRP/ARP/SPLIT (or none-of-the-above for Equal)
- `deviationsNarrative: WDMDeviationBlock[]` — `{heading, body, citation}` structured blocks built by `buildDeviationsNarrative(inputs, outputs)`
- `statutoryCap` — engaged + headroom branches with cap threshold, calculated PCSO, status
- `bcsoAboveCap` — structured breakdown (top of schedule, excess, rate, addition) when cap engaged
- `methodologyPassThrough` — per-parent Income Helper rationale (Path B, Path E, etc.)

**Bidirectional lint test:** `category: 'judgment'` ⟺ `userElection` populated. Both directions enforced in `src/lib/calc/wdm/__tests__/build.test.ts`.

### 1.3 AOC PDF strategy: fillable-form-fill (chosen over coordinate overlay)

Background: the original C1 round used pdf-lib coordinate overlay. That worked but was fragile (every cell required hand-coordinates, fonts encoded glyphs as "?", and any layout drift broke positioning). C1v3 onward uses **AcroForm fillable-PDF fill** instead:

- A separate agent (`Form_Builder_Agent_Prompt.md`) produces a fillable version of the official DHS form with ~104 named semantic fields (`monthly_gross_mother`, `pcso_12`, `low_income`, `party_status_father`, etc.) plus one annotation field (`equal_parenting_annotation`).
- `src/lib/pdf/aoc-field-map.ts` is now `{fieldName → WDM source}` — ~104 entries, one per field.
- `src/lib/pdf/overlay-renderer.ts` (~140 lines after refactor, down from ~290) loads the fillable PDF, fills fields from WDM via the map, sets `NeedAppearances=true` with DejaVu Sans Type0/Identity-H, calls `form.updateFieldAppearances(dejaVu)`, then `form.flatten()` for non-editable filing output.
- Unicode glyphs (§, →, ↑, en-dash) render correctly via embedded DejaVu Sans.

**Fillable PDF changes the form-builder agent made (per `Form_Builder_Agent_Prompt.md`):**
- C1: 111 semantic AcroForm fields, full coverage of every populated cell
- C2: added `equal_parenting_annotation` text field on page 1
- C3: converted `low_income_n/y` and `current_order_flat_n/y` to true radio groups (prevents both-checked nonsense states)
- C4 (optional): converted 9 independent PRP/ARP/SPLIT checkboxes to 3 per-column radio groups
- C5: converted 7 date fields (`child_dob_1`–`6`, `preparer_date`) to plain text /Tx without /AA format actions

What the form-builder agent must NOT do:
- No JavaScript auto-calculation (calculator pre-computes everything)
- No field-level format validation (calculator pre-formats all strings)
- No fields marked read-only (form remains editable for manual-fill secondary use)
- No new fields beyond the one annotation (official AOC form is the authoritative reference for what cells exist)

### 1.4 Annotated PDF strategy: narrative builder pattern

- Long-form (6–15 pages depending on case complexity)
- PDF library handles multi-page flow, pagination that doesn't split paragraphs, repeated section headers, page-number footers
- Generated from WDM via a builder pattern — one function per logical unit, each emitting paragraphs
- The WDM-to-prose mapping lives in **one inspectable location** (no scattered hand-edits to prose templates)
- Shares `buildDeviationsNarrative(inputs, outputs)` helper with AOC (the AOC uses `flattenForCommentsBriefAOC` for the brief Comments block; the annotated uses the full structured `WDMDeviationBlock[]` for its discretionary-deviations section)

### 1.5 Scenario branching: how "show me both" works

When at least one Category-C judgment (see §2) has a meaningfully different alternative election:

- **WDM is single-scenario.** Each WDM instance represents one complete calculation reflecting one set of Category-C elections.
- **AOC PDF is one scenario per file.** Always. The official CS-1 form has no two-scenario affordance and pixel-faithful reproduction prevents inventing one. When the user wants both, the calculator generates two AOC PDFs distinguished by a footer label (e.g., "Scenario: imputed" / "Scenario: actual").
- **Annotated PDF is one document.** Its comparison appendix renders both WDM instances side-by-side, narrates the dispute neutrally, shows the cumulative-through-age-18 dollar impact.

The engine's `computeWDM(inputs)` takes one input set. To produce a comparison the calling code synthesizes the alternative inputs (e.g., `inputs.useImputationForB = false`) and re-invokes. Two WDM instances → two AOC PDFs → one annotated PDF whose comparison appendix consumes both. WDM stays simple; the rendering layer orchestrates.

Pattern generalizes beyond imputation: variable-income averaging period, private school as deviation vs off-order, self-employment add-back elections, special-expense 7%-threshold waiver, above-cap burden-shift outcome. UX vocabulary: "primary election + alternative scenario," parameterized by which judgment is being branched.

---

## 2. The judgment-call boundary: the calculator does not argue

This section is the downstream implementation of §0.1 for the narrative layer. The calculator surfaces the judgment-call question with the rule that asks it; the user supplies the answer; the calculator executes the math for that answer. The factors listed for Category-C values are the rule's factors verbatim (or the case law's factors verbatim, where case law fills in the rule's standard). They are not the team's reframing, paraphrase, or "best practice" synthesis. If a rule lists six factors and we list four of them, we're editorializing — that's a §0.1 violation. List all six in the order the rule lists them.

Every WDM value falls into one of three categories. The narrative prose treatment dispatches off category.

### Category A — Mechanical (no judgment call)
BCSO schedule lookup, PI%, above-cap formula, cross-credit, schedule-cap engagement, statutory threshold comparison, 7%-threshold dollar computation, pro-rata math.

**Prose treatment:** recite the governing rule, show the math, state the result. Confident, declarative.

### Category B — Structural / user-supplied without judgment
Number of children, parenting type elected, who pays the health insurance premium, annual private school cost, case caption fields, the structural categorical choice itself.

**Prose treatment:** recite what the user provided. No factor list, no advocacy framing.

### Category C — Judgment-surfaced (a judgment call exists)
**Prose treatment must:**
1. Name the value and its AOC line reference.
2. Cite the rule that governs the question.
3. Explicitly flag that the question is a judgment for the court — not a computation the worksheet resolves.
4. List the factors a court would weigh, framed neutrally — *the court's factors, the same regardless of which way the user elected*.
5. Recite the user's election as the user's choice ("Position selected on this worksheet: [X]").
6. Show the math that flows from the elected position.

**Never argue for or against the choice.** When the UI presents both positions side-by-side (imputed vs. actual), the narrative presents both with equal weight and identifies the dispute as such.

### TN Category-C judgment calls (the narrative architecture handles all of them consistently)

- Whether to impute income and on what basis (Rule .04(3)(a)(2) — voluntary unemployment/underemployment, refusal to produce income evidence, asset-based)
- Reasonable averaging period for variable income (Rule .04(3)(b); *Massey v. Casals*, 315 S.W.3d 788 (Tenn. Ct. App. 2009))
- Which self-employment add-backs apply (Rule .04(3)(a)(3): depreciation, §179, vehicle, meals, home office)
- Whether private school is a deviation flowing through the order vs. handled off-order (Rule .07(2)(d))
- Whether a special expense qualifies under Rule .07(2)(d) and whether the 7% threshold should be waived
- Voluntary unemployment/underemployment for incarceration carve-out (Rule .04(3)(a)(2)(iii))
- SSI-only obligor means-tested $0-order trigger (Rule .04(3)(c)(2))
- Above-cap "reasonably necessary" burden-shift when PCSO exceeds § 36-5-101(e)(1)(B) threshold (engine knows cap engagement; the burden-shift *conclusion* is judgment — explain the framework, don't argue the outcome; *Nash v. Mulle*, 846 S.W.2d 803 (Tenn. 1993); *Richardson v. Spanos*, 189 S.W.3d 720 (Tenn. Ct. App. 2005); *Smallman v. Smallman*, 689 S.W.3d 845 (Tenn. Ct. App. 2023))
- Modification "substantial change of circumstances" finding under § 36-5-101(g) (15% variance is mechanical; substantial-change finding is judgment)

### Advocacy denylist (Phase E test)

25 phrases across 8 judgment-call categories, with conditional-framing allowlist that overrides denylist match within the preceding 10 words. Examples of denylist phrases: "should impute," "should not impute," "the bonus is non-recurring," "the parent is underemployed," "warrants deviation." Allowlist examples that license a denylist word: "if the court finds," "whether," "may consider."

Test runs every Category-C fixture, asserts the annotated PDF text (i) names the judgment as a judgment for the court, (ii) lists the relevant factors, (iii) recites the user's election as "Position selected on this worksheet," (iv) does NOT contain any denylist phrase outside an allowlist window.

---

## 3. Conditional content rules

- **Income Methodology Appendix** — only when one or both parents used the Income Helper (had a methodology captured). Otherwise omit.
- **Imputed-vs-Actual Comparison Appendix** — only when imputation is on for at least one parent. Otherwise omit.
- **Cap analysis box** — always show; text changes based on engaged-vs-not.
- **Discretionary deviations section** — only when at least one is toggled on.
- **7% threshold breakdown** — only when special expenses are toggled on.
- **Above-cap burden-shift framework** (with Nash/Richardson/Smallman) — only when PCSO exceeds the cap.
- **Modification subsection** (Lines 13a/b/c, substantial-change finding) — only when modification mode is engaged.

---

## 4. Section structure of the annotated PDF

- **Case Background and Inputs** — parties, children with ages, parenting arrangement, scope of calculation
- **I. Income Determination** — gross monthly income per parent under Rule .04(3); path taken (W-2 paystub, Box 5 vs Box 1, variable averaging with rationale, self-employment with add-backs, imputation with basis + method + case law)
- **II. Adjusted Gross Income** — credits and adjustments under Rule .04(4) and .04(5)
- **III. Combined AGI and Pro-Rata Shares** — combined income, schedule lookup vs above-cap formula, PIs
- **IV. Basic Child Support Obligation** — BCSO derivation step-by-step (top of schedule + excess + above-cap rate calculation when applicable)
- **V. Parenting Time and Net Presumptive Support** — standard parenting vs 50/50 cross-credit; the formula; the result and direction
- **VI. Mandatory Add-Ons under Rule .04(8)** — health insurance, recurring uninsured medical, work-related childcare; who pays directly; pro-rata net through the order
- **VII. Discretionary Deviations under Rule .07(2)(d)** — private school as deviation (full pro-rata, not subject to threshold); special expenses with 7%-threshold breakdown; distinction between Rule .04(8) mandatory add-ons (no threshold) and Rule .07(2)(d) deviations (7% threshold for special expenses)
- **VIII. Statutory Cap Analysis** — § 36-5-101(e)(1)(B) threshold for the relevant child count; whether PCSO clears or stays below; if it clears, the burden-shift framework with Nash/Richardson/Smallman cited
- **IX. Final Order Summary** — FCSO with federal benefit adjustment (Line 16); direction; monthly + annual
- **Appendix A: Imputed vs Actual Comparison** (conditional) — narrative + side-by-side table with cumulative-through-age-18 projection and lifetime delta
- **Appendix B: Income Methodology** (conditional) — per-parent path documentation in narrative form
- **Authority Block** — rules and cases cited throughout, gathered as a reference list at the end

---

## 5. The AOC PDF — what populates and what stays blank

Per the official CS-1/CS-102 layout, the AOC PDF must populate:

- Identification block (Part I): party names, case/docket numbers, court, children's names + DOBs + days-with-each-party
- PRP/ARP/SPLIT party-status indicators (per column, exclusive)
- All income lines (Part II): 1, 1a, 1b, 1c, 1d, 1e, 2, 2a, 3
- All BCSO lines (Part III): 4, 4a, 5, 6, 7 — including Line 5 ("Equal — 182.5") and Line 6 for Equal 50/50 (this is where C1 round 1 failed)
- All add-on lines (Part IV): 8a, 8b, 8c, 9, 10, 11
- PCSO + low-income + flat-percent + modification lines (Part V): 12, low_income radio, current_order_flat radio, 13a, 13b, 13c
- Deviations + final order (Part VI): 14, 15, 16
- Comments block — short prose stating what happened (numbers, election, branch). **No rule citations.** Pointer to annotated worksheet permitted.
- `equal_parenting_annotation` — visible only on Equal-parenting cases. Short text. **No rule citation.** Pointer to annotated worksheet permitted.
- Preparer's Use Only block

What stays blank: lines the user hasn't activated (the official form shows blank lines too).

What never appears on the AOC: rule citations, factor recitations, narrative explanation, judgment-call framing, advocacy.

---

## 6. Test architecture (Phase E)

Five test families, each guarding a specific drift risk:

1. **Consistency test** — for each fixture, every WDM field shared between AOC and annotated PDFs renders the exact same numeric value in both outputs (byte-for-byte assertion on the relevant text content).
2. **Citation completeness test** — every CITATIONS-registered rule key referenced by the WDM for a given fixture appears in the rendered annotated PDF text. Manifest add without PDF render → build fails.
3. **AOC purity test** — for each fixture, the AOC PDF text does NOT contain any rule citation pattern (regex against `§\s*\d`, `Tenn\.`, `Rule\s+\.\d`, etc.). If a citation leaks onto the AOC, build fails.
4. **Advocacy audit** — Category-C fixtures pass the denylist/allowlist check described in §2.
5. **Scenario branching round-trip** — `useImputationForB = true/false` produces two AOCs and one annotated PDF. Each AOC's footer correctly labels its scenario. Each AOC's numeric values match its WDM byte-for-byte. The annotated comparison appendix renders both WDMs' values, each matching its AOC. The comparison appendix passes the advocacy audit. Same test extends to at least one other Category-C branchable judgment (variable-income averaging period is the natural second).
6. **Rule-traceability test (the §0.1 enforcement test)** — bidirectional:
   - **Forward:** for every `WDMValue` produced across the full fixture set, assert that the value's `ruleCitation` (or its computational lineage if mechanical math falls under a higher-level rule) resolves to a key in `src/lib/calc/citations.ts`. If a value in the engine has no traceable citation key, the engine is implementing a behavior without rule authority — fail build.
   - **Reverse:** for every key in `src/lib/calc/citations.ts`, assert there exists at least one fixture in the fixture set whose WDM exercises that citation. If a citation key in the manifest is never reached, the manifest is claiming authority for something the engine doesn't do — either add the implementation, add a fixture that exercises it, or remove the dead citation key.
   - Together with test family #2 (citation completeness), this closes the loop **rule → manifest → engine → WDM → annotated PDF**, end-to-end traceable. Phase E acceptance gate: all six test families pass across the full fixture set before any cycle prompts close.

Existing tests continue to pass: `src/lib/calc/__tests__/citations.test.ts` and all engine tests unchanged.

---

## 7. Fixture set (Phase E target: 11 fixtures)

Currently 6, expanding to 11. Coverage map:

1. **F01 — Standard parenting, below-cap, no deviations** — baseline
2. **F02 — Equal 50/50** — cross-credit branch; Lines 5/6 unique; PRP/ARP/SPLIT all-unchecked branch; `equal_parenting_annotation` engaged
3. **F03 — Above-schedule standard parenting** — above-cap formula; cap analysis sub-threshold
4. **F04 — Berger (live case)** — Equal 50/50, imputed Mother, variable-income Father, HI + private school + special expenses deviations, cap analysis sub-threshold
5. **F05 — SSR low-income** — self-support reserve adjustment branch
6. **F06 — Split parenting** — Split pro-rata branch
7. **F07 — Modification with significant variance** (new) — Lines 13a/b/c; § 36-5-101(g) substantial-change Category-C judgment
8. **F08 — Modification without variance** (new) — variance < 15% branch
9. **F09 — Non-parent caretaker** (new) — Caretaker column populated; Mother/Father reduced; cap analysis with caretaker column
10. **F10 — Multiple Category-C judgments + scenario branching** (new) — imputation + variable averaging together; tests "primary election + alternative scenario" UX generalization
11. **F11 — Cap-engaged burden-shift** (new) — Father $85K, Mother $4.5K, 3 children, standard parenting, PCSO ≈ $7,325 > $4,100 cap; burden-shift framework engaged; Nash/Richardson/Smallman appear in annotated PDF; AOC remains free of cap-engagement citations

---

## 8. Phase plan

- **Phase A** — Build the WDM type and `buildWDM()`. Rewire on-screen Worksheet view to consume WDM. **Done** (v2.1 patched after v1's "screen-mirror" miss).
- **Phase B** — Build `buildDeviationsNarrative()` shared helper; AOC consumes `flattenForCommentsBriefAOC`; annotated consumes structured blocks. **Done.**
- **Phase C** — AOC PDF refactor to fillable-PDF fill. C1 (coordinate overlay), C1v2 (5 defects fixed), C1v3 (fillable-form-fill), **C1v4 in flight (rule-citations-off-AOC + annotation rewrite + wrap fix + tint check).**
- **Phase D** — Annotated PDF narrative builders. Builder pattern; conditional sections; WDM-to-prose mapping in one inspectable location. **In parallel with C1v4.**
- **Phase E** — Test scaffolding (advocacy denylist, citation completeness, AOC purity, consistency, scenario branching round-trip). Fixture expansion 6 → 11.

---

## 9. Drift-prevention rules (read these before any cycle prompt)

1. **AOC carries numbers; annotated carries citations.** If a cycle proposes putting a citation on the AOC, stop and re-read §0.
2. **WDM is the single canonical engine output.** No parallel computation paths in any consumer. If a PDF generator wants to compute something the WDM doesn't expose, the fix is to expose it on the WDM, not to compute it in the generator.
3. **Re-read the originating spec, not the summary.** When implementing a phase, re-read the originating spec block in full before writing types. The "screen-mirror WDM" Phase-A v1 miss happened because Lovable worked from the compressed summary instead of the originating block.
4. **Surface judgment-call inferences for explicit acknowledgment.** When an agent makes a judgment call (e.g., "ARP = fewer-days parent; ties → unchecked"), flag it for the user's ack rather than silently embedding it. Document the inference in the cycle report.
5. **Baseline regeneration requires human sign-off.** B0 baseline regeneration without approval was a process miss in Phase B. Baselines never regenerate without explicit go-ahead.
6. **Custom citation copies are banned.** Cite from canonical `src/lib/calc/citations.ts`. Don't keep stale local copies anywhere.
7. **One scenario per WDM instance.** Two scenarios = two WDM instances. The rendering layer orchestrates; the WDM stays simple.
8. **Pointers are not citations.** "See annotated worksheet" on the AOC is fine. "Rule .04(7)(b)(2)(i)" on the AOC is not.
9. **No editorial voice anywhere.** The system is descriptive of rule-driven behavior, never prescriptive. Phrases like "best practice is," "most chancellors," "typically," "the better view," "we recommend," "you should consider," "courts generally," "in our experience" are banned in all surfaces — UI copy, PDF labels, annotated narrative, helper text, error messages, tooltips, modal copy, and any other user-facing string. Recite the rule; recite the user's election; show the math. If an agent finds themselves writing editorial commentary, stop and rephrase in pure rule-recital terms. The advocacy denylist (§2) catches the worst offenders; this rule is the broader filter that should catch them before they get written.
10. **Untraceable behavior requires explicit user acknowledgment before shipping.** Any default, threshold, inference, formula, flag, narrative phrase, or UI behavior that cannot be cited to a rule, statute, or case requires the implementing agent to flag it explicitly in the cycle report and obtain user approval before deploying. The C1v3 "ARP = fewer-days parent; ties → unchecked" inference is the canonical example: rule didn't speak to ties, agent surfaced the gap, user acked, inference now documented. **Don't silently fill gaps the rules don't address.** If you're tempted to ship a sensible-seeming default that the rules don't speak to, ask first. The principle in §0.1 ("the calculator does not think") makes this binding on every cycle.

---

## 10. Reference files in the working directory

- `Lovable_Prompt_TN_PDF_Architecture_Fix.md` — originating testing-mode prompt (preserve as historical reference)
- `Form_Builder_Agent_Prompt.md` — fillable PDF form-builder agent's enhancement spec (Changes 1–4)
- `Berger_Test_Report_2026-05-27.md` — live-case test that triggered the architecture refactor
- `TN_PDF_Architecture_Plan_v1.0.md` — **this document; authoritative**

---

## 11. Open items / known defects (as of 2026-05-27)

- **C1v3 equal_parenting_annotation wrap defect on F02** — second line "Rule .04(7)(b)(2)(i)." clips outside field rectangle. C1v4 fix: drop the citation entirely (per §0), which should also self-resolve the wrap.
- **C1v3 Comments-block citations on F02/F03/F04** — currently contain "Tenn. Code Ann. § 36-5-101(e)(1)(B)" and "Rule .07(2)(d)". C1v4 fix: strip from `flattenForCommentsBriefAOC` (per §0).
- **C1v3 light-blue tint visible on filled fields** — unclear whether poppler artifact or real pdf-lib flatten issue. C1v4 verification: render through Acrobat/Preview to confirm tint is not in the actual PDF byte stream.
- **Phase D annotated PDF narrative builders** — in flight in parallel with C1v4.
- **Phase E test scaffolding** — pending; advocacy denylist, citation completeness, AOC purity, consistency, scenario branching round-trip.
- **Fixture expansion 6 → 11** — pending; F07–F11 designs above.
- **MS PDF architecture fix** — follow-up cycle, separately scoped. Same boundary principle applies (MS form = clean filing replica; MS annotated = narrative). Will reuse the WDM pattern adapted to § 43-19-101's mechanics.
