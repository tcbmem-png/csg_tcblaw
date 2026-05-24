
# Add Mississippi Calculator — Multi-State Architecture

Ship MS as a second state in the existing app. Rename the canonical domain to `csg.tcblaw.org` and keep `tncsg.tcblaw.org` as a 301-style redirect. TN behavior and URLs stay 100% intact.

## 1. Routing & landing

```
/                       → state picker landing (TN | MS, brief blurbs, "Pick your state")
/tn                     → current TN calculator (moved from /calculator)
/tn/how-it-works        → current /how-it-works
/tn/about               → current /about
/ms                     → MS calculator (new)
/ms/how-it-works        → MS "Behind the Scenes" (new)
/ms/about               → shared about, MS-flavored intro
/calculator             → 301 → /tn   (preserve old links / emails / SEO)
/how-it-works           → 301 → /tn/how-it-works
/about                  → 301 → /tn/about
/unlock/$token          → unchanged (PDFs are state-agnostic at the URL level)
/checkout/return        → unchanged
```

State-aware header: shows current state name + a "Switch state" affordance. Sitemap + robots updated. Per-route `head()` metadata is state-specific (titles mention "Mississippi" or "Tennessee" — never share copy).

Domain swap: user adds `csg.tcblaw.org` as primary in Project Settings → Domains; `tncsg.tcblaw.org` stays connected and we wire a server-level redirect from `tncsg.tcblaw.org/*` → `csg.tcblaw.org/tn/*` (preserving path tails where they map). Until DNS propagates, both work.

## 2. Engine — new file, zero TN refactor

New `src/lib/calc/ms/` directory mirroring TN:

```
src/lib/calc/ms/
  types.ts          # MSInputs, MSOutputs, MSDeviation
  calc.ts           # ~30 lines: AGI → percentage → presumptive → +/- deviations
  share.ts          # encodeShare / decodeShare for MS payload
  data/percentages.ts   # frozen statutory table from § 43-19-101
  __tests__/calc.test.ts # the 4 verification tests from spec §7
```

Calc shape:
- `grossAnnual − taxes − ss − mandatoryRetirement − preexistingSupportAnnual − (inHomeMonthly × 12) = adjustedAnnual`
- `adjustedAnnual / 12 = monthlyAGI`
- `monthlyAGI × pct[numChildren] = presumptiveMonthly`
- Health insurance: if obligee provides → add to presumptive; if obligor provides → already credited via AGI (per spec §3.9 interpretation, with on-screen note)
- Threshold flags: `requiresFindingHighIncome` (annual AGI > $100K), `requiresFindingLowIncome` (annual AGI < $10K)
- Sum of applicable deviations → `proposedFinalMonthly = presumptive + Σ deviations + healthInsuranceAddOn`

The shared `CaseCaption` (matter/docket/preparedBy/etc.) stays in `src/lib/calc/share.ts` and is reused. TN's existing `share.ts` payload prefix (`v: 1`) stays untouched; MS payloads carry `v: 1, s: "MS"` so the two formats never collide.

## 3. UI — parallel components, no shared form

New `src/components/calculator/ms/`:
- `inputs.tsx` — obligor income, statutory deductions, # children, pre-existing support, in-home deduction, health insurance section (radio: obligor / obligee / neither), 50/50 flag
- `result-sidebar.tsx` — presumptive amount, threshold warning banners, proposed-final-with-deviations summary
- `deviations.tsx` — 10 collapsible cards (a)–(j); each has Applicable toggle, description textarea, proposed monthly $ input (signed). Running total at bottom. Factor (g) has the prominent "no MS 50/50 formula" callout from spec §4.3.
- `case-caption.tsx` — reuse TN's (already generic)
- `unlock-pdf-panel.tsx` — reuse TN's, passes `state: "MS"` to checkout

`src/routes/ms.tsx` composes these. TN files untouched.

## 4. PDF — MS-specific renderer

New `src/lib/pdf/ms-worksheet-pdf.ts` — single PDF (not two — MS has no AOC official form to mirror). Contents:
- Case caption block
- AGI computation (gross, each deduction line, monthly AGI)
- Percentage application (% × monthly AGI = presumptive)
- Threshold finding callout (if triggered)
- Health insurance treatment
- Deviation worksheet: one row per applicable factor with letter, description, amount; total
- Proposed final monthly award
- Statutory citations footer (§ 43-19-101, § 43-19-103)
- Same TCB branding shell as TN

`fulfill.server.ts` branches on `payload.state`: TN → render both summary + official; MS → render the single MS PDF. Storage path stays `${order.id}/worksheet.pdf` for MS (single file); the existing `pdf_official_storage_path` stays null for MS orders, and the unlock route already handles a missing official variant. Email template stays the same template name — it adapts copy when `officialDownloadUrl` is absent.

## 5. Checkout

`createUnlockCheckout` payload gains an optional `state: "TN" | "MS"` field (defaults to `"TN"` for backward-compat with any in-flight TN sessions). `payload_json` carries it through; webhook + `fulfill.server.ts` switch PDF renderer on it. Same Stripe product, same $99 price — no new Stripe setup needed.

## 6. Database

`orders` table is unchanged structurally — `payload_json.state` carries the discriminator. No migration needed for orders.

The spec proposes `ms_deviations` as a normalized table, but since deviations live inside `payload_json` (alongside everything else needed to re-render the PDF), no separate table is necessary for v1. If you later want analytics across deviation factors, that's a v2 ALTER. **No database migration in this build.**

## 7. Landing page

New `/` is a 2-card chooser:
- "Tennessee — Income Shares model" → /tn
- "Mississippi — Flat-percentage model" → /ms

Existing TN landing content moves to `/tn`. SEO: `/` gets generic "TCB Law Child Support Calculators" title; each state route owns its own keyword-rich title and description.

## 8. Behind-the-Scenes for MS

New `/ms/how-it-works` with the 11 sections from spec §9, including the MS-specific emancipation callout (age 21 vs TN's 18). Existing TN page stays at `/tn/how-it-works` unchanged.

## 9. Tests

Add MS calc tests covering all 4 verification cases from spec §7. TN's existing 17 tests stay green (no shared code is touched).

## 10. Out of scope (matches spec §8)

No imputation engine, no alimony, no retroactive support, no split parenting, no emancipation modeling, no SB 2505 health-insurance amendment until/unless it passes.

---

## Technical notes

- TN's `share.ts` accepts unknown extra fields gracefully (it merges with defaults), so old TN share links keep working after the `state` field is added to the discriminator.
- The state picker landing is intentionally simple — no marketing redesign. Brand/typography/color tokens already in `src/styles.css` are reused as-is for MS.
- The 301 redirects (`/calculator` → `/tn`, etc.) are implemented as TanStack routes that `throw redirect(...)` in `beforeLoad` so existing email/order links from current customers continue to work indefinitely.
- Both domains stay verified in Lovable Cloud — `tncsg.tcblaw.org` becomes a connected domain that serves the same app and the per-request redirect maps it to the `/tn` prefix on `csg.tcblaw.org`.
- DNS for `csg.tcblaw.org` and `mscsg.tcblaw.org` (if you also want a MS-direct vanity domain later) can be added through Project Settings → Domains; no code change needed.

## What you'll need to do outside the chat

1. Add `csg.tcblaw.org` in Project Settings → Domains and set it as Primary.
2. Leave `tncsg.tcblaw.org` connected (don't remove it) — the redirect route handles old links.
3. Optionally add `mscsg.tcblaw.org` later if you want a direct MS vanity URL; not required for launch.

## Build order (when you say go)

1. New MS engine + tests (pure logic, no UI)
2. MS PDF renderer
3. MS routes + components + landing page
4. TN route moves + redirects
5. Checkout/fulfillment branching
6. SEO: per-route head(), updated sitemap, robots unchanged
