// Louisiana Schedule of Basic Child Support Obligations (La. R.S. 9:315.19).
// Source: Louisiana DCFS publication of the R.S. 9:315.19 schedule, as amended by
//   Acts 2020 No. 177, eff. 2021-01-01: https://www.dcfs.louisiana.gov/assets/docs/searchable/ChildSupportServices/schedule-child-support-obligations-2021.pdf
// Digitized & primary-source verified 2026-06-14 (see CSG/01_States/LA/LA_StateSpec_NOTES.md).
// Generated from LA_StateSpec.json schedule.rows — do not hand-edit.
//
// Tuple form: [rowIncome, ch1, ch2, ch3, ch4, ch5, ch6]
//   rowIncome = the chart row's combined adjusted monthly gross (combinedMin).
//   Lookup convention is nearest_50 (snap to the nearest $50 row).
//   The $100 self-sufficiency floor is built into the lowest row ($0-$950 -> $100).
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const LA_SCHEDULE_EFFECTIVE_DATE = "2021-01-01";
export const LA_SCHEDULE_MAX_CHILDREN = 6;
export const LA_SCHEDULE_CAP = 40000;

// 782 rows, 1-6 children.
export const LA_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
