/**
 * AOC Child Support Worksheet — Field Map (fillable AcroForm edition)
 *
 * Single source of truth for "what value goes into which AcroForm field"
 * on the v2 fillable template at
 * `src/lib/pdf/assets/tn-cs-worksheet-fillable.pdf`.
 *
 * Two field kinds:
 *   - "text"   : source returns the string value (null = leave blank).
 *                AcroForm /Tx multiline fields handle their own wrapping
 *                from /V; the renderer does not measure or wrap.
 *   - "choice" : radio-group / button field. Source returns the chosen
 *                option name (e.g. "N", "Y", "PRP", "ARP", "SPLIT") or
 *                null to leave the group unselected.
 *
 * Reviewers can audit every cell mapping without reading pdf-lib code.
 * The renderer (`overlay-renderer.ts`) is a pure pipeline: walk this
 * list, call the source, call form.getTextField/getRadioGroup, set
 * the value, flatten.
 *
 * Note on WDM ↔ AOC line numbering: the WDM uses screen-worksheet line
 * numbers (gross=3, AGI=4, PI=5, BCSO=6, Adjusted BCSO=7). AOC numbers
 * (gross=1, AGI=2, PI=3, BCSO=4, Adjusted BCSO=7) differ. The
 * translation lives only here — the WDM stays display-agnostic per
 * the Phase A v2.1 decision (option (i)).
 */

import type { CalcInputs, CalcOutputs } from "../calc/types";
import type { WDM } from "../calc/wdm/types";
import { findLineByScreenNo } from "../calc/wdm/build";
import { flattenForCommentsBriefAOC } from "../calc/deviations-narrative";

export type FieldKind = "text" | "choice";

export type FieldSource = (
  wdm: WDM,
  inputs: CalcInputs,
  outputs: CalcOutputs,
) => string | null;

export interface AocField {
  /** AcroForm field name in the v2 fillable template. */
  fieldName: string;
  kind: FieldKind;
  /** AOC line label for audits/logs. Empty for non-numbered fields. */
  aocLine: string;
  description: string;
  source: FieldSource;
}

// -------------------------------------------------------------------
// helpers
// -------------------------------------------------------------------

const fmtMoney = (n: number): string => {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `(${s})` : s;
};
const fmtPct = (frac: number): string => `${(frac * 100).toFixed(2)}`;

/** PRP = primary residential parent (the parent the child resides with most). */
const prpIs = (outputs: CalcOutputs): "parent_a" | "parent_b" | "equal" => {
  if (outputs.arpIdentity === "equal") return "equal";
  return outputs.arpIdentity === "parent_a" ? "parent_b" : "parent_a";
};

/** Gross contribution split per parent for an add-on cell. */
const lineAaSplit = (
  outputs: CalcOutputs,
  paidBy: "parent_a" | "parent_b" | "split_pro_rata",
  totalMonthly: number,
): { a: number; b: number } => {
  if (paidBy === "parent_a") return { a: totalMonthly, b: 0 };
  if (paidBy === "parent_b") return { a: 0, b: totalMonthly };
  return {
    a: totalMonthly * outputs.piA,
    b: totalMonthly * outputs.piB,
  };
};

/** Resolve the active PRP/ARP/SPLIT export value for a given parent. */
const partyStatus = (
  side: { prp: boolean; arp: boolean; split: boolean },
): string | null => {
  if (side.prp) return "PRP";
  if (side.arp) return "ARP";
  if (side.split) return "SPLIT";
  return null;
};

// -------------------------------------------------------------------
// Identification (Part I) — page 1
// -------------------------------------------------------------------

const identification: AocField[] = [
  {
    fieldName: "name_mother",
    kind: "text",
    aocLine: "",
    description: "Name of Mother (Parent A label)",
    source: (_w, inputs) => inputs.parentALabel || null,
  },
  {
    fieldName: "name_father",
    kind: "text",
    aocLine: "",
    description: "Name of Father (Parent B label)",
    source: (_w, inputs) => inputs.parentBLabel || null,
  },
  {
    fieldName: "name_caretaker",
    kind: "text",
    aocLine: "",
    description: "Name of Caretaker (not modeled)",
    source: () => null,
  },
  {
    fieldName: "tcses_case",
    kind: "text",
    aocLine: "",
    description: "TCSES case number",
    source: (wdm) => wdm.caption.docketNumber || null,
  },
  {
    fieldName: "docket_no",
    kind: "text",
    aocLine: "",
    description: "Docket number",
    source: (wdm) => wdm.caption.docketNumber || null,
  },
  {
    fieldName: "court_name",
    kind: "text",
    aocLine: "",
    description: "Court name",
    source: (wdm) => wdm.caption.court || null,
  },
  // PRP/ARP/SPLIT radio groups (one per party column).
  // Equal parenting → all three unselected; the equal_parenting_annotation
  // field below carries the Rule .04(7)(b)(2)(i) explainer.
  {
    fieldName: "party_status_mother",
    kind: "choice",
    aocLine: "",
    description: "Party status — Mother (PRP/ARP/SPLIT)",
    source: (wdm) => partyStatus(wdm.panels.parentRoleCheckboxes.parentA),
  },
  {
    fieldName: "party_status_father",
    kind: "choice",
    aocLine: "",
    description: "Party status — Father (PRP/ARP/SPLIT)",
    source: (wdm) => partyStatus(wdm.panels.parentRoleCheckboxes.parentB),
  },
  {
    fieldName: "party_status_caretaker",
    kind: "choice",
    aocLine: "",
    description: "Party status — Caretaker (not modeled)",
    source: () => null,
  },
  // Equal-50/50 margin note — sits in the empty band below Line 7 /
  // above Part IV, only renders when Equal parenting applies.
  {
    fieldName: "equal_parenting_annotation",
    kind: "text",
    aocLine: "",
    description: "Margin note: Equal parenting (Rule .04(7)(b)(2)(i))",
    source: (wdm) => {
      // AOC boundary: numbers + structural cells only — no rule cites.
      // Pointer to annotated worksheet is permitted (not a citation).
      const note = wdm.panels.parentRoleCheckboxes.marginNote;
      return note ? `↑ Equal parenting — see annotated worksheet.` : null;
    },
  },
];

// Children rows 1..6 — the calc engine does not model per-child name/DOB
// or per-child day counts, so all 30 fields stay null and the AcroForm
// cells render blank. The form remains hand-fillable for these rows.
const childRows: AocField[] = [];
for (let i = 1; i <= 6; i += 1) {
  childRows.push(
    {
      fieldName: `child_name_${i}`,
      kind: "text",
      aocLine: "",
      description: `Child #${i} name (not modeled)`,
      source: () => null,
    },
    {
      fieldName: `child_dob_${i}`,
      kind: "text",
      aocLine: "",
      description: `Child #${i} DOB (not modeled)`,
      source: () => null,
    },
    {
      fieldName: `days_mother_${i}`,
      kind: "text",
      aocLine: "",
      description: `Child #${i} days with mother (not modeled)`,
      source: () => null,
    },
    {
      fieldName: `days_father_${i}`,
      kind: "text",
      aocLine: "",
      description: `Child #${i} days with father (not modeled)`,
      source: () => null,
    },
    {
      fieldName: `days_caretaker_${i}`,
      kind: "text",
      aocLine: "",
      description: `Child #${i} days with caretaker (not modeled)`,
      source: () => null,
    },
  );
}

// -------------------------------------------------------------------
// Part II — Adjusted Gross Income (page 1)
// -------------------------------------------------------------------

const partII: AocField[] = [
  // 1 Monthly Gross Income
  {
    fieldName: "monthly_gross_mother",
    kind: "text",
    aocLine: "1",
    description: "Monthly Gross Income — Mother",
    source: (_w, inputs) => fmtMoney(inputs.parentAGrossMonthly),
  },
  {
    fieldName: "monthly_gross_father",
    kind: "text",
    aocLine: "1",
    description: "Monthly Gross Income — Father",
    source: (_w, inputs) => fmtMoney(inputs.parentBGrossMonthly),
  },
  // 1a Federal benefit for child
  {
    fieldName: "federal_benefit_mother",
    kind: "text",
    aocLine: "1a",
    description: "Federal benefit for child — Mother",
    source: (_w, inputs) =>
      inputs.parentAFederalBenefit > 0
        ? fmtMoney(inputs.parentAFederalBenefit)
        : null,
  },
  {
    fieldName: "federal_benefit_father",
    kind: "text",
    aocLine: "1a",
    description: "Federal benefit for child — Father",
    source: (_w, inputs) =>
      inputs.parentBFederalBenefit > 0
        ? fmtMoney(inputs.parentBFederalBenefit)
        : null,
  },
  // 1b Self-employment tax credit
  {
    fieldName: "self_employ_tax_mother",
    kind: "text",
    aocLine: "1b",
    description: "Self-employment tax credit — Mother",
    source: (_w, inputs) =>
      inputs.parentASECredit > 0 ? fmtMoney(inputs.parentASECredit) : null,
  },
  {
    fieldName: "self_employ_tax_father",
    kind: "text",
    aocLine: "1b",
    description: "Self-employment tax credit — Father",
    source: (_w, inputs) =>
      inputs.parentBSECredit > 0 ? fmtMoney(inputs.parentBSECredit) : null,
  },
  // 1c Subtotal (1 + 1a - 1b)
  {
    fieldName: "subtotal_1c_mother",
    kind: "text",
    aocLine: "1c",
    description: "Subtotal — Mother",
    source: (_w, inputs) =>
      fmtMoney(
        inputs.parentAGrossMonthly +
          inputs.parentAFederalBenefit -
          inputs.parentASECredit,
      ),
  },
  {
    fieldName: "subtotal_1c_father",
    kind: "text",
    aocLine: "1c",
    description: "Subtotal — Father",
    source: (_w, inputs) =>
      fmtMoney(
        inputs.parentBGrossMonthly +
          inputs.parentBFederalBenefit -
          inputs.parentBSECredit,
      ),
  },
  // 1d Credit for In-Home Children
  {
    fieldName: "credit_inhome_mother",
    kind: "text",
    aocLine: "1d",
    description: "Credit for In-Home Children — Mother",
    source: (_w, inputs) =>
      inputs.parentAInhomeCredit > 0
        ? fmtMoney(inputs.parentAInhomeCredit)
        : null,
  },
  {
    fieldName: "credit_inhome_father",
    kind: "text",
    aocLine: "1d",
    description: "Credit for In-Home Children — Father",
    source: (_w, inputs) =>
      inputs.parentBInhomeCredit > 0
        ? fmtMoney(inputs.parentBInhomeCredit)
        : null,
  },
  // 1e Credit for Not In Home Children
  {
    fieldName: "credit_notinhome_mother",
    kind: "text",
    aocLine: "1e",
    description: "Credit for Not In Home Children — Mother",
    source: (_w, inputs) =>
      inputs.parentAPriorSupport > 0
        ? fmtMoney(inputs.parentAPriorSupport)
        : null,
  },
  {
    fieldName: "credit_notinhome_father",
    kind: "text",
    aocLine: "1e",
    description: "Credit for Not In Home Children — Father",
    source: (_w, inputs) =>
      inputs.parentBPriorSupport > 0
        ? fmtMoney(inputs.parentBPriorSupport)
        : null,
  },
  // 2 AGI
  {
    fieldName: "agi_2_mother",
    kind: "text",
    aocLine: "2",
    description: "AGI — Mother",
    source: (_w, _i, o) => fmtMoney(o.parentAAGI),
  },
  {
    fieldName: "agi_2_father",
    kind: "text",
    aocLine: "2",
    description: "AGI — Father",
    source: (_w, _i, o) => fmtMoney(o.parentBAGI),
  },
  // 2a Combined AGI
  {
    fieldName: "combined_agi",
    kind: "text",
    aocLine: "2a",
    description: "Combined AGI",
    source: (_w, _i, o) => fmtMoney(o.combinedAGI),
  },
  // 3 PI %
  {
    fieldName: "pi_mother",
    kind: "text",
    aocLine: "3",
    description: "PI % — Mother",
    source: (_w, _i, o) => fmtPct(o.piA),
  },
  {
    fieldName: "pi_father",
    kind: "text",
    aocLine: "3",
    description: "PI % — Father",
    source: (_w, _i, o) => fmtPct(o.piB),
  },
];

// -------------------------------------------------------------------
// Part III — Parents' Share of BCSO (page 1)
// -------------------------------------------------------------------

const partIII: AocField[] = [
  // 4 BCSO allotted to PRP's household. Equal 50/50: populate both
  // columns (cross-credit per Rule .04(7)(b)(2)(i)).
  {
    fieldName: "bcso_household_4_mother",
    kind: "text",
    aocLine: "4",
    description: "BCSO allotted to PRP — Mother col",
    source: (_w, _i, o) => {
      const prp = prpIs(o);
      if (prp === "parent_a" || prp === "equal") return fmtMoney(o.bcso);
      return null;
    },
  },
  {
    fieldName: "bcso_household_4_father",
    kind: "text",
    aocLine: "4",
    description: "BCSO allotted to PRP — Father col",
    source: (_w, _i, o) => {
      const prp = prpIs(o);
      if (prp === "parent_b" || prp === "equal") return fmtMoney(o.bcso);
      return null;
    },
  },
  {
    fieldName: "bcso_household_4_caretaker",
    kind: "text",
    aocLine: "4",
    description: "BCSO allotted to PRP — Caretaker col (not modeled)",
    source: () => null,
  },
  // 4a Each parent's pro-rata share of BCSO
  {
    fieldName: "bcso_share_4a_mother",
    kind: "text",
    aocLine: "4a",
    description: "BCSO pro-rata share — Mother",
    source: (_w, _i, o) =>
      o.parentABcsoShare > 0 ? fmtMoney(o.parentABcsoShare) : null,
  },
  {
    fieldName: "bcso_share_4a_father",
    kind: "text",
    aocLine: "4a",
    description: "BCSO pro-rata share — Father",
    source: (_w, _i, o) =>
      o.parentBBcsoShare > 0 ? fmtMoney(o.parentBBcsoShare) : null,
  },
  // 5 ARP avg parenting time (days). Equal 50/50 → blank (margin note).
  {
    fieldName: "arp_avg_time_5_mother",
    kind: "text",
    aocLine: "5",
    description: "ARP avg parenting time — Mother col",
    source: (_w, inputs, o) => {
      if (o.arpIdentity !== "parent_a") return null;
      if (inputs.parentingType === "standard") return "80";
      if (inputs.parentingType === "custom")
        return String(inputs.parentADays ?? "");
      return null;
    },
  },
  {
    fieldName: "arp_avg_time_5_father",
    kind: "text",
    aocLine: "5",
    description: "ARP avg parenting time — Father col",
    source: (_w, inputs, o) => {
      if (o.arpIdentity !== "parent_b") return null;
      if (inputs.parentingType === "standard") return "80";
      if (inputs.parentingType === "custom")
        return String(inputs.parentBDays ?? "");
      return null;
    },
  },
  // 6 Parenting time adjustment. Equal → "0"; variable multiplier →
  // BCSO × (1 − multiplier) on the ARP side.
  {
    fieldName: "parenting_adj_6_mother",
    kind: "text",
    aocLine: "6",
    description: "Parenting time adjustment — Mother",
    source: (_w, _inputs, o) => {
      if (o.parentingTimeBand === "equal") return "0";
      if (o.variableMultiplier !== null && o.arpIdentity === "parent_a") {
        const adj = o.parentABcsoShare * (1 - o.variableMultiplier);
        return adj > 0 ? fmtMoney(adj) : null;
      }
      return null;
    },
  },
  {
    fieldName: "parenting_adj_6_father",
    kind: "text",
    aocLine: "6",
    description: "Parenting time adjustment — Father",
    source: (_w, _inputs, o) => {
      if (o.parentingTimeBand === "equal") return "0";
      if (o.variableMultiplier !== null && o.arpIdentity === "parent_b") {
        const adj = o.parentBBcsoShare * (1 - o.variableMultiplier);
        return adj > 0 ? fmtMoney(adj) : null;
      }
      return null;
    },
  },
  // 7 Adjusted BCSO (from WDM line 7)
  {
    fieldName: "adjusted_bcso_7_mother",
    kind: "text",
    aocLine: "7",
    description: "Adjusted BCSO — Mother",
    source: (wdm) => {
      const ln = findLineByScreenNo(wdm, "7");
      return ln?.a?.amount != null && ln.a.amount > 0
        ? fmtMoney(ln.a.amount)
        : null;
    },
  },
  {
    fieldName: "adjusted_bcso_7_father",
    kind: "text",
    aocLine: "7",
    description: "Adjusted BCSO — Father",
    source: (wdm) => {
      const ln = findLineByScreenNo(wdm, "7");
      return ln?.b?.amount != null && ln.b.amount > 0
        ? fmtMoney(ln.b.amount)
        : null;
    },
  },
];

// -------------------------------------------------------------------
// Part IV — Additional Expenses (page 2)
// -------------------------------------------------------------------

const partIV: AocField[] = [
  // 8a Health insurance
  {
    fieldName: "health_insurance_8a_mother",
    kind: "text",
    aocLine: "8a",
    description: "Health insurance — Mother",
    source: (_w, inputs, o) => {
      const { a } = lineAaSplit(
        o,
        inputs.healthPaidBy,
        inputs.healthPremiumMonthly,
      );
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    fieldName: "health_insurance_8a_father",
    kind: "text",
    aocLine: "8a",
    description: "Health insurance — Father",
    source: (_w, inputs, o) => {
      const { b } = lineAaSplit(
        o,
        inputs.healthPaidBy,
        inputs.healthPremiumMonthly,
      );
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  {
    fieldName: "health_insurance_8a_caretaker",
    kind: "text",
    aocLine: "8a",
    description: "Health insurance — Caretaker (not modeled)",
    source: () => null,
  },
  // 8b Recurring uninsured medical
  {
    fieldName: "uninsured_medical_8b_mother",
    kind: "text",
    aocLine: "8b",
    description: "Uninsured medical — Mother",
    source: (_w, inputs, o) => {
      if (inputs.uninsuredMedicalMonthly <= 0) return null;
      const { a } = lineAaSplit(
        o,
        inputs.uninsuredMedicalPaidBy === "split_pro_rata"
          ? "split_pro_rata"
          : inputs.uninsuredMedicalPaidBy,
        inputs.uninsuredMedicalMonthly,
      );
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    fieldName: "uninsured_medical_8b_father",
    kind: "text",
    aocLine: "8b",
    description: "Uninsured medical — Father",
    source: (_w, inputs, o) => {
      if (inputs.uninsuredMedicalMonthly <= 0) return null;
      const { b } = lineAaSplit(
        o,
        inputs.uninsuredMedicalPaidBy === "split_pro_rata"
          ? "split_pro_rata"
          : inputs.uninsuredMedicalPaidBy,
        inputs.uninsuredMedicalMonthly,
      );
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  {
    fieldName: "uninsured_medical_8b_caretaker",
    kind: "text",
    aocLine: "8b",
    description: "Uninsured medical — Caretaker (not modeled)",
    source: () => null,
  },
  // 8c Work-related childcare
  {
    fieldName: "childcare_8c_mother",
    kind: "text",
    aocLine: "8c",
    description: "Childcare — Mother",
    source: (_w, inputs, o) => {
      const { a } = lineAaSplit(
        o,
        inputs.childcarePaidBy,
        inputs.childcareMonthly,
      );
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    fieldName: "childcare_8c_father",
    kind: "text",
    aocLine: "8c",
    description: "Childcare — Father",
    source: (_w, inputs, o) => {
      const { b } = lineAaSplit(
        o,
        inputs.childcarePaidBy,
        inputs.childcareMonthly,
      );
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  {
    fieldName: "childcare_8c_caretaker",
    kind: "text",
    aocLine: "8c",
    description: "Childcare — Caretaker (not modeled)",
    source: () => null,
  },
  // 9 Total additional expenses
  {
    fieldName: "total_expenses_9_mother",
    kind: "text",
    aocLine: "9",
    description: "Total expenses — Mother",
    source: (_w, inputs, o) => {
      const h = lineAaSplit(
        o,
        inputs.healthPaidBy,
        inputs.healthPremiumMonthly,
      ).a;
      const m =
        inputs.uninsuredMedicalMonthly > 0
          ? lineAaSplit(
              o,
              inputs.uninsuredMedicalPaidBy === "split_pro_rata"
                ? "split_pro_rata"
                : inputs.uninsuredMedicalPaidBy,
              inputs.uninsuredMedicalMonthly,
            ).a
          : 0;
      const c = lineAaSplit(
        o,
        inputs.childcarePaidBy,
        inputs.childcareMonthly,
      ).a;
      const t = h + m + c;
      return t > 0 ? fmtMoney(t) : null;
    },
  },
  {
    fieldName: "total_expenses_9_father",
    kind: "text",
    aocLine: "9",
    description: "Total expenses — Father",
    source: (_w, inputs, o) => {
      const h = lineAaSplit(
        o,
        inputs.healthPaidBy,
        inputs.healthPremiumMonthly,
      ).b;
      const m =
        inputs.uninsuredMedicalMonthly > 0
          ? lineAaSplit(
              o,
              inputs.uninsuredMedicalPaidBy === "split_pro_rata"
                ? "split_pro_rata"
                : inputs.uninsuredMedicalPaidBy,
              inputs.uninsuredMedicalMonthly,
            ).b
          : 0;
      const c = lineAaSplit(
        o,
        inputs.childcarePaidBy,
        inputs.childcareMonthly,
      ).b;
      const t = h + m + c;
      return t > 0 ? fmtMoney(t) : null;
    },
  },
  {
    fieldName: "total_expenses_9_caretaker",
    kind: "text",
    aocLine: "9",
    description: "Total expenses — Caretaker (not modeled)",
    source: () => null,
  },
  // 10 Share of additional expenses owed (signed)
  {
    fieldName: "share_addl_10_mother",
    kind: "text",
    aocLine: "10",
    description: "Share of add'l expenses owed — Mother (when A owes net)",
    source: (_w, _i, o) =>
      o.addOnsTotalFromA > 0 ? fmtMoney(o.addOnsTotalFromA) : null,
  },
  {
    fieldName: "share_addl_10_father",
    kind: "text",
    aocLine: "10",
    description: "Share of add'l expenses owed — Father (when B owes net)",
    source: (_w, _i, o) =>
      o.addOnsTotalFromA < 0 ? fmtMoney(-o.addOnsTotalFromA) : null,
  },
  // 11 Adjusted Support Obligation (ASO) = Line 7 + Line 10 (per side)
  {
    fieldName: "aso_11_mother",
    kind: "text",
    aocLine: "11",
    description: "ASO — Mother",
    source: (wdm, _i, o) => {
      const ln7 = findLineByScreenNo(wdm, "7");
      const base = ln7?.a?.amount ?? 0;
      const addons = o.addOnsTotalFromA > 0 ? o.addOnsTotalFromA : 0;
      const v = base + addons;
      return v > 0 ? fmtMoney(v) : null;
    },
  },
  {
    fieldName: "aso_11_father",
    kind: "text",
    aocLine: "11",
    description: "ASO — Father",
    source: (wdm, _i, o) => {
      const ln7 = findLineByScreenNo(wdm, "7");
      const base = ln7?.b?.amount ?? 0;
      const addons = o.addOnsTotalFromA < 0 ? -o.addOnsTotalFromA : 0;
      const v = base + addons;
      return v > 0 ? fmtMoney(v) : null;
    },
  },
];

// -------------------------------------------------------------------
// Part V — PCSO (page 2)
// -------------------------------------------------------------------

const partV: AocField[] = [
  // 12 PCSO — absolute net in the obligor's column
  {
    fieldName: "pcso_12",
    kind: "text",
    aocLine: "12",
    description: "PCSO (presumptive child support order)",
    source: (_w, _i, o) =>
      o.allInDirection !== "none" ? fmtMoney(o.allInMonthly) : null,
  },
];

// -------------------------------------------------------------------
// Part V cont. — Modification block (Line 13a–13c) and low-income/flat
// radios. Calc engine does not model modification scenarios; flags
// stay at "N" defaults to make the form fully filled.
// -------------------------------------------------------------------

const partVModRadios: AocField[] = [
  {
    fieldName: "low_income",
    kind: "choice",
    aocLine: "",
    description: "Low Income? (N=15% Y=7.5%) — not currently modeled",
    source: () => "N",
  },
  {
    fieldName: "current_order_flat",
    kind: "choice",
    aocLine: "",
    description: "Current Order Flat %? — not currently modeled",
    source: () => "N",
  },
  {
    fieldName: "current_order_13a_mother",
    kind: "text",
    aocLine: "13a",
    description: "Current order — Mother (not modeled)",
    source: () => null,
  },
  {
    fieldName: "current_order_13a_father",
    kind: "text",
    aocLine: "13a",
    description: "Current order — Father (not modeled)",
    source: () => null,
  },
  {
    fieldName: "required_variance_13b_mother",
    kind: "text",
    aocLine: "13b",
    description: "Required variance — Mother (not modeled)",
    source: () => null,
  },
  {
    fieldName: "required_variance_13b_father",
    kind: "text",
    aocLine: "13b",
    description: "Required variance — Father (not modeled)",
    source: () => null,
  },
  {
    fieldName: "actual_variance_13c_mother",
    kind: "text",
    aocLine: "13c",
    description: "Actual variance — Mother (not modeled)",
    source: () => null,
  },
  {
    fieldName: "actual_variance_13c_father",
    kind: "text",
    aocLine: "13c",
    description: "Actual variance — Father (not modeled)",
    source: () => null,
  },
];

// -------------------------------------------------------------------
// Part VI — Deviations + FCSO + Comments + Preparer (page 2)
// -------------------------------------------------------------------

const partVI: AocField[] = [
  // 14 Deviation $ — net deviation signed from A
  {
    fieldName: "deviation_14_mother",
    kind: "text",
    aocLine: "14",
    description: "Deviation $ — Mother (when net adds to A's outflow)",
    source: (_w, _i, o) => {
      const dev =
        o.privateSchoolDeviationFromA + o.specialExpensesDeviationFromA;
      return dev > 0 ? fmtMoney(dev) : null;
    },
  },
  {
    fieldName: "deviation_14_father",
    kind: "text",
    aocLine: "14",
    description: "Deviation $ — Father (when net adds to B's outflow)",
    source: (_w, _i, o) => {
      const dev =
        o.privateSchoolDeviationFromA + o.specialExpensesDeviationFromA;
      return dev < 0 ? fmtMoney(-dev) : null;
    },
  },
  // Deviation "specify" multiline — full deviations brief.
  {
    fieldName: "deviation_specify",
    kind: "text",
    aocLine: "14",
    description: "Deviation specify — brief narrative",
    source: (wdm, inputs, outputs) => {
      const a = inputs.parentALabel || "Mother";
      const b = inputs.parentBLabel || "Father";
      const netDevFromA =
        outputs.privateSchoolDeviationFromA +
        outputs.specialExpensesDeviationFromA;
      return flattenForCommentsBriefAOC(
        wdm.panels.deviationsNarrative,
        a,
        b,
        netDevFromA,
      );
    },
  },
  // 15 FCSO
  {
    fieldName: "fcso_15_mother",
    kind: "text",
    aocLine: "15",
    description: "FCSO — Mother",
    source: (_w, _i, o) =>
      o.allInDirection === "parent_a_to_b" ? fmtMoney(o.allInMonthly) : null,
  },
  {
    fieldName: "fcso_15_father",
    kind: "text",
    aocLine: "15",
    description: "FCSO — Father",
    source: (_w, _i, o) =>
      o.allInDirection === "parent_b_to_a" ? fmtMoney(o.allInMonthly) : null,
  },
  // 16 FCSO adjusted for federal benefit
  {
    fieldName: "fcso_16_mother",
    kind: "text",
    aocLine: "16",
    description: "FCSO adj. federal benefit — Mother",
    source: (_w, _i, o) => {
      if (o.allInDirection !== "parent_a_to_b") return null;
      const adjusted = o.allInMonthly - Math.abs(o.federalBenefitOffsetFromA);
      return fmtMoney(adjusted);
    },
  },
  {
    fieldName: "fcso_16_father",
    kind: "text",
    aocLine: "16",
    description: "FCSO adj. federal benefit — Father",
    source: (_w, _i, o) => {
      if (o.allInDirection !== "parent_b_to_a") return null;
      const adjusted = o.allInMonthly - Math.abs(o.federalBenefitOffsetFromA);
      return fmtMoney(adjusted);
    },
  },
  // Comments / Rebuttals / Calculations — brief AOC composition per
  // Phase A v2.1: (1) net presumptive summary, (2) cap status,
  // (3) deviations brief. Multiline AcroForm field auto-wraps.
  {
    fieldName: "comments",
    kind: "text",
    aocLine: "",
    description: "Comments / Rebuttals / Calculations — brief AOC summary",
    source: (wdm, inputs, outputs) => {
      const parts: string[] = [];
      const a = inputs.parentALabel || "Mother";
      const b = inputs.parentBLabel || "Father";

      // 1. Net presumptive support summary.
      if (
        outputs.netPresumptiveSupport > 0 &&
        outputs.presumptiveDirection !== "none"
      ) {
        const dir =
          outputs.presumptiveDirection === "parent_a_to_b"
            ? `${a} → ${b}`
            : `${b} → ${a}`;
        parts.push(
          `Net presumptive support: $${fmtMoney(outputs.netPresumptiveSupport)}/mo (${dir}).`,
        );
      }

      // 2. Cap status (brief sentence).
      const cap = wdm.panels.statutoryCap;
      if (cap.statutoryMax > 0 && cap.numChildren > 0) {
        const childWord = cap.numChildren === 1 ? "child" : "children";
        const capDollars = cap.statutoryMax.toLocaleString("en-US");
        if (cap.engaged) {
          parts.push(
            `Calculation exceeds the $${capDollars}/mo presumptive cap for ${cap.numChildren} ${childWord}; rebuttable presumption.`,
          );
        } else {
          parts.push(
            `Calculation falls below the $${capDollars}/mo presumptive cap for ${cap.numChildren} ${childWord}.`,
          );
        }
      }

      // 3. Deviations brief.
      const netDevFromA =
        outputs.privateSchoolDeviationFromA +
        outputs.specialExpensesDeviationFromA;
      const devBrief = flattenForCommentsBriefAOC(
        wdm.panels.deviationsNarrative,
        a,
        b,
        netDevFromA,
      );
      if (devBrief) parts.push(devBrief);

      // 4. Closing pointer — methodology lives on the annotated worksheet.
      // Pointer, not a citation; permitted on the AOC face per architecture §0.
      if (parts.length > 0 && !parts[parts.length - 1].includes("annotated worksheet")) {
        parts.push("See annotated worksheet for methodology.");
      }

      return parts.length > 0 ? parts.join(" ") : null;
    },
  },
  // Preparer block
  {
    fieldName: "preparer_name",
    kind: "text",
    aocLine: "",
    description: "Preparer — Name",
    source: (wdm) => wdm.caption.preparedBy || null,
  },
  {
    fieldName: "preparer_date",
    kind: "text",
    aocLine: "",
    description: "Preparer — Date",
    source: (wdm) => wdm.header.preparedOnDisplay || null,
  },
  {
    fieldName: "preparer_title",
    kind: "text",
    aocLine: "",
    description: "Preparer — Title (not modeled)",
    source: () => null,
  },
];

// -------------------------------------------------------------------
// Full field map
// -------------------------------------------------------------------

export const AOC_FIELD_MAP: ReadonlyArray<AocField> = [
  ...identification,
  ...childRows,
  ...partII,
  ...partIII,
  ...partIV,
  ...partV,
  ...partVModRadios,
  ...partVI,
];
