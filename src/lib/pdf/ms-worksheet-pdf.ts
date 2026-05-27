import type {
  MSInputs,
  MSOutputs,
  MSFactorLetter,
  MSDeviation,
  MSDeviationStructured,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  SimplePdf,
  MARGIN,
  PAGE_W,
  PAGE_H,
  INK,
  MUTED,
  RULE,
  HEAD_BG,
  EMPH_BG,
  cleanText,
  trimToWidth,
  widthOfText,
  wrapText,
  type Color,
} from "./simple-pdf";

const ROW_W = PAGE_W - MARGIN * 2;
const COL_NUM_X = MARGIN;
const COL_LABEL_X = MARGIN + 24;
const COL_TOTAL_RIGHT = PAGE_W - MARGIN;
const LABEL_MAX_W = COL_TOTAL_RIGHT - COL_LABEL_X - 90;

const FACTOR_TITLES: Record<MSFactorLetter, string> = {
  a: "Extraordinary medical, psychological, educational, or dental expenses",
  b: "Independent income of the child",
  c: "Payment of both child support and spousal support to the obligee",
  d: "Seasonal variations in one or both parents' incomes or expenses",
  e: "The age of the child",
  f: "Special needs traditionally met within the family budget",
  g: "The particular shared parental arrangement",
  h: "Total available assets of the obligee, obligor, and the child",
  i: "Payment by the obligee of child care expenses (employment or disability)",
  j: "Any other adjustment needed to achieve an equitable result",
};

function fmt(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function fmt2(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
}

interface Ctx {
  pdf: SimplePdf;
  y: number;
}

function newPage(ctx: Ctx) {
  ctx.pdf.newPage();
  ctx.y = PAGE_H - MARGIN;
}

function ensure(ctx: Ctx, need: number) {
  if (ctx.y - need < MARGIN) newPage(ctx);
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color; maxWidth?: number } = {},
) {
  const size = opts.size ?? 10;
  const str = opts.maxWidth ? trimToWidth(text, size, opts.maxWidth) : cleanText(text);
  ctx.pdf.text(str, x, y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function drawTextRight(
  ctx: Ctx,
  text: string,
  rightX: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: Color } = {},
) {
  const size = opts.size ?? 10;
  const str = cleanText(text);
  ctx.pdf.text(str, rightX - widthOfText(str, size), y, size, opts.bold ? "F2" : "F1", opts.color ?? INK);
}

function h1(ctx: Ctx, t: string) {
  ensure(ctx, 24);
  drawText(ctx, t, MARGIN, ctx.y - 14, { size: 16, bold: true });
  ctx.y -= 20;
}

function h2(ctx: Ctx, t: string) {
  ensure(ctx, 22);
  ctx.y -= 8;
  drawText(ctx, t, MARGIN, ctx.y - 10, { size: 12, bold: true });
  ctx.y -= 14;
}

function small(ctx: Ctx, t: string) {
  ensure(ctx, 12);
  drawText(ctx, t, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
  ctx.y -= 12;
}

interface RowOpts {
  n?: string;
  label: string;
  total?: string;
  emphasis?: boolean;
  header?: boolean;
}

function row(ctx: Ctx, r: RowOpts) {
  const h = 16;
  ensure(ctx, h);
  const top = ctx.y;
  if (r.header) ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, HEAD_BG);
  else if (r.emphasis) ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, EMPH_BG);
  ctx.pdf.line(MARGIN, top - h, PAGE_W - MARGIN, top - h, RULE, 0.5);
  const textY = top - h + 5;
  if (r.n) drawText(ctx, r.n, COL_NUM_X, textY, { size: 8, color: MUTED });
  drawText(ctx, r.label, COL_LABEL_X, textY, {
    bold: r.emphasis || r.header,
    maxWidth: LABEL_MAX_W,
  });
  if (r.total) drawTextRight(ctx, r.total, COL_TOTAL_RIGHT, textY, { bold: !!r.emphasis });
  ctx.y -= h;
}

function captionLine(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 12);
  drawText(ctx, label, MARGIN + 6, ctx.y - 9, { bold: true, size: 9 });
  drawText(ctx, value, MARGIN + 96, ctx.y - 9, { size: 9, maxWidth: ROW_W - 106 });
  ctx.y -= 12;
}

function paragraph(ctx: Ctx, text: string, opts: { size?: number; color?: Color } = {}) {
  const size = opts.size ?? 9;
  const lines = wrapText(text, size, ROW_W);
  const lh = size + 2;
  for (const line of lines) {
    ensure(ctx, lh);
    drawText(ctx, line, MARGIN, ctx.y - size, { size, color: opts.color ?? INK });
    ctx.y -= lh;
  }
}

function footerNote(ctx: Ctx, text: string) {
  paragraph(ctx, text, { size: 8, color: MUTED });
  ctx.y -= 2;
}

function calloutBox(ctx: Ctx, title: string, body: string) {
  const size = 9;
  const lines = wrapText(body, size, ROW_W - 16);
  const lh = size + 2;
  const h = 18 + lines.length * lh + 8;
  ensure(ctx, h);
  const top = ctx.y;
  ctx.pdf.fillRect(MARGIN, top - h, ROW_W, h, EMPH_BG);
  ctx.pdf.strokeRect(MARGIN, top - h, ROW_W, h, RULE, 0.75);
  drawText(ctx, title, MARGIN + 8, top - 13, { size: 10, bold: true });
  let y = top - 13 - 8;
  for (const line of lines) {
    drawText(ctx, line, MARGIN + 8, y - size, { size });
    y -= lh;
  }
  ctx.y = top - h - 6;
}

function captionBlock(ctx: Ctx, inputs: MSInputs, caption: CaseCaption) {
  const boxTop = ctx.y;
  ctx.y -= 6;
  if (caption.matterName) captionLine(ctx, "Matter:", caption.matterName);
  if (caption.docketNumber) captionLine(ctx, "Cause No.:", caption.docketNumber);
  if (caption.court) captionLine(ctx, "Court:", caption.court);
  if (caption.preparedBy) captionLine(ctx, "Prepared by:", caption.preparedBy);
  if (caption.client) captionLine(ctx, "Client:", caption.client);
  captionLine(ctx, "Obligor:", inputs.obligorLabel || "Obligor");
  captionLine(ctx, "Obligee:", inputs.obligeeLabel || "Obligee");
  captionLine(ctx, "Children:", String(inputs.numChildren));
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 4;
}

/**
 * Bullet list of human-readable lines for one structured deviation variant.
 */
function structuredLines(s: MSDeviationStructured): string[] {
  const out: string[] = [];
  const m = (n: number) => `$${Math.abs(n).toLocaleString("en-US")}`;
  switch (s.letter) {
    case "a": {
      const types = Object.entries(s.types).filter(([, v]) => v).map(([k]) => k);
      if (types.length) out.push(`Type: ${types.join(", ")}`);
      if (s.description) out.push(`Description: ${s.description}`);
      if (s.currentMonthlyCost) out.push(`Current monthly cost: ${m(s.currentMonthlyCost)}`);
      if (s.anticipatedDuration) out.push(`Duration: ${s.anticipatedDuration}`);
      if (s.outOfPocket) out.push(`Out-of-pocket / mo: ${m(s.outOfPocket)}`);
      if (s.currentlyPaidBy) out.push(`Currently paid by: ${s.currentlyPaidBy}`);
      out.push(`Proposed obligor share: ${s.allocationObligorPct}%`);
      break;
    }
    case "b": {
      const parts: string[] = [];
      if (s.earnedMonthly) parts.push(`Earned ${m(s.earnedMonthly)}`);
      if (s.ssBenefitsMonthly) parts.push(`SS ${m(s.ssBenefitsMonthly)}`);
      if (s.trustMonthly) parts.push(`Trust ${m(s.trustMonthly)}`);
      if (s.investmentMonthly) parts.push(`Investment ${m(s.investmentMonthly)}`);
      if (s.otherMonthly) parts.push(`Other ${m(s.otherMonthly)}`);
      if (parts.length) out.push(`Child income / mo: ${parts.join("; ")}`);
      if (s.reliableRecurring) out.push(`Reliable/recurring: ${s.reliableRecurring}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "c": {
      if (s.status) out.push(`Spousal-support status: ${s.status}`);
      if (s.currentMonthly) out.push(`Current monthly spousal: ${m(s.currentMonthly)}`);
      const basis: string[] = [];
      if (s.basis.courtOrder) basis.push("court order");
      if (s.basis.propertySettlement) basis.push("PSA");
      if (s.basis.pendingDissolution) basis.push("pending dissolution");
      if (basis.length) out.push(`Basis: ${basis.join(", ")}`);
      if (s.basis.caseNumber) out.push(`Case no.: ${s.basis.caseNumber}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "d": {
      if (s.whichParent) out.push(`Which parent: ${s.whichParent}`);
      if (s.peakMonths) out.push(`Peak months: ${s.peakMonths}`);
      if (s.lowMonths) out.push(`Low months: ${s.lowMonths}`);
      if (s.highMonthGross) out.push(`High month gross: ${m(s.highMonthGross)}`);
      if (s.lowMonthGross) out.push(`Low month gross: ${m(s.lowMonthGross)}`);
      if (s.approach) out.push(`Approach: ${s.approach}`);
      if (s.adjustedMonthlyAmount) out.push(`Adjusted monthly: ${m(s.adjustedMonthlyAmount)}`);
      if (s.source) out.push(`Source: ${s.source}`);
      if (s.buildInNote) out.push(s.buildInNote);
      break;
    }
    case "e": {
      if (s.ages) out.push(`Ages: ${s.ages}`);
      const flags: string[] = [];
      if (s.greaterPerChildCosts) flags.push("greater per-child costs");
      if (s.greaterEducational) flags.push("greater educational");
      if (s.needsJustifyUpward) flags.push("upward justified");
      if (flags.length) out.push(flags.join("; "));
      if (s.itemsNotCovered) out.push(`Items not covered: ${s.itemsNotCovered}`);
      break;
    }
    case "f": {
      const cats = Object.entries(s.categories).filter(([, v]) => v).map(([k]) => k);
      if (cats.length) out.push(`Categories: ${cats.join(", ")}`);
      if (s.description) out.push(s.description);
      if (s.establishedPattern) out.push(`Pattern: ${s.establishedPattern}`);
      if (s.monthlyCost) out.push(`Monthly cost: ${m(s.monthlyCost)}`);
      break;
    }
    case "g": {
      if (s.arrangement) out.push(`Arrangement: ${s.arrangement === "other" ? s.arrangementOther : s.arrangement}`);
      if (s.obligorOvernights || s.obligeeOvernights)
        out.push(`Overnights — obligor: ${s.obligorOvernights}, obligee: ${s.obligeeOvernights}`);
      const dir: string[] = [];
      if (s.directExpenses.foodMonthly) dir.push(`food ${m(s.directExpenses.foodMonthly)}`);
      if (s.directExpenses.activitiesMonthly) dir.push(`activities ${m(s.directExpenses.activitiesMonthly)}`);
      if (s.directExpenses.clothingMonthly) dir.push(`clothing ${m(s.directExpenses.clothingMonthly)}`);
      if (s.directExpenses.transportationMonthly) dir.push(`transport ${m(s.directExpenses.transportationMonthly)}`);
      if (s.directExpenses.otherMonthly) dir.push(`other ${m(s.directExpenses.otherMonthly)}`);
      if (dir.length) out.push(`Direct expenses / mo: ${dir.join("; ")}`);
      if (s.duplicatedExpenses) out.push(`Duplicated expenses: ${s.duplicatedExpenses}${s.duplicatedExpensesNote ? ` — ${s.duplicatedExpensesNote}` : ""}`);
      if (s.approach) out.push(`Approach: ${s.approach === "other" ? s.approachOther : s.approach}`);
      if (s.downwardAmount) out.push(`Downward amount: ${m(s.downwardAmount)}`);
      break;
    }
    case "h": {
      const sumAssets = (a: typeof s.obligor) =>
        a.realEstate + a.equity + a.investments + a.retirement + a.business + a.other;
      out.push(`Obligor assets total: ${m(sumAssets(s.obligor))}`);
      out.push(`Obligee assets total: ${m(sumAssets(s.obligee))}`);
      if (s.child.value) out.push(`Child assets: ${m(s.child.value)}${s.child.note ? ` — ${s.child.note}` : ""}`);
      if (s.incomeFromAssets) out.push(`Income from assets: ${s.incomeFromAssets}${s.partialNote ? ` — ${s.partialNote}` : ""}`);
      if (s.description) out.push(s.description);
      break;
    }
    case "i": {
      if (s.reason) out.push(`Reason: ${s.reason}`);
      if (s.provider) out.push(`Provider: ${s.provider}`);
      if (s.monthlyCost) out.push(`Monthly cost: ${m(s.monthlyCost)}`);
      if (s.hoursPerWeek) out.push(`Hours/wk: ${s.hoursPerWeek}`);
      if (s.taxCredit) out.push(`Tax credit: ${s.taxCredit}`);
      if (s.netOutOfPocket) out.push(`Net out-of-pocket: ${m(s.netOutOfPocket)}`);
      if (s.allocation) out.push(`Allocation: ${s.allocation === "other" ? s.allocationOther : s.allocation}`);
      if (s.childrenCoveredNote) out.push(s.childrenCoveredNote);
      break;
    }
    case "j": {
      if (s.basisIsExistingDebt) out.push("Basis: existing debt obligation");
      if (s.basisIsOtherEquity) out.push(`Basis: other equity — ${s.otherEquityNote || "(unspecified)"}`);
      const types = Object.entries(s.debtType)
        .filter(([k, v]) => v && k !== "otherNote")
        .map(([k]) => k);
      if (types.length) out.push(`Debt type: ${types.join(", ")}`);
      if (s.currentMonthlyPayment) out.push(`Current monthly payment: ${m(s.currentMonthlyPayment)}`);
      if (s.remainingMonths) out.push(`Remaining months: ${s.remainingMonths}`);
      if (s.originalPayee) out.push(`Original payee: ${s.originalPayee}`);
      if (s.whyDeviationWorthy) out.push(s.whyDeviationWorthy);
      break;
    }
  }
  return out;
}

function renderStructuredDeviation(ctx: Ctx, d: MSDeviation) {
  row(ctx, {
    label: `(${d.letter}) ${FACTOR_TITLES[d.letter]}`,
    total: fmt2(d.proposedMonthly),
    header: true,
  });
  const lines = d.structured ? structuredLines(d.structured) : [];
  if (d.description) lines.push(`Additional context: ${d.description}`);
  if (lines.length === 0) {
    small(ctx, "  (no structured detail provided)");
  } else {
    for (const line of lines) {
      paragraph(ctx, `  • ${line}`, { size: 9 });
    }
  }
  ctx.y -= 2;
}

function renderSuspensionFinding(ctx: Ctx, outputs: MSOutputs) {
  h2(ctx, "§ 43-19-36 Finding — Obligation Suspended");
  calloutBox(
    ctx,
    "Obligation suspended by operation of law",
    outputs.suspensionReason ??
      "Obligor is incarcerated for more than 180 consecutive days, no statutory carve-out applies, and the obligor lacks means to pay during incarceration.",
  );
  paragraph(
    ctx,
    "Under Miss. Code Ann. § 43-19-36(2), the support obligation is suspended by operation of law. The suspension does not affect arrears accrued before incarceration. The obligation resumes the first day of the month following 60 days after release. § 43-19-36(3).",
    { size: 9 },
  );
  ctx.y -= 4;
  paragraph(
    ctx,
    "Because the suspension applies, no § 43-19-101 percentage calculation is performed for the period of incarceration. The chancellor may revisit the obligation upon release or upon a showing that a § 43-19-36(2) exception applies.",
    { size: 9 },
  );
}

function renderSideBySide(ctx: Ctx, inputs: MSInputs, outputs: MSOutputs) {
  if (!inputs.deviationsB || !outputs.positionB) return;

  h2(ctx, "IV. Side-by-Side Deviation Comparison (§ 43-19-103)");
  small(
    ctx,
    `${inputs.obligorLabel} vs ${inputs.obligeeLabel}. Both columns are proposals; the chancellor retains discretion.`,
  );

  let totalA = 0;
  let totalB = 0;

  for (let i = 0; i < inputs.deviationsA.length; i++) {
    const dA = inputs.deviationsA[i];
    const dB = inputs.deviationsB[i];
    if (!dA.applicable && !dB?.applicable) continue;

    const a = dA.applicable ? dA.proposedMonthly : 0;
    const b = dB?.applicable ? dB.proposedMonthly : 0;
    totalA += a;
    totalB += b;

    row(ctx, {
      label: `(${dA.letter}) ${FACTOR_TITLES[dA.letter]}`,
      header: true,
    });
    row(ctx, { label: `  ${inputs.obligorLabel}`, total: fmt2(a) });
    if (dA.applicable && dA.description) {
      paragraph(ctx, `    ${dA.description}`, { size: 8, color: MUTED });
    }
    row(ctx, { label: `  ${inputs.obligeeLabel}`, total: fmt2(b) });
    if (dB?.applicable && dB.description) {
      paragraph(ctx, `    ${dB.description}`, { size: 8, color: MUTED });
    }
    row(ctx, { label: "  Gap (obligor − obligee)", total: fmt2(a - b) });
  }

  ctx.y -= 4;
  row(ctx, { label: `${inputs.obligorLabel} — total deviations`, total: fmt2(totalA), emphasis: true });
  row(ctx, { label: `${inputs.obligeeLabel} — total deviations`, total: fmt2(totalB), emphasis: true });
  row(ctx, { label: "Aggregate gap / mo", total: fmt2(totalA - totalB), emphasis: true });

  // Final monthly comparison
  h2(ctx, "V. Proposed Final Monthly Award — Side by Side");
  row(ctx, {
    label: `${inputs.obligorLabel} — proposed final / mo`,
    total: fmt2(outputs.proposedFinalMonthly),
    emphasis: true,
  });
  row(ctx, {
    label: `${inputs.obligeeLabel} — proposed final / mo`,
    total: fmt2(outputs.positionB.proposedFinalMonthly),
    emphasis: true,
  });
  row(ctx, {
    label: "Gap / mo",
    total: fmt2(outputs.proposedFinalMonthly - outputs.positionB.proposedFinalMonthly),
  });
  row(ctx, {
    label: "Annualized gap",
    total: fmt2((outputs.proposedFinalMonthly - outputs.positionB.proposedFinalMonthly) * 12),
  });
}

export async function renderMSWorksheetPdf(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
}): Promise<Uint8Array> {
  const { inputs, outputs, caption } = args;

  const pdf = new SimplePdf(caption.matterName || "MS Child Support Worksheet");
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN };

  h1(ctx, "Mississippi Child Support Worksheet");

  // § 43-19-36 suspension short-circuit: cover-style finding page, stop.
  if (outputs.suspensionApplies) {
    small(
      ctx,
      `Miss. Code Ann. § 43-19-36 (suspension during incarceration). Guidelines effective ${outputs.guidelinesEffectiveDate}.`,
    );
    captionBlock(ctx, inputs, caption);
    renderSuspensionFinding(ctx, outputs);

    if (outputs.warnings.length > 0) {
      h2(ctx, "Notes");
      for (const w of outputs.warnings) {
        paragraph(ctx, `• ${w}`, { size: 9 });
      }
    }

    ctx.y -= 8;
    footerNote(
      ctx,
      "This worksheet is a calculation aid produced by TCB Law's Mississippi child support calculator. It is not legal advice and is not an official MDHS form. Authority: Miss. Code Ann. § 43-19-36.",
    );
    return pdf.save();
  }

  small(
    ctx,
    `Miss. Code Ann. § 43-19-101 (presumptive guideline) and § 43-19-103 (deviation criteria). Guidelines effective ${outputs.guidelinesEffectiveDate}.`,
  );

  captionBlock(ctx, inputs, caption);

  // I. AGI computation
  h2(ctx, "I. Adjusted Gross Income (§ 43-19-101(3))");
  row(ctx, { n: "#", label: "Item (annual unless noted)", total: "Amount", header: true });
  row(ctx, {
    n: "1",
    label: inputs.agiBasis === "imputed"
      ? "Obligor's gross income (imputed under § 43-19-101(5))"
      : "Obligor's gross income from all sources",
    total: fmt(inputs.obligorAnnualGross),
  });
  row(ctx, { n: "2", label: "Less: federal, state, and local taxes (actual liability)", total: `(${fmt(inputs.obligorAnnualTaxes)})` });
  row(ctx, { n: "3", label: "Less: Social Security contributions", total: `(${fmt(inputs.obligorAnnualSocialSecurity)})` });
  row(ctx, { n: "4", label: "Less: mandatory retirement / disability contributions", total: `(${fmt(inputs.obligorAnnualMandatoryRetirement)})` });
  row(ctx, { n: "5", label: "Less: pre-existing court-ordered support (other children)", total: `(${fmt(inputs.preexistingSupportAnnual)})` });
  row(ctx, { n: "6", label: "Annual Adjusted Gross Income", total: fmt(outputs.annualAGI), emphasis: true });
  if (inputs.inHomeChildrenDeductionMonthly > 0) {
    row(ctx, { n: "7", label: "Less: discretionary in-home other-children deduction (monthly)", total: `(${fmt(inputs.inHomeChildrenDeductionMonthly)})` });
  }
  row(ctx, { n: "8", label: "Monthly Adjusted Gross Income", total: fmt2(outputs.monthlyAGI), emphasis: true });

  if (inputs.agiBasis === "imputed") {
    const basis: string[] = [];
    if (inputs.imputationBasis.pastEarnings) basis.push("past earnings and employment history");
    if (inputs.imputationBasis.jobSkills) basis.push("job skills and educational attainment");
    if (inputs.imputationBasis.localMarket) basis.push("local job market & prevailing earnings");
    if (inputs.imputationBasis.availableEmployers) basis.push("available employers willing to hire");
    if (inputs.imputationBasis.other)
      basis.push(`other factors${inputs.imputationBasis.note ? ` (${inputs.imputationBasis.note})` : ""}`);
    calloutBox(
      ctx,
      "Imputed income — § 43-19-101(5)",
      basis.length
        ? `Basis: ${basis.join("; ")}.`
        : "Basis not specified; § 43-19-101(5) requires fact-specific findings rather than a standard amount.",
    );
  }

  // Threshold callouts
  if (outputs.requiresFindingHighIncome) {
    calloutBox(
      ctx,
      "Written finding required — § 43-19-101(4)",
      "Annual AGI exceeds $100,000. The chancellor must make a written finding as to whether the guideline percentage is reasonable in this case. The presumptive figure below may be adjusted upward, downward, or affirmed.",
    );
  }
  if (outputs.requiresFindingLowIncome) {
    calloutBox(
      ctx,
      "Written finding required — § 43-19-101(4)",
      "Annual AGI is below $10,000. The chancellor must make a written finding as to whether the guideline percentage is reasonable in this case. Low-income obligors are often eligible for downward deviation.",
    );
  }

  // II. Presumptive
  h2(ctx, "II. Presumptive Monthly Award (§ 43-19-101(1))");
  row(ctx, { n: "9", label: `Statutory percentage (${inputs.numChildren} ${inputs.numChildren === 1 ? "child" : "children"})`, total: `${(outputs.statutoryPercentage * 100).toFixed(0)}%` });
  row(ctx, { n: "10", label: "Presumptive monthly support  =  Monthly AGI × percentage", total: fmt2(outputs.presumptiveMonthly), emphasis: true });

  // III. Health insurance
  h2(ctx, "III. Health Insurance (§ 43-19-101(6))");
  if (inputs.healthInsuranceProvidedBy === "obligee" && inputs.healthInsuranceMonthly > 0) {
    row(ctx, { n: "11", label: "Children's portion of monthly premium (obligee provides — added to award)", total: fmt2(outputs.healthInsuranceAddOnMonthly) });
  } else if (inputs.healthInsuranceProvidedBy === "obligor" && inputs.healthInsuranceMonthly > 0) {
    row(ctx, { n: "11", label: "Children's portion of monthly premium (obligor provides — informational)", total: fmt2(inputs.healthInsuranceMonthly) });
    small(ctx, "Court may adjust the support obligation to reflect a share of the obligor-paid premium.");
  } else {
    row(ctx, { n: "11", label: "Children's portion of monthly premium", total: "-" });
  }

  // IV. Deviations — single or side-by-side
  if (inputs.comparisonMode === "side_by_side") {
    renderSideBySide(ctx, inputs, outputs);
  } else {
    const applicable = inputs.deviationsA.filter((d) => d.applicable);
    h2(ctx, "IV. Proposed Deviations (§ 43-19-103)");
    if (applicable.length === 0) {
      small(ctx, "No statutory deviation factors marked applicable. Presumptive amount stands.");
    } else {
      for (const d of applicable) {
        renderStructuredDeviation(ctx, d);
      }
      row(ctx, { label: "Total proposed deviations", total: fmt2(outputs.totalDeviationsMonthly), emphasis: true });
      small(ctx, "Proposed by user — the court has final discretion. § 43-19-103 requires written findings.");
    }

    // V. Final
    h2(ctx, "V. Proposed Final Monthly Award");
    row(ctx, { label: "Presumptive amount", total: fmt2(outputs.presumptiveMonthly) });
    if (outputs.healthInsuranceAddOnMonthly > 0) {
      row(ctx, { label: "Plus: health insurance add-on", total: fmt2(outputs.healthInsuranceAddOnMonthly) });
    }
    if (outputs.totalDeviationsMonthly !== 0) {
      row(ctx, { label: `${outputs.totalDeviationsMonthly >= 0 ? "Plus" : "Less"}: net deviations`, total: fmt2(outputs.totalDeviationsMonthly) });
    }
    row(ctx, { label: "Proposed final monthly support", total: fmt2(outputs.proposedFinalMonthly), emphasis: true });
  }

  // Notes
  if (outputs.warnings.length > 0) {
    h2(ctx, "Notes");
    for (const w of outputs.warnings) {
      paragraph(ctx, `• ${w}`, { size: 9 });
    }
  }

  ctx.y -= 8;
  footerNote(
    ctx,
    "This worksheet is a calculation aid produced by TCB Law's Mississippi child support calculator. It is not legal advice and is not an official MDHS form. Authority: Miss. Code Ann. §§ 43-19-101 and 43-19-103. Verify all inputs and consult counsel before filing.",
  );

  return pdf.save();
}
