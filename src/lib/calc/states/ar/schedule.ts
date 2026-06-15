// Arkansas Monthly Family Support Chart of Basic Child Support Obligations.
// Source: Arkansas AOC official chart (Admin. Order No. 10, Income Shares, eff. 2020-07-01,
//   as amended 2022-04-14): https://www.arcourts.gov/sites/default/files/formatted-files/monthly-family-support-chart-req-july-2020.pdf
// Digitized & primary-source verified 2026-06-14 (see CSG/01_States/AR/AR_StateSpec_NOTES.md).
// Generated from AR_StateSpec.json schedule.rows — do not hand-edit.
//
// Tuple form: [rowIncome, ch1, ch2, ch3, ch4, ch5, ch6]
//   rowIncome = the chart row's combined monthly income (combinedMin).
//   Lookup convention is round_down (largest rowIncome <= combined income).
//   No shaded bitmask: AR has no shaded-cell mechanic (its SSR keys off payor gross).
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const AR_SCHEDULE_EFFECTIVE_DATE = "2020-07-01";
export const AR_SCHEDULE_MAX_CHILDREN = 6;
export const AR_SCHEDULE_CAP = 30000;

// 580 rows, 1-6 children.
export const AR_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
