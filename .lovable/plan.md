## Goal

Keep worksheet PDFs free during beta, but require a name and email before the user can download/print. Capture the lead in the database, email the PDF(s) via the existing fulfillment pipeline, and unlock the on-page Print/Save button. Identical behavior on TN and MS.

## UX

Replace the current "Free during beta" panel (TN and MS) with a compact lead-capture card:

- Fields: **Full name** (required, 1–200 chars), **Email** (required, validated, ≤320 chars)
- Submit button: "Email me my worksheet"
- On success: unlocks the on-page Print/Save PDF button, shows a confirmation ("Sent to {email} — check your inbox"), and persists the unlock locally so reloads don't re-prompt
- Small print: "Free during beta. We'll only use your email to send your worksheet and occasional product updates. Unsubscribe anytime." + link to the existing unsubscribe flow
- Error states: inline validation + a single retry message for server/rate-limit errors

## Data model

New table `beta_leads`:

- `id` uuid pk
- `email` text (lowercased, indexed)
- `name` text
- `state` text ('TN' | 'MS')
- `matter_name` text nullable (from caption)
- `worksheet_hash` text nullable
- `order_id` uuid nullable (FK-style reference to `orders.id`, no constraint to keep it loose)
- `ip` text nullable (truncated, same pattern as `checkout_rate_limits`)
- `user_agent` text nullable
- `created_at` timestamptz default now()
- Unique on `(email, worksheet_hash)` to dedupe reloads
- RLS enabled, no client policies (service-role only — same posture as `orders`)

## Server

New file `src/lib/free-unlock.functions.ts` exporting `requestFreeWorksheet` (`createServerFn`, POST):

- Reuse the `captionSchema` and `payload` shape from `src/lib/checkout.functions.ts`
- Zod-validate `{ name, email, state, payload }`
- Rate-limit by IP via the existing `checkout_rate_limits` table (reuse `enforceCheckoutRateLimit`)
- Insert into `beta_leads`
- Insert into `orders` with `status='pending'`, `amount_cents=0`, `payload_json={...payload, state}`, `email` lowercased — same shape `createUnlockCheckout` writes
- Call `fulfillOrder(sb, order.id, origin)` from `src/lib/fulfill.server.ts`. That already: renders the TN summary + official PDFs (or MS PDF), uploads to the `worksheet-pdfs` bucket, sends the Resend email with attachments, marks the order delivered
- Backfill `beta_leads.order_id` after order insert
- Return `{ unlockToken, orderId }`

No webhook, no Stripe, no payment. The `orders` table is reused as the canonical fulfillment record (keeps the existing `/unlock/{token}` download route, the email-resend flow, and the admin tools working unchanged).

## Client changes

- `src/lib/calc/unlock.ts`: revert `useIsUnlocked()` to its real implementation (read `getStoredUnlock()`, subscribe to `tncsg:unlock-changed`). The locally-stored token re-gates the worksheet's Print/Save button, same mechanism as the paid flow.
- `src/components/calculator/unlock-pdf-panel.tsx` (TN): replace the static notice with the lead-capture form. On submit, call `requestFreeWorksheet` via `useServerFn`, then `setStoredUnlock(token)` and show the success state.
- `src/components/calculator/ms/unlock-pdf-panel.tsx` (MS): same form, pass `state: 'MS'` and the MS inputs/outputs.
- Both panels keep the same shell/spacing so existing layout doesn't shift.

## Things left intact (for re-enabling paid mode later)

- `StripeWorksheetCheckout`, `StripeMSWorksheetCheckout`, `createUnlockCheckout`, `getOrderStatus`, webhook handler, return route — all untouched
- `PaymentTestModeBanner` stays a no-op
- `fulfillOrder` / `resendWorksheetEmail` — unchanged; the free flow just calls them with a $0 order

## Out of scope

- No admin UI for leads (read via the existing Cloud → Database view)
- No marketing-email opt-in toggle (single combined consent in the small-print copy)
- No changes to calculator logic, PDF rendering, or the worksheet UI
- No edits to auto-generated files

## Technical notes

- Migration via `supabase--migration` for `beta_leads` (table + RLS + unique index)
- `requestFreeWorksheet` lives in `src/lib/free-unlock.functions.ts` (client-safe path; pairs with `fulfill.server.ts` which already exists)
- Email send uses the existing Resend setup (`CSG_Resend_API_Key`) — no new secrets
- IP capture uses the same `clientIp()` helper pattern from `checkout.functions.ts` (extract into a shared helper if convenient, otherwise duplicate)

## Verification

- Submit form on TN with a test email → row appears in `beta_leads` and `orders` (status `delivered`), email arrives with both TN PDFs, on-page Print/Save unlocks, reload keeps it unlocked
- Same flow on MS → single MS PDF attached, `state='MS'` on both rows
- Submitting twice with same email + same worksheet → no duplicate `beta_leads` row (unique constraint), order is re-fulfilled idempotently (existing `fulfillOrder` early-returns if already delivered)
- Rate limit kicks in after 10 submissions/hour from the same IP