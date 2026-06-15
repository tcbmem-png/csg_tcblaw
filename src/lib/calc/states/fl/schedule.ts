// Florida Child Support Guidelines schedule — Fla. Stat. § 61.30(6), on combined NET income.
// Source: https://www.flsenate.gov/Laws/Statutes/2024/61.30 (2024 statute). Digitized & verified 2026-06-14
//   (see CSG/01_States/FL/FL_StateSpec_NOTES.md). Generated from FL_StateSpec.json — do not hand-edit.
//
// Tuple form: [combinedNetIncome, ch1..ch6]. Lookup is interpolate_linear between
// the $50 rows (§ 61.30 practice). No shaded bitmask.
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const FL_SCHEDULE_EFFECTIVE_DATE = "2023-07-01";
export const FL_SCHEDULE_MAX_CHILDREN = 6;
export const FL_SCHEDULE_CAP = 10000;

// 185 rows ($800-$10,000 combined NET, $50 steps), 1-6 children.
export const FL_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
