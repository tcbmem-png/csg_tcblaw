## Why the link said "Forbidden"

The email was sent by the `retry-stuck` cron route, which derives `origin` from the request URL. The cron is currently calling the **preview** deployment (`project--…-dev.lovable.app`), and preview deployments require a Lovable login — hence the "Forbidden" page. The token itself is fine; the host is the problem.

So there are two fixes worth bundling: attach the PDFs (what you asked for), and make sure any link we do include points at the live custom domain.

## Why we need Resend for attachments

Lovable's built-in email queue (what we use today) intentionally does **not** support file attachments — it only sends HTML/text. The supported workaround is download links, which is what we have now. To actually attach the two PDFs to the email, we need to send through a provider that supports attachments. Resend does, and it's already available as a Lovable connector.

**Action you'll need to take:** connect Resend in **Connectors → Resend**. Once connected, I'll wire it up. (Stripe stays as-is; this is only for this one email.)

## Plan

### 1. Send `worksheet-ready` through Resend with attachments
In `src/lib/fulfill.server.ts` (both `fulfillOrder` and `resendWorksheetEmail`):
- After rendering/uploading the PDFs, also keep the buffers in memory.
- Instead of `sb.rpc("enqueue_email", …)`, POST directly to `https://connector-gateway.lovable.dev/resend/emails` with:
  - `from: "TCB Child Support Helper <noreply@notify.tncsg.tcblaw.org>"`
  - `to: [order.email]`, `subject`, `html`, `text`
  - `attachments`: TN → both `tn-child-support-worksheet-official.pdf` and `tn-child-support-worksheet.pdf` (base64); MS → single `ms-child-support-worksheet.pdf`.
  - Headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${RESEND_API_KEY}`.
- Continue writing a row to `email_send_log` so the existing audit/rate-limit logic for "resend my worksheet" keeps working.
- Keep the unsubscribe footer logic (Resend supports `headers: { "List-Unsubscribe": … }` — I'll set that to the existing `/unsubscribe?token=` URL so one-click unsub still works).

### 2. Simplify the email template
In `src/lib/email-templates/worksheet-ready.tsx`:
- Replace the two big "Download" buttons with a short line: "Your worksheet PDFs are attached to this email." (TN: "summary + official AOC"; MS: single PDF.)
- Keep a small grey "If your email client stripped the attachments, you can also download them here: [link]" line as a fallback, pointing at the live custom domain (see #3).

### 3. Stop generating preview-domain links
Add an env-based origin override:
- New optional env `PUBLIC_SITE_ORIGIN` (e.g. `https://tncsg.tcblaw.org`).
- `fulfillOrder` / `resendWorksheetEmail` use `process.env.PUBLIC_SITE_ORIGIN ?? origin` when building any URL that ends up in an email (download fallback link + unsubscribe link).
- I'll set `PUBLIC_SITE_ORIGIN=https://tncsg.tcblaw.org` as a Supabase secret so cron-triggered sends always link to the live site, never the preview.

### 4. Don't break the in-app download flow
- `/unlock/$token` and `/checkout/return` keep working unchanged — those are in-app, not in email, so the link/download UX on the site is unaffected.

### 5. QA
- Re-fulfill the existing test order (`e327a75f-…`) against the **live** origin via `retry-stuck` so the email goes out with attachments.
- Confirm Gmail shows two PDF attachments on the TN email (and one on MS), and that the fallback link, if used, points to `tncsg.tcblaw.org`, not the preview host.

## Out of scope
- Changing PDF layout (you said both look good now).
- Migrating other emails (unsub confirmations, etc.) off the Lovable queue — only `worksheet-ready` switches to Resend.
- Stripe / payments / calc logic.

## What I need from you before I build
1. Connect **Resend** in Connectors (so `RESEND_API_KEY` is available to server functions).
2. Confirm the public origin should be `https://tncsg.tcblaw.org` (vs `https://csg.tcblaw.org`) — both are mapped to this project.
