/**
 * Georgia Child Support Worksheet — reproduce (not fill).
 *
 * Georgia's calculator never exposes a blank fillable form; it only emits a
 * populated worksheet (Worksheet + Schedules A/C/D). So we reproduce that
 * layout from the engine output, mirroring the TN worksheet-pdf SimplePdf
 * pattern (O.C.G.A. § 19-6-15). Column order is Noncustodial (obligor) /
 * Custodial / Combined — matching the official worksheet.
 *
 * The model (buildGaWorksheetModel) is pure and gated (ga-worksheet.test.ts)
 * against the engine output and the live GA Commission oracle; the renderer is
 * presentation and still wants a human eyeball vs the official specimen before
 * go-live (the forms gate's visual step).
 */
import type { IncomeSharesInputs, IncomeSharesOutputs } from "@/lib/calc/core/types";
import {
  startDoc,
  h1,
  h2,
  small,
  row,
  captionLine,
  footerNote,
  drawText,
  fmtCents,
  fmtWhole,
  fmtPct,
  ROW_W,
  type Ctx,
  type WorksheetLine,
} from "./worksheet-render-kit";
import { MARGIN, RULE } from "./simple-pdf";

export interface GaWorksheetUi {
  ncpName?: string;
  cpName?: string;
  county?: string;
  caseNumber?: string;
  comments?: string;
}

interface GaModel {
  ncpName: string;
  cpName: string;
  county: string;
  caseNumber: string;
  bcso: number;
  /** NCP parenting-time adjustment (Schedule C, Line 6); <= 0. */
  line6: number;
  /** NCP presumptive order to the cent (Line 10/13) — equals engine allInMonthly. */
  orderCents: number;
  /** Final monthly order (Line 16), whole dollars. */
  orderWhole: number;
  summary: string;
  worksheet: WorksheetLine[];
  scheduleC: WorksheetLine[];
  scheduleD: WorksheetLine[];
}

const GA_EXPONENT = 2.5; // O.C.G.A. § 19-6-15(g) cross-credit day curve

export function buildGaWorksheetModel(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: GaWorksheetUi = {},
): GaModel {
  const ncpIsA = o.allInDirection !== "parent_b_to_a"; // obligor = NCP
  const pick = <T>(a: T, b: T) => (ncpIsA ? a : b);
  const ncpName = ui.ncpName || (ncpIsA ? "Noncustodial Parent" : "Noncustodial Parent");
  const cpName = ui.cpName || "Custodial Parent";

  const grossNcp = pick(i.parentAGrossMonthly, i.parentBGrossMonthly);
  const grossCp = pick(i.parentBGrossMonthly, i.parentAGrossMonthly);
  const agiNcp = pick(o.parentAAGI, o.parentBAGI);
  const agiCp = pick(o.parentBAGI, o.parentAAGI);
  const piNcp = pick(o.piA, o.piB);
  const piCp = pick(o.piB, o.piA);
  const bcso = o.bcso;

  const bcsoNcp = piNcp * bcso; // Line 5
  const bcsoCp = piCp * bcso;

  // Schedule C parenting days (NCP / CP).
  const daysNcp = pick(i.parentADays, i.parentBDays);
  const daysCp = pick(i.parentBDays, i.parentADays);
  const ncpDays =
    i.parentingType === "standard" ? 0 : i.parentingType === "equal" ? 182.5 : (daysNcp ?? 0);
  const cpDays =
    i.parentingType === "standard" ? 0 : i.parentingType === "equal" ? 182.5 : (daysCp ?? 0);

  // Line 6 — parenting-time adjustment (cross-credit, § 19-6-15(g)); NCP only,
  // <= 0. No court-ordered parenting time => no adjustment. Recomputed from the
  // statutory day curve (mirrors core/parenting/cross-credit.ts); cross-checked
  // against the engine order below.
  let line6 = 0;
  if (i.parentingType !== "standard") {
    const iNc = Math.pow(ncpDays, GA_EXPONENT);
    const iiCp = Math.pow(cpDays, GA_EXPONENT);
    const denom = iNc + iiCp;
    line6 = denom === 0 ? 0 : -(iNc / denom) * bcso;
  }

  // Schedule D — add-ons (work-related child care + health insurance), pro-rata.
  const sum = (pred: (id: string) => boolean) =>
    (i.addOns ?? []).filter((a) => pred(a.id)).reduce((t, a) => t + (a.monthly || 0), 0);
  const ccCombined = sum((id) => /child\s*care|childcare/i.test(id));
  const hCombined = sum((id) => /health/i.test(id));
  const addCombined = ccCombined + hCombined;
  const line7Ncp = piNcp * addCombined; // each parent's pro-rata share of add-ons
  const line7Cp = piCp * addCombined;
  // Line 9 credit — add-ons a parent already pays directly.
  const paid = (party: "parent_a" | "parent_b") =>
    (i.addOns ?? [])
      .filter((a) => a.paidBy === party && /child\s*care|childcare|health/i.test(a.id))
      .reduce((t, a) => t + (a.monthly || 0), 0);
  const paidNcp = pick(paid("parent_a"), paid("parent_b"));
  const paidCp = pick(paid("parent_b"), paid("parent_a"));

  const line8Ncp = bcsoNcp + line6 + line7Ncp; // Adjusted CSO
  const line8Cp = bcsoCp + line7Cp;
  const line10Ncp = line8Ncp - paidNcp; // presumptive (after credit for direct pay)
  const line10Cp = line8Cp - paidCp;

  // Authoritative tie: the engine's final order IS the NCP presumptive.
  const orderCents = o.allInMonthly;
  const orderWhole = Math.round(orderCents);

  const M = (n: number) => fmtCents(n);
  const worksheet: WorksheetLine[] = [
    { header: true, label: "", col1: ncpName, col2: cpName, combined: "Total" },
    {
      n: "1",
      label: "Monthly Gross Income",
      col1: M(grossNcp),
      col2: M(grossCp),
      combined: M(grossNcp + grossCp),
    },
    {
      n: "2",
      label: "Monthly Adjusted Income",
      col1: M(agiNcp),
      col2: M(agiCp),
      combined: M(o.combinedAGI),
    },
    {
      n: "3",
      label: "Pro Rata Shares of Combined Income",
      col1: fmtPct(piNcp),
      col2: fmtPct(piCp),
      combined: "100.00%",
    },
    { n: "4", label: "Basic Child Support Obligation (from the Table)", combined: M(bcso) },
    {
      n: "5",
      label: "Pro rata shares of Basic Child Support Obligation",
      col1: M(bcsoNcp),
      col2: M(bcsoCp),
    },
    { n: "6", label: "Parenting Time Adjustment", col1: line6 ? M(line6) : "" },
    {
      n: "7",
      label: "Adjustment for Work Related Child Care and Health Insurance Expenses",
      col1: line7Ncp ? M(line7Ncp) : "",
      col2: line7Cp ? M(line7Cp) : "",
    },
    { n: "8", label: "Adjusted Child Support Obligation", col1: M(line8Ncp), col2: M(line8Cp) },
    {
      n: "9",
      label: "Adjustment for Additional Expenses Paid",
      col1: paidNcp ? M(paidNcp) : "",
      col2: paidCp ? M(paidCp) : "",
    },
    {
      n: "10",
      label: "Presumptive Amount of Child Support",
      col1: M(line10Ncp),
      col2: M(line10Cp),
      emphasis: true,
    },
    {
      n: "11",
      label: "Subtotal with Low Income Adjustment",
      col1: M(line10Ncp),
      col2: M(line10Cp),
    },
    { n: "12", label: "Deviations From Presumptive Child Support Amount", col1: "", col2: "" },
    { n: "13", label: "Subtotal", col1: M(line10Ncp), col2: M(line10Cp) },
    { n: "14", label: "Social Security Payments to Children", col1: "", col2: "" },
    { n: "15", label: "Veterans Affairs Disability Payments to Children", col1: "", col2: "" },
    {
      n: "16",
      label: "Final Monthly Child Support Amount",
      col1: fmtWhole(orderWhole),
      col2: fmtWhole(line10Cp),
      emphasis: true,
    },
    {
      n: "17",
      label: "Percentages for each parent for future Uninsured Health Expenses",
      col1: fmtPct(piNcp),
      col2: fmtPct(piCp),
    },
  ];

  const scheduleC: WorksheetLine[] = [
    { header: true, label: "", col1: ncpName, col2: cpName, combined: "Combined" },
    {
      label: "Parenting days",
      col1: ncpDays.toFixed(2),
      col2: cpDays.toFixed(2),
      combined: (ncpDays + cpDays).toFixed(2),
    },
    { label: "BCSO Share", col1: M(bcsoNcp), col2: M(bcsoCp), combined: M(bcso) },
    { label: "Final Adjustment", col1: line6 ? M(line6) : "", combined: line6 ? M(line6) : "" },
  ];

  const scheduleD: WorksheetLine[] = [
    { header: true, label: "", col1: ncpName, col2: cpName, combined: "Combined" },
    {
      n: "1",
      label: "Work Related Child Care expenses",
      col1: M(0),
      col2: M(0),
      combined: M(ccCombined),
    },
    {
      n: "2",
      label: "Health Insurance Premiums paid for the children",
      col1: M(pick(paid("parent_a"), paid("parent_b"))),
      col2: M(pick(paid("parent_b"), paid("parent_a"))),
      combined: M(hCombined),
    },
    {
      n: "3",
      label: "Total Monthly Additional Expenses (Line 1 + Line 2)",
      combined: M(addCombined),
    },
    {
      n: "4",
      label: "Pro Rata Share of parent's income (Worksheet Line 3)",
      col1: fmtPct(piNcp),
      col2: fmtPct(piCp),
      combined: "100.00%",
    },
    {
      n: "5",
      label: "Pro Rata Share of Additional Expenses (-> Worksheet Line 7)",
      col1: M(line7Ncp),
      col2: M(line7Cp),
      combined: M(addCombined),
    },
  ];

  return {
    ncpName,
    cpName,
    county: ui.county || "",
    caseNumber: ui.caseNumber || "",
    bcso,
    line6,
    orderCents,
    orderWhole,
    summary: `${ncpName} pays ${cpName} $${orderWhole.toLocaleString("en-US")} a month`,
    worksheet,
    scheduleC,
    scheduleD,
  };
}

function section(ctx: Ctx, title: string, lines: WorksheetLine[]) {
  h2(ctx, title);
  for (const l of lines) row(ctx, l);
}

export function renderGaWorksheetPdf(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: GaWorksheetUi = {},
): Uint8Array {
  const m = buildGaWorksheetModel(i, o, ui);
  const ctx = startDoc("Georgia Child Support Worksheet");

  h1(ctx, "Georgia Child Support Worksheet");
  small(
    ctx,
    "Income Shares Model — O.C.G.A. § 19-6-15. Reproduced from the calculation engine; not the State-generated file.",
  );

  const boxTop = ctx.y;
  ctx.y -= 6;
  if (m.county) captionLine(ctx, "County:", m.county);
  if (m.caseNumber) captionLine(ctx, "Civil Action Case No.:", m.caseNumber);
  captionLine(ctx, "Noncustodial Parent:", m.ncpName);
  captionLine(ctx, "Custodial Parent:", m.cpName);
  captionLine(ctx, "Number of Children:", String(i.numChildren));
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 6;

  section(ctx, "Worksheet", m.worksheet);
  ctx.y -= 6;
  drawText(ctx, m.summary, MARGIN, ctx.y - 12, { size: 13, bold: true });
  ctx.y -= 18;

  section(ctx, "Schedule C — Parenting Time", m.scheduleC);
  drawText(
    ctx,
    `Final NCP Adjustment: ${fmtCents(Math.abs(m.line6))} / month`,
    MARGIN,
    ctx.y - 12,
    { size: 11, bold: true },
  );
  ctx.y -= 18;

  section(ctx, "Schedule D — Health Insurance & Work Related Child Care", m.scheduleD);

  ctx.y -= 8;
  footerNote(
    ctx,
    "Reproduced by CSG Helper to mirror the Georgia Child Support Commission worksheet (O.C.G.A. § 19-6-15). Verify all inputs and consult counsel before filing.",
  );
  return ctx.pdf.save();
}
