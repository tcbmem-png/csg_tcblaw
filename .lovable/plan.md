## Goal

Lock in (with tests) and lightly document how each calculator behaves when one parent has 365 — or near 365 — days of custody. No formula changes; the two models are doing the right thing under their respective statutes. We just want regression coverage and a small bit of UX copy so users don't misread the TN output.

## Findings (no code change needed for these)

- **MS** — single-obligor flat percentage; custody days never enter the formula. 365/0 is the statutory default. Already correct.
- **TN** — Rule .04(7) "increase" band caps the upward bump at `(69 − ARP_days) / 365 ≈ 18.9 %` over the ARP's pro-rata BCSO at ARP = 0. There is no "sole-custody" multiplier in the guidelines; behavior is correct but undramatic, which can surprise users.

## Changes

### 1. Tests — `src/lib/calc/__tests__/calc.test.ts`

Add a `describe("Sole / near-sole custody (TN)")` block with three cases:
- **365/0, custom band**: parentADays = 0, parentBDays = 365. Assert ARP=A, band = "increase", presumptive ≈ proRataA × (1 + 69/365), direction A→B.
- **Symmetry**: same inputs flipped (0/365) → direction flips, magnitude identical.
- **Standard 285/80 vs custom 285/80 produces the same presumptive** — sanity that the "standard" preset is just a custom-days shortcut.
- **Floor check**: very low-income obligor with 365/0 still subject to SSR / $100 minimum logic exactly as in the standard case.

### 2. Tests — `src/lib/calc/ms/__tests__/calc.test.ts`

Add a small `describe("MS — sole custody is the default presumption")` block:
- **Asserts custody is not an input to the formula**: two runs with `sharedCustodyFlag` true vs false and otherwise identical inputs produce the same `presumptiveMonthly` and `proposedFinalMonthly`. Only `warnings` differ (Factor (g) callout appears once).
- **Spec Test 1 re-asserted with an explicit "sole-custody by default" comment** so future readers see the assumption documented.

### 3. UX note — TN custom-days input (`src/components/calculator/inputs.tsx`)

In the "Parenting time → Custom days" sub-section, when either parent's day count is `≤ 5` or `≥ 360`, render a small muted hint under the day inputs:

> Tennessee's guidelines (Rule .04(7)(i)) cap the upward adjustment at about 19% over the ARP's standard pro-rata share, even at 0 ARP days. Many sole-custody cases are still entered at the standard 285/80 split.

Plain `<p className="text-xs text-muted-foreground">` under the existing day Grid — no new component.

### 4. UX note — MS inputs (`src/components/calculator/ms/inputs.tsx`)

In the header area (or right under the obligor income section), add a single sentence:

> Mississippi assumes the obligor is the non-custodial parent and applies the statutory percentage to their AGI; the number of custody days is not an input. For 50/50 arrangements use the Factor (g) deviation.

Same muted-text treatment. Not a banner, not a warning.

## Out of scope

- No change to TN calc formulas, band thresholds, or the `(69 - arpDays)/365` increase factor.
- No change to MS calc formulas or AGI handling.
- No new "100% custody" toggle or preset — the existing standard preset + custom days cover it.