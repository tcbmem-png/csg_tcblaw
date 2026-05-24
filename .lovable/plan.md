
## What I found

### 1. Our PDF vs. the official AOC Child Support Worksheet

I parsed the form you uploaded (the official State of Tennessee – Child Support Worksheet) and compared it to `src/lib/pdf/worksheet-pdf.ts`. They are not the same document:

| Section | Official form | Ours |
|---|---|---|
| Part I — Identification | Mother / Father / Non-parent Caretaker columns, PRP/ARP/SPLIT checkboxes, TCSES #, Docket #, Court, child names + DOBs + days with each parent | Generic "Parent A / Parent B" caption box, no PRP/ARP checkbox, no per-child rows |
| Line numbers | 1, 1a (federal benefit for child), 1b (SE tax paid), 1c subtotal, 1d in-home credit, 1e not-in-home credit, 2 AGI, 2a combined, 3 PI | 1–4 with different labels, no 1a/1b/1e |
| Part III | 4 BCSO to PRP household, 4a share owed, 5 ARP avg parenting time, 6 parenting time adjustment, 7 Adjusted BCSO | 7 BCSO, 8 share, 9 ARP/band string, 10 net presumptive |
| Part IV | 8a/8b/8c + 9 total + 10 share + 11 ASO | 11/12/13/14 |
| Part V | 12 PCSO, low-income 7.5%/15% flag, 13a/b/c modification variance | Not present |
| Part VI | 14 deviations, 15 FCSO, 16 FCSO adjusted for federal benefit, Comments, Preparer block | Custom "Final monthly order" block, no preparer/comments box |

So ours is a clean, lawyer-friendly summary — better-looking but **not** the AOC form a clerk will accept. Your instinct is right: ship both.

### 2. Logic gaps worth flagging (not fixing in this turn unless you say so)

Inputs the AOC form has but our calculator does not capture:
- **Line 1a — Federal benefit paid for child** (offset against obligor's share, line 16). Currently ignored.
- **Line 1e — Credit for not-in-home qualified children** (separate from in-home credit).
- **Non-parent caretaker** scenarios (Column C). We assume two parents.
- **Low-income flag** (7.5% variance threshold instead of 15%) for modifications.
- **Modification flow** (13a/b/c) — current order amount + significant variance test. We only price initial calculations.
- **Per-child days** breakdown — we take a single "days for parent A / parent B" total, not per-child days.

None of these break a typical initial-order calculation, but the official worksheet will show blanks where a clerk expects entries. I'll note this on the PDF for now and we can extend the calculator inputs later if you want full AOC parity.

### 3. Other site logic spot-checks

- BCSO lookup, pro-rata, parenting-time bands, SSR, add-ons math in `src/lib/calc/calc.ts` + `bcso.ts` match Rule 1240-02-04 and the 2022 schedule. ✓
- Fulfillment, retry sweep, /resend recovery, unlock token all wired correctly. ✓
- `/howitworks` and citations text already cleaned of the "75/25" relic last turn. ✓
- One thing I want to double-check while I'm in there: the admin fulfill route uses the service-role key as the `x-admin-secret` bearer — works, but I'd like to swap it for a dedicated `ADMIN_FULFILL_SECRET` so rotating service-role doesn't break the admin tool. Low priority; flagging only.

## Plan

### A. Add an "official form" PDF renderer
- New file `src/lib/pdf/official-worksheet-pdf.ts` that mirrors the AOC form layout exactly: Part I identification table (Mother/Father columns, PRP/ARP checkboxes derived from inputs, docket/court/TCSES from caption, child-count rows), Parts II–VI with the official line numbers (1, 1a, 1b, 1c, 1d, 1e, 2, 2a, 3, 4, 4a, 5, 6, 7, 8a-c, 9, 10, 11, 12, 13a-c, 14, 15, 16), Comments box, Preparer's block.
- Uses the same `SimplePdf` Helvetica primitive we already have (Worker-safe, no WASM, no native deps).
- Fields we don't collect (1a federal benefit, 1e not-in-home, 13a–c modification, Column C caretaker) render as blanks/dashes — clerk-fillable.
- Mother/Father mapping: if `parentALabel` / `parentBLabel` look like names we'll use them; otherwise label as Parent A / Parent B in the Mother column / Father column slots. PRP/ARP X marks derived from `outputs.arpIdentity`.

### B. Wire both PDFs into fulfillment
- `fulfillOrder` renders **two** PDFs and uploads both:
  - `${order.id}/worksheet.pdf` — current branded version (unchanged)
  - `${order.id}/worksheet-official.pdf` — new AOC-format version
- Add column `pdf_official_storage_path text` to `orders` via migration.
- Update `/api/public/unlock/$token` to accept an optional `?variant=official` query param and serve the official one; default unchanged for back-compat.
- Update `worksheet-ready` email template to include both download links: "Download the branded summary" + "Download the official AOC form".
- Update `/resend` and `resendWorksheetEmail` — no code changes needed beyond the new template (it pulls both links from order data).

### C. Light verification
- After the build settles, hit the e2e script against the dev server (the published Workers run pdfkit-free SimplePdf, so this will work in production too — no WASM).
- Convert both PDFs to images and eyeball them per the QA rule before claiming done.

## Out of scope (call out only)

- Capturing federal benefit, not-in-home credit, modification, and caretaker inputs in the calculator UI — separate feature. Want me to queue it?
- Swapping the admin fulfill bearer to its own secret — 5-min change, want me to do it in this same turn?
