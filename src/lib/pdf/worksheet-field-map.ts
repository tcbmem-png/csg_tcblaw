import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { WorksheetData } from "./official-fillable-pdf";

type Party = "mother" | "father";

const N = (v?: number | string | null) =>
  v == null || v === "" ? 0 : Number(v);

/** Money formatter — rounded, thousands-separated string. Use ONLY for dollar fields. */
const money = (v?: number | null): string | undefined =>
  v == null || Number.isNaN(Number(v))
    ? undefined
    : Number(Math.round(Number(v))).toLocaleString("en-US");

/** Plain numeric rounding for non-money fields (days, percents). */
const num = (v?: number | null) =>
  v == null || Number.isNaN(v) ? undefined : Math.round(v * 100) / 100;

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
  /** Authored Part VI narrative (e.g., statutory cap explanation). When present, takes precedence over the auto-built cap note. */
  narrativeOverride?: string;
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
  const oblMoney = (v?: number | null) =>
    obligor == null
      ? { a: undefined as string | undefined, b: undefined as string | undefined }
      : obligorIsMother
        ? { a: money(v), b: undefined }
        : { a: undefined, b: money(v) };

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

  // F1: tie obligor's Line 11 to authoritative PCSO so 11(obligor) == 12 (no $1 rounding gap).
  const pcsoAbs = Math.abs(N(o.netPresumptiveSupport));
  if (obligor === "mother") aso11.m = pcsoAbs;
  else if (obligor === "father") aso11.f = pcsoAbs;

  // Part V / VI obligor singles
  // Line 12 — PCSO (authoritative)
  const pcso = oblMoney(N(o.netPresumptiveSupport));

  // Line 14 — TRUE discretionary deviations ONLY (not the PCSO→FCSO delta)
  const devTotal =
    N(o.privateSchoolDeviationFromA) + N(o.specialExpensesDeviationFromA);
  const dev = devTotal
    ? oblMoney(devTotal)
    : { a: undefined as string | undefined, b: undefined as string | undefined };

  // federal child benefit credited to the obligor (Line 1a)
  const fedBenefit = Math.abs(N(o.federalBenefitOffsetFromA));

  // Line 15 — FCSO BEFORE federal-benefit credit (allInMonthly is net of benefit, add it back)
  const fcso = oblMoney(N(o.allInMonthly) + fedBenefit);

  // Line 16 — FCSO adjusted for federal benefit; blank when no benefit
  const fcsoAdj =
    fedBenefit > 0
      ? oblMoney(N(o.allInMonthly))
      : { a: undefined as string | undefined, b: undefined as string | undefined };

  // Identification
  const names = motherIsA
    ? { mother: i.parentALabel, father: i.parentBLabel }
    : { mother: i.parentBLabel, father: i.parentALabel };

  // F5: gate each reason on its include flag — never print stale rationale.
  const reasons = [
    i.includePrivateSchool ? i.privateSchoolReason : "",
    i.includeSpecialExpenses ? i.specialExpensesReason : "",
  ]
    .filter(Boolean)
    .join("; ");

  // F4: surface the statutory cap analysis in the comments box.
  const capNote = o.pcsoExceedsStatutoryMax
    ? `Statutory cap check (Tenn. Code Ann. § 36-5-101(e)(1)(B)): calculated PCSO $${money(o.netPresumptiveSupport)}/mo ` +
      `exceeds the presumptive maximum of $${money(o.pcsoStatutoryMax)}/mo by $${money(o.pcsoExcessOverCap)}/mo. ` +
      `Amount above the cap requires written findings.`
    : "";
  const commentsCombined =
    [ui.narrativeOverride, ui.narrativeOverride ? "" : capNote, ui.comments]
      .filter((s): s is string => Boolean(s && s.trim()))
      .join("\n\n") || undefined;

  // F2: Line 4 (BCSO allotted to household) — populate in PRP (non-obligor) column.
  const prpIsMother = obligor == null ? null : !obligorIsMother;

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

    line1_income_a: money(income.m),
    line1_income_b: money(income.f),
    line1a_fed_benefit_a: money(fed.m),
    line1a_fed_benefit_b: money(fed.f),
    line1b_se_tax_a: money(se.m),
    line1b_se_tax_b: money(se.f),
    line1c_subtotal_a: money(subtotalM),
    line1c_subtotal_b: money(subtotalF),
    line1d_credit_inhome_a: money(inhome.m),
    line1d_credit_inhome_b: money(inhome.f),
    line1e_credit_not_inhome_a: money(notin.m),
    line1e_credit_not_inhome_b: money(notin.f),
    line2_agi_a: money(agi.m),
    line2_agi_b: money(agi.f),
    line2a_combined_agi: money(o.combinedAGI),
    line3_pi_a: num(piPct.m),
    line3_pi_b: num(piPct.f),

    line4_bcso_allotted_a: prpIsMother === true ? money(o.bcso) : undefined,
    line4_bcso_allotted_b: prpIsMother === false ? money(o.bcso) : undefined,
    line4a_bcso_owed_a: money(rawShare.m),
    line4a_bcso_owed_b: money(rawShare.f),
    line5_arp_parenting_a: num(days.m),
    line5_arp_parenting_b: num(days.f),
    line6_pt_adjustment_a: money(ptAdj.m),
    line6_pt_adjustment_b: money(ptAdj.f),
    line7_adjusted_bcso_a: money(adjShare.m),
    line7_adjusted_bcso_b: money(adjShare.f),

    line8a_health_insurance_a: money(health.m),
    line8a_health_insurance_b: money(health.f),
    line8b_uninsured_medical_a: money(med.m),
    line8b_uninsured_medical_b: money(med.f),
    line8c_childcare_a: money(cc.m),
    line8c_childcare_b: money(cc.f),
    line9_total_expenses_a: money(total9.m),
    line9_total_expenses_b: money(total9.f),
    line10_share_expenses_a: money(share10.m),
    line10_share_expenses_b: money(share10.f),
    line11_aso_a: money(aso11.m),
    line11_aso_b: money(aso11.f),

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
    comments: commentsCombined,
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
    narrativeOverride?: string;
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
    narrativeOverride: caption.narrativeOverride?.trim() || undefined,
  };
}
