// Alabama Schedule of Basic Child Support Obligations (Rule 32, Ala. R. Jud. Admin.).
// Source: alacourt.gov/docs/ChildSupportObligations.512022.pdf (Schedule eff. 5/1/2022;
//   Rule 32 amendments eff. 6/1/2023). Digitized & primary-source verified 2026-06-14
//   (see CSG/01_States/AL/AL_StateSpec_NOTES.md). Generated from AL_StateSpec.json — do not hand-edit.
//
// Tuple form: [rowIncome, ch1, ch2, ch3, ch4, ch5, ch6]. Lookup convention is
// nearest_50 (Rule 32(C)(1) nearest-$50 interpolation). No shaded bitmask.
import type { BcsoRow } from "../../core/schedule";
import rows from "./schedule.rows.json";

export const AL_SCHEDULE_EFFECTIVE_DATE = "2022-05-01";
export const AL_SCHEDULE_MAX_CHILDREN = 6;
export const AL_SCHEDULE_CAP = 30000;

// 596 rows, 1-6 children.
export const AL_BCSO_SCHEDULE: readonly BcsoRow[] = rows;
