# Tennessee Child Support Worksheet — Fillable Form Template

## `cs-1-fillable.pdf` (v2 — 2026-05-27)

Fillable AcroForm replica of the State of Tennessee / AOC DHS Child
Support Worksheet (Form CS-1). Used as the template substrate by the
calculator's overlay renderer (`src/lib/pdf/overlay-renderer.ts`):
the engine computes every cell, sets the corresponding AcroForm field,
then flattens for filing.

### Field inventory (104 top-level AcroForm fields)

- **99 text fields** (`/Tx`) covering every populated cell of the
  official form — identification, children rows, Lines 1–16,
  health/medical/childcare add-ons, current order block, deviations,
  FCSO, comments, preparer block.
- **5 radio groups** (`/Btn`, `/Ff = Radio`):
  - `party_status_mother`, `party_status_father`, `party_status_caretaker`
    with options `PRP` / `ARP` / `SPLIT` (unset = Equal-parenting / none).
  - `low_income` with options `N` / `Y`.
  - `current_order_flat` with options `N` / `Y`.
- One multiline annotation field, `equal_parenting_annotation` (page 1,
  below Line 7 / above Part IV), reserved for the Rule .04(7)(b)(2)(i)
  cross-credit margin note in Equal-50/50 cases. Default value: empty
  (invisible on standard-parenting renders).

### v1 → v2 changes (from form-builder agent)

1. **New field `equal_parenting_annotation`** — multiline `/Tx`,
   rect `[370, 252, 521, 278]`, Type0/Identity-H DejaVu Sans embedded
   in `/DR/Font/DejaVu` for `↑` and en-dash glyphs.
2. **N/Y checkbox pairs → radio groups** — `low_income_n`/`low_income_y`
   and `current_order_flat_n`/`current_order_flat_y` collapsed into
   true mutually-exclusive radio groups (`low_income`,
   `current_order_flat`).
3. **PRP/ARP/SPLIT 9-checkbox grid → 3 per-column radio groups** —
   one group per party column, each with 3 options; unselected
   represents the Equal-parenting "no PRP/ARP" state.
4. **Date fields → plain text** — `child_dob_1..6` and `preparer_date`
   stripped of `/AA` date-format actions so pre-formatted strings from
   the calculator pass through untouched and manual fillers can enter
   partial / non-standard dates.

Field count went from 111 (v1) → 104 (v2) as the checkbox-to-radio
consolidations reduced the top-level field count.

### Form-level settings

- `/AcroForm /NeedAppearances true` — viewers regenerate appearance
  streams from `/V` on open.
- `/AcroForm /DR /Font` contains `DejaVu`, `Helv`, `ZaDb`. DejaVu is
  the Type0/Identity-H font used for Unicode glyphs in the
  annotation, comments, and deviation-specify blocks.
- Field `/DA` defaults: `/DejaVu 10 Tf` for `equal_parenting_annotation`,
  `/Helv 9 Tf` for everything else. The overlay renderer calls
  `form.updateFieldAppearances(dejaVu)` before flattening so every
  appearance stream is rebuilt against the Unicode font (§, →,
  en-dash render correctly across Adobe Reader, Preview, Chrome,
  poppler).

### Provenance

- Source: form-builder agent, v2 patch landed 2026-05-27.
- Replaces v1 (delivered 2026-05-26).
- Authoritative reference: official State of Tennessee AOC/DHS
  Child Support Worksheet PDF (blank reference retained at
  `src/lib/pdf/assets/tn-cs-worksheet-blank.pdf`).

### Consumers

- Runtime template: `src/lib/pdf/assets/tn-cs-worksheet-fillable.pdf`
  (byte-identical copy, bundled with the app).
- Public preview / download: `public/forms/cs-1-fillable.pdf`
  (this file).
- Field map: `src/lib/pdf/aoc-field-map.ts` —
  `{ fieldName → (wdm, inputs, outputs) ⇒ value | null }`.
- Renderer: `src/lib/pdf/overlay-renderer.ts` — loads the fillable
  PDF, sets fields, regenerates appearances with DejaVu, flattens.
