/**
 * AOC Child Support Worksheet — Field Map
 *
 * Single inspectable file: AOC Line N → WDM/calc source + coord box + fit policy.
 * Reviewers can audit the form mapping without reading pdf-lib code.
 *
 * Coordinate system
 * -----------------
 * Rectangles use pdfplumber-style top-down coords (origin top-left, y grows
 * downward, points). The renderer converts to pdf-lib bottom-up at draw time.
 * Each rect was measured from the official blank form bundled at
 * src/lib/pdf/assets/tn-cs-worksheet-blank.pdf via pdfplumber extract_words
 * (anchor markers: "$", "%", "+", "-", section labels).
 *
 * Source accessors are pure: (wdm, inputs, outputs) → string | null.
 * Returning null means "do not write" (cell left blank as on the form).
 *
 * Fit policy
 * ----------
 *  - "shrink"   : start at `size`, shrink in 0.5pt steps until it fits the
 *                 rect width, floor at 7pt. Single-line.
 *  - "wrap"     : wrap to multiple lines within the rect; truncate-with-overflow
 *                 if it exceeds rect height; overflow is appended to the Comments
 *                 block on page 2.
 *  - "fixed"    : draw as-is at `size`; no measurement.
 *
 * Note on WDM↔AOC line numbering
 * ------------------------------
 * The WDM uses screen-worksheet line numbers (gross=3, AGI=4, PI=5, BCSO=6,
 * Adjusted BCSO=7). AOC numbers (gross=1, AGI=2, PI=3, BCSO=6) differ. The
 * translation lives only in this file — the WDM is display-agnostic per the
 * Phase A v2.1 decision (option (i)).
 */

import type { CalcInputs, CalcOutputs } from "../calc/types";
import type { WDM } from "../calc/wdm/types";
import { findLineByScreenNo } from "../calc/wdm/build";
import { flattenForCommentsBlock } from "../calc/deviations-narrative";

export type FontStyle = "regular" | "bold";
export type Align = "left" | "right" | "center";

export interface FieldRect {
  /** Top-left x in pdfplumber coords (page-relative, points). */
  x: number;
  /** Top-left y in pdfplumber coords (top-down, points). */
  y: number;
  /** Width in points. */
  w: number;
  /** Height in points (used for wrap clipping). */
  h: number;
}

export interface FieldFit {
  policy: "shrink" | "wrap" | "fixed";
  size: number;
  align?: Align;
  /** Vertical bottom-padding from rect bottom for single-line draws (default 2). */
  vPad?: number;
}

export type FieldSource = (
  wdm: WDM,
  inputs: CalcInputs,
  outputs: CalcOutputs,
) => string | null;

export interface AocField {
  /** AOC line label, used in audits/logs. Empty string for non-numbered fields. */
  aocLine: string;
  /** Human description; appears in field-map audits. */
  description: string;
  /** PDF page (1-indexed). */
  page: 1 | 2;
  rect: FieldRect;
  fit: FieldFit;
  font?: FontStyle;
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
const fmtPct = (frac: number): string =>
  `${(frac * 100).toFixed(2)}`;

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

// Cell x-anchors derived from pdfplumber-measured "$"/"%" marker positions.
// Money/percent values right-align inside the cell rectangle.
const COL = {
  // Money cells, page 1 (Part II/III)
  motherP1Money: { x: 376, w: 44 },
  fatherP1Money: { x: 430, w: 44 },
  caretakerP1Money: { x: 485, w: 44 },
  // Money cells, page 2 (Part IV/V/VI)
  motherP2Money: { x: 380, w: 44 },
  fatherP2Money: { x: 432, w: 44 },
  caretakerP2Money: { x: 484, w: 44 },
  // Percent cells (Line 3)
  motherPct: { x: 380, w: 32 },
  fatherPct: { x: 434, w: 32 },
  // Combined AGI (Line 2a) — narrower single cell
  combined2a: { x: 322, w: 44 },
  // ARP days (Line 5) — full cell width, mother/father columns
  motherP1Days: { x: 376, w: 44 },
  fatherP1Days: { x: 430, w: 44 },
  // PRP/ARP/SPLIT checkboxes (cell centers)
  prpX: 447,
  arpX: 476,
  splitX: 505,
} as const;

const moneyMother1: FieldRect = { ...COL.motherP1Money, y: 0, h: 9 };
const moneyFather1: FieldRect = { ...COL.fatherP1Money, y: 0, h: 9 };
void moneyMother1; void moneyFather1; // not used directly; per-line specifics below

const moneyFit: FieldFit = { policy: "shrink", size: 9, align: "right", vPad: 1 };
const pctFit: FieldFit = { policy: "shrink", size: 9, align: "right", vPad: 1 };
const textFit = (size = 9): FieldFit => ({
  policy: "shrink",
  size,
  align: "left",
  vPad: 1,
});
const centerFit = (size = 10): FieldFit => ({
  policy: "fixed",
  size,
  align: "center",
});

// y for a given pdfplumber "top" — anchor at top, cell height ≈ 9pt.
const row = (top: number, h = 9): { y: number; h: number } => ({ y: top - 1, h });

// -------------------------------------------------------------------
// Identification (Part I) — page 1
// -------------------------------------------------------------------

// Name underline approx spans x=283..420; sit text just above the line.
const NAME_X = 285;
const NAME_W = 145;

const identificationFields: AocField[] = [
  {
    aocLine: "",
    description: "Name of Mother (or Parent A when parentARole=mother)",
    page: 1,
    rect: { x: NAME_X, y: row(142.5).y, w: NAME_W, h: 9 },
    fit: textFit(9),
    source: (_wdm, inputs) =>
      inputs.parentALabel || null,
  },
  {
    aocLine: "",
    description: "Name of Father (or Parent B)",
    page: 1,
    rect: { x: NAME_X, y: row(150.7).y, w: NAME_W, h: 9 },
    fit: textFit(9),
    source: (_wdm, inputs) =>
      inputs.parentBLabel || null,
  },
  // PRP / ARP / SPLIT checkboxes — Mother row (y top=142.5)
  {
    aocLine: "",
    description: "Mother PRP checkbox",
    page: 1,
    rect: { x: COL.prpX - 4, y: row(141, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentA.prp ? "X" : null),
  },
  {
    aocLine: "",
    description: "Mother ARP checkbox",
    page: 1,
    rect: { x: COL.arpX - 4, y: row(141, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentA.arp ? "X" : null),
  },
  {
    aocLine: "",
    description: "Mother SPLIT checkbox",
    page: 1,
    rect: { x: COL.splitX - 4, y: row(141, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentA.split ? "X" : null),
  },
  // Father row
  {
    aocLine: "",
    description: "Father PRP checkbox",
    page: 1,
    rect: { x: COL.prpX - 4, y: row(149.5, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentB.prp ? "X" : null),
  },
  {
    aocLine: "",
    description: "Father ARP checkbox",
    page: 1,
    rect: { x: COL.arpX - 4, y: row(149.5, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentB.arp ? "X" : null),
  },
  {
    aocLine: "",
    description: "Father SPLIT checkbox",
    page: 1,
    rect: { x: COL.splitX - 4, y: row(149.5, 10).y, w: 8, h: 10 },
    fit: centerFit(10),
    font: "bold",
    source: (wdm) => (wdm.panels.parentRoleCheckboxes.parentB.split ? "X" : null),
  },
  // Equal-50/50 margin note — positioned in the empty band between
  // Line 7 (Adjusted BCSO, top≈494) and Part IV's section divider
  // (top≈520). This places the annotation immediately under the
  // parenting-time block (Lines 5-7) so it reads as the explanation
  // for the blank Line 5, $0 Line 6, and cross-credit Line 7. The
  // up-arrow prefix points the chancellor's eye back to that block.
  {
    aocLine: "",
    description: "Margin note: Equal parenting (Rule .04(7)(b)(2)(i))",
    page: 1,
    rect: { x: 366, y: 511, w: 190, h: 14 },
    fit: { policy: "wrap", size: 7, align: "left" },
    source: (wdm) => {
      const note = wdm.panels.parentRoleCheckboxes.marginNote;
      return note ? `↑ Lines 5–7: ${note}` : null;
    },
  },
];

// -------------------------------------------------------------------
// Part II — Adjusted Gross Income (page 1)
// -------------------------------------------------------------------

// Lines 1, 1a-1e, 2, 2a, 3. The form ships with $/+/-/% glyphs already
// present; we write the numeric value to the right of those glyphs.
const VALUE_X_OFFSET = 6; // points to the right of the $/+/-/% glyph

const partII: AocField[] = [
  // 1 Monthly Gross Income — top=332.1
  {
    aocLine: "1",
    description: "Monthly Gross Income — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, ...row(332).h ? {} : {}, y: row(332).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) => fmtMoney(inputs.parentAGrossMonthly),
  },
  {
    aocLine: "1",
    description: "Monthly Gross Income — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(332).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) => fmtMoney(inputs.parentBGrossMonthly),
  },
  // 1a Federal benefit for child (top=341.4) — sourced from inputs, not WDM
  {
    aocLine: "1a",
    description: "Federal benefit for child — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(341).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentAFederalBenefit > 0 ? fmtMoney(inputs.parentAFederalBenefit) : null,
  },
  {
    aocLine: "1a",
    description: "Federal benefit for child — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(341).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentBFederalBenefit > 0 ? fmtMoney(inputs.parentBFederalBenefit) : null,
  },
  // 1b Self-employment tax paid (top=349.9). WDM "3a".
  {
    aocLine: "1b",
    description: "Self-employment tax credit — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(350).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentASECredit > 0 ? fmtMoney(inputs.parentASECredit) : null,
  },
  {
    aocLine: "1b",
    description: "Self-employment tax credit — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(350).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentBSECredit > 0 ? fmtMoney(inputs.parentBSECredit) : null,
  },
  // 1c Subtotal (top=358.5). 1c = 1 + 1a - 1b.
  {
    aocLine: "1c",
    description: "Subtotal — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(358).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      fmtMoney(
        inputs.parentAGrossMonthly +
          inputs.parentAFederalBenefit -
          inputs.parentASECredit,
      ),
  },
  {
    aocLine: "1c",
    description: "Subtotal — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(358).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      fmtMoney(
        inputs.parentBGrossMonthly +
          inputs.parentBFederalBenefit -
          inputs.parentBSECredit,
      ),
  },
  // 1d Credit for In-Home Children (top=367). WDM "3c".
  {
    aocLine: "1d",
    description: "Credit for In-Home Children — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(367).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentAInhomeCredit > 0 ? fmtMoney(inputs.parentAInhomeCredit) : null,
  },
  {
    aocLine: "1d",
    description: "Credit for In-Home Children — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(367).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentBInhomeCredit > 0 ? fmtMoney(inputs.parentBInhomeCredit) : null,
  },
  // 1e Credit for Not In Home Children (top=375.6). WDM "3b".
  {
    aocLine: "1e",
    description: "Credit for Not In Home Children — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(375).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentAPriorSupport > 0 ? fmtMoney(inputs.parentAPriorSupport) : null,
  },
  {
    aocLine: "1e",
    description: "Credit for Not In Home Children — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(375).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs) =>
      inputs.parentBPriorSupport > 0 ? fmtMoney(inputs.parentBPriorSupport) : null,
  },
  // 2 AGI (top=384.1). WDM "4".
  {
    aocLine: "2",
    description: "AGI — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(384).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => fmtMoney(o.parentAAGI),
  },
  {
    aocLine: "2",
    description: "AGI — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(384).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => fmtMoney(o.parentBAGI),
  },
  // 2a Combined AGI (top=392.7). Single cell at x≈315.
  {
    aocLine: "2a",
    description: "Combined AGI",
    page: 1,
    rect: { x: COL.combined2a.x + VALUE_X_OFFSET, y: row(392).y, w: COL.combined2a.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => fmtMoney(o.combinedAGI),
  },
  // 3 PI % (top=401.2). WDM "5".
  {
    aocLine: "3",
    description: "PI % — Mother",
    page: 1,
    rect: { x: COL.motherPct.x, y: row(401).y, w: COL.motherPct.w, h: 9 },
    fit: pctFit,
    source: (_w, _i, o) => fmtPct(o.piA),
  },
  {
    aocLine: "3",
    description: "PI % — Father",
    page: 1,
    rect: { x: COL.fatherPct.x, y: row(401).y, w: COL.fatherPct.w, h: 9 },
    fit: pctFit,
    source: (_w, _i, o) => fmtPct(o.piB),
  },
];

// -------------------------------------------------------------------
// Part III — Parents' Share of BCSO (page 1)
// -------------------------------------------------------------------

const partIII: AocField[] = [
  // 4 BCSO allotted to PRP's household (top=434.9). Goes in the PRP column.
  {
    aocLine: "4",
    description: "BCSO allotted to PRP — Mother col (if Mother is PRP)",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(435).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => (prpIs(o) === "parent_a" ? fmtMoney(o.bcso) : null),
  },
  {
    aocLine: "4",
    description: "BCSO allotted to PRP — Father col (if Father is PRP)",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(435).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => (prpIs(o) === "parent_b" ? fmtMoney(o.bcso) : null),
  },
  // 4a Share of BCSO owed to PRP (top=443.5). ARP's pro-rata share — goes
  // in ARP column.
  {
    aocLine: "4a",
    description: "Share of BCSO owed to PRP — Mother col (if Mother is ARP)",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(444).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.arpIdentity === "parent_a" ? fmtMoney(o.parentABcsoShare) : null,
  },
  {
    aocLine: "4a",
    description: "Share of BCSO owed to PRP — Father col (if Father is ARP)",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(444).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.arpIdentity === "parent_b" ? fmtMoney(o.parentBBcsoShare) : null,
  },
  // 5 ARP parent's average parenting time (top=460.6). Days as integer.
  // Equal 50/50 → leave blank (per Phase A approval; margin note covers).
  {
    aocLine: "5",
    description: "ARP avg parenting time — Mother col",
    page: 1,
    rect: { x: COL.motherP1Days.x, y: row(461).y, w: COL.motherP1Days.w, h: 9 },
    fit: { ...moneyFit, align: "center" },
    source: (_w, inputs, o) => {
      if (o.arpIdentity !== "parent_a") return null;
      if (inputs.parentingType === "standard") return "80";
      if (inputs.parentingType === "custom")
        return String(inputs.parentADays ?? "");
      return null;
    },
  },
  {
    aocLine: "5",
    description: "ARP avg parenting time — Father col",
    page: 1,
    rect: { x: COL.fatherP1Days.x, y: row(461).y, w: COL.fatherP1Days.w, h: 9 },
    fit: { ...moneyFit, align: "center" },
    source: (_w, inputs, o) => {
      if (o.arpIdentity !== "parent_b") return null;
      if (inputs.parentingType === "standard") return "80";
      if (inputs.parentingType === "custom")
        return String(inputs.parentBDays ?? "");
      return null;
    },
  },
  // 6 Parenting time adjustment (top=477.1). Equal 50/50 → $0 with annotation;
  // standard parenting at 80 days → no adjustment (blank). Variable multiplier
  // case → the dollar adjustment.
  {
    aocLine: "6",
    description: "Parenting time adjustment — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(477).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      if (o.parentingTimeBand === "equal") return "0";
      // Variable multiplier case: BCSO × (1 - multiplier) applied to ARP share
      if (o.variableMultiplier !== null && o.arpIdentity === "parent_a") {
        const adj = o.parentABcsoShare * (1 - o.variableMultiplier);
        return adj > 0 ? fmtMoney(adj) : null;
      }
      return null;
    },
  },
  {
    aocLine: "6",
    description: "Parenting time adjustment — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(477).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _inputs, o) => {
      if (o.parentingTimeBand === "equal") return "0";
      if (o.variableMultiplier !== null && o.arpIdentity === "parent_b") {
        const adj = o.parentBBcsoShare * (1 - o.variableMultiplier);
        return adj > 0 ? fmtMoney(adj) : null;
      }
      return null;
    },
  },
  // 7 Adjusted BCSO (top=494.2). WDM "7" — for Equal-50/50 this is the
  // cross-credit net; for standard/variable it's the post-adjustment ARP share.
  {
    aocLine: "7",
    description: "Adjusted BCSO — Mother",
    page: 1,
    rect: { x: COL.motherP1Money.x + VALUE_X_OFFSET, y: row(494).y, w: COL.motherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (wdm) => {
      const ln = findLineByScreenNo(wdm, "7");
      return ln?.a?.amount != null && ln.a.amount > 0 ? fmtMoney(ln.a.amount) : null;
    },
  },
  {
    aocLine: "7",
    description: "Adjusted BCSO — Father",
    page: 1,
    rect: { x: COL.fatherP1Money.x + VALUE_X_OFFSET, y: row(494).y, w: COL.fatherP1Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (wdm) => {
      const ln = findLineByScreenNo(wdm, "7");
      return ln?.b?.amount != null && ln.b.amount > 0 ? fmtMoney(ln.b.amount) : null;
    },
  },
];

// -------------------------------------------------------------------
// Part IV — Additional Expenses (page 2)
// -------------------------------------------------------------------

const partIV: AocField[] = [
  // 8a Children's portion of health insurance (top=129.6)
  {
    aocLine: "8a",
    description: "Health insurance — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(129).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const { a } = lineAaSplit(o, inputs.healthPaidBy, inputs.healthPremiumMonthly);
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    aocLine: "8a",
    description: "Health insurance — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(129).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const { b } = lineAaSplit(o, inputs.healthPaidBy, inputs.healthPremiumMonthly);
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  // 8b Recurring Uninsured Medical (top=138.4)
  {
    aocLine: "8b",
    description: "Uninsured medical — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(138).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      if (inputs.uninsuredMedicalMonthly <= 0) return null;
      const { a } = lineAaSplit(o, inputs.uninsuredMedicalPaidBy === "split_pro_rata"
          ? "split_pro_rata"
          : inputs.uninsuredMedicalPaidBy,
        inputs.uninsuredMedicalMonthly,
      );
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    aocLine: "8b",
    description: "Uninsured medical — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(138).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      if (inputs.uninsuredMedicalMonthly <= 0) return null;
      const { b } = lineAaSplit(o, inputs.uninsuredMedicalPaidBy === "split_pro_rata"
          ? "split_pro_rata"
          : inputs.uninsuredMedicalPaidBy,
        inputs.uninsuredMedicalMonthly,
      );
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  // 8c Work-related childcare (top=146.9)
  {
    aocLine: "8c",
    description: "Childcare — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(147).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const { a } = lineAaSplit(o, inputs.childcarePaidBy, inputs.childcareMonthly);
      return a > 0 ? fmtMoney(a) : null;
    },
  },
  {
    aocLine: "8c",
    description: "Childcare — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(147).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const { b } = lineAaSplit(o, inputs.childcarePaidBy, inputs.childcareMonthly);
      return b > 0 ? fmtMoney(b) : null;
    },
  },
  // 9 Total expenses (top=156.4)
  {
    aocLine: "9",
    description: "Total expenses — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(156).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const h = lineAaSplit(o, inputs.healthPaidBy, inputs.healthPremiumMonthly).a;
      const m = inputs.uninsuredMedicalMonthly > 0
        ? lineAaSplit(o, inputs.uninsuredMedicalPaidBy === "split_pro_rata" ? "split_pro_rata" : inputs.uninsuredMedicalPaidBy,
            inputs.uninsuredMedicalMonthly).a
        : 0;
      const c = lineAaSplit(o, inputs.childcarePaidBy, inputs.childcareMonthly).a;
      const t = h + m + c;
      return t > 0 ? fmtMoney(t) : null;
    },
  },
  {
    aocLine: "9",
    description: "Total expenses — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(156).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, inputs, o) => {
      const h = lineAaSplit(o, inputs.healthPaidBy, inputs.healthPremiumMonthly).b;
      const m = inputs.uninsuredMedicalMonthly > 0
        ? lineAaSplit(o, inputs.uninsuredMedicalPaidBy === "split_pro_rata" ? "split_pro_rata" : inputs.uninsuredMedicalPaidBy,
            inputs.uninsuredMedicalMonthly).b
        : 0;
      const c = lineAaSplit(o, inputs.childcarePaidBy, inputs.childcareMonthly).b;
      const t = h + m + c;
      return t > 0 ? fmtMoney(t) : null;
    },
  },
  // 10 Share of additional expenses owed (top=173.5) — net signed transfer.
  {
    aocLine: "10",
    description: "Share of add'l expenses owed — Mother (when A owes net)",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(173).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => (o.addOnsTotalFromA > 0 ? fmtMoney(o.addOnsTotalFromA) : null),
  },
  {
    aocLine: "10",
    description: "Share of add'l expenses owed — Father (when B owes net)",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(173).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => (o.addOnsTotalFromA < 0 ? fmtMoney(-o.addOnsTotalFromA) : null),
  },
  // 11 Adjusted Support Obligation (ASO) (top=190.6) = Line 7 + Line 10 net
  {
    aocLine: "11",
    description: "ASO — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(190).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (wdm, _i, o) => {
      const ln7 = findLineByScreenNo(wdm, "7");
      const base = ln7?.a?.amount ?? 0;
      const addons = o.addOnsTotalFromA > 0 ? o.addOnsTotalFromA : 0;
      const v = base + addons;
      return v > 0 ? fmtMoney(v) : null;
    },
  },
  {
    aocLine: "11",
    description: "ASO — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(190).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
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
  // 12 PCSO (top=252.3). Two cells, but the form's prescribed convention is
  // to enter the absolute net in the obligor's column.
  {
    aocLine: "12",
    description: "PCSO — Mother (when A is obligor)",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(252).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.allInDirection === "parent_a_to_b" ? fmtMoney(o.allInMonthly) : null,
  },
  {
    aocLine: "12",
    description: "PCSO — Father (when B is obligor)",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(252).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.allInDirection === "parent_b_to_a" ? fmtMoney(o.allInMonthly) : null,
  },
];

// -------------------------------------------------------------------
// Part VI — Deviations + FCSO (page 2)
// -------------------------------------------------------------------

const partVI: AocField[] = [
  // 14 Deviations $ (top=411.2) — net deviation transfer signed from A.
  {
    aocLine: "14",
    description: "Deviation $ — Mother (when net adds to A's outflow)",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(411).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => {
      const dev = o.privateSchoolDeviationFromA + o.specialExpensesDeviationFromA;
      return dev > 0 ? fmtMoney(dev) : null;
    },
  },
  {
    aocLine: "14",
    description: "Deviation $ — Father (when net adds to B's outflow)",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(411).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => {
      const dev = o.privateSchoolDeviationFromA + o.specialExpensesDeviationFromA;
      return dev < 0 ? fmtMoney(-dev) : null;
    },
  },
  // 15 FCSO (top=488.9)
  {
    aocLine: "15",
    description: "FCSO — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(489).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.allInDirection === "parent_a_to_b" ? fmtMoney(o.allInMonthly) : null,
  },
  {
    aocLine: "15",
    description: "FCSO — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(489).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) =>
      o.allInDirection === "parent_b_to_a" ? fmtMoney(o.allInMonthly) : null,
  },
  // 16 FCSO adjusted for federal benefit (top=501.8)
  {
    aocLine: "16",
    description: "FCSO adj. federal benefit — Mother",
    page: 2,
    rect: { x: COL.motherP2Money.x + VALUE_X_OFFSET, y: row(502).y, w: COL.motherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => {
      if (o.allInDirection !== "parent_a_to_b") return null;
      const adjusted = o.allInMonthly - Math.abs(o.federalBenefitOffsetFromA);
      return fmtMoney(adjusted);
    },
  },
  {
    aocLine: "16",
    description: "FCSO adj. federal benefit — Father",
    page: 2,
    rect: { x: COL.fatherP2Money.x + VALUE_X_OFFSET, y: row(502).y, w: COL.fatherP2Money.w - VALUE_X_OFFSET, h: 9 },
    fit: moneyFit,
    source: (_w, _i, o) => {
      if (o.allInDirection !== "parent_b_to_a") return null;
      const adjusted = o.allInMonthly - Math.abs(o.federalBenefitOffsetFromA);
      return fmtMoney(adjusted);
    },
  },
  // Comments / Calculations / Rebuttals block — wrapped, ~4 underlines starting
  // at top=550, spanning x≈195..555. Composed of (in order):
  //   1. Net presumptive transfer summary (uses → glyph).
  //   2. Above-cap analysis paragraph when statutory cap engaged (uses § glyph).
  //   3. Deviations narrative flattened from wdm.panels.deviationsNarrative.
  {
    aocLine: "",
    description: "Comments block — transfer summary + cap analysis + deviations",
    page: 2,
    rect: { x: 195, y: 548, w: 360, h: 48 },
    fit: { policy: "wrap", size: 8, align: "left" },
    source: (wdm, inputs, outputs) => {
      const parts: string[] = [];
      const a = inputs.parentALabel || "Mother";
      const b = inputs.parentBLabel || "Father";
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
      const cap = wdm.panels.statutoryCap;
      if (cap.capNote) parts.push(cap.capNote);
      const dev = flattenForCommentsBlock(wdm.panels.deviationsNarrative);
      if (dev) parts.push(dev);
      return parts.length > 0 ? parts.join("  ") : null;
    },
  },
  // Preparer's Use Only — Name (top=614.4) + Date (right side)
  {
    aocLine: "",
    description: "Preparer — Name",
    page: 2,
    rect: { x: 220, y: row(614).y, w: 220, h: 9 },
    fit: textFit(9),
    source: (wdm) => wdm.caption.preparedBy || null,
  },
  {
    aocLine: "",
    description: "Preparer — Date",
    page: 2,
    rect: { x: 470, y: row(614).y, w: 90, h: 9 },
    fit: textFit(9),
    source: (wdm) => wdm.header.preparedOnDisplay || null,
  },
];

// -------------------------------------------------------------------
// Full field map
// -------------------------------------------------------------------

export const AOC_FIELD_MAP: ReadonlyArray<AocField> = [
  ...identificationFields,
  ...partII,
  ...partIII,
  ...partIV,
  ...partV,
  ...partVI,
];
