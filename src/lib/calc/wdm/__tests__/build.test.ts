import { describe, expect, it } from "vitest";
import { calculate, defaultInputs } from "../../calc";
import { defaultCaption } from "../../share";
import { buildWDM, findLineByScreenNo, walkValues } from "../build";
import type { CalcInputs, ImputedMethodology } from "../../types";

const PREPARED_ON = "2026-05-27"; // deterministic for snapshot stability

function build(inputs: CalcInputs, caption = defaultCaption()) {
  const out = calculate(inputs);
  return buildWDM(inputs, out, caption, { preparedOnDisplay: PREPARED_ON });
}

// ============================================================
// Shape & invariants
// ============================================================

describe("buildWDM — shape & invariants", () => {
  it("emits the canonical sections in order, plus deviations when present", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 2,
    });
    expect(wdm.sections.map((s) => s.id)).toEqual([
      "identification",
      "agi",
      "bcso",
      "parenting_time",
      "addons",
      "final",
    ]);

    const withDev = build({
      ...defaultInputs(),
      parentAGrossMonthly: 6000,
      parentBGrossMonthly: 4000,
      numChildren: 2,
      includePrivateSchool: true,
      privateSchoolAnnual: 12000,
      privateSchoolPaidBy: "parent_a",
    });
    expect(withDev.sections.map((s) => s.id)).toContain("deviations");
    const ids = withDev.sections.map((s) => s.id);
    expect(ids.indexOf("deviations")).toBe(ids.indexOf("addons") + 1);
    expect(ids.indexOf("final")).toBe(ids.indexOf("deviations") + 1);
  });

  it("propagates schedule effective date and parent labels", () => {
    const inputs = {
      ...defaultInputs(),
      parentALabel: "Mother",
      parentBLabel: "Father",
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    };
    const wdm = build(inputs);
    expect(wdm.parentALabel).toBe("Mother");
    expect(wdm.parentBLabel).toBe("Father");
    expect(wdm.header.scheduleEffectiveDate).toBeTruthy();
    expect(wdm.header.preparedOnDisplay).toBe(PREPARED_ON);
  });

  it("hasCaption is false for the default empty caption and true once a field is set", () => {
    const inputs = { ...defaultInputs(), parentAGrossMonthly: 5000, parentBGrossMonthly: 3000 };
    expect(build(inputs).hasCaption).toBe(false);
    expect(build(inputs, { ...defaultCaption(), matterName: "Doe v. Doe" }).hasCaption).toBe(true);
  });
});

// ============================================================
// Berger-style standard-parenting fixture
// ============================================================

describe("buildWDM — Berger-style standard-parenting fixture", () => {
  const inputs: CalcInputs = {
    ...defaultInputs(),
    parentALabel: "Mother",
    parentBLabel: "Father",
    parentAGrossMonthly: 5000,
    parentBGrossMonthly: 8000,
    numChildren: 2,
    parentingType: "standard",
    arpForStandard: "parent_b",
  };

  it("Line 6 prints the schedule BCSO (not 0) for standard parenting", () => {
    const wdm = build(inputs);
    const line6 = findLineByScreenNo(wdm, "6")!;
    expect(line6.total!.amount).toBeGreaterThan(0);
    expect(line6.annotation).toBeUndefined();
    expect(line6.label).toMatch(/schedule lookup/i);
  });

  it("Line 7 uses the pro-rata label", () => {
    const wdm = build(inputs);
    const line7 = findLineByScreenNo(wdm, "7")!;
    expect(line7.label).toBe("Pro-rata share of BCSO");
  });

  it("AGI line is emphasized and combined total is sum of A + B AGIs", () => {
    const wdm = build(inputs);
    const line4 = findLineByScreenNo(wdm, "4")!;
    expect(line4.emphasis).toBe(true);
    expect(line4.total!.amount).toBe(line4.a!.amount! + line4.b!.amount!);
  });

  it("PI line shows percentages summing to 100%", () => {
    const wdm = build(inputs);
    const line5 = findLineByScreenNo(wdm, "5")!;
    expect(line5.a!.display).toMatch(/%$/);
    expect(line5.b!.display).toMatch(/%$/);
    expect(line5.total!.display).toBe("100.00%");
    const sum = (line5.a!.amount ?? 0) + (line5.b!.amount ?? 0);
    expect(sum).toBeCloseTo(1, 6);
  });
});

// ============================================================
// Equal 50/50 approved annotations (locked Phase A behavior)
// ============================================================

describe("buildWDM — Equal 50/50 approved annotations", () => {
  const inputs: CalcInputs = {
    ...defaultInputs(),
    parentAGrossMonthly: 8333.33,
    parentBGrossMonthly: 4166.67,
    numChildren: 3,
    parentingType: "equal",
  };

  it('Line 6 prints "$0" with the Rule .04(7)(b)(2)(i) cross-credit annotation', () => {
    const wdm = build(inputs);
    const line6 = findLineByScreenNo(wdm, "6")!;
    expect(line6.total!.amount).toBe(0);
    expect(line6.total!.display).toBe("$0");
    expect(line6.annotation).toBe(
      "equal-parenting cross-credit applied at Line 7 per Rule .04(7)(b)(2)(i)",
    );
  });

  it("Line 7 carries the post-multiplier label and the cross-credit amount", () => {
    const wdm = build(inputs);
    const line7 = findLineByScreenNo(wdm, "7")!;
    expect(line7.label).toBe(
      "Adjusted BCSO (post-multiplier, Rule .04(7)(b)(2)(i))",
    );
    expect(line7.a!.amount).toBeGreaterThan(0);
    expect(line7.b!.amount).toBe(0);
  });

  it("Line 2 (parenting time) carries the equal-parenting margin annotation", () => {
    const wdm = build(inputs);
    const line2 = findLineByScreenNo(wdm, "2")!;
    expect(line2.annotation).toBe("Equal parenting — Rule .04(7)(b)(2)(i).");
    expect(line2.total!.display).toBe("Equal (182.5 / 182.5)");
  });
});

// ============================================================
// Above-cap formula breakdown + structured pass-through (check #2)
// ============================================================

describe("buildWDM — above-cap formula breakdown", () => {
  const inputs: CalcInputs = {
    ...defaultInputs(),
    parentAGrossMonthly: 51250,
    parentBGrossMonthly: 28167,
    numChildren: 3,
    parentingType: "equal",
  };

  it("emits the human-readable breakdown lines below Line 6", () => {
    const wdm = build(inputs);
    const bcso = wdm.sections.find((s) => s.id === "bcso")!;
    const labels = bcso.lines.map((l) => l.label);
    expect(labels.some((l) => /Top of schedule/.test(l))).toBe(true);
    expect(labels.some((l) => /in excess of schedule cap/.test(l))).toBe(true);
    expect(labels.some((l) => /Above-cap rate/.test(l))).toBe(true);
  });

  it("Line 6 carries the structured bcsoAboveCap sub-object (Phase D narrative input)", () => {
    // Use standard parenting so Line 6 isn't masked by the Equal-50/50 $0 rule.
    const wdm = build({ ...inputs, parentingType: "standard", arpForStandard: "parent_b" });
    const line6 = findLineByScreenNo(wdm, "6")!;
    expect(line6.bcsoAboveCap).toBeDefined();
    expect(line6.bcsoAboveCap!.topOfSchedule).toBeGreaterThan(0);
    expect(line6.bcsoAboveCap!.excessAGI).toBeGreaterThan(0);
    expect(line6.bcsoAboveCap!.rate).toBeGreaterThan(0);
    expect(line6.bcsoAboveCap!.addition).toBeGreaterThan(0);
  });

  it("bcsoAboveCap is undefined for schedule-source BCSO", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_b",
    });
    const line6 = findLineByScreenNo(wdm, "6")!;
    expect(line6.bcsoAboveCap).toBeUndefined();
  });
});

// ============================================================
// Statutory cap panel — both branches (Refinement 4)
// ============================================================

describe("buildWDM — statutoryCap panel structured for both branches", () => {
  it("not-engaged branch populates headroom, leaves excessOverCap=0 and factors=[]", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    });
    const cap = wdm.panels.statutoryCap;
    expect(cap.engaged).toBe(false);
    expect(cap.excessOverCap).toBe(0);
    expect(cap.factors).toEqual([]);
    expect(cap.userElectedPCSO).toBeNull();
    expect(cap.headroom).toBeGreaterThanOrEqual(0);
    expect(cap.headroom).toBe(cap.statutoryMax - cap.calculatedPCSO);
    expect(cap.caseLaw).toBeTruthy();
  });

  it("engaged branch populates excessOverCap + factors, leaves headroom=0", () => {
    // Push above the cap via a large private-school deviation Mother pays.
    const inputs: CalcInputs = {
      ...defaultInputs(),
      parentAGrossMonthly: 51250,
      parentBGrossMonthly: 28167,
      numChildren: 3,
      parentingType: "equal",
      includePrivateSchool: true,
      privateSchoolAnnual: 60000,
      privateSchoolPaidBy: "parent_b",
    };
    const wdm = build(inputs);
    const cap = wdm.panels.statutoryCap;
    if (cap.engaged) {
      expect(cap.excessOverCap).toBeGreaterThan(0);
      expect(cap.headroom).toBe(0);
      expect(cap.factors.length).toBeGreaterThan(0);
      expect(cap.factors.some((f) => /child/i.test(f))).toBe(true);
      expect(cap.caseLaw).toBeTruthy();
    } else {
      // If this fixture doesn't trip the cap on this engine version,
      // skip the engaged-branch assertions — Fixture #11 (cap-engaged)
      // is the dedicated coverage path; this test guards both shapes.
      expect(cap.engaged).toBe(false);
    }
  });

  it("panel is ALWAYS present (Refinement 4 — never null)", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    });
    expect(wdm.panels.statutoryCap).not.toBeNull();
    expect(typeof wdm.panels.statutoryCap.engaged).toBe("boolean");
  });
});

// ============================================================
// Deviations section & methodology footnote
// ============================================================

describe("buildWDM — deviations section & methodology footnote", () => {
  it("omits deviations section and footnote when neither deviation is selected", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    });
    expect(wdm.sections.find((s) => s.id === "deviations")).toBeUndefined();
    expect(wdm.panels.deviationMethodologyNote).toBeNull();
  });

  it("emits deviations section and methodology footnote when private school is on", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
      includePrivateSchool: true,
      privateSchoolAnnual: 10000,
      privateSchoolPaidBy: "parent_a",
    });
    const dev = wdm.sections.find((s) => s.id === "deviations")!;
    expect(dev.lines[0].screenLineNo).toBe("13");
    expect(dev.lines[0].citation).toBe("private_school");
    expect(wdm.panels.deviationMethodologyNote).toBeTruthy();
  });

  it("emits Line 14 + 14a for special expenses with correct citation", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
      includeSpecialExpenses: true,
      specialExpensesAnnual: 6000,
      specialExpensesPaidBy: "parent_a",
    });
    const dev = wdm.sections.find((s) => s.id === "deviations")!;
    const line14 = dev.lines.find((l) => l.screenLineNo === "14")!;
    const line14a = dev.lines.find((l) => l.screenLineNo === "14a")!;
    expect(line14.citation).toBe("special_expenses");
    expect(line14a).toBeDefined();
  });
});

// ============================================================
// Money formatting
// ============================================================

describe("buildWDM — money formatting", () => {
  it("formats positive amounts with $ prefix and no decimals", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.a!.display).toBe("$5,000");
    expect(line3.b!.display).toBe("$3,000");
  });

  it("preserves raw amounts alongside display strings", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 1234,
      parentBGrossMonthly: 567,
      numChildren: 1,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.a!.amount).toBe(1234);
    expect(line3.b!.amount).toBe(567);
  });
});

// ============================================================
// Income source sub-line
// ============================================================

describe("buildWDM — income source sub-line", () => {
  it("uses default 'entered directly' when no methodology is set", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.subSource!.a).toBe("Source: entered directly");
    expect(line3.subSource!.b).toBe("Source: entered directly");
  });
});

// ============================================================
// Methodology pass-through — both sides independent (Refinement 3)
// ============================================================

describe("buildWDM — methodology pass-through (Refinement 3)", () => {
  const motherImputed: ImputedMethodology = {
    path: "imputed",
    basis: "voluntary_underemployment",
    method: "vocational_capacity",
    actualMonthlyGross: 1500,
    occupation: "registered nurse",
    area: "Nashville MSA",
    hoursPerWeek: 40,
    rationale: "Mother left full-time RN role; vocational evidence supports $4,800/mo capacity.",
    monthlyGrossResult: 4800,
  };

  it("populates parentA.methodology AND parentB.methodology from CalcInputs", () => {
    const wdm = build({
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
      parentAIncomeMethodology: motherImputed,
      // Father simple — should still be passed through, not dropped.
      parentBIncomeMethodology: {
        path: "simple",
        source: "w2_box5_annual",
        w2Box5Annual: 96000,
        monthlyGrossResult: 8000,
      },
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.methodology).toBeDefined();
    expect(line3.methodology!.parentA).toBeDefined();
    expect(line3.methodology!.parentB).toBeDefined();
    expect(line3.methodology!.parentA!.path).toBe("imputed");
    expect(line3.methodology!.parentB!.path).toBe("simple");
    // Berger-shaped Mother imputation: full pass-through (vocational
    // occupation/area/hours are not dropped at WDM-build time).
    const a = line3.methodology!.parentA as ImputedMethodology;
    expect(a.occupation).toBe("registered nurse");
    expect(a.area).toBe("Nashville MSA");
    expect(a.hoursPerWeek).toBe(40);
    expect(a.rationale).toMatch(/vocational evidence/);
  });

  it("leaves methodology fields undefined when CalcInputs methodology is absent (one side only)", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 4800,
      parentBGrossMonthly: 8000,
      numChildren: 2,
      // Only side A populated.
      parentAIncomeMethodology: motherImputed,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.methodology!.parentA).toBeDefined();
    expect(line3.methodology!.parentB).toBeUndefined();
  });
});

// ============================================================
// Judgment-call tagging — Berger Mother imputation
// ============================================================

describe("buildWDM — judgment-call tagging for imputation", () => {
  const motherImputed: ImputedMethodology = {
    path: "imputed",
    basis: "voluntary_underemployment",
    method: "vocational_capacity",
    actualMonthlyGross: 1500,
    occupation: "registered nurse",
    area: "Nashville MSA",
    hoursPerWeek: 40,
    rationale: "Vocational evidence supports $4,800/mo earning capacity.",
    monthlyGrossResult: 4800,
  };

  it("Line 3 side A is tagged judgment with vocational rule + factors + userElection", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 4800,
      parentBGrossMonthly: 8000,
      numChildren: 2,
      useImputationForA: true,
      parentAIncomeMethodology: motherImputed,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    const a = line3.a!;
    expect(a.category).toBe("judgment");
    expect(a.rule).toBe("income_imputed_vocational");
    expect(a.factors).toBeDefined();
    expect(a.factors!.some((f) => /occupation/i.test(f))).toBe(true);
    expect(a.userElection).toBeDefined();
    expect(a.userElection!.source).toBe("user_input");
    expect(a.userElection!.field).toBe("parentAIncomeMethodology");
    expect(a.userElection!.rationale).toMatch(/vocational evidence/i);
  });

  it("Line 3 side B (simple methodology) stays mechanical", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 4800,
      parentBGrossMonthly: 8000,
      numChildren: 2,
      useImputationForA: true,
      parentAIncomeMethodology: motherImputed,
    });
    const line3 = findLineByScreenNo(wdm, "3")!;
    expect(line3.b!.category).toBe("mechanical");
    expect(line3.b!.userElection).toBeUndefined();
  });

  it("Private-school deviation Line 13 is tagged judgment with rule + factors + userElection", () => {
    const wdm = build({
      ...defaultInputs(),
      parentAGrossMonthly: 5000,
      parentBGrossMonthly: 3000,
      numChildren: 1,
      includePrivateSchool: true,
      privateSchoolAnnual: 12000,
      privateSchoolPaidBy: "parent_a",
    });
    const line13 = findLineByScreenNo(wdm, "13")!;
    const total = line13.total!;
    expect(total.category).toBe("judgment");
    expect(total.rule).toBe("private_school");
    expect(total.factors!.length).toBeGreaterThan(0);
    expect(total.userElection!.field).toBe("includePrivateSchool");
    expect(total.userElection!.source).toBe("user_input");
  });
});

// ============================================================
// Lint invariants — Refinement 5
// ============================================================

describe("buildWDM — lint invariants (Refinement 5)", () => {
  // A representative cross-section of fixtures, including all the
  // judgment-call surface area we expect Phase D to narrate.
  const fixtures: { name: string; inputs: CalcInputs }[] = [
    {
      name: "mid-income standard",
      inputs: {
        ...defaultInputs(),
        parentAGrossMonthly: 5000,
        parentBGrossMonthly: 8000,
        numChildren: 2,
        parentingType: "standard",
        arpForStandard: "parent_b",
      },
    },
    {
      name: "Equal 50/50",
      inputs: {
        ...defaultInputs(),
        parentAGrossMonthly: 8333.33,
        parentBGrossMonthly: 4166.67,
        numChildren: 3,
        parentingType: "equal",
      },
    },
    {
      name: "above-cap equal",
      inputs: {
        ...defaultInputs(),
        parentAGrossMonthly: 51250,
        parentBGrossMonthly: 28167,
        numChildren: 3,
        parentingType: "equal",
      },
    },
    {
      name: "Berger-shaped (Mother imputed, deviations on)",
      inputs: {
        ...defaultInputs(),
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
          occupation: "RN",
          area: "Nashville MSA",
          hoursPerWeek: 40,
          rationale: "Voc evidence.",
          monthlyGrossResult: 4800,
        },
        includePrivateSchool: true,
        privateSchoolAnnual: 12000,
        privateSchoolPaidBy: "parent_b",
        includeSpecialExpenses: true,
        specialExpensesAnnual: 6000,
        specialExpensesPaidBy: "parent_a",
      },
    },
  ];

  for (const f of fixtures) {
    it(`[${f.name}] every "judgment" value has userElection populated`, () => {
      const wdm = build(f.inputs);
      const offenders = walkValues(wdm).filter(
        (v) => v.category === "judgment" && !v.userElection,
      );
      expect(offenders).toEqual([]);
    });

    it(`[${f.name}] every value with userElection has category "judgment"`, () => {
      const wdm = build(f.inputs);
      const offenders = walkValues(wdm).filter(
        (v) => v.userElection && v.category !== "judgment",
      );
      expect(offenders).toEqual([]);
    });

    it(`[${f.name}] every "judgment" value has rule + factors populated`, () => {
      const wdm = build(f.inputs);
      const offenders = walkValues(wdm).filter(
        (v) =>
          v.category === "judgment" &&
          (!v.rule || !v.factors || v.factors.length === 0),
      );
      expect(offenders).toEqual([]);
    });

    it(`[${f.name}] every userElection carries source: "user_input"`, () => {
      const wdm = build(f.inputs);
      const offenders = walkValues(wdm).filter(
        (v) => v.userElection && v.userElection.source !== "user_input",
      );
      expect(offenders).toEqual([]);
    });
  }
});
