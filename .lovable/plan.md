# Two-attorney handoff — MS calculator — SHIPPED

All items in the original plan have shipped, including the deferred closures from the prior cycle:

- Letter-fix stragglers (item 1 closure): `FACTOR_TITLES` in `ms-worksheet-pdf.ts` and `worksheet-preview.tsx` now match the statute (g=assets, h=childcare, i=parental). `calc.ts` shared-custody warning cites § 43-19-103(i). `calc.test.ts` assertion updated and now also guards against regression to (g). `deviation-factor-form.tsx` FormParental callout cites factor (i).
- Per-row PDF attribution (item 5): `ms-deviation-pdf.ts` renders a "Per {counsel} ({firm})" sub-line under each party's column header when a handoff is in effect. Originating slate → `originatingAttorney`; receiving slate → `receivingAttorney` or "Per opposing counsel (name not provided)". Single-attorney PDFs unchanged.
- Tests (item 6): `share.test.ts` (v3 round-trip, v2→v3 upgrade incl. letter-fix migration, ?side= parse helpers, scrubbing), `handoff.test.ts` (four-state transitions incl. PDF auto-flip, scrubbing, C2 token compare, caption-driven labels), `letter-mapping.test.ts` (regression guard).



## Data model

`src/lib/calc/ms/types.ts` — add a `handoff` object hanging off the share payload (not off `MSInputs`, so calc/reconciliation stay untouched):

```ts
export type HandoffStatus = "none" | "originated" | "in_progress" | "completed";
export type HandoffSide = "A" | "B";

export interface HandoffState {
  status: HandoffStatus;
  originatingSide: HandoffSide;        // which slate the originator filled
  originatingAttorney: { name: string; firm: string } | null;
  receivingAttorney:  { name: string; firm: string } | null;
  createdAt: string;                    // ISO
  lastReceivingEditAt: string | null;   // ISO — bumped on each receiving-side edit
  completedAt: string | null;           // ISO when receiving side finishes / PDF generated
}
```

Slate A/B carry **no** obligor/obligee semantics. Caption (`obligorLabel`/`obligeeLabel`) plus `originatingSide` drives every label and PDF attribution string.

## Share encoding — v3 with v2 backward compat

`src/lib/calc/ms/share.ts`:

- New `MSSharePayloadV3 = { v:3; s:"MS"; i:MSInputs; c:CaseCaption; h:HandoffState }`.
- `encodeMSShare(inputs, caption, handoff)` emits v3.
- `decodeMSShare` accepts v2 and v3. v2 → synthesize `handoff = { status:"none", … }` and continue through existing `migrateSlate` letter-fix path. v1 path unchanged.

## `?side=` transport

- Originator's "Generate handoff URL" produces `…/ms?s=<payload>&side=<other-side>` where `other-side = originatingSide === "A" ? "B" : "A"`.
- Landing logic (`src/routes/ms.tsx`):
  1. Parse `?s=` (existing).
  2. Parse `?side=` only when `handoff.status !== "none"`. Lock the editable slate to `?side=`'s value; the other slate is read-only and clearly labeled as "from originating counsel".
  3. **C1**: When `handoff.status === "completed"`, the URL auto-sync keeps `?side=` in the URL so any downstream copy is also locked. Until completion, `?side=` is dropped from the originator's URL but kept on the receiving session (so mid-edit reload survives).
- Receiving side's first edit flips `handoff.status` from `"originated"` → `"in_progress"` and stamps `lastReceivingEditAt`; subsequent edits bump `lastReceivingEditAt`.

## Status lifecycle and visibility (addition #1)

Four-state enum: `none → originated → in_progress → completed`.

- **Landing indicator.** When a session loads a URL with `status === "in_progress"`, the landing banner shows: *"Worksheet in progress — last updated by receiving counsel on {lastReceivingEditAt, formatted}."* When `status === "completed"`, banner shows: *"Worksheet completed in calculator on {completedAt}."* When `status === "originated"` and no `lastReceivingEditAt` yet: *"Awaiting receiving counsel's entries."*
- **PDF auto-completion.** Generating either PDF (`downloadMSDeviationPdf` or the print-PDF path) from the *receiving* side, when `status === "in_progress"`, flips `status → "completed"` and stamps `completedAt = now()` before rendering. The originator generating a PDF pre-handoff is unchanged (status stays `"none"`).

## C2 — originator-opens-their-own-handoff detection

- When the originator generates a handoff URL, write an opaque token (random 16 bytes hex) into `localStorage["ms.handoff.origins"]` keyed by `sha256(payload-without-handoff)`.
- On landing with `?side=` set opposite `handoff.originatingSide`, if the local token matches → render a one-line yellow notice: *"This browser generated this handoff URL. Entries here will be attributed to opposing counsel in the PDF."* **No block.** Different browser → silent.
- **Token GC (addition #2).** Deferred. No expiration or pruning in this cycle — tokens are ~40 bytes each and accumulation is slow. Documented as a deferred decision via a code comment at the write site so a future maintainer (or you) can revisit if `localStorage` quota ever becomes a concern.

## C3 — receiving attorney capture

New component `src/components/calculator/ms/handoff-landing-banner.tsx`, rendered above the inputs when `handoff.status !== "none"` and the active session is the receiving side:

- Single-line yellow banner: case caption summary, status line per addition #1, "originating counsel: {name} ({firm})", inline optional fields *Your name* / *Your firm* (controlled, writes into `handoff.receivingAttorney` on blur).
- Never blocks editing. Dismissable; reappears on hard reload only if attribution is still blank.
- Blank → PDF renders *"Per opposing counsel (name not provided)"*.

## "Share" dialog (originator side)

New `src/components/calculator/ms/handoff-share-dialog.tsx`, opened from a new "Hand off to opposing counsel" button in `result-sidebar.tsx`:

- Field 1 (required): "Which side does your client represent?" → `originatingSide`.
- Field 2 (optional): Your name / firm → `originatingAttorney`.
- Field 3 (toggle, default ON): "Scrub my financial entries before handoff" → applies the scrubbing transform (zero out the opposite slate's `proposedMonthly` + `party.proposedMonthly`, clear `factsAsserted`/`documentationReferenced` on the opposite slate; the originator's own slate is preserved verbatim).
- Generate button: stamps `handoff.status = "originated"`, `createdAt = now()`, builds the URL, copies it to clipboard, shows confirmation.

## PDF attribution

`src/lib/pdf/ms-deviation-pdf.ts` and `ms-worksheet-pdf.ts`:

- Per-row attribution strings derived from `caption.obligorLabel`/`obligeeLabel` plus `handoff.originatingSide` (never from "A means obligor"):
  - Originating slate: `"Per {originatingAttorney.name || 'originating counsel'} ({obligor|obligeeLabel for originatingSide}): …"`
  - Receiving slate: `"Per {receivingAttorney.name || 'opposing counsel (name not provided)'} ({the other label}): …"`
- Single-slate (pre-handoff) PDFs unchanged.
- **Completion footer (addition #3).** When `handoff.status === "completed"`, the deviation PDF gets a footer line: *"Case: {caption}. Originating counsel: {…}. Receiving counsel: {… or 'name not provided'}. Worksheet completed in calculator: {completedAt, formatted MMMM D, YYYY}."* Explicit "completed in calculator" labeling so a chancellor doesn't read the date as filing or signature.

## URL auto-sync

`src/routes/ms.tsx`:

- Debounced effect serializes `handoff` and writes `?side=` when (a) `status === "completed"`, or (b) the active session is the receiving side mid-edit.
- Originator session pre-handoff or post-generate-but-still-editing: `?side=` is stripped.

## Tests

- `__tests__/share.test.ts` — v3 round-trip; v2 → v3 upgrade with `status === "none"`; `?side=` parse/preserve rules across all four states.
- `__tests__/handoff.test.ts` — scrubbing transform leaves originator's slate intact and zeros opposite slate; status transitions `none → originated → in_progress → completed` including the PDF-triggered auto-flip; `lastReceivingEditAt` bumps; labels derive from caption + `originatingSide` regardless of A/B identifier; C2 token compare.
- `__tests__/letter-mapping.test.ts` (already shipped in item 1).

## Files touched

```text
src/lib/calc/ms/types.ts              # add HandoffState, HandoffStatus, HandoffSide
src/lib/calc/ms/share.ts              # v3 encoder; v2-compat decoder; ?side= helpers
src/routes/ms.tsx                     # handoff state, ?side= lock, auto-sync rules
src/components/calculator/ms/result-sidebar.tsx        # "Hand off to opposing counsel"
src/components/calculator/ms/handoff-share-dialog.tsx  # NEW
src/components/calculator/ms/handoff-landing-banner.tsx# NEW
src/components/calculator/ms/inputs.tsx                # lock non-active slate read-only
src/components/calculator/ms/party-factor-block.tsx    # read-only render variant
src/lib/pdf/ms-deviation-pdf.ts       # attribution lines + completion footer; PDF-triggered status flip
src/lib/pdf/ms-worksheet-pdf.ts       # attribution lines; PDF-triggered status flip
src/lib/calc/ms/__tests__/share.test.ts    # NEW
src/lib/calc/ms/__tests__/handoff.test.ts  # NEW
```

## Explicit non-goals (unchanged from brief)

No auth, no realtime, no server storage, no TN-side changes, no calc/reconciliation math changes, no obligor/obligee semantics attached to A/B, no localStorage token GC in this cycle.
