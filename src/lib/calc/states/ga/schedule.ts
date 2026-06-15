// Georgia BCSO schedule — O.C.G.A. § 19-6-15(o) (eff. 7/1/2024; SB 454, top row $40,000/mo).
// Digitized & verified 2026-06-15 (see CSG/01_States/GA/GA_StateSpec_NOTES.md).
// Generated from GA_StateSpec.json — do not hand-edit. Tuple: [combinedMin, ch1..ch6].
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const GA_SCHEDULE_EFFECTIVE_DATE = "2026-01-01";
export const GA_SCHEDULE_MAX_CHILDREN = 6;
export const GA_SCHEDULE_CAP = 40000;

export const GA_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
