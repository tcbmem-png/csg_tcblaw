// Washington State Child Support Schedule economic table — RCW 26.19.020
// (effective 1/1/2026, as amended by EHB 1014, Laws of 2025 ch. 272), on
// combined monthly NET income. Source: app.leg.wa.gov RCW 26.19.020 (certified
// 8/15/2025), digitized + programmatically validated (CSG/01_States/WA:
// WA_StateSpec.json, WA_StateSpec_NOTES.md). Generated from WA_StateSpec.json —
// do not hand-edit.
//
// Tuple form: [combinedNetIncome, ch1..ch5]. The cell is the PER-CHILD basic
// support obligation (table header "MONTHLY BASIC SUPPORT OBLIGATION PER
// CHILD"); the total BCSO = cell × N (see schedule config valuesArePerChild).
// Lookup is nearest_100 (EHB 1014: round combined net to the nearest $100 row,
// ≤49 down / ≥50 up). 479 rows, $2,200–$50,000 in $100 steps, 1–5 children.
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const WA_SCHEDULE_EFFECTIVE_DATE = "2026-01-01";
export const WA_SCHEDULE_MAX_CHILDREN = 5;
export const WA_SCHEDULE_CAP = 50000;

export const WA_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
