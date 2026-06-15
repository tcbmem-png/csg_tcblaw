import type { BcsoRow } from "../../../core/schedule";
import rows from "./schedule-2022.rows.json";
// Tennessee BCSO Schedule, effective 2021-10-01
// Source: Income_Shares_Worksheet_2022_v1_0_MAC_English_.xlsm
// Auto-generated from bcso_schedule_2022.csv (2,815 rows)
// To update: replace CSV, re-run scripts/build-schedule.ts

export const SCHEDULE_EFFECTIVE_DATE = '2021-10-01';


export const BCSO_SCHEDULE: readonly BcsoRow[] = rows;
