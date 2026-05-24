## Confirmed status (no code changes needed)

- **`/tn` and `/ms`**: Both route files exist (`tn.tsx`, `ms.tsx`, plus `/about` and `/how-it-works` sub-pages for each) and are listed in `sitemap.xml`. Good to go.
- **Custom domains**: `tncsg.tcblaw.org`, `csg.tcblaw.org`, and `notify.tncsg.tcblaw.org` are all connected.
- **Heads-up on canonical**: The code currently uses **`csg.tcblaw.org`** as the canonical SITE_URL in `__root.tsx` and as the `BASE_URL` in `sitemap.xml` — not `tncsg.tcblaw.org`. If `tncsg` is meant to be the primary, that's a one-line change in two files. Not changing it as part of this turn unless you confirm.

## Favicon plan

You uploaded `favicon.ico`. I'll:

1. **Copy the file** into `public/favicon.ico` so it's served at `/favicon.ico`.
2. **Add `<link rel="icon">` to `__root.tsx`** in the `head().links` array so every route (TN, MS, about, how-it-works, calculator, checkout, etc.) inherits it:
   ```ts
   { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
   { rel: "shortcut icon", href: "/favicon.ico" },
   ```
   Placing it in the root route's `head()` means it's emitted on every page automatically — no per-route work needed.
3. **Verify** by curling `/favicon.ico` after build and visually checking the tab on `/`, `/tn`, `/ms`.

No other files touched. No domain/route changes in this turn.
