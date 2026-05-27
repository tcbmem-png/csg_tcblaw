## Goal

Bring the MS deviation worksheet in line with the new build brief: lighter two-party per-factor input, real-time agreement/disagreement readout, a reconciliation view with monthly + cumulative dollars, and a dedicated chancellor-ready PDF. Existing FormA–FormJ structured forms remain available as Position-A-only optional detail (per your choice).

## What's already there (keep)

- Walkthrough (`deviation-walkthrough.tsx`), entry-mode picker, single vs. side-by-side toggle.
- Structured per-factor sub-forms (`deviation-factor-form.tsx`) and their types.
- Light comparison view (`deviation-comparison.tsx`) — will be replaced by the new reconciliation table.
- Existing MS worksheet PDF (`src/lib/pdf/ms-worksheet-pdf.ts`) — untouched.

## What changes

### 1. Per-party schema (brief §"Per-party input")

Add a new shared shape used on both sides:

```ts
// src/lib/calc/ms/types.ts
export type MSPartyPosition =
  | "" | "downward" | "upward" | "apply_no_amount" | "oppose";

export interface MSPartyEntry {
  position: MSPartyPosition;
  factsAsserted: string;
  documentationReferenced: string;
  proposedMonthly: number;     // signed; blank = 0
  legalAuthority: string;
}
```

Extend `MSDeviation`:
```ts
party?: MSPartyEntry;          // populated for whichever side this slate represents
```

Position A's slate may still hold `structured` (the elaborate FormA–FormJ). Position B's slate carries `party` only.

### 2. "Is this factor in play?" selector

Above the per-party block, a 4-state radio: *not asserted / asserted by obligor / asserted by obligee / asserted by both*. Drives `applicable` on each side and collapses the form when "not asserted by either."

### 3. New per-factor two-column block

Component `MSPartyFactorBlock` rendering two `MSPartyEntry` editors side by side with the brief's five fields + factor-specific help text (medical/asset/seasonal/etc. prompts pulled from the brief's per-factor "Help text" lines).

Existing structured FormA–FormJ rendered below Position A's column as an `<details>` "Detailed evidence (optional)" disclosure — preserved for users who want the deeper capture.

### 4. Real-time comparison row

Computes per-factor state from both `party` entries and renders one of:
- Both agree, same amount → "Parties agree: factor applies, $X/mo. Net: [up/down]."
- Both apply, different amounts → "Both apply; differ on amount. Obligor $X; obligee $Y. Gap: $|X−Y|/mo."
- One asserts, other opposes → "Asserted by [side]; opposed by [other]. Magnitude if granted: $X/mo."
- Neither → collapsed (just the header).

Lives at the bottom of each factor card; pure presentational helper in `deviation-factor-form.tsx`.

### 5. Reconciliation view

Replaces `deviation-comparison.tsx` with `MSDeviationReconciliation`:

- Table: factor letter | in play? | obligor position | obligee position | obligor $ | obligee $ | gap $.
- Totals row: obligor total / obligee total / net difference (monthly).
- Cumulative row: net difference × `avgMonthsRemaining`, where:
  ```
  avgMonthsRemaining = clamp( mean( max(0, 21 - age_i) ) * 12, 0, 21*12 )
  ```
  Uses a new optional `childAges: number[]` input. When empty, the cumulative row shows "Enter child ages to see cumulative impact" rather than guessing.
- "See full comparison" link from the result sidebar already exists for TN; mirror it on MS.

### 6. Child ages input

Add `childAges: number[]` to `MSInputs` (defaulted to `[]` so existing state is forward-compatible). Surface in `ms/inputs.tsx` near `numChildren` as a comma-separated list with the existing monthly-hint pattern (keeps Option-2 minimalism).

### 7. Dedicated Deviation Worksheet PDF

New file `src/lib/pdf/ms-deviation-pdf.ts`, generated alongside the existing MS worksheet PDF. Sections:

1. **Case Information** — parties, attorneys, children + ages, statutory %, presumptive monthly (pulled from existing MS outputs).
2. **Deviation Analysis by Factor** — for each factor, full statutory text, in-play state, two-column per-party content (position, facts verbatim, docs, authority, $), gap line. Non-asserted factors collapse to a single line.
3. **Reconciliation Summary** — same table as on-screen + monthly + cumulative totals.
4. **Proposed Final Order** — presumptive ± deviation = proposed final monthly; blank findings block; signature line.
5. Footer — disclaimer, citation to https://csg.tcblaw.org/ms, repo URL.

Wired into MS result sidebar as a second download button: "Download deviation worksheet (PDF)" next to the existing worksheet download.

### 8. Persistence + sharing

`MSPartyEntry` and `childAges` are plain serializable data; they ride along on the existing localStorage save and shareable-URL encode in `src/lib/calc/ms/share.ts` without schema-version bump — just additive fields with safe defaults during decode.

### 9. Acceptance checks

- Walkthrough still works; "Yes, this factor applies" now opens the two-party block (not just the structured form).
- Side-by-side mode replaced by the new always-two-party layout; the `comparisonMode` toggle becomes "Show opposing party column" (kept for users who don't have the other side's position).
- `ms/calc.ts` total still derives from `deviationsA[*].proposedMonthly` for the obligor-side worksheet math; obligee totals are display-only.
- All existing MS calc tests pass (no engine changes).
- New unit tests for the reconciliation aggregator (gap math, cumulative when ages missing/present).

## Files touched

- **Types:** `src/lib/calc/ms/types.ts` (add `MSPartyEntry`, `MSPartyPosition`, `childAges`).
- **Inputs UI:** `src/components/calculator/ms/inputs.tsx` (child ages field).
- **Factor UI:** `src/components/calculator/ms/deviation-factor-form.tsx` (new `MSPartyFactorBlock`, in-play selector, real-time row; existing FormA–FormJ wrapped in disclosure).
- **Walkthrough:** `src/components/calculator/ms/deviation-walkthrough.tsx` (use new block; widen "applies?" to 4-state).
- **Reconciliation:** replace `deviation-comparison.tsx` with `deviation-reconciliation.tsx`; keep export alias for now.
- **Sidebar:** `src/components/calculator/ms/result-sidebar.tsx` (deviation PDF button + reconciliation link).
- **PDF:** new `src/lib/pdf/ms-deviation-pdf.ts` + wire-up in MS route.
- **Share:** `src/lib/calc/ms/share.ts` (decode defaults for new fields).
- **Tests:** new `src/lib/calc/ms/__tests__/reconciliation.test.ts`.

## Out of scope (per brief §"What Should NOT Be in This Module")

- No new calc math beyond reconciliation aggregation; the chancellor decides.
- No Option-1 MS monthly engine refactor (still queued separately).
- No DB persistence — same localStorage + URL share story as today.
