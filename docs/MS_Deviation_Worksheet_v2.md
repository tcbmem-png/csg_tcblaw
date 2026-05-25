# MS_Deviation_Worksheet_v2.md

*Build spec for the next pass on the Mississippi § 43-19-103 deviation worksheet at `csg.tcblaw.org/ms`. The current implementation (per `MS_Calculator_Overview.md`) ships all ten factors as a free-text + signed-dollar input per factor with a running total. This spec adds three things: a guided walk-through that prompts the user to consider each factor in turn, structured sub-inputs per factor that capture the kinds of evidence a Mississippi chancellor will weigh, and a side-by-side comparison mode that lets the parties' positions sit beside each other before the chancellor sees them.*

*Also includes two important statutory updates the current code and copy don't reflect: the 2022 imputation framework now codified at § 43-19-101(5), and the SB 2082 / § 43-19-36 administrative suspension of child support during incarceration.*

*Read alongside: `MS_Build_Spec.md` (original spec), `MS_Calculator_Overview.md` (current implementation), `MS_How_It_Works_Income.md` (the how-it-works page — needs updates noted below).*

---

## 1. What This Spec Adds

The Substack post for this project, drafted at the same time as this spec, contains the line:

> "For Mississippi, it does the simple percentage. It also walks the user through all ten deviation factors as a structured worksheet. The output is a document that organizes the parties' positions on each factor before the chancellor sees them."

The current MS calculator partially fulfills that claim. It does the simple percentage correctly. It surfaces all ten factors. It produces a worksheet output. It does NOT, however, do three things that the sentence promises:

**It does not "walk the user through" the factors.** The current UI shows ten expandable factor cards. The user picks which to engage with. There is no guided sequence that prompts the user to consider each factor in turn and decide whether it applies.

**It is not "a structured worksheet" in any meaningful sense.** Each factor's input is a free-text description plus a signed dollar amount. A chancellor reading the worksheet sees a number and a sentence. That's not structured. A structured worksheet would capture the kinds of evidence and reasoning that map onto the chancellor's framework for each specific factor.

**It does not "organize the parties' positions" because there is only one party's position.** The current UI is single-user. There is no opposing-party position capture, no side-by-side comparison, no document that shows the gap between what each side is arguing.

This spec addresses all three. It also folds in two statutory developments that the current code and copy were drafted before reflecting:

- The 2022 imputation amendment (HB 1067) added subsection (5) to § 43-19-101, providing a statutory framework for imputation that did not previously exist.
- The 2023 administrative suspension act (SB 2082) created § 43-19-36, which suspends child support obligations by operation of law for incarcerated parents (more than 180 days), with carve-outs.

Both of these mean the calculator's current handling of imputation and incarceration is incomplete. The fixes are described in Sections 5 and 6 below.

---

## 2. The Walk-Through

The current factor card UI should be preserved as the underlying data model and as the experienced-user fallback. Adding a new "Walk-Through" mode gives less-experienced users a guided path.

### 2.1 — Entry point

On the Inputs tab, above the existing factor card list, add a new section:

```
┌─ Deviations: How would you like to work through them? ─┐
│                                                        │
│  Mississippi law allows the chancellor to deviate      │
│  from the guideline percentage based on ten specific   │
│  factors at § 43-19-103. Most cases involve only one   │
│  or two factors; some involve none. We'll help you     │
│  identify which apply.                                 │
│                                                        │
│  ◯ Walk me through all ten factors                     │
│    Recommended if you're not sure which factors apply  │
│                                                        │
│  ◯ Let me pick the factors I want to address           │
│    Recommended if you already know which factors are   │
│    in play (current behavior)                          │
│                                                        │
│  [Continue →]                                          │
└────────────────────────────────────────────────────────┘
```

If the user picks "Walk me through," the interface shifts into the walk-through flow. If they pick "Let me pick," the current factor card UI displays.

### 2.2 — Walk-through screen pattern

For each factor in sequence (a through j), display a focused screen:

```
┌─ Factor (a) — Extraordinary medical, psychological,
│              educational, or dental expenses
│                                              [3 of 10] │
│                                                        │
│  Does either parent have, or is either parent          │
│  anticipating, extraordinary expenses for any child    │
│  in any of these categories?                           │
│                                                        │
│  Examples:                                             │
│  • Ongoing medical treatment beyond routine care       │
│  • Mental health therapy or counseling                 │
│  • Specialized educational services (tutoring,         │
│    learning disability support, private school for     │
│    a child whose needs require it)                     │
│  • Major dental work beyond routine care               │
│                                                        │
│  ◯ Yes, this factor applies                            │
│  ◯ No, this factor does not apply                      │
│  ◯ Skip for now (decide later)                         │
│                                                        │
│  [← Back]                                  [Continue →]│
└────────────────────────────────────────────────────────┘
```

When the user selects "Yes," the screen expands to show the structured sub-inputs for that factor (Section 3 below). When the user selects "No" or "Skip for now," the walk-through proceeds to the next factor.

A progress indicator at the top shows where the user is in the sequence (3 of 10, 4 of 10, etc.).

### 2.3 — End of walk-through

After factor (j), the user lands on a summary screen showing every applicable factor with its proposed amount and a running total. From this screen the user can:

- Edit any factor inline
- Return to the walk-through to revisit a "Skip for now"
- Proceed to the Worksheet tab

---

## 3. Structured Sub-Inputs Per Factor

This is the heart of the upgrade. Each of the ten factors gets a sub-form designed around the kinds of evidence a Mississippi chancellor weighs when applying that specific factor.

The free-text "description" field is preserved but moves to the bottom of each sub-form as "Additional context (optional)." The structured fields above it capture the substantive evidence.

### 3.1 — Factor (a): Extraordinary medical, psychological, educational, or dental expenses

```
Type of expense (check all that apply):
  ☐ Medical (ongoing, beyond routine care)
  ☐ Psychological (therapy, counseling, psychiatric)
  ☐ Educational (specialized services, private school for need)
  ☐ Dental (major work beyond routine care)

For each checked type:
  Description of the specific expense:
  [text field]

  Current monthly cost: $___
  Anticipated duration: [3-6 months / 6-12 months /
                         1-2 years / through age 21 / other]
  Documentation available:
    ☐ Provider bills/estimates
    ☐ Insurance EOBs
    ☐ Treatment plan / IEP / similar
    ☐ Other: [text]

  Coverage:
    Portion covered by insurance: $___
    Portion not covered (out-of-pocket): $___
    Which parent currently pays: [Obligor / Obligee / Both]

Proposed monthly deviation amount: $___ [+/-]
Proposed allocation between parents:
  Obligor's share: ___%   Obligee's share: ___%
```

### 3.2 — Factor (b): Independent income of the child

```
Does the child have independent income?
  ☐ Earned income (job, self-employment) — monthly: $___
  ☐ Social Security benefits (other than SSI) — monthly: $___
  ☐ Trust distributions — monthly: $___
  ☐ Investment income — monthly: $___
  ☐ Other: [text] — monthly: $___

Is the income reliable and recurring? [Yes / No]

Description:
[text field]

Proposed monthly deviation amount: $___
(typically negative — reduces obligor's support)
```

### 3.3 — Factor (c): Payment of both child support and spousal support

```
Is the obligor also paying spousal support to the obligee?
  ◯ Yes — current monthly amount: $___
  ◯ Spousal support pending but not yet ordered
  ◯ No

If yes, basis for spousal support:
  ☐ Court order (case number: ____)
  ☐ Property settlement agreement
  ☐ Pending dissolution proceeding

Description of the combined burden:
[text field]

Proposed monthly deviation amount: $___ [+/-]
```

### 3.4 — Factor (d): Seasonal variations in either parent's income or expenses

```
Type of variation:
  ☐ Income — which parent: [Obligor / Obligee / Both]
  ☐ Expenses — which parent: [Obligor / Obligee / Both]

Pattern (peak vs trough months):
  Peak income months: [multi-select calendar months]
  Low income months: [multi-select calendar months]

Annual range (high to low):
  High-month gross: $___
  Low-month gross: $___

Source of variation:
  [text field — e.g., "construction trade with weather-dependent
   project flow," "commission-based sales with quarterly cycles"]

Proposed approach:
  ◯ Use annualized average (current approach)
  ◯ Use seasonally-adjusted monthly figure (specify): $___
  ◯ Build in seasonal adjustment to support amount (specify): [text]

Proposed monthly deviation amount: $___ [+/-]
```

### 3.5 — Factor (e): The age of the child

```
Ages of children:
  Child 1: ___    Child 2: ___    Child 3: ___    [+]

Greater-needs argument:
  ☐ Older children have greater per-child costs
     (activities, clothing, food, transportation)
  ☐ Older children have greater educational expenses
  ☐ Older children's needs justify upward deviation

Specific items the standard percentage may not cover:
  [text field]

Proposed monthly deviation amount: $___ [+]
```

### 3.6 — Factor (f): Special needs traditionally met within the family budget

```
Type of special need:
  ☐ Activities (sports, music, arts)
  ☐ Religious / cultural / community
  ☐ Educational enrichment (tutoring, summer programs)
  ☐ Travel (family visits, established annual trips)
  ☐ Other: [text]

For each checked item:
  Description: [text]
  Established pattern (how long, frequency):
  [text]
  Current monthly cost: $___
  Evidence of historical family practice:
    ☐ Receipts / payment records
    ☐ Photos / records of participation
    ☐ Testimony of family members
    ☐ Other: [text]

Proposed monthly deviation amount: $___ [+]
```

### 3.7 — Factor (g): The particular shared parental arrangement

This is the most important factor in the current Mississippi practice. Mississippi has no statutory shared-parenting formula, so factor (g) is the vehicle for any adjustment based on custody structure.

```
Custody arrangement:
  ◯ Standard parenting (one parent has primary custody)
  ◯ Substantially shared (60/40 to 50/50 split)
  ◯ Equal time-sharing (true 50/50)
  ◯ Other arrangement: [text]

If shared or equal:
  Number of overnights per year with obligor: ___
  Number of overnights per year with obligee: ___

Direct expenses borne by obligor during their parenting time:
  Food/groceries: $___ monthly
  Activities during obligor's time: $___ monthly
  Clothing/supplies provided by obligor: $___ monthly
  Transportation: $___ monthly
  Other: [text] $___ monthly

Are there duplicated expenses between households?
(housing, utilities, child's bedroom in both homes)
  ☐ Yes — describe: [text]
  ☐ No

Proposed approach to deviation:
  ◯ No adjustment (apply standard percentage to AGI)
  ◯ Downward adjustment reflecting obligor's direct
    expenses during parenting time (specify): $___
  ◯ Other approach (specify): [text]

⚠ This factor is where shared-parenting cases live in
  Mississippi. There is no statutory formula. The
  chancellor has substantial discretion. Counsel should
  expect this factor to be the most contested in any
  shared-parenting case.

Proposed monthly deviation amount: $___ [+/-]
```

### 3.8 — Factor (h): Total available assets of the obligee, obligor, and the child

```
Significant assets to disclose (each parent):

Obligor:
  Real estate value: $___   Equity: $___
  Investment accounts: $___
  Retirement accounts: $___
  Business interests: $___
  Other significant assets: [text] $___

Obligee:
  [same structure]

Child:
  [same structure, including UTMA/UGMA, trust assets,
   college savings]

Income from assets (already captured in AGI?):
  ☐ Yes, included in AGI
  ☐ No, would constitute additional income for analysis
  ☐ Partially: [text]

Description of asset disparity, if relevant:
[text field]

Proposed monthly deviation amount: $___ [+/-]
```

### 3.9 — Factor (i): Payment by the obligee of child care expenses for employment or disability

```
Does the obligee pay child care expenses?
  ◯ Yes — for employment
  ◯ Yes — due to obligee's disability
  ◯ No

If yes:
  Provider: [text]
  Monthly cost: $___
  Hours per week: ___
  Children covered: [check from the case's child list]
  Tax credit applied?  [Yes / No / Partial]
  Net out-of-pocket monthly: $___

Allocation proposal:
  ◯ Add full amount as upward deviation
  ◯ Pro-rate based on AGI shares
  ◯ Other: [text]

Proposed monthly deviation amount: $___ [+]
```

### 3.10 — Factor (j): Any other adjustment needed to achieve an equitable result

This is the catchall and the broadest factor. Capture the basis specifically.

```
What is the basis for the equitable adjustment?
  ☐ Reasonable and necessary existing expense or debt
     (statutory language)
  ☐ Other equity argument: [text]

If existing expense or debt:
  Type of debt:
    ☐ Marital debt being paid by obligor
    ☐ Marital debt being paid by obligee
    ☐ Child-related debt (medical, educational arrears)
    ☐ Other: [text]
  Current monthly payment: $___
  Remaining term: ___ months
  Original creditor / payee: [text]

Basis for treating as deviation-worthy:
[text — must explain why this rises above ordinary
 financial obligations both parents have]

Proposed monthly deviation amount: $___ [+/-]
```

### 3.11 — Implementation notes

Each factor's structured sub-form should:

- Save partial input (user can come back to finish)
- Show a summary line in the factor card list showing the key fields populated
- Print all populated fields to the worksheet output (Section 7)
- Render in the PDF as a structured per-factor section, not just a paragraph of free text

The free-text "Description" field stays available on every factor as "Additional context (optional)" at the bottom of the sub-form. This protects the use case where the factor doesn't fit neatly into the structured fields.

---

## 4. Side-by-Side Comparison Mode

This is the feature that fulfills the Substack post's claim about "organiz[ing] the parties' positions on each factor."

### 4.1 — Entry point

On the main Inputs page, add a new option above the deviation section:

```
Are you preparing this worksheet for one party only,
or comparing both parties' proposed positions?

  ◯ Single party worksheet (current behavior)
  ◯ Side-by-side comparison
    Both parties' proposed positions on each factor,
    displayed in parallel for negotiation or mediation
```

When the user selects side-by-side, the deviation worksheet duplicates: every factor gets two sub-forms, one labeled "Position A" (typically the obligor) and one labeled "Position B" (typically the obligee). The labels should be configurable so the parties can identify themselves clearly.

### 4.2 — Per-factor side-by-side display

For each factor, both positions display side by side:

```
┌─ Factor (a) — Extraordinary medical expenses ──────┐
│                                                    │
│ ┌─ Position A ─────────┐ ┌─ Position B ─────────┐ │
│ │ Type: Medical, Psych │ │ Type: Medical only   │ │
│ │ Cost: $450/mo        │ │ Cost: $250/mo        │ │
│ │ Duration: 1-2 years  │ │ Duration: 3-6 months │ │
│ │ Documentation:       │ │ Documentation:       │ │
│ │   Provider bills,    │ │   Provider bills     │ │
│ │   Treatment plan     │ │                      │ │
│ │                      │ │                      │ │
│ │ Proposed: $300/mo    │ │ Proposed: $100/mo    │ │
│ └──────────────────────┘ └──────────────────────┘ │
│                                                    │
│  Gap: $200/mo  Annual: $2,400                      │
└────────────────────────────────────────────────────┘
```

The gap line at the bottom of each factor shows what's at stake on that specific factor. At the bottom of the worksheet, a summary shows:

- Total of Position A's proposed deviations
- Total of Position B's proposed deviations
- Aggregate gap
- Annualized aggregate gap

This is the document that "organizes the parties' positions on each factor before the chancellor sees them." It's also the document that, in mediation, makes the disagreement legible — the parties can see precisely where they agree (factors with similar amounts), where they disagree slightly (small gaps), and where the genuine fights are (large gaps).

### 4.3 — PDF rendering for side-by-side

The PDF should render side-by-side in two-column layout per factor, with the summary table at the end showing total gap and annualized gap. A cover page should note that this is a "Proposed Deviation Comparison" document and that both positions are proposals, neither is an order, and the chancellor retains discretion under § 43-19-103.

### 4.4 — Database schema for side-by-side

Extend the `deviations` JSONB array to support two positions per factor:

```ts
// types.ts
interface MSDeviation {
  letter: MSFactorLetter;  // 'a' through 'j'
  applicable: boolean;
  description?: string;  // free-text fallback (preserved for backward compat)
  proposedMonthly: number;  // signed (preserved for backward compat)

  // NEW: structured fields per factor (varies by letter)
  structured?: MSDeviationStructured;
}

interface MSInputs {
  // ... existing fields ...
  comparisonMode: 'single' | 'side_by_side';
  deviationsA: MSDeviation[];   // 10 items
  deviationsB?: MSDeviation[];  // 10 items, only populated when comparisonMode === 'side_by_side'

  // Position labels for side-by-side mode
  positionALabel?: string;  // default: obligor's name
  positionBLabel?: string;  // default: obligee's name
}
```

Backward compatibility: existing single-party worksheets continue to work. The `deviations` array becomes `deviationsA`. The `deviationsB` field is optional and only populated in side-by-side mode.

---

## 5. Statutory Update: 2022 Imputation Framework

The current code and the `/ms/about` page treat Mississippi imputation as judge-made law. That was correct prior to 2022 but is no longer accurate.

### 5.1 — What changed in 2022

HB 1067 (Laws of 2022, ch. 365), effective July 1, 2022, added subsection (5) to Miss. Code Ann. § 43-19-101. The new subsection provides:

> (5) Imputation of income shall not be based upon a standard amount in lieu of fact-gathering. In the absence of specific sufficient evidence of past earnings and employment history to use as the measure of an obligated parent's ability to pay, the recommended child-support obligation amount should be based on available information about the specific circumstances of the obligated parent. This can include, but is not limited to, such factors as assets, residence, job skills, educational attainment, literacy, age, health, criminal record and other employment barriers, and record of seeking work, as well as the local job market, the availability of employers willing to hire the obligated parent, prevailing earnings level in the local community, and other relevant factors in the case.

This is now the controlling Mississippi statute on imputation. The judge-made framework from prior case law (Brown, Bruce, related decisions) is still relevant for interpretation but is no longer the primary source.

### 5.2 — What this means for the calculator

The calculator currently lacks any structured imputation flow. The `MS_How_It_Works_Income.md` page describes imputation as judicial and references Gillespie — both statements need to be corrected.

For v2 of the deviation worksheet (this spec), the imputation flow does not need to be built yet — imputation is not one of the ten § 43-19-103 factors. But the AGI input section needs to be updated to acknowledge that if the user is entering an imputed AGI figure rather than an actual one, the figure should be supported by the fact-gathering the statute now requires.

Specifically, in the AGI input section, add:

```
Is this AGI figure based on actual earnings or imputed earnings?
  ◯ Actual — supported by W-2, 1099, tax returns, or other documentation
  ◯ Imputed — assigned based on earning capacity per § 43-19-101(5)

If imputed:
  Basis for the imputed amount (check all that apply):
    ☐ Past earnings and employment history
    ☐ Job skills and educational attainment
    ☐ Local job market and prevailing earnings level
    ☐ Available employers willing to hire this parent
    ☐ Other factors per § 43-19-101(5)

  ⓘ Mississippi law (effective July 1, 2022) requires that
    imputation be based on specific fact-gathering rather
    than on a standard amount. Be prepared to document the
    factual basis for the imputed figure.
```

### 5.3 — Copy updates needed

The following files need text updates to reflect the 2022 amendment:

- `MS_How_It_Works_Income.md` — Section 6 (currently titled "Imputation: Mississippi's Judicial Approach") should be retitled and rewritten to acknowledge the 2022 statutory framework. The Gillespie attribution is wrong (Gillespie is about escalation clauses, not imputation) and should be removed.
- `MS_Bar_Journal_Article_Draft.md` — Section III's references to Mississippi's "judicial" imputation framework and the Gillespie citation need updating.
- `/ms/about` page — should add a note about the 2022 amendment so users searching for current Mississippi law see the right citation.

---

## 6. Statutory Update: § 43-19-36 Incarceration Suspension

This is a more significant update than the imputation framework, because it changes how the calculator should handle a specific case type that the current implementation doesn't address at all.

### 6.1 — What changed in 2023

SB 2082 (Laws of 2023, ch. ___), enacted in 2023 and effective July 1, 2023, created a new section, § 43-19-36. The key operative language:

> (2) Child support obligations shall be suspended, by operation of law, for any period exceeding one hundred eighty (180) consecutive days in which the person ordered to pay support is incarcerated or involuntarily institutionalized, unless:
>
>   (a) The person owing support has the means to pay support in accordance with the guidelines established in 43-19-101 and 43-19-103 while incarcerated or involuntarily institutionalized; or
>
>   (b) The person owing support was incarcerated or involuntarily institutionalized for an offense constituting domestic violence under Section 97-3-7, child abuse under Section 97-5-39, or criminal nonpayment of child support under Section 97-5-3.
>
> (3) The child support obligation will resume the first day of the month following the expiration of sixty (60) days after the date the noncustodial parent is released from incarceration...

This is a stronger protection than Tennessee's. Tennessee bars imputation for incarcerated parents but the underlying obligation continues. Mississippi now suspends the obligation entirely (by operation of law, for incarceration over 180 days) with three specific carve-outs.

### 6.2 — What this means for the calculator

The calculator currently has no handling for incarceration. A user computing support for an incarcerated obligor will produce a number that the statute now says is unenforceable (subject to the carve-outs).

For v2, add an incarceration check at the top of the AGI input section:

```
Is the obligor currently incarcerated or involuntarily institutionalized?
  ◯ No
  ◯ Yes — and the incarceration is or will exceed 180 consecutive days
  ◯ Yes — but for less than 180 days (calculator proceeds normally)

If "yes — exceeds 180 days":

  Reason for incarceration (check all that apply):
    ☐ Domestic violence (Section 97-3-7)
    ☐ Child abuse (Section 97-5-39)
    ☐ Criminal nonpayment of child support (Section 97-5-3)
    ☐ Other (none of the above)

  Does the obligor have means to pay support during
  incarceration?
    ☐ Yes (rare — would include prison earnings or
       independent income)
    ☐ No

  ⚠ Under § 43-19-36 (effective July 1, 2023), child
    support obligations are SUSPENDED BY OPERATION OF LAW
    during incarceration exceeding 180 days, with three
    carve-outs (DV, child abuse, criminal nonpayment of
    support) and an exception for obligors with means to
    pay.

    [Based on the user's answers:]
    [Conditional: "Your case appears to qualify for
    suspension under § 43-19-36" OR "Your case appears to
    fall under a carve-out — full obligation continues"
    OR "Your case appears to qualify based on means
    available — obligation may continue"]
```

The output worksheet should reflect the suspension finding clearly, with the citation, and should note that the obligation resumes 60 days after release per subsection (3).

### 6.3 — Copy updates needed

- `MS_How_It_Works_Income.md` — Section 6 needs a new subsection on § 43-19-36 incarceration suspension.
- `MS_Bar_Journal_Article_Draft.md` — Section III's statement that "Mississippi does not have a statutory equivalent to Tennessee's specific carve-outs for incarcerated parents" needs to be revised. Mississippi now has a STRONGER protection than Tennessee — full suspension rather than bar on imputation. This is actually a substantive improvement to the bar journal piece's comparative argument.
- `/ms/about` page — known limitations should be updated to remove any implication that incarceration is unhandled.

---

## 7. Worksheet Output Changes

The PDF worksheet currently renders deviations as a Section IV with the statutory title for each applicable factor, the user's free-text description, and the signed dollar amount.

The new worksheet structure for each applicable factor:

```
Factor (a) — Extraordinary medical, psychological,
             educational, or dental expenses

  Type: Medical (ongoing); Psychological (therapy)
  Current monthly cost: $450.00
  Anticipated duration: 1-2 years
  Documentation: Provider bills/estimates; Treatment plan

  Insurance coverage: $200.00/month
  Out-of-pocket: $250.00/month
  Currently paid by: Obligor

  Additional context: [user's free-text]

  Proposed monthly deviation: +$300.00
  Proposed allocation: Obligor 75% / Obligee 25%
```

For side-by-side mode, the rendering shows both positions in parallel columns with the gap highlighted, as described in Section 4.3.

Sections II (presumptive award), III (health insurance), and V (final monthly award) are unchanged.

---

## 8. Code Architecture Changes

### 8.1 — New components

```
src/components/calculator/ms/
  deviation-walkthrough.tsx     # NEW — guided walk-through flow
  deviation-factor-form-a.tsx   # NEW — structured sub-form for factor (a)
  deviation-factor-form-b.tsx   # NEW — structured sub-form for factor (b)
  ...                            # one per factor (j total new files)
  deviation-comparison.tsx       # NEW — side-by-side renderer
  incarceration-check.tsx        # NEW — § 43-19-36 check at top of AGI
  imputation-basis.tsx           # NEW — § 43-19-101(5) basis capture
```

### 8.2 — Type extensions

`types.ts` gets the structured deviation types per Section 4.4 above. The `MSDeviationStructured` discriminated union has one variant per factor letter, each with the fields described in Section 3.

### 8.3 — Calculator logic updates

`calc.ts` gets:

- A pre-check for § 43-19-36 incarceration suspension that, if triggered, short-circuits the calculation and returns a special output state indicating suspension applies. The worksheet renders the suspension finding rather than a monthly amount.
- For side-by-side mode, return both position computations rather than one.

### 8.4 — Routing

No new routes required. The walk-through and side-by-side comparison are modes within the existing `/ms` route. The how-it-works updates land at the existing `/ms/how-it-works` and `/ms/how-it-works/income` routes.

---

## 9. Verification Tests

After implementation, the following should pass:

**Test A — Walk-through mode catches a missed factor.**
A user selects walk-through, encounters factor (a), enters expenses for a child's ongoing therapy. The walk-through continues to factors (b) through (j). The user is prompted to consider each in turn. The summary screen shows factor (a) populated with structured data and the other nine as "not applicable" or "skipped."

**Test B — Structured sub-form for factor (g) captures shared parenting.**
A user opens factor (g), inputs 50/50 custody with overnights split evenly. The sub-form captures the direct expenses borne by each parent during their parenting time. The proposed deviation amount is documented with the structured rationale, and the worksheet output shows the structure rather than just the amount.

**Test C — Side-by-side comparison surfaces the gap.**
A user selects side-by-side mode. Both positions are entered for factor (a): Position A proposes +$300/mo, Position B proposes +$100/mo. The worksheet shows both side by side with a $200/mo gap. The PDF renders the comparison in two-column layout. The summary at the end shows aggregate gap and annualized gap.

**Test D — Incarceration suspension short-circuit.**
A user indicates the obligor is incarcerated for more than 180 days. The reason for incarceration is selected (none of the carve-outs). The obligor has no means to pay. The calculator does NOT produce a monthly support figure — it produces a suspension finding with citation to § 43-19-36 and a note that the obligation resumes 60 days after release.

**Test E — Incarceration carve-out preserves the obligation.**
A user indicates the obligor is incarcerated for more than 180 days, but the reason is domestic violence. The calculator produces a full monthly support figure (no suspension) and notes in the worksheet that the carve-out applies under § 43-19-36(2)(b).

**Test F — Imputed AGI captures basis.**
A user enters AGI as imputed. The basis fields are required. The worksheet output shows that the AGI figure is imputed and documents the basis under § 43-19-101(5).

**Test G — Backward compatibility for existing share URLs.**
A share URL encoded under the v1 schema decodes correctly. Deviations from v1 (free-text + amount) display in the new UI without the structured fields populated. Users can optionally upgrade the v1 deviations to structured by re-entering them.

---

## 10. Implementation Priority

**Phase 1 — Walk-through and structured sub-forms for the four most common factors:**
- Factor (a) — extraordinary expenses
- Factor (g) — shared parenting arrangement (highest priority — most contested)
- Factor (i) — child care expenses
- Factor (j) — catchall equity adjustment

This phase makes the worksheet substantially more useful while limiting the build scope. The other six factors (b, c, d, e, f, h) can continue to use the existing free-text + amount approach in v2 Phase 1, with structured sub-forms following in Phase 2.

**Phase 1 also includes the statutory updates:**
- § 43-19-101(5) imputation basis capture
- § 43-19-36 incarceration suspension check
- Copy updates to `/ms/how-it-works/income`, `/ms/about`, and the bar journal draft

**Phase 2:**
- Remaining six factor sub-forms (b, c, d, e, f, h)
- Side-by-side comparison mode
- PDF rendering for side-by-side
- Side-by-side share URL state

Phase 1 closes the gap between what the Substack piece claims and what the calculator delivers for the most common factors. Phase 2 closes the remaining gap and adds the side-by-side comparison feature that does the heaviest strategic work.

---

## 11. What This Doesn't Change

A few things from `MS_Build_Spec.md` and `MS_Calculator_Overview.md` are preserved as-is:

- The basic AGI and percentage calculation
- The high-income and low-income threshold warnings under § 43-19-101(4)
- The health insurance provider radio button and the obligor-provided informational note
- The shared-custody flag that surfaces a Factor (g) callout (now extended by the structured sub-form for factor (g))
- The 50/50 honesty about no statutory shared-parenting formula
- The known limitations on alimony, retroactive support, split parenting, and emancipation projections
- The Stripe checkout integration with `state: "MS"`

The architecture changes in this spec are additive. Existing share URLs continue to work. Existing single-party worksheets continue to render correctly. The current implementation is not torn out; it is extended.

---

## 12. Why This Matters

The current MS calculator is a defensible v1. The walk-through, the structured sub-inputs, and the side-by-side mode are what move it from "free-text capture of one party's position" to "structured organization of the parties' positions on each factor before the chancellor sees them." That phrase, from the Substack piece, is what the calculator's strategic value depends on. This spec makes that phrase fully true.

The statutory updates (Sections 5 and 6) are independent of the walk-through work but should ship together. The 2022 imputation framework and the 2023 incarceration suspension are now controlling Mississippi law. A calculator that doesn't reflect them gives users wrong information about cases the statute now governs.

The bar journal piece's comparative argument — that Mississippi addresses incarceration less robustly than Tennessee — turns out to be wrong, and in a way that helps the comparative argument when corrected. Mississippi's protection is stronger than Tennessee's, by a meaningful margin. Fixing that paragraph improves the piece.

---

*End of MS_Deviation_Worksheet_v2.md.*
