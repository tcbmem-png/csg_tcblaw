/**
 * Alabama CS-42 (Child Support Guidelines worksheet, eff. 5/1/2022) field map.
 *
 * STANDARD CUSTODY ONLY. CS-42-S (shared 50/50, eff. 6/1/2023) is a different
 * form that bakes in the 1.5x multiplier and a different SSR posture; it is NOT
 * wired here and the builder throws if handed a shared/split arrangement.
 *
 * Maps the generic income-shares engine output (IncomeSharesInputs/Outputs) to
 * the 65 named AcroForm fields in the official PDF. Decoded prefixes: P =
 * Plaintiff column, D = Defendant column, C = Combined. The Plaintiff/Defendant
 * axis is NOT the payor/obligor axis — the caller supplies which engine party is
 * the Plaintiff (`ui.plaintiff`), and every value is bound to a column through
 * that. Get this wrong and the order inverts on paper; the verification gate
 * (src/lib/pdf/__tests__/al-cs42-fill.test.ts) pins the column binding both ways.
 *
 * SSR (Rule 32(C)(5)) is an obligor-only computation reproduced from
 * AL_SSR_PARAMS: Income Available = max(0, obligorAGI - reserve); Max
 * Recommended After SSR = incentivePct x that. Only the obligor's column gets
 * these; the recipient's and the Combined SSR cells stay blank.
 *
 * Intentionally LEFT BLANK pending an official-instruction render check (filling
 * a guessed number on a filed form is the exact risk the gate guards against):
 *   "Defendant Child Support Obligation", "PCSO", "Final Child Support Order_3",
 *   and the non-obligor / Combined SSR-flow cells.
 */
import type { IncomeSharesInputs, IncomeSharesOutputs } from "../../core/types";
import type { AcroFormData } from "@/lib/pdf/acroform-fill";
import { AL_SSR_PARAMS } from "./spec";

export const AL_CS42_TEMPLATE_URL = "/forms/AL_CS-42_ChildSupportGuidelines_STANDARD_2022.pdf";

type EngineParty = "parent_a" | "parent_b";

export interface AlCs42Ui {
  /** Which engine party occupies the Plaintiff column (column binding). */
  plaintiff: EngineParty;
  plaintiffName?: string;
  defendantName?: string;
  caseNumber?: string;
  county?: string;
  circuitOrDistrict?: string;
  children?: Array<{ name?: string; dob?: string }>;
  preparedBy?: string;
  date?: string;
  comments?: string;
}

/** Round to whole dollars (AL orders are whole-dollar; finalOrder half_up). */
const dollars = (v: number | null | undefined): string | undefined =>
  v == null || Number.isNaN(v) ? undefined : String(Math.round(v));
/** Like dollars(), but blank for zero — for optional deduction lines. */
const dollarsNZ = (v: number): string | undefined =>
  Math.round(v) === 0 ? undefined : String(Math.round(v));

export function buildAlCs42Data(
  i: IncomeSharesInputs,
  o: IncomeSharesOutputs,
  ui: AlCs42Ui,
): AcroFormData {
  if (i.parentingType !== "standard" || i.splitCustody) {
    throw new Error(
      "AL CS-42 fill is standard-custody only; shared 50/50 (CS-42-S) and split " +
        "custody are not wired. Refusing to fill the standard form for a non-standard case.",
    );
  }

  const sum = (pred: (id: string) => boolean) =>
    (i.addOns ?? []).filter((a) => pred(a.id)).reduce((t, a) => t + (a.monthly || 0), 0);
  const ccCombined = sum((id) => /child\s*care|childcare/i.test(id));
  const hCombined = sum((id) => /health/i.test(id));

  const bcso = o.bcso;
  const tcsoCombined = bcso + ccCombined + hCombined;

  // Per engine party (a/b). Shares use the engine's already-rounded pi (AL Rule
  // 32(C)(3) nearest 1%), so the two columns reconcile to the combined line.
  const per = (pi: number, gross: number, agi: number, party: EngineParty) => {
    const costsPaid = (i.addOns ?? [])
      .filter((a) => a.paidBy === party)
      .reduce((t, a) => t + (a.monthly || 0), 0);
    const tcso = Math.round(pi * tcsoCombined);
    return {
      gross,
      agi,
      pct: String(Math.round(pi * 100)),
      bcsoShare: Math.round(pi * bcso),
      cc: Math.round(pi * ccCombined),
      health: Math.round(pi * hCombined),
      tcso,
      costsPaid,
      // "Obligation Before Consideration [of SSR]" = each parent's total
      // obligation net of the add-ons they pay directly (pre-SSR).
      oblBeforeSsr: tcso - costsPaid,
    };
  };
  const A = per(o.piA, i.parentAGrossMonthly, o.parentAAGI, "parent_a");
  const B = per(o.piB, i.parentBGrossMonthly, o.parentBAGI, "parent_b");

  const plaintiffIsA = ui.plaintiff === "parent_a";
  // Column selectors: P() picks the Plaintiff-column value, D() the Defendant.
  const P = <T>(a: T, b: T): T => (plaintiffIsA ? a : b);
  const D = <T>(a: T, b: T): T => (plaintiffIsA ? b : a);

  // Obligor (who pays) from the engine's net direction.
  const obligor: EngineParty | null =
    o.allInDirection === "parent_a_to_b"
      ? "parent_a"
      : o.allInDirection === "parent_b_to_a"
        ? "parent_b"
        : null;
  const obligorIsA = obligor === "parent_a";
  const obligorIsPlaintiff = obligor != null && obligorIsA === plaintiffIsA;

  // SSR (Rule 32(C)(5)) — obligor only.
  const obligorAgi = obligor == null ? 0 : obligorIsA ? o.parentAAGI : o.parentBAGI;
  const incomeAvailable = Math.max(0, obligorAgi - AL_SSR_PARAMS.reserve);
  const maxAfterSsr = AL_SSR_PARAMS.incentivePct * incomeAvailable;
  const recommended = o.allInMonthly; // engine final order (post-SSR), authoritative

  // Place an obligor-only value into the obligor's column (the other stays blank).
  const oblCol = (v: number | null | undefined) =>
    obligor == null
      ? { p: undefined, d: undefined }
      : obligorIsPlaintiff
        ? { p: dollars(v), d: undefined }
        : { p: undefined, d: dollars(v) };

  const incAvail = oblCol(incomeAvailable);
  const maxSsr = oblCol(maxAfterSsr);
  const recCol = oblCol(recommended);

  const data: AcroFormData = {
    // --- Caption ---
    "Case Number": ui.caseNumber,
    "Circuit or District": ui.circuitOrDistrict,
    "Name of County": ui.county,
    Plaintiff: ui.plaintiffName,
    Defendant: ui.defendantName,
    "Number of Children": String(i.numChildren),

    // --- Income ---
    PGI: dollars(P(A.gross, B.gross)),
    DGI: dollars(D(A.gross, B.gross)),
    PAGI: dollars(P(A.agi, B.agi)),
    DAGI: dollars(D(A.agi, B.agi)),
    CI: dollars(A.gross + B.gross),
    CAGI: dollars(o.combinedAGI),
    // Preexisting child-support / alimony deductions: blank when zero.
    PECSP: dollarsNZ(0),
    DECSP: dollarsNZ(0),
    PAP: dollarsNZ(0),
    DAP: dollarsNZ(0),
    CCSP: dollarsNZ(0),
    CAP: dollarsNZ(0),

    // --- Shares ---
    "P%": P(A.pct, B.pct),
    "D%": D(A.pct, B.pct),

    // --- BCSO ---
    PBCSO: dollars(P(A.bcsoShare, B.bcsoShare)),
    DBCSO: dollars(D(A.bcsoShare, B.bcsoShare)),
    CBCSA: dollars(bcso),

    // --- Work-related child care ---
    PWRCCC: dollars(P(A.cc, B.cc)),
    DWRCCC: dollars(D(A.cc, B.cc)),
    CWRCC: dollars(ccCombined),

    // --- Health-care coverage ---
    PHCCC: dollars(P(A.health, B.health)),
    DHCCC: dollars(D(A.health, B.health)),
    CHCCC: dollars(hCombined),

    // --- Total child-support obligation ---
    PTCSO: dollars(P(A.tcso, B.tcso)),
    DTCSO: dollars(D(A.tcso, B.tcso)),
    CCSO: dollars(tcsoCombined),

    // --- Costs paid directly (add-ons each parent pays) ---
    "Plaintiff Total Costs Paid": dollarsNZ(P(A.costsPaid, B.costsPaid)),
    "Defendant Total Costs Paid": dollarsNZ(D(A.costsPaid, B.costsPaid)),
    "Combined Costs Paid": dollarsNZ(A.costsPaid + B.costsPaid),

    // --- Obligation before SSR (per party: TCSO net of own costs paid) ---
    "Plaintiff Obligation Before Consideration": dollars(P(A.oblBeforeSsr, B.oblBeforeSsr)),
    "Defendant Obligation Before Consideration": dollars(D(A.oblBeforeSsr, B.oblBeforeSsr)),
    "Combined Obligation Before Consideration": dollars(A.oblBeforeSsr + B.oblBeforeSsr),

    // --- SSR flow (obligor column only) ---
    "Plaintiff Income Available": incAvail.p,
    "Defendant Income Available": incAvail.d,
    "Plaintiff Max Recommended Child Support After SSR": maxSsr.p,
    "Defendant Max Recommended Child Support": maxSsr.d,

    // --- Recommended order (obligor column; Combined carries the order) ---
    "Plaintiff Recommended Child Support AMount": recCol.p,
    "Defendant Recommended Child Support Amount": recCol.d,
    "Combined Recommended Child Support Amount": dollars(recommended),

    // --- Preparer / comments ---
    "Prepared By": ui.preparedBy,
    Date: ui.date,
    "Comments, Calculation,s or Rebuttals to Guidelines": ui.comments,
  };

  (ui.children ?? []).slice(0, 6).forEach((c, idx) => {
    const k = idx + 1;
    data[`Child ${k}`] = c.name;
    data[`Date of Birth Child ${k}`] = c.dob;
  });

  return data;
}
