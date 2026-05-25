/**
 * Mississippi § 43-19-103 Deviation Worksheet PDF.
 *
 * Chancellor-ready analysis document, separate from the main MS
 * presumptive-percentage worksheet PDF. Generated client-side and
 * downloadable without payment (the substantive analysis is the value;
 * the gated PDF is the worksheet proper).
 *
 * Sections:
 *   1. Case Information
 *   2. Deviation Analysis by Factor (statutory text + per-party block)
 *   3. Reconciliation Summary (table + monthly + cumulative)
 *   4. Proposed Final Order (blank findings + signature line)
 *   5. Footer (disclaimer, authority, repo)
 */
import type { MSInputs, MSOutputs, MSFactorLetter, HandoffState } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  buildReconciliation,
  FACTOR_STATUTORY_TEXT,
  FACTOR_TITLES,
  type ReconciliationRow,
} from "@/lib/calc/ms/reconciliation";
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
const COL_TOTAL_RIGHT = PAGE_W - MARGIN;

function fmt(n: number): string {
  const s = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${s})` : `$${s}`;
}

function fmt2(n: number): string {
  const s = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `($${s})` : `$${s}`;
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
  const str = opts.maxWidth
    ? trimToWidth(text, size, opts.maxWidth)
    : cleanText(text);
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
  ctx.pdf.text(
    str,
    rightX - widthOfText(str, size),
    y,
    size,
    opts.bold ? "F2" : "F1",
    opts.color ?? INK,
  );
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

function h3(ctx: Ctx, t: string) {
  ensure(ctx, 16);
  drawText(ctx, t, MARGIN, ctx.y - 9, { size: 10, bold: true });
  ctx.y -= 12;
}

function small(ctx: Ctx, t: string) {
  ensure(ctx, 12);
  drawText(ctx, t, MARGIN, ctx.y - 8, { size: 8, color: MUTED });
  ctx.y -= 12;
}

function paragraph(
  ctx: Ctx,
  text: string,
  opts: { size?: number; color?: Color; indent?: number } = {},
) {
  const size = opts.size ?? 9;
  const indent = opts.indent ?? 0;
  const lines = wrapText(text, size, ROW_W - indent);
  const lh = size + 2;
  for (const line of lines) {
    ensure(ctx, lh);
    drawText(ctx, line, MARGIN + indent, ctx.y - size, {
      size,
      color: opts.color ?? INK,
    });
    ctx.y -= lh;
  }
}

function captionLine(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 12);
  drawText(ctx, label, MARGIN + 6, ctx.y - 9, { bold: true, size: 9 });
  drawText(ctx, value, MARGIN + 110, ctx.y - 9, {
    size: 9,
    maxWidth: ROW_W - 120,
  });
  ctx.y -= 12;
}

function rule(ctx: Ctx) {
  ensure(ctx, 6);
  ctx.pdf.line(MARGIN, ctx.y - 2, PAGE_W - MARGIN, ctx.y - 2, RULE, 0.5);
  ctx.y -= 6;
}

function captionBlock(ctx: Ctx, inputs: MSInputs, caption: CaseCaption) {
  const boxTop = ctx.y;
  ctx.y -= 6;
  if (caption.matterName) captionLine(ctx, "Matter:", caption.matterName);
  if (caption.docketNumber)
    captionLine(ctx, "Cause No.:", caption.docketNumber);
  if (caption.court) captionLine(ctx, "Court:", caption.court);
  if (caption.preparedBy)
    captionLine(ctx, "Prepared by:", caption.preparedBy);
  if (caption.client) captionLine(ctx, "Client:", caption.client);
  captionLine(ctx, "Obligor:", inputs.obligorLabel || "Obligor");
  captionLine(ctx, "Obligee:", inputs.obligeeLabel || "Obligee");
  captionLine(
    ctx,
    "Children:",
    inputs.childAges.length > 0
      ? `${inputs.numChildren} (ages: ${inputs.childAges.join(", ")})`
      : String(inputs.numChildren),
  );
  ctx.y -= 4;
  ctx.pdf.strokeRect(MARGIN, ctx.y, ROW_W, boxTop - ctx.y, RULE, 1);
  ctx.y -= 4;
}

const POSITION_LABEL: Record<string, string> = {
  downward: "Apply — downward deviation",
  upward: "Apply — upward deviation",
  apply_no_amount: "Apply — no specific amount proposed",
  oppose: "Oppose application of this factor",
  "": "(no position recorded)",
};

function partyColumn(
  ctx: Ctx,
  sideLabel: string,
  d: { applicable: boolean; amount: number; entry?: { party?: { position?: string; factsAsserted?: string; documentationReferenced?: string; legalAuthority?: string }; description?: string } },
  x: number,
  width: number,
) {
  // Bordered box; returns new ctx.y. We measure first to keep both columns
  // visually equal-height (caller balances).
  const padding = 6;
  const labelLh = 12;
  const lineSize = 8;
  const lh = lineSize + 2;

  const startY = ctx.y;
  drawText(ctx, sideLabel, x + padding, startY - 10, { size: 9, bold: true });
  let y = startY - 10 - labelLh;

  if (!d.applicable) {
    drawText(ctx, "Not asserted by this party.", x + padding, y - lineSize, {
      size: lineSize,
      color: MUTED,
    });
    y -= lh;
  } else {
    const party = d.entry?.party;
    const position = party?.position ?? "";
    const facts = party?.factsAsserted ?? d.entry?.description ?? "";
    const docs = party?.documentationReferenced ?? "";
    const authority = party?.legalAuthority ?? "";

    drawText(
      ctx,
      `Position: ${POSITION_LABEL[position] ?? "(unspecified)"}`,
      x + padding,
      y - lineSize,
      { size: lineSize },
    );
    y -= lh;

    drawText(
      ctx,
      `Proposed: ${fmt(d.amount)} / mo`,
      x + padding,
      y - lineSize,
      { size: lineSize, bold: true },
    );
    y -= lh;

    if (facts) {
      drawText(ctx, "Facts asserted:", x + padding, y - lineSize, {
        size: lineSize,
        bold: true,
      });
      y -= lh;
      const lines = wrapText(facts, lineSize, width - padding * 2);
      for (const line of lines) {
        drawText(ctx, line, x + padding, y - lineSize, { size: lineSize });
        y -= lh;
      }
    }
    if (docs) {
      drawText(ctx, "Documentation:", x + padding, y - lineSize, {
        size: lineSize,
        bold: true,
      });
      y -= lh;
      const lines = wrapText(docs, lineSize, width - padding * 2);
      for (const line of lines) {
        drawText(ctx, line, x + padding, y - lineSize, { size: lineSize });
        y -= lh;
      }
    }
    if (authority) {
      drawText(ctx, "Legal authority:", x + padding, y - lineSize, {
        size: lineSize,
        bold: true,
      });
      y -= lh;
      const lines = wrapText(authority, lineSize, width - padding * 2);
      for (const line of lines) {
        drawText(ctx, line, x + padding, y - lineSize, { size: lineSize });
        y -= lh;
      }
    }
  }

  return y;
}

function factorBlock(
  ctx: Ctx,
  row: ReconciliationRow,
  inputs: MSInputs,
  sideBySide: boolean,
) {
  ensure(ctx, 80);

  // Header line
  h3(ctx, `Factor (${row.letter}) — ${FACTOR_TITLES[row.letter]}`);
  paragraph(ctx, `Statutory text: ${FACTOR_STATUTORY_TEXT[row.letter]}`, {
    size: 8,
    color: MUTED,
  });

  // In-play banner
  const banner =
    row.inPlay === "neither"
      ? "Not asserted by either party."
      : row.inPlay === "agree"
        ? `Parties agree this factor applies; agreed adjustment ${fmt(row.obligor.amount)} / mo.`
        : row.inPlay === "both"
          ? `Both parties assert this factor; gap ${fmt(Math.abs(row.gapMonthly))} / mo.`
          : row.inPlay === "obligor_only"
            ? `Asserted by ${inputs.obligorLabel}; opposed by ${inputs.obligeeLabel}.`
            : `Asserted by ${inputs.obligeeLabel}; opposed by ${inputs.obligorLabel}.`;
  ensure(ctx, 16);
  ctx.pdf.fillRect(MARGIN, ctx.y - 14, ROW_W, 14, EMPH_BG);
  drawText(ctx, banner, MARGIN + 6, ctx.y - 10, { size: 9, bold: true });
  ctx.y -= 16;

  if (row.inPlay === "neither") {
    ctx.y -= 4;
    return;
  }

  // Per-party columns
  if (sideBySide) {
    const gap = 8;
    const colW = (ROW_W - gap) / 2;
    const topY = ctx.y;
    const leftEndY = partyColumn(
      ctx,
      inputs.obligorLabel,
      row.obligor,
      MARGIN,
      colW,
    );
    // Reset y for right column draw
    ctx.y = topY;
    const rightEndY = partyColumn(
      ctx,
      inputs.obligeeLabel,
      row.obligee,
      MARGIN + colW + gap,
      colW,
    );
    const endY = Math.min(leftEndY, rightEndY) - 4;
    // Draw column borders
    ctx.pdf.strokeRect(MARGIN, endY, colW, topY - endY, RULE, 0.5);
    ctx.pdf.strokeRect(
      MARGIN + colW + gap,
      endY,
      colW,
      topY - endY,
      RULE,
      0.5,
    );
    ctx.y = endY - 8;
  } else {
    const topY = ctx.y;
    const endY = partyColumn(
      ctx,
      inputs.obligorLabel,
      row.obligor,
      MARGIN,
      ROW_W,
    );
    ctx.pdf.strokeRect(MARGIN, endY - 4, ROW_W, topY - (endY - 4), RULE, 0.5);
    ctx.y = endY - 8;
  }
}

function reconciliationTable(
  ctx: Ctx,
  report: ReturnType<typeof buildReconciliation>,
  inputs: MSInputs,
  sideBySide: boolean,
) {
  const { rows, totals } = report;

  // Column widths
  const wLetter = 36;
  const wInPlay = 90;
  const wAmt = 70;
  const wTitle = ROW_W - wLetter - wInPlay - wAmt * (sideBySide ? 3 : 1);

  // Header
  ensure(ctx, 18);
  const top = ctx.y;
  ctx.pdf.fillRect(MARGIN, top - 14, ROW_W, 14, HEAD_BG);
  let x = MARGIN + 4;
  drawText(ctx, "Factor", x, top - 10, { size: 9, bold: true });
  x += wLetter;
  drawText(ctx, "Title", x, top - 10, { size: 9, bold: true });
  x += wTitle;
  drawText(ctx, "In play?", x, top - 10, { size: 9, bold: true });
  x += wInPlay;
  drawTextRight(ctx, inputs.obligorLabel, x + wAmt - 4, top - 10, {
    size: 9,
    bold: true,
  });
  x += wAmt;
  if (sideBySide) {
    drawTextRight(ctx, inputs.obligeeLabel, x + wAmt - 4, top - 10, {
      size: 9,
      bold: true,
    });
    x += wAmt;
    drawTextRight(ctx, "Gap / mo", x + wAmt - 4, top - 10, {
      size: 9,
      bold: true,
    });
  }
  ctx.y -= 16;

  // Body
  for (const r of rows) {
    ensure(ctx, 14);
    const ry = ctx.y;
    let cx = MARGIN + 4;
    drawText(ctx, `(${r.letter})`, cx, ry - 9, { size: 9 });
    cx += wLetter;
    drawText(ctx, r.title, cx, ry - 9, { size: 8, maxWidth: wTitle - 6 });
    cx += wTitle;
    const inPlayShort =
      r.inPlay === "neither"
        ? "—"
        : r.inPlay === "agree"
          ? "Agreed"
          : r.inPlay === "both"
            ? "Both, differ"
            : r.inPlay === "obligor_only"
              ? "Obligor only"
              : "Obligee only";
    drawText(ctx, inPlayShort, cx, ry - 9, { size: 8 });
    cx += wInPlay;
    drawTextRight(
      ctx,
      r.obligor.applicable ? fmt(r.obligor.amount) : "—",
      cx + wAmt - 4,
      ry - 9,
      { size: 9 },
    );
    cx += wAmt;
    if (sideBySide) {
      drawTextRight(
        ctx,
        r.obligee.applicable ? fmt(r.obligee.amount) : "—",
        cx + wAmt - 4,
        ry - 9,
        { size: 9 },
      );
      cx += wAmt;
      drawTextRight(ctx, fmt(r.gapMonthly), cx + wAmt - 4, ry - 9, {
        size: 9,
      });
    }
    ctx.pdf.line(MARGIN, ry - 14, PAGE_W - MARGIN, ry - 14, RULE, 0.3);
    ctx.y -= 14;
  }

  // Totals
  ensure(ctx, 16);
  const ty = ctx.y;
  ctx.pdf.fillRect(MARGIN, ty - 14, ROW_W, 14, EMPH_BG);
  drawText(ctx, "Total / mo", MARGIN + 4, ty - 10, { size: 9, bold: true });
  let tx = MARGIN + 4 + wLetter + wTitle + wInPlay;
  drawTextRight(ctx, fmt(totals.obligorMonthly), tx + wAmt - 4, ty - 10, {
    size: 9,
    bold: true,
  });
  tx += wAmt;
  if (sideBySide) {
    drawTextRight(ctx, fmt(totals.obligeeMonthly), tx + wAmt - 4, ty - 10, {
      size: 9,
      bold: true,
    });
    tx += wAmt;
    drawTextRight(
      ctx,
      fmt(totals.netDifferenceMonthly),
      tx + wAmt - 4,
      ty - 10,
      { size: 9, bold: true },
    );
  }
  ctx.y -= 16;

  // Cumulative
  if (sideBySide) {
    ctx.y -= 4;
    if (totals.avgMonthsRemaining === null) {
      paragraph(
        ctx,
        "Cumulative impact: enter the children's ages on the calculator to project the net difference over the remaining support period.",
        { size: 8, color: MUTED },
      );
    } else {
      paragraph(
        ctx,
        `Average remaining support window: ${totals.avgMonthsRemaining} months (${(
          totals.avgMonthsRemaining / 12
        ).toFixed(1)} years), computed as mean(max(0, 21 - age)) over ${inputs.childAges.length} listed child${inputs.childAges.length === 1 ? "" : "ren"}.`,
        { size: 8, color: MUTED },
      );
      paragraph(
        ctx,
        `Cumulative net difference between proposals: ${fmt(
          totals.cumulativeNetDifference ?? 0,
        )}.`,
        { size: 9 },
      );
    }
  }
}

function proposedFinalOrder(ctx: Ctx, inputs: MSInputs, outputs: MSOutputs) {
  h2(ctx, "IV. Proposed Final Order");

  paragraph(
    ctx,
    "After considering the § 43-19-103 factors set forth above, the Court finds the presumptive amount under § 43-19-101 should be adjusted as follows:",
    { size: 9 },
  );

  ctx.y -= 4;
  const line = (label: string, value: string) => {
    ensure(ctx, 14);
    drawText(ctx, label, MARGIN, ctx.y - 10, { size: 9 });
    drawTextRight(ctx, value, COL_TOTAL_RIGHT, ctx.y - 10, {
      size: 9,
      bold: true,
    });
    ctx.pdf.line(
      MARGIN,
      ctx.y - 14,
      PAGE_W - MARGIN,
      ctx.y - 14,
      RULE,
      0.3,
    );
    ctx.y -= 14;
  };

  line(
    `Presumptive monthly support (§ 43-19-101, ${(outputs.statutoryPercentage * 100).toFixed(0)}%)`,
    `$${fmt2(outputs.presumptiveMonthly)}`,
  );
  if (outputs.healthInsuranceAddOnMonthly > 0) {
    line(
      "Health insurance add-on (§ 43-19-101(6))",
      `+$${fmt2(outputs.healthInsuranceAddOnMonthly)}`,
    );
  }
  line(
    `Net deviation (${inputs.obligorLabel} proposals)`,
    `${outputs.totalDeviationsMonthly < 0 ? "-" : "+"}$${fmt2(Math.abs(outputs.totalDeviationsMonthly))}`,
  );
  line("Proposed final monthly support", `$${fmt2(outputs.proposedFinalMonthly)}`);

  ctx.y -= 8;
  h3(ctx, "Findings (chancellor):");
  for (let i = 0; i < 4; i++) {
    ensure(ctx, 16);
    ctx.pdf.line(
      MARGIN,
      ctx.y - 12,
      PAGE_W - MARGIN,
      ctx.y - 12,
      RULE,
      0.3,
    );
    ctx.y -= 16;
  }

  ctx.y -= 12;
  ensure(ctx, 40);
  // Signature blocks
  const halfW = (ROW_W - 24) / 2;
  ctx.pdf.line(MARGIN, ctx.y, MARGIN + halfW, ctx.y, RULE, 0.6);
  ctx.pdf.line(
    MARGIN + halfW + 24,
    ctx.y,
    PAGE_W - MARGIN,
    ctx.y,
    RULE,
    0.6,
  );
  drawText(ctx, "Chancellor", MARGIN, ctx.y - 10, { size: 8, color: MUTED });
  drawText(ctx, "Date", MARGIN + halfW + 24, ctx.y - 10, {
    size: 8,
    color: MUTED,
  });
  ctx.y -= 20;
}

export function renderMSDeviationPdf(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
}): Uint8Array {
  const { inputs, outputs, caption } = args;
  const report = buildReconciliation(inputs);
  const sideBySide =
    inputs.comparisonMode === "side_by_side" && !!inputs.deviationsB;

  const pdf = new SimplePdf(
    caption.matterName
      ? `${caption.matterName} — MS Deviation Worksheet`
      : "MS § 43-19-103 Deviation Worksheet",
  );
  const ctx: Ctx = { pdf, y: PAGE_H - MARGIN };

  h1(ctx, "Mississippi Deviation Worksheet");
  small(
    ctx,
    `Miss. Code Ann. § 43-19-103 (criteria for overcoming the presumption). Guidelines effective ${outputs.guidelinesEffectiveDate}.`,
  );

  // I. Case Information
  h2(ctx, "I. Case Information");
  captionBlock(ctx, inputs, caption);

  // II. Deviation Analysis by Factor
  h2(ctx, "II. Deviation Analysis by Factor");
  paragraph(
    ctx,
    "Each statutory factor is addressed below with the party positions, facts asserted, supporting documentation, and proposed monetary effect. The chancellor weighs the evidence; this worksheet only organizes it.",
    { size: 9, color: MUTED },
  );
  ctx.y -= 4;

  const letters: MSFactorLetter[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
  for (const letter of letters) {
    const row = report.rows.find((r) => r.letter === letter);
    if (!row) continue;
    factorBlock(ctx, row, inputs, sideBySide);
  }

  // III. Reconciliation Summary
  newPage(ctx);
  h2(ctx, "III. Reconciliation Summary");
  reconciliationTable(ctx, report, inputs, sideBySide);

  // IV. Proposed Final Order
  ctx.y -= 8;
  proposedFinalOrder(ctx, inputs, outputs);

  // Footer
  ctx.y -= 4;
  rule(ctx);
  paragraph(
    ctx,
    "This deviation worksheet is a calculation and presentation aid produced by TCB Law's Mississippi child support calculator. It is not legal advice and is not an official MDHS form. Authority: Miss. Code Ann. § 43-19-103. Source: https://csg.tcblaw.org/ms — repository: https://github.com/tcbmem-png/csg_tcblaw.",
    { size: 8, color: MUTED },
  );

  return pdf.save();
}

/** Browser-side helper: trigger a download of the deviation worksheet PDF. */
export function downloadMSDeviationPdf(args: {
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  filename?: string;
}) {
  const bytes = renderMSDeviationPdf(args);
  // ArrayBuffer copy so Blob doesn't see a SharedArrayBuffer-typed buffer.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    args.filename ??
    `${(args.caption.matterName || "ms-deviation").replace(/[^a-z0-9-_]+/gi, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
