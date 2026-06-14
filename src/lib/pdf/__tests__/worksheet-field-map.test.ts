/**
 * Regression suite for the AOC fillable-PDF adapter.
 *
 * Locks in the post-R3 behavior validated by the live adversarial audit
 * (AOC_TESTER_RESULTS.md — all findings F1–F9 resolved). Each `describe`
 * pins one finding so a future change to `worksheet-field-map.ts` that
 * would reintroduce that defect fails fast in CI.
 *
 * Tests target the pure `buildWorksheetData(i, o, ui)` adapter — no PDF
 * rendering, no DOM. CalcOutputs is synthesized so cases (cap, SSR,
 * federal benefit) can be exercised in isolation from engine drift.
 */
import { describe, it, expect } from "vitest";
import { defaultInputs, calculate } from "@/lib/calc/calc";
import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import { buildWorksheetData, type WorksheetUi } from "../worksheet-field-map";

function mkOutputs(over: Partial<CalcOutputs> = {}): CalcOutputs {
  return {
    parentAAGI: 0,
    parentBAGI: 0,
    combinedAGI: 0,
    piA: 0,
    piB: 0,
    bcso: 0,
    bcsoSource: "schedule",
    scheduleAgiUsed: null,
    scheduleIsShaded: false,
    parentABcsoShare: 0,
    parentBBcsoShare: 0,
    arpIdentity: "parent_b",
    parentingTimeBand: "standard",
    variableMultiplier: null,
    netPresumptiveSupport: 0,
    presumptiveDirection: "none",
    ssrApplied: false,
    ssrNote: null,
    minimumOrderApplied: false,
    addOnHealthFromA: 0,
    addOnMedicalFromA: 0,
    addOnChildcareFromA: 0,
    addOnsTotalFromA: 0,
    privateSchoolMonthlyTotal: 0,
    privateSchoolDeviationFromA: 0,
    specialExpensesThresholdAmount: 0,
    specialExpensesIncludedAsDeviation: 0,
    specialExpensesDeviationFromA: 0,
    federalBenefitOffsetFromA: 0,
    allInMonthlyFromA: 0,
    allInMonthly: 0,
    allInDirection: "none",
    allInAnnual: 0,
    warnings: [],
    pcsoExceedsStatutoryMax: false,
    pcsoStatutoryMax: 0,
    pcsoCapNote: null,
    pcsoExcessOverCap: 0,
    pcsoBelowCapNote: null,
    bcsoAboveCapBreakdown: null,
    equalParentingLowSupportNote: null,
    nonEarnerArpNote: null,
    zeroPresumptiveNote: null,
    scheduleEffectiveDate: "2022-05-10",
    errors: [],
    ...over,
  };
}

const ui = (over: Partial<WorksheetUi> = {}): WorksheetUi => ({
  parentAParty: "mother",
  ...over,
});

describe("F1 — Line 11 (obligor) equals Line 12 (PCSO), no $1 rounding gap", () => {
  it("baseline 11k/11k, ARP=Father: line11_aso_b === line12_pcso_b", () => {
    const out = calculate({
      ...defaultInputs(),
      parentAGrossMonthly: 11000,
      parentBGrossMonthly: 11000,
      numChildren: 1,
      parentingType: "standard",
      arpForStandard: "parent_b",
      parentADays: 285,
      parentBDays: 80,
    });
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 11000,
      parentBGrossMonthly: 11000,
      numChildren: 1,
      parentingType: "standard",
      arpForStandard: "parent_b",
      parentADays: 285,
      parentBDays: 80,
    };
    const d = buildWorksheetData(inputs, out, ui());
    // Father is obligor (Parent B → father when A=Mother). Both cells must equal.
    expect(d.line11_aso_b).toBe(d.line12_pcso_b);
    expect(d.line11_aso_b).toBeTruthy();
  });
});

describe("F2 — Line 4 (BCSO allotted to household) populates in PRP (non-obligor) column", () => {
  it("when obligor is father, Line 4 prints in mother (A) column only", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      bcso: 1500,
      arpIdentity: "parent_b",
      netPresumptiveSupport: 500,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    expect(d.line4_bcso_allotted_a).toBe("1,500");
    expect(d.line4_bcso_allotted_b).toBeUndefined();
  });

  it("when obligor is mother, Line 4 prints in father (B) column only", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      bcso: 1500,
      arpIdentity: "parent_a",
      netPresumptiveSupport: 500,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    expect(d.line4_bcso_allotted_b).toBe("1,500");
    expect(d.line4_bcso_allotted_a).toBeUndefined();
  });
});

describe("F3 / F9 — pure private-school deviation reconciles on Line 14", () => {
  it("PCSO 477, FCSO 137 → Line 14 = -340, 12+14=15", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 477,
      allInMonthly: 137,
      allInMonthlyFromA: -137,
      privateSchoolDeviationFromA: -340,
      federalBenefitOffsetFromA: 0,
      minimumOrderApplied: false,
      ssrApplied: false,
    });
    const d = buildWorksheetData(inputs, out, ui());
    expect(d.line12_pcso_b).toBe("477");
    expect(d.line14_deviations_b).toBe("-340");
    expect(d.line15_fcso_b).toBe("137");
    expect(d.line14_deviations_a).toBeUndefined();
    // 12 + 14 must equal 15
    const n = (s: unknown) =>
      Number(String(s ?? "0").replace(/,/g, ""));
    expect(n(d.line12_pcso_b) + n(d.line14_deviations_b)).toBe(n(d.line15_fcso_b));
  });
});

describe("F4 — statutory cap note appears in comments when PCSO exceeds the cap", () => {
  it("includes § 36-5-101(e)(1)(B) text + cap + excess figures", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 5744,
      allInMonthly: 5744,
      pcsoExceedsStatutoryMax: true,
      pcsoStatutoryMax: 2100,
      pcsoExcessOverCap: 3644,
    });
    const d = buildWorksheetData(inputs, out, ui());
    const comments = String(d.comments ?? "");
    expect(comments).toMatch(/36-5-101\(e\)\(1\)\(B\)/);
    expect(comments).toMatch(/2,100/);
    expect(comments).toMatch(/3,644/);
    expect(comments.toLowerCase()).toMatch(/cap|maximum/);
  });

  it("narrativeOverride takes precedence over the auto cap note", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 5744,
      pcsoExceedsStatutoryMax: true,
      pcsoStatutoryMax: 2100,
      pcsoExcessOverCap: 3644,
    });
    const d = buildWorksheetData(
      inputs,
      out,
      ui({ narrativeOverride: "Counsel-drafted Part VI narrative goes here." }),
    );
    const comments = String(d.comments ?? "");
    expect(comments.startsWith("Counsel-drafted Part VI narrative")).toBe(true);
  });
});

describe("F5 — reason text is gated on the include flag", () => {
  it("deviations_specify is undefined when includePrivateSchool=false", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      includePrivateSchool: false,
      privateSchoolReason: "Private school tuition continuation",
      includeSpecialExpenses: false,
      specialExpensesReason: "Travel team fees",
    };
    const d = buildWorksheetData(inputs, mkOutputs(), ui());
    expect(d.deviations_specify).toBeUndefined();
  });

  it("includes each reason only when its flag is on", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      includePrivateSchool: true,
      privateSchoolReason: "Private school tuition continuation",
      includeSpecialExpenses: false,
      specialExpensesReason: "Should NOT appear",
    };
    const d = buildWorksheetData(inputs, mkOutputs(), ui());
    expect(String(d.deviations_specify)).toContain("Private school");
    expect(String(d.deviations_specify)).not.toContain("Should NOT appear");
  });
});

describe("F6 — thousands separators on dollar fields", () => {
  it("formats 80000 as '80,000'", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 3000,
      parentBGrossMonthly: 80000,
    };
    const d = buildWorksheetData(inputs, mkOutputs(), ui());
    expect(d.line1_income_b).toBe("80,000");
    expect(d.line1_income_a).toBe("3,000");
  });
});

describe("F7 — federal benefit offset (Line 1a / 15 / 16) — not double-subtracted, not on Line 14", () => {
  it("Father obligor, $600 benefit, PCSO 615 → 15=615, 16=15, 14 blank", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 3000,
      parentBGrossMonthly: 5000,
      parentBFederalBenefit: 600,
      numChildren: 1,
    };
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 615,
      // allInMonthly is FCSO net of the federal benefit; adapter adds it back for Line 15
      allInMonthly: 15,
      federalBenefitOffsetFromA: -600, // benefit credited to Parent B (sign convention)
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    expect(d.line1a_fed_benefit_b).toBe("600");
    expect(d.line12_pcso_b).toBe("615");
    expect(d.line14_deviations_b).toBeUndefined();
    expect(d.line15_fcso_b).toBe("615");
    expect(d.line16_fcso_adjusted_b).toBe("15");
  });

  it("works correctly when the obligor is the Mother (Column A)", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      parentAFederalBenefit: 600,
      numChildren: 1,
    };
    const out = mkOutputs({
      arpIdentity: "parent_a",
      netPresumptiveSupport: 615,
      allInMonthly: 15,
      federalBenefitOffsetFromA: 600,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    expect(d.line1a_fed_benefit_a).toBe("600");
    expect(d.line12_pcso_a).toBe("615");
    expect(d.line14_deviations_a).toBeUndefined();
    expect(d.line15_fcso_a).toBe("615");
    expect(d.line16_fcso_adjusted_a).toBe("15");
  });

  it("Line 16 stays blank when no federal benefit applies", () => {
    const inputs = defaultInputs();
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 500,
      allInMonthly: 500,
      federalBenefitOffsetFromA: 0,
    });
    const d = buildWorksheetData(inputs, out, ui());
    expect(d.line16_fcso_adjusted_a).toBeUndefined();
    expect(d.line16_fcso_adjusted_b).toBeUndefined();
  });
});

describe("F8 — SSR / statutory minimum order: floor goes to comments, not Line 14", () => {
  it("minimum-order case: Line 12=0, Line 14 blank, Line 15=100, low_income=Y, comments explain floor", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 0,
      parentBGrossMonthly: 900,
      numChildren: 1,
    };
    const out = mkOutputs({
      arpIdentity: "parent_b",
      netPresumptiveSupport: 0,
      allInMonthly: 100,
      minimumOrderApplied: true,
      ssrApplied: true,
    });
    const d = buildWorksheetData(inputs, out, ui());
    expect(d.line12_pcso_b).toBe("0");
    expect(d.line14_deviations_b).toBeUndefined();
    expect(d.line14_deviations_a).toBeUndefined();
    expect(d.line15_fcso_b).toBe("100");
    expect(d.low_income).toBe("Y");
    const comments = String(d.comments ?? "").toLowerCase();
    expect(comments).toMatch(/minimum order|self-support reserve|1240-02-04-\.07/);
  });
});

describe("Obligor-direction parity (audit Cases 2/3) — flip ARP, columns flip too", () => {
  it("ARP=Mother (Parent A): obligor cells land in Column A, B is empty", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 11000,
      parentBGrossMonthly: 11000,
      numChildren: 1,
      arpForStandard: "parent_a",
      parentADays: 80,
      parentBDays: 285,
    };
    const out = mkOutputs({
      arpIdentity: "parent_a",
      netPresumptiveSupport: 500,
      allInMonthly: 500,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    expect(d.line12_pcso_a).toBe("500");
    expect(d.line12_pcso_b).toBeUndefined();
    expect(d.line15_fcso_a).toBe("500");
    expect(d.line15_fcso_b).toBeUndefined();
    expect(d.status_mother_arp).toBe(true);
    expect(d.status_father_prp).toBe(true);
  });
});

describe("Swap routing (audit Case 4) — A=Father correctly populates mother/father columns", () => {
  it("when parentARole=father, mother_name resolves to Parent B and incomes route correctly", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentALabel: "Dad",
      parentBLabel: "Mom",
      parentAGrossMonthly: 4000,
      parentBGrossMonthly: 16000,
      numChildren: 3,
      uninsuredMedicalMonthly: 200,
      uninsuredMedicalPaidBy: "split_pro_rata",
      healthPremiumMonthly: 300,
      healthPaidBy: "parent_b", // Mother
      childcareMonthly: 500,
      childcarePaidBy: "parent_a", // Father
    };
    const out = mkOutputs({
      parentAAGI: 4000,
      parentBAGI: 16000,
      combinedAGI: 20000,
      piA: 0.2,
      piB: 0.8,
      arpIdentity: "parent_a",
      netPresumptiveSupport: 477,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "father" }));
    // mother_name reflects Parent B
    expect(d.mother_name).toBe("Mom");
    expect(d.father_name).toBe("Dad");
    // Mother column shows 16,000 / 80%
    expect(d.line1_income_a).toBe("16,000");
    expect(d.line3_pi_a).toBe(80);
    // Father column shows 4,000 / 20%
    expect(d.line1_income_b).toBe("4,000");
    expect(d.line3_pi_b).toBe(20);
    // Health (paid by Mother=B) → mother column = A → 300
    expect(d.line8a_health_insurance_a).toBe("300");
    expect(d.line8a_health_insurance_b).toBe("0");
    // Childcare (paid by Father=A) → father column = B → 500
    expect(d.line8c_childcare_b).toBe("500");
    expect(d.line8c_childcare_a).toBe("0");
    // split_pro_rata: 200 split 80/20 → 160 / 40
    expect(d.line8b_uninsured_medical_a).toBe("160");
    expect(d.line8b_uninsured_medical_b).toBe("40");
    // Obligor (ARP=Parent A=Father) → Column B
    expect(d.line12_pcso_b).toBe("477");
    expect(d.line12_pcso_a).toBeUndefined();
  });
});

describe("Equal 50/50 parenting — obligor derived from presumptiveDirection", () => {
  it("arpIdentity=equal, direction=parent_a_to_b → obligor is Parent A", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      parentingType: "equal",
      numChildren: 2,
    };
    const out = mkOutputs({
      arpIdentity: "equal",
      presumptiveDirection: "parent_a_to_b",
      netPresumptiveSupport: 250,
      allInMonthly: 250,
    });
    const d = buildWorksheetData(inputs, out, ui({ parentAParty: "mother" }));
    // Parent A = Mother → Column A
    expect(d.line12_pcso_a).toBe("250");
    expect(d.line12_pcso_b).toBeUndefined();
  });
});

describe("Zero / empty inputs — no NaN, no crash", () => {
  it("all-zero inputs produce a safe data object", () => {
    const inputs = defaultInputs();
    const out = mkOutputs();
    const d = buildWorksheetData(inputs, out, ui());
    // No values should serialize as 'NaN'
    for (const v of Object.values(d)) {
      if (typeof v === "string") expect(v).not.toBe("NaN");
    }
    // With defaults, ARP=Parent B (Father) is the obligor; PCSO=0 renders as "0", not NaN
    expect(d.line12_pcso_b).toBe("0");
    expect(d.line12_pcso_a).toBeUndefined();
  });
});

describe("Long unicode names pass through verbatim", () => {
  it("preserves unicode characters in parent and child names", () => {
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentALabel: "María Elena O'Súllivan-García",
      parentBLabel: "李伟 Jr.",
    };
    const overlay: WorksheetUi = ui({
      children: [{ name: "Émile 中文 🙂", dob: "2015-01-01", daysMother: 200, daysFather: 165 }],
    });
    const d = buildWorksheetData(inputs, mkOutputs(), overlay);
    expect(d.mother_name).toBe("María Elena O'Súllivan-García");
    expect(d.father_name).toBe("李伟 Jr.");
    expect(d.child1_name).toBe("Émile 中文 🙂");
  });
});
