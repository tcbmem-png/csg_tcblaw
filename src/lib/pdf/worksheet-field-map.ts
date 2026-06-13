import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { WorksheetData } from "./official-fillable-pdf";

type Party = "mother" | "father";

const num = (v?: number | null) =>
  v == null || Number.isNaN(v) ? undefined : Math.round(v * 100) / 100;
const N = (v?: number | string | null) =>
  v == null || v === "" ? 0 : Number(v);

/** UI-only fields not present in CalcInputs/CalcOutputs. */
export interface WorksheetUi {
  parentAParty: Party; // Parent A Mother/Father toggle
  children?: Array<{
    name?: string;
    dob?: string;
    daysMother?: number | string;
    daysFather?: number | string;
  }>;
  tcsesCase?: string;
  docketNumber?: string;
  courtName?: string;
  preparerName?: string;
  preparerDate?: string;
  preparerTitle?: string;
  comments?: string;
}

export function buildWorksheetData(
  i: CalcInputs,
  o: CalcOutputs,
  ui: WorksheetUi,
): WorksheetData {
  const motherIsA = ui.parentAParty === "mother";
  const partyB: Party = motherIsA ? "father" : "mother";

  const pick = <T,>(a: T, b: T) => (motherIsA ? { m: a, f: b } : { m: b, f: a });
  const partyOf = (who: "parent_a" | "parent_b"): Party =>
    who === "parent_a" ? ui.parentAParty : partyB;

  // Obligor (who pays): ARP, or fall back to presumptive direction for equal parenting
  let obligor: Party | null = null;
  if (o.arpIdentity === "parent_a") obligor = ui.parentAParty;
  else if (o.arpIdentity === "parent_b") obligor = partyB;
  else if (o.presumptiveDirection === "parent_a_to_b") obligor = ui.parentAParty;
  else if (o.presumptiveDirection === "parent_b_to_a") obligor = partyB;
  const obligorIsMother = obligor === "mother";
  const obl = (v?: number | null) =>
    obligor == null
      ? { a: undefined as number | undefined, b: undefined as number | undefined }
      : obligorIsMother
        ? { a: num(v), b: undefined }
        : { a: undefined, b: num(v) };

  // Part II income chain
  const income = pick(N(i.parentAGrossMonthly), N(i.parentBGrossMonthly));
  const fed = pick(N(i.parentAFederalBenefit), N(i.parentBFederalBenefit));
  const se = pick(N(i.parentASECredit), N(i.parentBSECredit));
  const inhome = pick(N(i.parentAInhomeCredit), N(i.parentBInhomeCredit));
  const notin = pick(N(i.parentAPriorSupport), N(i.parentBPriorSupport));
  const subtotalM = income.m + fed.m - se.m;
  const subtotalF = income.f + fed.f - se.f;
  const agi = pick(N(o.parentAAGI), N(o.parentBAGI));
  const piDec = pick(N(o.piA), N(o.piB));
  const piPct = { m: piDec.m * 100, f: piDec.f * 100 };

  // Part III BCSO + parenting-time adjustment
  const rawShare = pick(N(o.parentABcsoShare), N(o.parentBBcsoShare));
  const adjA =
    (o as unknown as { adjustedBcsoShareA?: number }).adjustedBcsoShareA ??
    o.parentABcsoShare;
  const adjB =
    (o as unknown as { adjustedBcsoShareB?: number }).adjustedBcsoShareB ??
    o.parentBBcsoShare;
  const adjShare = pick(N(adjA), N(adjB));
  const ptAdj = { m: rawShare.m - adjShare.m, f: rawShare.f - adjShare.f };
  const days = pick(N(i.parentADays), N(i.parentBDays));

  // Part IV additional expenses
  const byPayer = (paidBy: string | undefined, amount?: number | null) => {
    const amt = N(amount);
    if (!amt) return { m: 0, f: 0 };
    if (paidBy === "split_pro_rata")
      return { m: amt * piDec.m, f: amt * piDec.f };
    const p = partyOf((paidBy as "parent_a" | "parent_b") ?? "parent_a");
    return p === "mother" ? { m: amt, f: 0 } : { m: 0, f: amt };
  };
  const health = byPayer(i.healthPaidBy, i.healthPremiumMonthly);
  const med = byPayer(i.uninsuredMedicalPaidBy, i.uninsuredMedicalMonthly);
  const cc = byPayer(i.childcarePaidBy, i.childcareMonthly);
  const total9 = { m: health.m + med.m + cc.m, f: health.f + med.f + cc.f };
  const combinedExp = total9.m + total9.f;
  const share10 = { m: piDec.m * combinedExp, f: piDec.f * combinedExp };
  const aso11 = { m: adjShare.m + share10.m, f: adjShare.f + share10.f };

  // Part V / VI obligor singles
  const pcso = obl(Math.abs(N(o.netPresumptiveSupport)));
  const devTotal = Math.abs(
    N(o.privateSchoolDeviationFromA) + N(o.specialExpensesDeviationFromA),
  );
  const dev = obl(devTotal || undefined);
  const fcso = obl(Math.abs(N(o.allInMonthly)));
  const fcsoAdj = obl(
    Math.max(
      0,
      Math.abs(N(o.allInMonthly)) - Math.abs(N(o.federalBenefitOffsetFromA)),
    ),
  );

  // Identification
  const names = motherIsA
    ? { mother: i.parentALabel, father: i.parentBLabel }
    : { mother: i.parentBLabel, father: i.parentALabel };
  const reasons = [i.privateSchoolReason, i.specialExpensesReason]
    .filter(Boolean)
    .join("; ");

  const data: WorksheetData = {
    mother_name: names.mother,
    father_name: names.father,
    tcses_case: ui.tcsesCase,
    docket_number: ui.docketNumber,
    court_name: ui.courtName,
    status_mother_prp: obligor != null && !obligorIsMother,
    status_mother_arp: obligorIsMother,
    status_father_prp: obligorIsMother,
    status_father_arp: obligor != null && !obligorIsMother,

    line1_income_a: num(income.m),
    line1_income_b: num(income.f),
    line1a_fed_benefit_a: num(fed.m),
    line1a_fed_benefit_b: num(fed.f),
    line1b_se_tax_a: num(se.m),
    line1b_se_tax_b: num(se.f),
    line1c_subtotal_a: num(subtotalM),
    line1c_subtotal_b: num(subtotalF),
    line1d_credit_inhome_a: num(inhome.m),
    line1d_credit_inhome_b: num(inhome.f),
    line1e_credit_not_inhome_a: num(notin.m),
    line1e_credit_not_inhome_b: num(notin.f),
    line2_agi_a: num(agi.m),
    line2_agi_b: num(agi.f),
    line2a_combined_agi: num(o.combinedAGI),
    line3_pi_a: num(piPct.m),
    line3_pi_b: num(piPct.f),

    line4a_bcso_owed_a: num(rawShare.m),
    line4a_bcso_owed_b: num(rawShare.f),
    line5_arp_parenting_a: num(days.m),
    line5_arp_parenting_b: num(days.f),
    line6_pt_adjustment_a: num(ptAdj.m),
    line6_pt_adjustment_b: num(ptAdj.f),
    line7_adjusted_bcso_a: num(adjShare.m),
    line7_adjusted_bcso_b: num(adjShare.f),

    line8a_health_insurance_a: num(health.m),
    line8a_health_insurance_b: num(health.f),
    line8b_uninsured_medical_a: num(med.m),
    line8b_uninsured_medical_b: num(med.f),
    line8c_childcare_a: num(cc.m),
    line8c_childcare_b: num(cc.f),
    line9_total_expenses_a: num(total9.m),
    line9_total_expenses_b: num(total9.f),
    line10_share_expenses_a: num(share10.m),
    line10_share_expenses_b: num(share10.f),
    line11_aso_a: num(aso11.m),
    line11_aso_b: num(aso11.f),

    line12_pcso_a: pcso.a,
    line12_pcso_b: pcso.b,
    low_income: o.ssrApplied ? "Y" : "N",
    line14_deviations_a: dev.a,
    line14_deviations_b: dev.b,
    deviations_specify: reasons || undefined,
    line15_fcso_a: fcso.a,
    line15_fcso_b: fcso.b,
    line16_fcso_adjusted_a: fcsoAdj.a,
    line16_fcso_adjusted_b: fcsoAdj.b,

    preparer_name: ui.preparerName,
    preparer_date: ui.preparerDate,
    preparer_title: ui.preparerTitle,
    comments: ui.comments,
  };

  (ui.children ?? []).slice(0, 5).forEach((c, idx) => {
    const k = idx + 1;
    data[`child${k}_name`] = c.name;
    data[`child${k}_dob`] = c.dob;
    data[`child${k}_days_mother`] = c.daysMother;
    data[`child${k}_days_father`] = c.daysFather;
  });

  return data;
}

/** Build the UI overlay from CaseCaption + CalcInputs (Mother/Father toggle, per-child days). */
export function worksheetUiFromCaption(
  inputs: CalcInputs,
  caption: {
    parentARole: "mother" | "father" | null;
    docketNumber?: string;
    court?: string;
    preparedBy?: string;
    children?: Array<{
      name: string;
      dob: string;
      daysWithA: number;
      daysWithB: number;
    }>;
  },
): WorksheetUi {
  // Default Parent A → mother if user hasn't picked a role yet.
  const parentAParty: Party = caption.parentARole === "father" ? "father" : "mother";
  const motherIsA = parentAParty === "mother";
  const children = (caption.children ?? []).slice(0, inputs.numChildren).map((c) => ({
    name: c.name,
    dob: c.dob,
    daysMother: motherIsA ? c.daysWithA : c.daysWithB,
    daysFather: motherIsA ? c.daysWithB : c.daysWithA,
  }));
  return {
    parentAParty,
    children,
    docketNumber: caption.docketNumber || undefined,
    courtName: caption.court || undefined,
    preparerName: caption.preparedBy || undefined,
  };
}
