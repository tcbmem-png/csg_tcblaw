/**
 * Canonical fixture catalog for visual-regression baselines and the WDM
 * lint-coverage loop. Each fixture is a *labeled, frozen* CalcInputs
 * shape chosen to exercise a distinct judgment-call surface, parenting
 * mode, or cap branch. Adding a fixture here automatically extends the
 * baseline snapshot set and (in Phase E) the lint coverage loop.
 *
 * **Do not edit fixture inputs in place.** Add a new entry instead — the
 * baseline files in `__baselines__/` are keyed by `slug`, and an in-place
 * input change will silently move a baseline.
 */
import type { CalcInputs } from "../../types";
import { defaultInputs } from "../../calc";

export interface WorksheetFixture {
  /** Stable filesystem-safe slug. Used as the baseline filename. */
  slug: string;
  /** Human-readable label printed in test output. */
  label: string;
  /** What judgment/branch surface this fixture is meant to exercise. */
  exercises: string[];
  inputs: CalcInputs;
}

export const FIXTURES: WorksheetFixture[] = [
  // -------------------------------------------------------------------
  // F01 — vanilla standard parenting, mid-income
  //   Exercises: standard ARP path, schedule BCSO, no deviations
  // -------------------------------------------------------------------
  {
    slug: "f01-standard-mid-income",
    label: "Standard parenting, mid-income (Father ARP)",
    exercises: ["standard parenting", "schedule BCSO", "mechanical-only"],
    inputs: {
      ...defaultInputs(),
      parentALabel: "Mother",
      parentBLabel: "Father",
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 8000,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_b",
    },
  },

  // -------------------------------------------------------------------
  // F02 — Equal 50/50 (locked annotations live here)
  // -------------------------------------------------------------------
  {
    slug: "f02-equal-50-50",
    label: "Equal 50/50, 3 kids",
    exercises: [
      "equal parenting",
      "Rule .04(7)(b)(2)(i) cross-credit",
      "Line 6 $0 annotation",
    ],
    inputs: {
      ...defaultInputs(),
      parentAGrossMonthly: 8333.33,
      parentBGrossMonthly: 4166.67,
      numChildren: 3,
      parentingType: "equal",
    },
  },

  // -------------------------------------------------------------------
  // F03 — Above-cap (above-schedule extrapolation), standard parenting
  // -------------------------------------------------------------------
  {
    slug: "f03-above-schedule-standard",
    label: "Above-schedule extrapolation, standard parenting",
    exercises: ["above-cap formula", "bcsoAboveCap structured sub-object"],
    inputs: {
      ...defaultInputs(),
      parentAGrossMonthly: 51250,
      parentBGrossMonthly: 28167,
      numChildren: 3,
      parentingType: "standard",
      arpForStandard: "parent_b",
    },
  },

  // -------------------------------------------------------------------
  // F04 — Berger-shaped: Mother vocationally imputed + both deviations
  //   Exercises: vocational imputation, private school, special expenses
  // -------------------------------------------------------------------
  {
    slug: "f04-berger-imputed-with-deviations",
    label: "Berger-shaped: Mother imputed (vocational) + PS + SE deviations",
    exercises: [
      "imputation (vocational_capacity / voluntary_underemployment)",
      "private school deviation",
      "special-expenses deviation",
    ],
    inputs: {
      ...defaultInputs(),
      parentALabel: "Mother",
      parentBLabel: "Father",
      parentAGrossMonthly: 4800,
      parentBGrossMonthly: 8000,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_b",
      useImputationForA: true,
      parentAActualGrossMonthly: 1500,
      parentAIncomeMethodology: {
        path: "imputed",
        basis: "voluntary_underemployment",
        method: "vocational_capacity",
        actualMonthlyGross: 1500,
        occupation: "registered nurse",
        area: "Nashville MSA",
        hoursPerWeek: 40,
        rationale:
          "Mother left full-time RN role; vocational evidence supports $4,800/mo capacity.",
        monthlyGrossResult: 4800,
      },
      parentBIncomeMethodology: {
        path: "simple",
        source: "w2_box5_annual",
        w2Box5Annual: 96000,
        monthlyGrossResult: 8000,
      },
      includePrivateSchool: true,
      privateSchoolAnnual: 12000,
      privateSchoolPaidBy: "parent_b",
      includeSpecialExpenses: true,
      specialExpensesAnnual: 6000,
      specialExpensesPaidBy: "parent_a",
    },
  },

  // -------------------------------------------------------------------
  // F05 — Private-school deviation only (clean isolation)
  // -------------------------------------------------------------------
  {
    slug: "f05-private-school-only",
    label: "Private school deviation only",
    exercises: ["private school deviation (isolated)"],
    inputs: {
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
      includePrivateSchool: true,
      privateSchoolAnnual: 10000,
      privateSchoolPaidBy: "parent_a",
    },
  },

  // -------------------------------------------------------------------
  // F06 — Special-expenses deviation only
  // -------------------------------------------------------------------
  {
    slug: "f06-special-expenses-only",
    label: "Special-expenses deviation only",
    exercises: ["special-expenses deviation (isolated)"],
    inputs: {
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
      includeSpecialExpenses: true,
      specialExpensesAnnual: 6000,
      specialExpensesPaidBy: "parent_a",
    },
  },
];

/** Coverage gaps — to be filled before Phase E (lint expansion).
 *  Each commented entry is a Phase-E TODO; do NOT activate without
 *  human approval per the gate schedule. */
export const FIXTURE_COVERAGE_GAPS_FOR_PHASE_E = [
  "Path C — self-employment add-backs",
  "Path E — variable income, averaging period set",
  "Fixture #9 — means-tested only / SSI carve-out",
  "Fixture #10 — incarceration carve-out (criminal nonpayment branch)",
  "Fixture #11 — cap-engaged burden-shift (PCSO > $4,100)",
  "Special-expense 7% waiver branch",
] as const;
