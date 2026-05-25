# TN_Income_Module.md

*Unified build spec for the Income Calculator module on `tncsg.tcblaw.org`. Supersedes `TN_Income_Calculation_Module.md` and `TN_Imputed_Income_Module.md` (prior split-module specs). Single income calculator with progressive disclosure, collapsed by default at the top of the main calculator page. Legal explanation lives at a new `/how-it-works/income` page.*

*Goal: lay users see a clean, simple BCSO calculator unless they need help with income. Users who need help get a guided experience that exposes complexity only as relevant. Attorneys and curious users get the full legal framework on a separate, deep page.*

-----

## 1. The Design Philosophy

The income determination is one of the most complex parts of Tennessee child support law. The previous attempt at this module produced ~1,600 lines of spec covering two parallel calculators (actual + imputed) with detailed wizard flows for each. That design captured the legal architecture but reproduced the complexity that lay users came to the calculator to escape.

This unified module takes a different approach:

- **One calculator, not two.** Users think in terms of “what number goes here for the child support calculation,” not in terms of “actual vs imputed income.” The calculator follows the user’s mental model, branching into different flows only when the user’s situation calls for it.
- **Progressive disclosure.** The default state is a simple two-field input (Parent A monthly income, Parent B monthly income). Users who already know their answers enter them and move on. Users who need help click “Help me figure this out” and the calculator unfolds, asking branching questions to expose only the relevant complexity.
- **Imputation appears only when relevant.** A W-2 employee with stable salary should never see the word “imputation” in the UI. Imputation surfaces only when the user indicates it applies (other parent alleges voluntary underemployment, parent has no documented earnings, default judgment scenario, etc.). For the ~80% of cases where imputation isn’t at issue, the calculator behaves as a pure actual-income tool.
- **Collapsed by default.** The income calculator sits at the top of the main calculator page in a collapsed/expandable panel. A user who already knows their incomes scrolls past it to use the BCSO calculator directly. A user who needs help clicks to expand.
- **Law lives elsewhere.** Tooltips inside the calculator are brief and practical. The full legal framework — citations, deviations, edge cases, case law — lives at `/how-it-works/income` as a deep reference page. The calculator stays uncluttered.

-----

## 2. UI Architecture on the Main Calculator Page

### 2.1 — Page Layout

The main calculator page (`/calculator`) gets a new collapsed section at the top:

```
┌─ TN Child Support Calculator ───────────────────────────────┐
│                                                             │
│  ── Step 1: Income (Optional Helper) ──────────[ Expand ▼ ] │
│  Already know each parent's monthly gross income? Skip      │
│  this section. Need help figuring it out? Click expand.     │
│                                                             │
│  ── Step 2: Child Support Calculation ─────────────────     │
│                                                             │
│  Parent A monthly gross income: [ $______ ]                 │
│  Parent B monthly gross income: [ $______ ]                 │
│  Number of children: [ ___ ]                                │
│  ... [rest of existing BCSO calculator inputs]              │
│                                                             │
│  [Calculate →]                                              │
└─────────────────────────────────────────────────────────────┘
```

When the income helper is collapsed, the user sees a one-line summary and proceeds directly to the BCSO calculator. When expanded, the helper renders inline above the BCSO inputs and feeds its results into them automatically.

### 2.2 — Expanded State

When the user clicks Expand, the section grows to show:

```
┌─ Step 1: Income Helper ─────────────────────────[ Collapse ]│
│                                                             │
│  We'll help you figure out monthly gross income for each    │
│  parent using Tennessee's rules. This number flows into     │
│  the child support calculation below.                       │
│                                                             │
│  Want to learn the law first? See How Tennessee Calculates  │
│  Income → [link to /how-it-works/income]                    │
│                                                             │
│  ── Parent A ──────────────────────────────                 │
│  [ Set up Parent A's income → ]                             │
│                                                             │
│  ── Parent B ──────────────────────────────                 │
│  [ Set up Parent B's income → ]                             │
│                                                             │
│  When both are complete, this section will display the      │
│  monthly figures and they will populate the calculator      │
│  below automatically.                                       │
└─────────────────────────────────────────────────────────────┘
```

Clicking “Set up Parent A’s income” opens an inline modal or expandable subsection that runs the progressive-disclosure flow for that parent. Same for Parent B.

### 2.3 — Per-Parent Flow Entry Point

For each parent, the first screen is the situation router:

```
┌─ Parent A: Income Situation ────────────────────────────────┐
│                                                             │
│  Tell us about Parent A's income. Pick the option that      │
│  best fits.                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Simple: Steady salary or hourly job              │    │
│  │   "I have a paycheck and my income is stable."     │    │
│  │   Takes about 30 seconds.                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Variable income: Bonuses, commissions, overtime  │    │
│  │   "My income varies year to year."                 │    │
│  │   Takes about 2-3 minutes.                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Self-employed                                    │    │
│  │   "I run my own business or work as 1099/K-1."     │    │
│  │   Takes about 3-5 minutes.                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Complicated: Multiple sources or recent changes  │    │
│  │   "I have a mix of income, or things have changed  │    │
│  │   recently."                                       │    │
│  │   Takes about 3-5 minutes.                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ── Special Situations ─────────────────────────            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Imputed income: Court may assign income          │    │
│  │   "The other parent claims I should be earning     │    │
│  │   more, or I'm pursuing this for the other parent."│    │
│  │   Takes about 3-5 minutes.                         │    │
│  │   Most cases don't involve imputation — only       │    │
│  │   choose this if it's specifically at issue.       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◯ Special: SSI only, incarcerated, or military     │    │
│  │   "This parent's situation is one of these."       │    │
│  │   Takes about 1 minute.                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Cancel and enter income directly] [Continue →]            │
└─────────────────────────────────────────────────────────────┘
```

This router does the heavy lifting. The simple path serves the majority of users in 30 seconds. The complex paths exist for users who need them but don’t clutter the simple case. Imputation is right there as an option but is clearly flagged as the exception, not the norm.

-----

## 3. The Branching Flows

### 3.1 — Path A: Simple Steady Income

For the W-2 employee with stable salary. The minimum viable flow.

```
┌─ Parent A: Steady Income ───────────────────────────────────┐
│                                                             │
│  Two ways to enter — pick the one you have:                 │
│                                                             │
│  ◯ Annual gross income from W-2 Box 5                       │
│    [ $______ ]                                              │
│    ⓘ Box 5 is "Medicare wages and tips" — total            │
│      compensation BEFORE voluntary retirement contributions │
│      (401(k), etc). Use this if you have your W-2.          │
│                                                             │
│  ◯ Current monthly gross pay                                │
│    [ $______ ]                                              │
│    ⓘ Your gross pay from your most recent paystub, before   │
│      any deductions. If you contribute to a 401(k) or       │
│      similar plan, add those contributions back.            │
│                                                             │
│  ── Box 5 vs Box 1 ───────────────────────                  │
│  ⚠ Tennessee uses W-2 Box 5, not Box 1. The difference is   │
│  retirement contributions, which Box 1 lets you exclude but │
│  Tennessee does NOT. If your annual salary is $100,000 and  │
│  you contribute $20,000 to a 401(k), Box 1 says $80,000 but │
│  Box 5 says $100,000. For child support purposes, you owe   │
│  on $100,000.                                               │
│                                                             │
│  Calculated monthly gross income: $ ____ /month             │
│                                                             │
│  [← Back]                                  [Use This Value]  │
└─────────────────────────────────────────────────────────────┘
```

**That’s it.** One screen, one input, one tooltip explaining Box 5. Most users finish this in under 30 seconds.

### 3.2 — Path B: Variable Income

For users with bonuses, commissions, overtime, or investment income.

```
┌─ Parent A: Variable Income ─────────────────────────────────┐
│                                                             │
│  We'll combine your fixed pay with averaged variable        │
│  income to get monthly gross.                               │
│                                                             │
│  ── Fixed Pay ─────────────────────────────                 │
│  Annual base salary (Box 5): [ $______ ]                    │
│                                                             │
│  ── Variable Income ───────────────────────                 │
│                                                             │
│  Bonuses (annual amount for each of the last 3 years):      │
│    Last year:      [ $______ ]                              │
│    Two years ago:  [ $______ ]                              │
│    Three years ago: [ $______ ]                             │
│                                                             │
│  Commissions: [+ Add commission income]                     │
│  Overtime: [+ Add overtime income]                          │
│  Investment income: [+ Add investment income]               │
│                                                             │
│  ── Averaging Period ──────────────────────                 │
│  Tennessee's rule (1240-02-04-.04(3)) says variable income  │
│  should be averaged "over a reasonable period of time       │
│  consistent with the circumstances of the case." It does    │
│  NOT specify a particular period.                           │
│                                                             │
│  How should we average your variable income?                │
│  ◯ Last year only                                           │
│  ◯ 2-year average (most common)                             │
│  ◯ 3-year average (smooths year-to-year variation)          │
│                                                             │
│  ⚠ Strategic note: if your most recent year was unusually   │
│  high or low, the period you select changes the result.     │
│  Two-year averaging is most common but the rule allows      │
│  flexibility. Read more →                                   │
│                                                             │
│  ── Calculated Monthly Gross ──────────────                 │
│  Fixed base monthly:     $ ____                             │
│  Variable income monthly: $ ____                            │
│  TOTAL MONTHLY GROSS:    $ ____                             │
│                                                             │
│  [← Back]                                  [Use This Value]  │
└─────────────────────────────────────────────────────────────┘
```

The averaging-period question is the most consequential decision in this flow. The UI surfaces it as an explicit choice rather than hiding it. The strategic note alerts the user that the choice matters.

### 3.3 — Path C: Self-Employed

Self-employment is the most contested income category. The flow accepts the basics, flags the complexity, and produces a defensible starting point.

```
┌─ Parent A: Self-Employed Income ────────────────────────────┐
│                                                             │
│  Self-employment income for child support is:               │
│    Gross receipts − Ordinary business expenses              │
│                                                             │
│  Tennessee disallows some Schedule C deductions for child   │
│  support: accelerated depreciation, investment tax credits, │
│  and similar non-cash items.                                │
│                                                             │
│  ⚠ Self-employment is the most contested income category    │
│  in family law. For high-stakes cases, consult an attorney  │
│  about whether a forensic accountant is appropriate. This   │
│  calculator gives you a starting point, not a definitive    │
│  answer.                                                    │
│                                                             │
│  ── Enter from your Schedule C / K-1 ──────                 │
│                                                             │
│           Last year   Two yrs ago   Three yrs ago           │
│  Gross    [ $___ ]   [ $___ ]      [ $___ ]                │
│  receipts                                                   │
│  Expenses [ $___ ]   [ $___ ]      [ $___ ]                │
│  Net      auto       auto          auto                     │
│  Add-back [ $___ ]   [ $___ ]      [ $___ ]                │
│  (depr)                                                     │
│  Adjusted auto       auto          auto                     │
│  ── Averaging period ──────────────────────                 │
│  ◯ Last year only                                           │
│  ◯ 2-year average                                           │
│  ◯ 3-year average (most common for SE — smooths variation)  │
│                                                             │
│  Calculated monthly self-employment income: $ ____ /month   │
│                                                             │
│  [← Back]                                  [Use This Value]  │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 — Path D: Complicated (Multiple Sources)

For users with a mix of income types — say, a salaried day job plus self-employment side income plus investment income plus a rental property.

This flow is a combination of B and C, with additional fields for retirement income, disability/SSA, and other miscellaneous sources. It’s the “everything but the kitchen sink” path. Users select this when no other path fits.

Key feature: each income source gets its own line item with its own averaging period (if applicable), and the worksheet documents each component separately.

### 3.5 — Path E: Imputed Income

This is the path that surfaces only when imputation is at issue. Reached through the explicit “Imputed income” option on the situation router.

```
┌─ Parent A: Imputed Income ──────────────────────────────────┐
│                                                             │
│  Imputed income is income a court ASSIGNS to a parent based │
│  on what they could be earning, rather than what they       │
│  actually earn.                                             │
│                                                             │
│  Imputation is NOT a calculator decision — only a court can │
│  order imputation. This tool helps you figure out what the  │
│  imputed number might be if a court ordered it.             │
│                                                             │
│  ── First, check the carve-outs ────────────                │
│  These situations BLOCK imputation under Tennessee law:     │
│                                                             │
│  Is this parent incarcerated?                               │
│    ◯ Yes — incarcerated or expected to be 180+ days         │
│    ◯ No                                                     │
│                                                             │
│  Is this parent on active military duty?                    │
│    ◯ Yes — enlisted, drafted, or activated                  │
│    ◯ No                                                     │
│                                                             │
│  [If either Yes: short-circuit to "imputation unavailable"  │
│   screen explaining the rule and recommending actual income │
│   path]                                                     │
│                                                             │
│  ── Why is imputation at issue? ────────────                │
│  ◯ The other parent claims this parent is voluntarily       │
│    underemployed (took lower-paying work, went part-time)   │
│  ◯ This parent has refused to provide income evidence       │
│    (default judgment scenario)                              │
│  ◯ This parent has substantial non-income-producing assets  │
│  ◯ I'm exploring what imputation would produce              │
│                                                             │
│  Stay-at-home parent? [ Yes / No ]                          │
│  ⓘ Stay-at-home status by itself does NOT support           │
│    imputation. Tennessee requires consideration of: how     │
│    long the parent has been out of work, the children's     │
│    ages, and whether the role existed during the marriage.  │
│                                                             │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

After the basis selection, the flow continues into the amount-determination screen:

```
┌─ Parent A: Imputed Income Amount ───────────────────────────┐
│                                                             │
│  How should we figure out the imputed amount?               │
│                                                             │
│  ◯ Prior earnings approach                                  │
│    Use the parent's most recent comparable earnings         │
│    Prior position: [ ____________ ]                         │
│    Prior annual gross: [ $______ ]                          │
│    Date of departure: [ MM/YYYY ]                           │
│                                                             │
│  ◯ Vocational capacity approach                             │
│    Use what the parent could reasonably earn given          │
│    education, skills, and the local job market              │
│    Annual capacity estimate: [ $______ ]                    │
│    Source: [ BLS / vocational expert / other: ____ ]        │
│                                                             │
│  ◯ Statutory default (when no other evidence available)     │
│    Tennessee provides default median income figures:         │
│    ◯ Female ($35,936/yr = $2,994.67/mo)                     │
│    ◯ Male ($43,761/yr = $3,646.75/mo)                       │
│    These defaults come from 2016 Census data and are used   │
│    primarily in default judgment situations.                │
│                                                             │
│  ◯ 10%/year modification rule                               │
│    (only for modification cases where parent failed to      │
│    cooperate with discovery)                                │
│    Prior order's income: [ $______/mo ]                     │
│    Date of prior order: [ MM/YYYY ]                         │
│    Annual increase %: [ ___% ] (max 10%)                    │
│                                                             │
│  ◯ Custom amount with explanation                           │
│    Annual amount: [ $______ ]                               │
│    Brief explanation: [ ________________ ]                  │
│                                                             │
│  ── Side-by-side option ────────────────────                │
│  ☐ Also show me what the child support calculation would    │
│    produce using this parent's ACTUAL income. This helps    │
│    you see what the imputation argument is worth.           │
│                                                             │
│  [← Back]                                  [Use This Value]  │
└─────────────────────────────────────────────────────────────┘
```

If the user checks “Also show me actual income,” the parent’s actual-income data is collected through a quick simple-income flow (Path A) and stored alongside the imputed figure. When the BCSO calculation runs, the main calculator displays both scenarios.

### 3.6 — Path F: Special Situations

For SSI-only, incarcerated, or active military scenarios. This is a triage screen:

```
┌─ Parent A: Special Situation ───────────────────────────────┐
│                                                             │
│  Which describes this parent?                               │
│                                                             │
│  ◯ Sole income source is SSI (Supplemental Security Income, │
│    Title XVI)                                               │
│    → Support set to $0 per Rule .04(3)(c)(2)                │
│                                                             │
│  ◯ Incarcerated, currently or expected 180+ days            │
│    → Not treated as voluntarily unemployed                  │
│    → Use actual income (including prison wages if any)      │
│    → Continue with Path A (simple income)                   │
│                                                             │
│  ◯ Active military duty                                     │
│    → Not subject to imputation                              │
│    → Use actual military pay                                │
│    → Continue with Path A (simple income)                   │
│                                                             │
│  ◯ None of these                                            │
│    → Return to main situation chooser                       │
│                                                             │
│  [← Back]                                  [Continue →]     │
└─────────────────────────────────────────────────────────────┘
```

The SSI path is short-circuit: it terminates with “support is set to $0” and writes that to the main calculator. The other special situations route to Path A (simple income) after acknowledging the legal status.

-----

## 4. The Side-by-Side Mode

When the user has computed both actual and imputed income for a parent (by checking the side-by-side option in Path E), the main BCSO calculator displays both scenarios in parallel:

```
┌─ Child Support Calculation Results ─────────────────────────┐
│                                                             │
│  Your case includes an imputation question. Here's what the │
│  calculation produces under both scenarios:                 │
│                                                             │
│  ┌──────────────────────────┬──────────────────────────┐    │
│  │ ACTUAL INCOME SCENARIO   │ IMPUTED INCOME SCENARIO  │    │
│  ├──────────────────────────┼──────────────────────────┤    │
│  │ Parent A: $3,500/mo      │ Parent A: $7,500/mo      │    │
│  │ Parent B: $6,000/mo      │ Parent B: $6,000/mo      │    │
│  │                          │                          │    │
│  │ Combined AGI: $9,500     │ Combined AGI: $13,500    │    │
│  │ BCSO: $1,495             │ BCSO: $1,872             │    │
│  │                          │                          │    │
│  │ ... [full calculation]   │ ... [full calculation]   │    │
│  │                          │                          │    │
│  │ PRESUMPTIVE PCSO:        │ PRESUMPTIVE PCSO:        │    │
│  │ $549 (B → A)             │ $208 (A → B)             │    │
│  └──────────────────────────┴──────────────────────────┘    │
│                                                             │
│  ⚠ What's at stake in the imputation dispute:               │
│  Monthly difference: $757                                   │
│  Annualized difference: $9,084                              │
│  Direction reversal: Yes (B owes A vs A owes B)             │
│                                                             │
│  [Generate PDF for both scenarios]                          │
│  [Continue with one scenario →]                             │
└─────────────────────────────────────────────────────────────┘
```

This side-by-side display is the highest-strategic-value feature of the imputation flow. The user (and any attorney reviewing the output) sees exactly what’s at stake in concrete dollar terms. In many cases this defuses the imputation dispute entirely.

Side-by-side is opt-in, not default. Most users won’t see it.

-----

## 5. Database Schema

Extending the existing `calculations` table and adding a new `income_components` table:

```sql
-- Existing calculations table gets income type tracking
ALTER TABLE calculations
  ADD COLUMN parent_a_income_type TEXT DEFAULT 'simple',
  ADD COLUMN parent_b_income_type TEXT DEFAULT 'simple',
  ADD COLUMN calculation_mode TEXT DEFAULT 'single';
  -- income_type: 'simple' | 'variable' | 'self_employed' | 'complicated'
  --   | 'imputed' | 'ssi_only' | 'special_military' | 'special_incarcerated'
  -- calculation_mode: 'single' | 'side_by_side'

-- New table for the income calculation components and methodology
CREATE TABLE income_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE,
  parent_designation TEXT NOT NULL,  -- 'A' or 'B'
  scenario TEXT NOT NULL DEFAULT 'primary',  -- 'primary' or 'comparison'
    -- for side-by-side: 'primary' = the chosen scenario, 'comparison' = the other
    -- for single: always 'primary'

  -- Path taken in the calculator
  income_path TEXT NOT NULL,
    -- 'simple' | 'variable' | 'self_employed' | 'complicated' | 'imputed' | 'special'

  -- Simple income (used for all paths)
  monthly_gross_income INTEGER NOT NULL,

  -- Component breakdown (JSONB for flexibility across paths)
  components JSONB,
    -- For variable: {fixed_monthly, variable_components: [{type, monthly, period}]}
    -- For self-employed: {years: [...], add_backs: [...], averaging_period}
    -- For imputed: {basis, approach, prior_position, prior_annual,
    --                vocational_estimate, statutory_default_gender, etc.}
    -- For complicated: {sources: [...]}

  -- Methodology notes printed to worksheet
  methodology_notes TEXT,

  -- Imputation-specific (NULL for non-imputation paths)
  imputation_basis TEXT,
    -- 'willful_underemployment' | 'no_evidence' | 'non_income_assets'
    -- | 'modification_10pct' | 'statutory_default'
  imputation_approach TEXT,
    -- 'prior_earnings' | 'vocational' | 'statutory' | 'asset_return' | 'custom'
  imputation_rationale TEXT,
  carve_out_check JSONB,
    -- {incarcerated: bool, military: bool, stay_at_home: bool, sah_factors: {...}}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_income_components_calculation ON income_components(calculation_id);
CREATE INDEX idx_income_components_parent ON income_components(calculation_id, parent_designation);
```

The schema is simpler than the prior two-table design because there’s only one logical entity (income determination per parent) with optional imputation fields. The `scenario` column supports side-by-side mode by allowing two records per parent (primary + comparison).

-----

## 6. Worksheet Integration

When the user has used the income helper, the worksheet output documents the methodology. Three display modes:

### 6.1 — Simple Path (Most Common)

```
1   Parent A Monthly Gross Income       $8,500
    Source: W-2 Box 5 (Medicare wages), 2024
    Annual: $102,000 ÷ 12 = $8,500/month
```

Brief and clean. Doesn’t take up much space on the worksheet. Documents that Box 5 was used (not Box 1), which is the most common silent error in TN child support calculations.

### 6.2 — Variable / Self-Employed / Complicated Path

```
1   Parent A Monthly Gross Income       $10,675
    Methodology:
    - Fixed monthly base (Box 5):              $8,500.00
    - Monthly bonus (2-yr avg, 2023-2024):     1,250.00
    - Monthly commission (2-yr avg):             850.00
    - Monthly investment income (12-mo avg):      75.00
    ────────────────────────────────────────
    Total monthly gross income:               $10,675.00

    Less adjustments to AGI:
    - In-home children credit:                    0.00
    - Not-in-home children credit:                0.00
    - Self-employment tax credit:                 0.00
    ────────────────────────────────────────
    Adjusted Gross Income (AGI):              $10,675.00
```

Full breakdown that documents each component and the averaging period selected.

### 6.3 — Imputed Path

```
1   Parent A Monthly Gross Income       $7,500 [IMPUTED]

    Basis for imputation: Willful and voluntary underemployment
    Authority: Rule 1240-02-04-.04(3)(a)(2)(ii)
    Approach: Prior earnings

    Prior employment: ABC Corporation, Sales Manager
    Prior annual income: $90,000
    Date of departure: March 2024
    Calculated imputed amount: $90,000 / 12 = $7,500/month

    Rationale: Parent A voluntarily resigned from ABC
    Corporation in March 2024 to take a position paying
    $42,000/year. The new position is not consistent with
    Parent A's training, experience, or prior earning
    capacity.

    Carve-outs verified:
    [X] Not incarcerated
    [X] Not on active military duty
    [X] Stay-at-home status: Not applicable
```

The imputation worksheet is comprehensive because imputation requires written court findings. The worksheet output can be attached to a proposed order or used to support a motion.

### 6.4 — Side-by-Side Mode

When side-by-side is in use, the worksheet shows both scenarios in parallel columns with a “difference” summary at the bottom. Two PDF pages are generated, one per scenario, plus a comparison summary page.

-----

## 7. The /how-it-works/income Page

A new standalone page at `/how-it-works/income`. Linked from the income helper UI. Comprehensive but readable. This is where the law and the depth live.

### 7.1 — Page Structure

```
# How Tennessee Calculates Income for Child Support

[Top of page: "Just want to use the calculator? Skip the law →"
 link back to /calculator]

## The Short Version

For child support in Tennessee, "income" means your gross monthly
income from all sources, before any deductions. Three things make
this more complicated than it sounds:

1. The W-2 Box 5 question: use Medicare wages, not federal wages
2. Variable income: bonuses and commissions get averaged
3. Imputation: sometimes the court assigns income you don't earn

If your income is steady wages from a single job, you can probably
skip the rest of this page. If any of the three things above apply
to your case, keep reading.

## What Counts as Income

[Plain-English list from the Section 3.1 of the prior income module
spec — wages, salaries, commissions, bonuses, self-employment, etc.]

## What Doesn't Count as Income

[Plain-English list — SSI, TANF, current spouse's income, child's
own income, adoption assistance, etc.]

## The W-2 Box 5 Question

[Detailed explanation of Box 5 vs Box 1, with worked example showing
the $20,000 401(k) contribution difference and what it does to the
support calculation]

## Variable Income and the Averaging Question

[Detailed explanation of the "reasonable period" rule, why three-year
averaging is convention but not required, and the strategic
implications of period selection]

## Self-Employment Income

[Schedule C / K-1 starting point, add-backs for accelerated
depreciation and investment tax credits, why forensic accountants
are common in high-stakes SE cases]

## Imputation: When the Court Assigns Income You Don't Earn

[Full explanation of the three bases — willful underemployment,
no evidence, non-income assets. The two carve-outs — incarceration
and military service. The stay-at-home parent analysis. The
statutory default median income figures.]

## How Earning Capacity Is Determined in Contested Cases

[Vocational evidence, labor market evidence, the parent's own
choices. Recent prior earnings vs. current capacity. Vocational
expert testimony.]

## The 10%/Year Modification Rule

[Specific rule for modification cases where a parent fails to
cooperate with discovery.]

## Adjustments to Get from Gross Income to AGI

[Self-employment tax credit, qualified other children credits,
federal benefit to child Line 1a treatment.]

## What This Means for Your Case

[Practical guidance. Most cases are simple. The complications
matter in specific situations. The calculator handles all of them.]

## Authorities and Citations

[Full citation list: Rule 1240-02-04-.04, with all subsections
relevant to income; Tenn. Code Ann. § 36-5-101; PDF Guide
references; relevant case law: Massey v. Casals, Watters v.
Watters, etc.]

[Bottom of page: link back to /calculator]
```

### 7.2 — Page Length and Tone

The page should be comprehensive but readable. Estimated 2,500-3,500 words. Plain English with citations available but not intrusive. Use headers, bullets, worked examples, and callouts to break up the text. The user should be able to read just the section relevant to their situation and skip the rest.

The page serves three audiences:

- **Lay users** who want to understand before using the calculator. They get plain-English explanations and worked examples.
- **Lay users** who use the calculator first and have a specific question. They come back to the page to look up the relevant section.
- **Attorneys and judges** who want to verify the calculator’s authority claims. They scan to the citations and case law sections.

All three audiences are served by the same content; the structure lets each read at their preferred depth.

-----

## 8. Inline Tooltips Inside the Calculator

The calculator UI uses brief contextual tooltips for the most common questions. These are practical, not legal — they tell the user what to do, not the full rule.

Examples:

- “Box 5 is Medicare wages and tips, not federal wages. Difference is your 401(k). Use Box 5.”
- “Use a 2-year or 3-year average for bonuses. Read more →”
- “Imputation means the court assigns income the parent doesn’t actually earn. Only courts can order imputation; this calculator helps you see what it would produce.”

Each tooltip ends with a “Read more →” link to the relevant section of `/how-it-works/income`. The tooltip serves the user mid-task; the linked page serves the user who wants depth.

-----

## 9. Phased Implementation

### Phase 1 — Minimum Viable Module

Build the simple case end-to-end first. This is the highest-value flow because it serves the most users.

- Collapsed/expandable income helper at top of `/calculator`
- Path A (simple steady income) with Box 5 catch
- Database schema additions
- Worksheet integration for simple path
- `/how-it-works/income` page with the short version, Box 5 section, and authorities list

This phase alone meaningfully improves the calculator. It catches the most common error (Box 5 vs Box 1) and documents the income source on the worksheet.

### Phase 2 — Variable Income and Self-Employment

- Path B (variable income) with averaging period selection
- Path C (self-employed) with add-back handling
- Path D (complicated) for multiple-source cases
- Worksheet integration for these paths
- Variable income and self-employment sections of `/how-it-works/income`

This phase serves users with non-trivial income situations. The averaging period selection is the most legally consequential feature.

### Phase 3 — Imputation

- Path E (imputed income) with all four amount-determination approaches
- Carve-out checks (incarceration, military)
- Stay-at-home parent analysis
- Side-by-side calculation mode in the main calculator
- Side-by-side PDF generation
- Imputation section of `/how-it-works/income`

This phase serves the contested cases. Lower volume than Phases 1-2 but higher strategic value per case.

### Phase 4 — Special Situations and Polish

- Path F (special situations) for SSI/incarcerated/military
- Refinement of methodology display on worksheet
- BLS / wage-data links in the vocational capacity flow
- Earning capacity helper widget
- Discovery template integration (future)

-----

## 10. Verification Tests

After full implementation, the following should pass:

**Test A — Skip the helper entirely:**

- User scrolls past collapsed income helper
- Enters income directly in BCSO calculator
- Calculation runs normally
- No methodology notes on worksheet (helper wasn’t used)

**Test B — Simple path catches Box 5 confusion:**

- User opens helper, picks Path A
- Enters $108,000 as annual salary
- System asks “Box 5 or Box 1?”
- If user says Box 1: prompted to look up Box 5 (likely higher)
- Result correctly uses Box 5 figure

**Test C — Variable income averaging:**

- User opens helper, picks Path B
- Enters base salary $100K, bonuses $30K/$50K/$20K
- 1-year average: shows $2,500/mo bonus
- 2-year average: shows $3,333/mo bonus
- 3-year average: shows $2,778/mo bonus
- User selects 2-year, worksheet documents the selection

**Test D — Self-employment add-backs:**

- User opens helper, picks Path C
- Enters Schedule C data with $60K accelerated depreciation add-back
- Calculator adds back the depreciation
- Final monthly figure reflects the add-back
- Worksheet documents the add-back rationale

**Test E — Imputation carve-out catches incarceration:**

- User opens helper, picks Path E (imputed)
- Indicates parent is incarcerated
- Calculator routes to short-circuit screen
- Recommends Path A (actual income, including prison wages if any)
- No imputed amount produced

**Test F — Imputation side-by-side mode:**

- User opens helper, picks Path E
- Selects willful underemployment, prior earnings approach
- Checks “also show actual income”
- Calculator collects actual income via quick Path A
- BCSO calculator displays both scenarios in parallel
- Shows monthly + annual difference clearly

**Test G — SSI short-circuit:**

- User opens helper, picks Path F (special situation)
- Selects “sole income source is SSI”
- Calculator routes to “support set to $0” terminal
- Writes $0 to BCSO calculator
- No further income data needed

**Test H — Mixed parents:**

- Parent A uses helper Path B (variable income)
- Parent B uses helper Path C (self-employed)
- Both calculations flow into BCSO calculator
- Worksheet shows different methodology notes for each parent

-----

## 11. Strategic Value Summary

This module addresses three real problems:

**1. The Box 5 silent error.** In every TN child support case where a W-2 employee has voluntary retirement contributions, using Box 1 understates income. The simple-path tooltip catches this every time, for every user. Even users who think they know their income get the Box 5 check.

**2. The averaging period dispute.** Variable income period selection is a contested issue in high-income cases. The calculator surfaces it as an explicit decision rather than hiding it inside a single number. The strategic note alerts users that the choice matters. Both sides of a dispute can use the calculator and see what the other side’s selection would produce.

**3. The imputation transparency gap.** Imputation arguments traditionally happen in private, with each side computing in isolation and presenting positions. The side-by-side mode shows both scenarios concurrently. The dollar difference between scenarios is exactly what the imputation dispute is fighting over. Seeing that in concrete terms often dissolves the dispute or makes the cost-benefit clear.

The unified, progressively-disclosed design serves the simple case in 30 seconds and the complex case in a few minutes. The user never sees more complexity than their situation requires. The full legal framework is available at `/how-it-works/income` for users who want it without cluttering the calculator UI.

-----

## 12. Notes for the Lovable Agent

A few specific implementation notes:

- The collapsed/expandable section at the top of `/calculator` should remember user preference (cookie or localStorage). If the user expands it once, it stays expanded on return visits. If the user dismisses it, it stays collapsed.
- The “Set up Parent A’s income” button should open an inline modal or expandable subsection, not a navigation event. The user should never leave the calculator page during the income flow.
- The situation router (Section 2.3) should set the `income_path` value in the database when the user makes their selection. This determines which methodology display is used on the worksheet.
- The side-by-side mode requires UI affordances throughout: a banner indicator that side-by-side is active, side-by-side display in the worksheet, side-by-side PDF generation. If side-by-side is enabled, the user should see it acknowledged at every step.
- The `/how-it-works/income` page should be linked from EVERY tooltip and from the helper’s introduction screen. Make the path to depth easy without making depth mandatory.
- For users who skip the helper entirely (just enter income directly in the BCSO calculator), no `income_components` record is created. The worksheet simply shows the income as a single line item without methodology notes.
- For users who do use the helper, the worksheet output should clearly indicate “Income methodology documented via Income Helper” so attorneys reviewing the output know there’s a documented basis.

-----

## 13. What This Replaces

This unified module supersedes both `TN_Income_Calculation_Module.md` and `TN_Imputed_Income_Module.md`. Those two files described parallel calculators with separate flows. The unified design is simpler in UI, simpler in database schema, and simpler in user experience.

The substantive law content from both prior files is preserved — it just lives on `/how-it-works/income` rather than being repeated in calculator UI. The calculator UI itself is leaner, focused on producing the right monthly income figure for the user’s situation.

If Lovable has already started implementation based on the prior two specs, the migration is straightforward: combine the two flows into a single situation router (Section 2.3), consolidate the database tables into one, and move the legal explanation to the new `/how-it-works/income` page.

-----

*End of TN_Income_Module.md.*