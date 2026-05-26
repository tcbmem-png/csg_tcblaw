## What happened

There used to be a true AOC-format renderer: `src/lib/pdf/official-worksheet-pdf.ts` (893 lines). It draws the actual DHS/AOC worksheet — Mother/Father/Caretaker columns, PRP/ARP/SPLIT checkboxes, hatched "N/A" cells, the official line numbering (1, 1a–1e, 2, 2a, 3, 4, 4a–4e, …), TCSES/Docket/Court captions, and the per-child name/DOB/days sub-table — matching the uploaded PDF and the DHS Guide.

In P2 (dual-PDF) that renderer was bypassed. Two new pieces were added:

- `src/components/calculator/aoc-worksheet.tsx` — a *branded* React stand-in (Parent A / Parent B, "Rule .04(3)" footnotes, dark "Part I · Identification" bars, TCB form footer). This is what users now see/print as the "AOC-format" PDF.
- `src/components/calculator/pdf-download-buttons.tsx` + `src/lib/print-mode.ts` — print via `window.print()` with a `.pdf-aoc` / `.pdf-annotated` body class toggle, instead of calling the real PDF renderers.

Both `renderOfficialWorksheetPdf` (true AOC replica) and `renderWorksheetPdf` (annotated PDF) are now orphans — no call sites in the app.

So the "official" output is no longer official; it's just the branded worksheet with annotations stripped. The DB/field-name mirroring against the AOC form (Mother/Father, 1a–1e, 2a, etc.) is intact in the orphaned renderer.

## Plan: resurrect the true AOC PDF, keep the annotated branded one

### 1. Wire the real renderers back to the download buttons

In `src/components/calculator/pdf-download-buttons.tsx`, replace `printPdf("aoc" | "annotated")` with a direct call to the existing server renderers, downloading a Blob:

- AOC button → `renderOfficialWorksheetPdf({ inputs, outputs, caption })` → `tn-child-support-worksheet-AOC.pdf`
- Annotated button → `renderWorksheetPdf({ inputs, outputs, caption })` → `tn-child-support-worksheet-annotated.pdf`

This requires the buttons to receive `inputs`, `outputs`, and `caption` as props (today they take none). Update the one caller in `src/routes/tn.tsx` (line 174) to pass them.

Mirror the same fix in `src/components/calculator/result-sidebar.tsx` "Print annotated PDF" button (currently calls `printPdf("annotated")` after switching tabs) — invoke `renderWorksheetPdf` directly and download.

### 2. Retire the branded "AOC" stand-in

- Delete `src/components/calculator/aoc-worksheet.tsx` and its `<AocWorksheet>` render in `src/routes/tn.tsx` (lines 10, 189). It's a duplicate of the annotated worksheet without annotations and is what's misleading users.
- Delete `src/lib/print-mode.ts` and remove the `.print-mode-aoc` / `.print-mode-annotated` CSS hooks added to `src/styles.css`. PDFs now come from the server renderers, not `window.print()`.
- The on-screen worksheet panel (`<OfficialWorksheet>` — the annotated branded view) stays exactly as it is. It's the screen view; both PDFs are downloads.

### 3. Verify the AOC PDF still matches the uploaded form

Audit `official-worksheet-pdf.ts` line numbering against the uploaded `PDF.pdf` and `A_Guide_to_Tennessee_s_Child_Support_Worksheet_2.pdf` (DHS guide) and confirm:

- Part I identification table & per-child sub-table match
- Part II lines 1, 1a–1e, 2, 2a, 3 match
- Part III BCSO lines 4, 4a–4e match
- Parts IV–VII line numbering matches the form
- Hatched-N/A cells appear where the form has them
- Mother/Father swap honored via `caption.parentARole`

Fix any drift found (likely small — the renderer was written against the same form). Document any line that maps to a field we don't yet collect (caretaker column, federal-benefit 1a if not collected, etc.) — those stay as blank fillable cells, matching what the orphan already does.

### 4. QA

- Run the existing test suite (118 tests). Should be unaffected.
- Generate both PDFs for one of the article stories; open the AOC PDF side-by-side with `PDF.pdf` and confirm line-by-line parity.
- Confirm the annotated PDF still includes the rule citations, methodology appendix, and source lines.

## Technical notes

- The renderers already exist and are Worker-compatible (`SimplePdf` uses no native deps). Hooking them up is a small client-side change: dynamic-import the renderer in the button handler, build a Blob, and trigger a download via an `<a download>` click — no print dialog.
- `caption` is already plumbed to `<OfficialWorksheet>` in `tn.tsx`; we just pass the same value to the buttons.
- Tennessee-only change. MS PDF flow (`ms/worksheet-preview.tsx` + `ms-worksheet-pdf.ts`) is untouched.

## Files

- Edit: `src/components/calculator/pdf-download-buttons.tsx`, `src/components/calculator/result-sidebar.tsx`, `src/routes/tn.tsx`, `src/styles.css`
- Possibly edit: `src/lib/pdf/official-worksheet-pdf.ts` (only if audit finds drift)
- Delete: `src/components/calculator/aoc-worksheet.tsx`, `src/lib/print-mode.ts`
