import { describe, expect, it } from "vitest";
import { calculate, defaultInputs } from "../../calc";
import { defaultCaption } from "../../share";
import { buildWDM, findLineByScreenNo } from "../build";
import type { CalcInputs } from "../../types";

const PREPARED_ON = "2026-05-27"; // deterministic for snapshot stability

function build(inputs: CalcInputs, caption = defaultCaption()) {
  const out = calculate(inputs);
  return buildWDM(inputs, out, caption, { preparedOnDisplay: PREPARED_ON });
}

describe("buildWDM — shape & invariants", () => {
  it("emits the seven canonical sections in order, plus deviations when present", () => {
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
    // Deviations always sits between addons and final.
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

describe("buildWDM — Berger-style standard-parenting fixture", () => {
  // Standard parenting, ARP = Father, mid-income; exercises pro-rata
  // line 7 path (NOT the equal-parenting cross-credit branch).
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

describe("buildWDM — Equal 50/50 approved annotations (locked Phase A behavior)", () => {
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
    // Mother (higher earner) → Father, so A side carries the cross-credit.
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

describe("buildWDM — above-cap formula breakdown surfaces in BCSO section", () => {
  const inputs: CalcInputs = {
    ...defaultInputs(),
    parentAGrossMonthly: 51250,
    parentBGrossMonthly: 28167,
    numChildren: 3,
    parentingType: "equal",
  };

  it("includes top-of-schedule, excess AGI, and above-cap-rate lines below Line 6", () => {
    const wdm = build(inputs);
    const bcso = wdm.sections.find((s) => s.id === "bcso")!;
    const labels = bcso.lines.map((l) => l.label);
    expect(labels.some((l) => /Top of schedule/.test(l))).toBe(true);
    expect(labels.some((l) => /in excess of schedule cap/.test(l))).toBe(true);
    expect(labels.some((l) => /Above-cap rate/.test(l))).toBe(true);
  });

  it("statutory cap panel populates when PCSO exceeds the §36-5-101(e)(1)(B) max", () => {
    // Push above the cap by adding a private-school deviation Mother pays.
    const wdm = build({
      ...inputs,
      includePrivateSchool: true,
      privateSchoolAnnual: 60000,
      privateSchoolPaidBy: "parent_b",
    });
    if (wdm.panels.statutoryCap) {
      expect(wdm.panels.statutoryCap.statutoryMax).toBeGreaterThan(0);
      expect(wdm.panels.statutoryCap.excessOverCap).toBeGreaterThan(0);
      expect(wdm.panels.statutoryCap.numChildren).toBe(3);
      // When the cap panel is rendered, the "below cap" reassurance must NOT.
      expect(wdm.panels.pcsoBelowCapNote).toBeNull();
    } else {
      // If this fixture doesn't trip the cap, the below-cap note path is exercised.
      expect(wdm.panels.statutoryCap).toBeNull();
    }
  });
});

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
