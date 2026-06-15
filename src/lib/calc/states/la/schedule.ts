// Louisiana Schedule of Basic Child Support Obligations (La. R.S. 9:315.19).
// Source: the schedule embedded in the official Louisiana DCFS OBWS "Child
//   Support Estimator" (webapps.dcfs.la.gov/OBWS), table dated 2024-12-16 — the
//   ~Jan. 1, 2025 revision. Re-digitized 2026-06-15 after the live DCFS tool
//   disagreed with our prior (2021, Acts 2020 No. 177) table by ~10%; see
//   CSG/06_State_Forms/LA/LA_Oracle_Check_FINDING.md and the `_scheduleUpdate`
//   note in CSG/01_States/LA/LA_StateSpec.json (the 2021 table is backed up at
//   LA_StateSpec.BACKUP-2021sched.json).
// Generated from LA_StateSpec.json schedule.rows — do not hand-edit.
//
// Tuple form: [rowIncome, ch1, ch2, ch3, ch4, ch5, ch6]
//   rowIncome = the chart row's combined adjusted monthly gross (combinedMin).
//   Lookup convention is nearest_50 (snap to the nearest $50 row).
//   Below the schedule's first tabulated row ($1,050), the State sets the basic
//   obligation at 4% of combined income, flat across all child counts — captured
//   live at $50 increments ([0]->0, [50]->2, ... [1000]->40); the tabulated
//   table proper begins at [1050]->43/43/44/44/45/45.
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const LA_SCHEDULE_EFFECTIVE_DATE = "2025-01-01";
export const LA_SCHEDULE_MAX_CHILDREN = 6;
// Schedule now extends to $50,000/mo combined (the 2025 table's top row);
// above $50,000 is discretionary (R.S. 9:315.13(B)(1) / Falterman).
export const LA_SCHEDULE_CAP = 50000;

// 1001 rows, 1-6 children (20 sub-$1,050 4%-of-combined floor rows + the table).
export const LA_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
