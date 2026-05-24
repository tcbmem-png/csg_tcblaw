## Goal

Stop calling the PCSO statutory-max message a "warning." It's not an error — it's a routine guideline note that explains *why* the all-in number is above the §36-5-101(e)(1)(B) cap and what the court needs to support it. Mention that documented deviations (especially private school as an Extraordinary Educational Expense under Rule .07(2)(d)1) are the typical justification.

## Copy changes

**Sidebar & on-screen worksheet (new wording, identical in both places):**

> **Above the presumptive statutory cap.** The all-in transfer ($X,XXX/mo) exceeds the §36-5-101(e)(1)(B) presumptive maximum of $X,XXX/mo for N children. This is common when the order includes documented deviations — most often private-school tuition (Rule .07(2)(d)1) or other extraordinary educational expenses. The court must make written findings that the additional amount is reasonably necessary for the child; with those findings the order stands above the cap.

If a private-school deviation is currently active in the inputs, append a second sentence:

> Your private-school deviation of $X,XXX/mo is included in this total and is the typical basis for findings above the cap.

## Implementation

1. **`src/lib/calc/calc.ts`** — separate the PCSO-cap message from `warnings`. Add a new output field `pcsoCapNote: string | null` (and keep `pcsoExceedsStatutoryMax`/`pcsoStatutoryMax` as they are). Remove the existing `warnings.push(...)` for the cap. Compose the note text in the calc so it can include the live private-school deviation amount when present.
2. **`src/lib/calc/types.ts`** — add `pcsoCapNote: string | null` to `CalcOutputs`.
3. **`src/components/calculator/result-sidebar.tsx`** — render `pcsoCapNote` in its own neutral block (no ⚠, no amber alert styling) above or below the `warnings` list. Use a muted card style consistent with informational notes.
4. **`src/components/calculator/official-worksheet.tsx`** — replace the existing "Statutory PCSO maximum exceeded" block (lines ~369–378) with the new note, using neutral styling (e.g. `border-rule bg-cream` like the footer) instead of `bg-accent/10`.
5. **`src/lib/pdf/worksheet-pdf.ts`** — the footer currently dumps `warnings.join(" * ")`. Also render `pcsoCapNote` as its own footer line labeled "Note:" (not "Notes:") so it doesn't look like an error in the PDF.
6. **`src/lib/pdf/official-worksheet-pdf.ts`** — if it currently renders the cap message, swap to the new note text the same way.
7. Tests in `src/lib/calc/__tests__/calc.test.ts`: update any assertion that checks for the old warning string; add a small assertion that `pcsoCapNote` is non-null when over the cap and null otherwise, and that it mentions private school when `includePrivateSchool` is true with a non-zero deviation.

## Out of scope

- No changes to the actual calculation, the cap value, or how deviations are applied.
- No changes to the MS calculator (this is a TN-specific statutory cap).
- Other entries in the `warnings` array (e.g., SSR notes, income thresholds) keep their current treatment.