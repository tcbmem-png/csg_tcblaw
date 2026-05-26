
## Goal

Make the MS deviation handoff readable as "two attorneys email a worksheet back and forth; the link is the worksheet." State-aware status banner at the top of the deviations area, state-aware action panel where the current scattered handoff buttons live. Fix the round-trip identity bug so the originator's browser still recognizes a URL after the receiver edits it. Add a localStorage save-and-resume for receiving counsel with a true state-divergence check. MS-only; no server-state changes.

## The five moments

Derived from `handoff.status` + `activeSide` + `isOriginatorBrowser`:

1. **Drafting** — `status === "none"`. No banner; primary action "Send to opposing counsel".
2. **Sent — awaiting response** — `originated` AND originator browser AND not the receiving `?side=` session.
3. **Your turn (receiver)** — `activeSide && activeSide !== originatingSide`.
4. **Returned for review** — `in_progress` (or `completed`) AND `isOriginatorBrowser` AND not a receiver session.
5. **Complete** — `status === "completed"`.

A small `useHandoffMoment(handoff, activeSide, isOriginator)` hook returns `{ moment, counterpartyLabel, timestamp }` so banner and action panel share one source of truth.

Known asymmetry (accepted, not fixed): once a receiver downloads the final PDF, the originator's view stays at moment 4 until they reopen the URL. PDF is the canonical artifact. Optional "Mark complete" affordance is out of scope for this cycle — flagged so we don't forget it.

## Components

```
src/components/calculator/ms/
  handoff-share-dialog.tsx        rewrite copy + remove jargon
  handoff-landing-banner.tsx      rewrite + add originator-receives-back variant
  handoff-status-banner.tsx       NEW — moment-driven status strip
  handoff-action-panel.tsx        NEW — moment-driven primary/alt/secondary buttons
  handoff-resume-prompt.tsx       NEW — divergence-aware resume prompt
  handoff-resume-pill.tsx         NEW — quiet "saved draft available — restore?" pill
  result-sidebar.tsx              remove handoff-specific buttons; keep "Copy shareable link" (see Sidebar decision)
```

### Sidebar decision (open item resolved)

Keep **Copy shareable link** in the sidebar as a universal affordance (option A in the review). It's not handoff-specific — it always copies the current URL — and it's useful at any moment for "send this to my paralegal / save to Clio". The new action panel handles the role-aware "Send to opposing counsel / Send back / Send revisions back" semantics; the sidebar's Copy is the plumbing-level escape hatch. They don't conflict — different jobs.

`MSHandoffShareDialog`, `Hand off to opposing counsel`, `Re-generate handoff URL`, and `Download deviation worksheet (PDF)` all leave the sidebar and move into `handoff-action-panel.tsx`.

### Copy (verbatim from spec)

Status banner uses `Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", hour:"numeric", minute:"2-digit" })` for "Tuesday, May 26 at 2:14 PM".

Send dialog: title "Send to opposing counsel". The existing "Scrub my financial entries" toggle becomes "☑ Show opposing counsel a blank slate (recommended)" — same boolean, new label/helper. Primary "Copy link"; secondary "Copy link & open email" (see mailto handling below); "Cancel".

Landing banner: two variants — receiving-side and originator-receives-back — text per spec.

## Round-trip case identity

Add `caseId: string | null` to `HandoffState`. Generated once at first Send via `randomToken(16)` — **16 bytes / 128 bits, same entropy as the existing C2 origin token** (called out so a future maintainer doesn't downsize). Preserved verbatim on re-generate.

- New `recordOriginatedHandoff(caseId)` / `isOriginatorBrowser(caseId, inputs, caption)` key off `caseId`. Storage shape: `ms.handoff.origins` → `{ [caseId]: token }`.
- Back-compat: if `caseId` is null on a decoded payload, fall back to the existing `fingerprintShare(inputs, caption)` check. Old URLs in the wild still behave as today; once re-sent, they get a caseId.
- `MSHandoffLandingBanner` switches to the single new API (which internally picks caseId or falls back to fingerprint).

This makes "↩️ Returned" detection survive any number of receiving-side edits.

## Receiving-side save-and-resume (state-divergence, not timestamp)

New `src/lib/calc/ms/resume.ts`:

- `saveReceivingDraft(caseId, { inputs, handoff, baseShareHash })` — writes to `localStorage["ms.handoff.draft." + caseId]`. **`baseShareHash` = a hash of the URL `?s=` value the receiver was editing against at the moment of save** (cheap djb2 or reuse `fingerprintShare`). Called from the receiver-side debounced URL-sync effect in `ms.tsx` so the saved snapshot and the hash are always taken together.
- `loadReceivingDraft(caseId)` / `clearReceivingDraft(caseId)`.
- On hydrate: if receiving session AND a stored draft exists for the URL's `caseId`, **compare the URL's current share hash to the stored `baseShareHash`** (not timestamps):
  - **Equal** → URL is the same one the receiver was editing. Render `<MSHandoffResumePrompt variant="resumable">` with two options: "Continue your edits" / "Use the version they sent". This is the normal "you closed the tab" path.
  - **Different** → originator sent a new URL since the draft. Render `<MSHandoffResumePrompt variant="diverged">` with three options: "Continue your edits", "Use the version they just sent", "Compare both" (Compare is wired but routes to a `toast.info("Side-by-side compare coming in a later cycle")` for now — UI affordance exists, implementation deferred).
- **Dismiss (X) is non-destructive.** Hides the prompt for this session, preserves the draft. A small `<MSHandoffResumePill>` ("You have a saved draft for this case — restore?") sits in the deviations section header so the receiver can re-summon the prompt at any time. Only the explicit "Continue your edits" / "Use the version they sent" actions mutate state.
- Draft is cleared when status flips to `completed`, AND when "Send back" successfully copies the URL (the receiver has handed it off; saved draft is now stale).

## Send-back / send-revisions feedback

Receiver clicks "Send back to Jane Counsel →" → URL copies → toast via `sonner`:

> "Link copied. Paste it into your email to Jane — when she opens it, she'll see your client's positions filled in on her copy."

Same pattern for the originator's "Send revisions back". Inline confirmation also lives under the button (mirrors the existing `CopyLinkButton` idle/copied state) so users without notification permission still see the receipt.

## mailto handling (URL never goes through mailto)

"Send to opposing counsel / Copy link & open email" and the receiver-side "Send back & open email" do **two** things in order:

1. `navigator.clipboard.writeText(url)` first.
2. `window.location.href = "mailto:?subject=" + encodeURIComponent(subjectFromCaption) + "&body=" + encodeURIComponent("Paste your link below this line:\n\n----------\n")`.

The share URL is never embedded in the mailto body, so we never hit the ~2000-char client-side clipping ceiling on long deviation slates. Subject is derived from caption (`"[Matter] — MS deviation worksheet"`); falls back to a generic subject when caption is empty.

## Tests

Keep all existing `src/lib/calc/ms/__tests__/handoff.test.ts` assertions passing.

- `caseId-origin-detection.test.ts`: generate URL → mutate inputs (simulate receiver edits) → re-encode → `isOriginatorBrowser` still true based on caseId.
- `caseId-backcompat.test.ts`: decode a v3 payload with no caseId → fingerprint fallback still detects originator.
- `resume.test.ts`:
  - save → load round-trips inputs.
  - resumable path: stored `baseShareHash` == current URL hash → returns `{ status: "resumable" }`.
  - diverged path: stored hash differs → returns `{ status: "diverged" }`.
  - clear on completion.
  - **Dismiss is non-destructive** — calling the prompt's dismiss path does not remove the stored draft.
- `handoff-status-banner.test.tsx` (RTL): for each of the five moments, render with a shaped `handoff` + `activeSide` and assert banner text.
- `send-back-toast.test.tsx` (RTL): clicking "Send back" calls `navigator.clipboard.writeText` and emits the expected sonner toast string.

## Out of scope

Real-time sync, round counters, full side-by-side diff implementation (the "Compare both" affordance is scaffolded only), receiver-initiated "Mark complete", anything TN.

## Files

Edit: `src/lib/calc/ms/types.ts`, `src/lib/calc/ms/share.ts`, `src/components/calculator/ms/handoff-share-dialog.tsx`, `src/components/calculator/ms/handoff-landing-banner.tsx`, `src/components/calculator/ms/result-sidebar.tsx`, `src/routes/ms.tsx`, `src/lib/calc/ms/__tests__/handoff.test.ts`.

Create: `src/components/calculator/ms/handoff-status-banner.tsx`, `src/components/calculator/ms/handoff-action-panel.tsx`, `src/components/calculator/ms/handoff-resume-prompt.tsx`, `src/components/calculator/ms/handoff-resume-pill.tsx`, `src/lib/calc/ms/resume.ts`, plus the four new test files above.
