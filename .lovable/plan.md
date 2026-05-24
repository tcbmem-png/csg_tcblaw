## Two bugs, two fixes

### 1. "Forbidden" link in email
Cause: `publicOrigin()` requires the secret to start with `http://` or `https://`. You stored `csg.tcblaw.org` (no scheme), so the check fails and the code falls back to the request origin — which is the preview host, hence "Forbidden".

Fix: make `publicOrigin()` lenient — if the secret is a bare hostname, prepend `https://` automatically. Strip any trailing slash. So `csg.tcblaw.org`, `https://csg.tcblaw.org`, and `https://csg.tcblaw.org/` all resolve to `https://csg.tcblaw.org`.

No secret change needed on your end after this — your current value will start working.

### 2. PDFs not attached
Sends to Resend are returning success (`status: sent` in the log), but attachments aren't reaching your inbox. Most likely cause: Resend's API expects `content` as a base64 string (which we do), but our request also needs the attachments field to survive the Lovable→Resend gateway proxy. Two likely culprits worth fixing in one pass:

a. **Add `content_type: "application/pdf"`** to each attachment — Resend infers from filename but is more reliable when set explicitly.

b. **Log the Resend response body** on success too (currently only logged on failure) so we can see the returned message id and confirm attachments were accepted. I'll persist a short response snippet to `email_send_log.error_message` on the `sent` row for diagnostics (or add a new column-less debug log line).

c. **Verify by triggering a re-send** to your test order after deploy and checking the response body. If Resend still doesn't include attachments, the most likely remaining cause is request body size — I'll then switch to sending the PDFs via Resend's `path` field using a signed Supabase Storage URL instead of inline base64 (Resend fetches the file itself, no size limit on the request).

### Files touched
- `src/lib/fulfill.server.ts` — lenient `publicOrigin()`, add `content_type` to attachments, log Resend response.

### Verification
- Reset the test order via migration, trigger re-fulfillment, check `email_send_log` for the captured Resend response, and confirm the email arrives with attachments and a `tncsg.tcblaw.org` link.
