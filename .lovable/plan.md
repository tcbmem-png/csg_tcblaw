# Make the official PDF actually look like the AOC form

## Diagnosis

I rendered both files for comparison:

- **Real AOC form** (`Tennessee_Child_Support_Worksheet.pdf`) — two-column layout with a left "gutter" of guidance text next to each Part, a dedicated Child(ren) sub-table in Part I, shaded/hatched cells for non-applicable columns, merged "Obligation Column" header in Part V, modification block 13a–c, and a narrative-style Deviations row 14.
- **Our `official-worksheet-pdf.ts`** — single full-width data table per Part, no gutter, no child sub-table, wrong labels in several rows, extra Min-Order Y/N row that doesn't exist on AOC, no shading on N/A cells, Part V columns not merged, and identification block uses our internal Matter / Prepared-by rows instead of the AOC's TCSES / Docket / Court rows.

The order I just fulfilled (`e327a75f…`) has both PDFs in storage. The summary PDF you uploaded looks correct; the AOC one is where the gap is.

## Scope of the rewrite

Rewrite `src/lib/pdf/official-worksheet-pdf.ts` so its rendered output matches the AOC form section-by-section. Touch `src/lib/pdf/simple-pdf.ts` only if a small hatched-fill helper is needed for N/A cells. No calc logic, no email/storage/route changes.

## Layout changes

Adopt a two-column page model:

- Left gutter (~150pt): Part heading + the AOC's italic guidance text
  ("Indicate the status of each parent…", "Use Credit Worksheet to calculate
  line items 1d and 1e.", "Modification of Current Child Support Order",
  "Deviations must be substantiated by written findings…").
- Right body (~390pt): the AOC's actual line-numbered tables.

Part bars become a thin horizontal rule with the Part title at top-left of the gutter, not the wide grey banner we use today.

## Section-by-section changes

**Part I — Identification**
- Replace our captionRow Matter/Prepared-by stack with the AOC ordering:
  Name of Mother / Name of Father / Name of non-parent Caretaker, then
  TCSES case #, Docket #, Court name.
- Add the AOC Child(ren) sub-table:
  Name(s) of Child(ren) | Date of Birth | Days with Mother | Days with Father | Days with Caretaker.
  We don't collect per-child data, so render 5 blank ruled rows for the clerk.
- Keep the PRP / ARP / SPLIT "X" columns aligned right of each parent name (we already have these).

**Part II — Adjusted Gross Income**
- Column headers stay (Mother/Col A, Father/Col B, Non-parent Caretaker/Col C).
- Reword to AOC exactly: 1, 1a Federal benefit for child, 1b Self-employment tax paid, 1c Subtotal, 1d Credit for In-Home Children, 1e Credit for Not In Home Children, 2 Adjusted Gross Income (AGI), 2a Combined Adjusted Gross Income, 3 Percentage Share of Income (PI).
- Prefix cells with `$` or `%` per AOC; drop the "(+)" / "(-)" suffixes.
- Hatch-fill the Caretaker column on rows where it doesn't apply (most of 1–3), and hatch-fill the right side of row 2a.

**Part III — Parents' Share of BCSO**
- Re-label row 4 → "BCSO allotted to primary parent's household" (value in Combined/Col C only; A and B shaded).
- Row 4a → "Share of BCSO owed to primary parent".
- Row 5 → "ARP parent's average parenting time" (single value spanning).
- Rows 6, 7 unchanged in meaning, AOC wording.

**Part IV — Additional Expenses**
- Collapse our split 8c/8d (payroll vs non-payroll) into one AOC row 8c "Work-related childcare".
- 8a, 8b, 8c, 9, 10, 11 numbering matches AOC; shade Col C on rows 10 and 11.

**Part V — Presumptive Child Support / Modification of Current Support**
- Change header to a single merged "Obligation Column" spanning A+B; Caretaker column hatched throughout this Part.
- Row 12 PCSO with the small-print note: "* Enter the difference between the greater and smaller numbers from Line 11, except in non-parent caretaker situations."
- Add the two AOC prompts:
  `Low Income?  ____  (N = 15%   Y = 7.5%)`
  `Current Order Flat %  ____  (N / Y)`
- Modification block (left gutter label "Modification of Current Child Support Order"):
  13a Current child support order amount for the obligor parent.
  13b Amount required for significant variance to exist.
  13c Actual variance between current order and PCSO / BCSO.

**Part VI — Deviations and Final Child Support Order**
- Gutter label: "Deviations must be substantiated by written findings in the Child Support Order".
- Row 14 Deviations (Specify): one value row + 3 ruled blank lines for narrative.
- Drop our extra "Adjusted for Minimum Order (Y/N)" row — not on AOC.
- 15 Final Child Support Order (FCSO).
- 16 FCSO adjusted for federal benefit, Line 1a, Obligor's column.

**Footer**: keep our Comments box, Preparer's Use Only (Name / Title / Date) block, and the generated-by disclaimer.

## QA

After build, re-fulfill the existing test order (already paid + delivered) by clearing `pdf_official_storage_path` on row `e327a75f…` and hitting `/api/public/payments/retry-stuck` — or just call the admin endpoint once and re-email. Render the new official PDF to JPEGs at 150dpi and visually compare side-by-side with the uploaded AOC form. Iterate until each Part matches structurally.

## Out of scope

- Summary PDF (you said it looks good).
- MS worksheet.
- Calculator logic, email templates, storage, routes.
- The parent label rendering glitch in the summary ("tay"/"her" split with odd kerning) — not raised, leave it.
