/**
 * Annotated Worksheet PDF — print rendering of the on-screen Worksheet
 * tab (src/components/calculator/official-worksheet.tsx).
 *
 * Same data model (WDM) as the on-screen worksheet. Same section
 * structure. Same line-by-line rule citations. Same conditional panels
 * (statutory cap, equal-parenting low-support note, deviation
 * methodology footnote). Pdf-paginated, no fixed coordinates.
 *
 * Engine and AOC PDF are untouched.
 */

import type {
  Content,
  ContentText,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

import { CITATIONS, type CitationKey } from "@/lib/calc/citations";
import type {
  WDM,
  WDMLine,
  WDMSection,
  WDMStatutoryCapPanel,
  WDMValue,
} from "@/lib/calc/wdm/types";

import {
  renderDocToPdf,
  type AnnotatedPdfAssets,
} from "./layout/document";

export type { AnnotatedPdfAssets } from "./layout/document";

export interface AnnotatedPdfMeta {
  /** Document title (PDF metadata + header). */
  title: string;
  subject?: string;
  /** Pre-formatted "Prepared 05/27/2026" string for the page header. */
  preparedOnDisplay: string;
  /** Public URL printed in the footer (e.g. "csg.tcblaw.org/tn"). */
  publicUrl?: string;
}

export interface RenderAnnotatedPdfOpts {
  assets: AnnotatedPdfAssets;
  meta: AnnotatedPdfMeta;
}

// ---------- color palette (mirrors on-screen tokens) ----------

const COLOR_INK = "#111111";
const COLOR_MUTED = "#6b6b6b";
const COLOR_RULE = "#dcdcdc";
const COLOR_PRIMARY = "#1f3a5f";
const COLOR_PRIMARY_FG = "#ffffff";
const COLOR_CREAM = "#f7f1e3";
const COLOR_CREAM_SOFT = "#fbf6ea";

// ---------- formatting helpers ----------

function fmt(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

function cellDisplay(v: WDMValue | undefined): string {
  return v?.display ?? "";
}

function ruleDisplay(line: WDMLine): string | null {
  if (line.citation) {
    const r = CITATIONS[line.citation].rule;
    return `Rule ${r.replace(/^1240-02-04-/, "")}`;
  }
  return line.cite ?? null;
}

// ---------- WDM → pdfmake content ----------

const TABLE_WIDTHS = [28, "*" as const, 64, 64, 70];

function headerRow(): any[] {
  const cell = (text: string, align: "left" | "right" = "right"): Content => ({
    text,
    bold: true,
    fontSize: 8,
    color: COLOR_PRIMARY_FG,
    alignment: align,
    fillColor: COLOR_PRIMARY,
    margin: [2, 4, 2, 4],
  });
  return [cell("", "left"), cell("", "left"), cell("A"), cell("B"), cell("Combined")];
}

function sectionTitleRow(title: string): any[] {
  return [
    {
      text: title.toUpperCase(),
      colSpan: 5,
      bold: true,
      fontSize: 9,
      color: COLOR_PRIMARY_FG,
      fillColor: COLOR_PRIMARY,
      margin: [4, 4, 4, 4],
      characterSpacing: 0.6,
    },
    {},
    {},
    {},
    {},
  ];
}

function lineRow(line: WDMLine): any[] {
  const fill = line.emphasis ? COLOR_CREAM : undefined;
  const labelStack: Content[] = [
    { text: line.label, bold: !!line.emphasis, fontSize: 9.5 },
  ];
  const ruleText = ruleDisplay(line);
  if (ruleText) {
    labelStack.push({
      text: ruleText,
      fontSize: 7,
      color: COLOR_MUTED,
      characterSpacing: 0.5,
      margin: [0, 1, 0, 0],
    });
  }
  const valueCell = (v: WDMValue | undefined): Content => ({
    text: cellDisplay(v),
    alignment: "right",
    fontSize: 9.5,
    bold: !!line.emphasis,
    margin: [2, 2, 2, 2],
    fillColor: fill,
  });
  return [
    {
      text: line.screenLineNo ?? "",
      fontSize: 8,
      color: COLOR_MUTED,
      alignment: "left",
      margin: [2, 3, 2, 2],
      fillColor: fill,
    },
    {
      stack: labelStack,
      margin: [2, 2, 2, 2],
      fillColor: fill,
    },
    valueCell(line.a),
    valueCell(line.b),
    valueCell(line.total),
  ];
}

function subSourceRow(a: string, b: string): any[] {
  return [
    { text: "", fontSize: 7 },
    { text: "", fontSize: 7 },
    {
      text: a,
      fontSize: 7,
      color: COLOR_MUTED,
      alignment: "right",
      margin: [2, 1, 2, 3],
    },
    {
      text: b,
      fontSize: 7,
      color: COLOR_MUTED,
      alignment: "right",
      margin: [2, 1, 2, 3],
    },
    { text: "", fontSize: 7 },
  ];
}

function aboveCapRow(bcso: NonNullable<WDMLine["bcsoAboveCap"]>): any[] {
  // Above-cap formula broken into components (matches the on-screen
  // worksheet's Line 6 expansion under Rule .09(2)(d)).
  const ratePct = (bcso.rate * 100).toFixed(2);
  const text =
    `Above-cap formula: top of schedule $${fmt(bcso.topOfSchedule)} + ` +
    `(combined AGI in excess of schedule $${fmt(bcso.excessAGI)} × ${ratePct}% = $${fmt(bcso.addition)}).`;
  return [
    { text: "", fontSize: 8 },
    {
      text,
      colSpan: 4,
      italics: true,
      fontSize: 8,
      color: COLOR_MUTED,
      margin: [2, 2, 2, 4],
    },
    {},
    {},
    {},
  ];
}

function inlineNoteRow(text: string): any[] {
  return [
    { text: "", fontSize: 8 },
    {
      text,
      colSpan: 4,
      fontSize: 8,
      color: COLOR_MUTED,
      fillColor: COLOR_CREAM_SOFT,
      margin: [4, 3, 4, 5],
    },
    {},
    {},
    {},
  ];
}

function buildWorksheetTable(wdm: WDM): Content {
  const body: Array<any[]> = [headerRow()];

  // Find the special-expenses block once (mirrors on-screen behavior).
  const seBlock = wdm.panels.deviationsNarrative.blocks.find(
    (b) => b.citation === "special_expenses",
  );

  for (const section of wdm.sections) {
    body.push(sectionTitleRow(section.title));
    for (const line of section.lines) {
      body.push(lineRow(line));
      if (line.subSource) {
        body.push(subSourceRow(line.subSource.a, line.subSource.b));
      }
      if (line.bcsoAboveCap) {
        body.push(aboveCapRow(line.bcsoAboveCap));
      }
      if (
        section.id === "deviations" &&
        line.screenLineNo === "14a" &&
        seBlock
      ) {
        body.push(inlineNoteRow(seBlock.body));
      }
    }
  }

  return {
    table: {
      headerRows: 1,
      widths: TABLE_WIDTHS,
      body,
      dontBreakRows: true,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => COLOR_RULE,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 12],
  };
}

function buildCaptionBlock(wdm: WDM): Content | null {
  if (!wdm.hasCaption) return null;
  const cap = wdm.caption;
  const rows: Content[] = [];
  const field = (label: string, value: string): Content => ({
    text: [
      { text: `${label} · `, color: COLOR_MUTED, fontSize: 8 },
      { text: value, fontSize: 9 },
    ],
    margin: [0, 1, 0, 1],
  });
  if (cap.matterName) rows.push(field("Matter", cap.matterName));
  if (cap.docketNumber) rows.push(field("Docket", cap.docketNumber));
  if (cap.court) rows.push(field("Court", cap.court));
  if (cap.client) rows.push(field("Client", cap.client));
  if (cap.preparedBy) rows.push(field("Prepared by", cap.preparedBy));
  if (rows.length === 0) return null;
  return {
    stack: rows,
    fillColor: COLOR_CREAM,
    margin: [0, 0, 0, 10],
    // pdfmake doesn't pad stacks directly; wrap in a single-cell table for padding.
  };
}

function buildHeaderBlock(wdm: WDM): Content {
  const { header } = wdm;
  return {
    columns: [
      {
        stack: [
          {
            text: header.jurisdiction.toUpperCase(),
            fontSize: 8,
            color: COLOR_MUTED,
            characterSpacing: 0.8,
          },
          {
            text: header.formTitle,
            fontSize: 14,
            bold: true,
            color: COLOR_INK,
            margin: [0, 2, 0, 1],
          },
          {
            text: `Tenn. Comp. R. & Regs. 1240-02-04 · Schedule effective ${header.scheduleEffectiveDate}`,
            fontSize: 8,
            color: COLOR_MUTED,
          },
        ],
        width: "*",
      },
      {
        stack: [
          {
            text: `Prepared ${header.preparedOnDisplay}`,
            fontSize: 8,
            color: COLOR_MUTED,
            alignment: "right",
          },
          {
            text: "via TCB Law TN Child Support Calculator",
            fontSize: 8,
            color: COLOR_MUTED,
            alignment: "right",
          },
        ],
        width: "auto",
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

function buildCapPanel(panel: WDMStatutoryCapPanel): Content | null {
  if (panel.engaged) {
    const stack: Content[] = [
      {
        text: "Statutory Presumptive Cap · Tenn. Code Ann. §36-5-101(e)(1)(B)",
        fontSize: 8,
        color: COLOR_MUTED,
        characterSpacing: 0.6,
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Calculated PCSO", fontSize: 9 },
              { text: `$${fmt(panel.calculatedPCSO)}/mo`, fontSize: 9, alignment: "right" },
            ],
            [
              {
                text: `Statutory cap (${panel.numChildren} ${panel.numChildren === 1 ? "child" : "children"})`,
                fontSize: 9,
              },
              { text: `$${fmt(panel.statutoryMax)}/mo`, fontSize: 9, alignment: "right" },
            ],
            [
              { text: "Excess subject to recipient's burden", bold: true, fontSize: 9 },
              {
                text: `$${fmt(panel.excessOverCap)}/mo · $${fmt(panel.excessOverCap * 12)}/yr`,
                bold: true,
                fontSize: 9,
                alignment: "right",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 2 ? 0.5 : 0),
          vLineWidth: () => 0,
          hLineColor: () => COLOR_RULE,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
    ];
    if (panel.capNote) {
      stack.push({
        text: panel.capNote,
        fontSize: 9,
        margin: [0, 6, 0, 0],
        lineHeight: 1.3,
      });
    }
    if (panel.caseLaw) {
      stack.push({
        text: panel.caseLaw,
        italics: true,
        fontSize: 8,
        color: COLOR_MUTED,
        margin: [0, 6, 0, 0],
        lineHeight: 1.3,
      });
    }
    return wrapTinted(stack, COLOR_CREAM);
  }
  // Not-engaged: simple note line in cream tint, mirroring on-screen.
  if (panel.capNote) {
    return wrapTinted(
      [
        {
          text: panel.capNote,
          fontSize: 9,
          color: COLOR_MUTED,
          lineHeight: 1.3,
        },
      ],
      COLOR_CREAM,
    );
  }
  return null;
}

function wrapTinted(stack: Content[], fill: string): Content {
  // pdfmake doesn't apply fillColor to a stack directly; wrap in a
  // single-cell borderless table to get a tinted, padded block.
  return {
    table: {
      widths: ["*"],
      body: [[{ stack, fillColor: fill, margin: [10, 8, 10, 8], border: [false, false, false, false] }]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 8],
  };
}

function buildEqualParentingNote(text: string): Content {
  return wrapTinted(
    [
      { text: "Why is this support amount so low?", bold: true, fontSize: 9, margin: [0, 0, 0, 3] },
      { text, fontSize: 9, lineHeight: 1.3 },
    ],
    "#eef2f7",
  );
}

function buildMethodologyNote(text: string): Content {
  return wrapTinted(
    [{ text, fontSize: 8, color: COLOR_MUTED, lineHeight: 1.3 }],
    COLOR_CREAM_SOFT,
  );
}

function buildClosingNote(scheduleDate: string): Content {
  return wrapTinted(
    [
      {
        text:
          `Calculated using the Tennessee Child Support Guidelines under Rule 1240-02-04, ` +
          `schedule effective ${scheduleDate}. This worksheet is an estimate and not legal advice. ` +
          `Consult a licensed Tennessee attorney for your specific case.`,
        fontSize: 8,
        color: COLOR_MUTED,
        lineHeight: 1.3,
      },
    ],
    COLOR_CREAM,
  );
}

// ---------- entry point ----------

export async function renderAnnotatedPdf(
  wdm: WDM,
  opts: RenderAnnotatedPdfOpts,
): Promise<Uint8Array> {
  const content: Content[] = [];

  content.push(buildHeaderBlock(wdm));
  const caption = buildCaptionBlock(wdm);
  if (caption) {
    content.push(
      wrapTinted(
        [caption as ContentText],
        COLOR_CREAM,
      ),
    );
  }

  content.push(buildWorksheetTable(wdm));

  const capPanel = buildCapPanel(wdm.panels.statutoryCap);
  if (capPanel) content.push(capPanel);

  if (wdm.panels.equalParentingLowSupportNote) {
    content.push(buildEqualParentingNote(wdm.panels.equalParentingLowSupportNote));
  }

  if (wdm.panels.deviationMethodologyNote) {
    content.push(buildMethodologyNote(wdm.panels.deviationMethodologyNote));
  }

  content.push(buildClosingNote(wdm.header.scheduleEffectiveDate));

  const publicUrl = opts.meta.publicUrl;
  const headerLine = wdm.hasCaption && wdm.caption.matterName
    ? wdm.caption.matterName
    : opts.meta.title;

  const doc: TDocumentDefinitions = {
    info: {
      title: opts.meta.title,
      subject: opts.meta.subject,
      creator: "TN Child Support Calculator",
      producer: "TN Child Support Calculator",
    },
    pageSize: "LETTER",
    pageMargins: [48, 48, 48, 48],
    defaultStyle: {
      font: "DejaVu",
      fontSize: 10,
      lineHeight: 1.2,
      color: COLOR_INK,
    },
    header: (currentPage: number) =>
      currentPage === 1
        ? { text: "" }
        : {
            columns: [
              { text: headerLine, fontSize: 8, color: COLOR_MUTED },
              {
                text: opts.meta.preparedOnDisplay,
                fontSize: 8,
                color: COLOR_MUTED,
                alignment: "right",
              },
            ],
            margin: [48, 24, 48, 0],
          },
    footer: (currentPage: number, pageCount: number) => ({
      text:
        `Page ${currentPage} of ${pageCount}` +
        (publicUrl ? ` · ${publicUrl}` : "") +
        ` · ${opts.meta.preparedOnDisplay}`,
      fontSize: 8,
      color: COLOR_MUTED,
      alignment: "center",
      margin: [48, 12, 48, 0],
    }),
    content,
  };

  return renderDocToPdf(doc, opts.assets);
}

/** Re-export the WDM citation set for tests / debugging. */
export function collectWdmCitations(wdm: WDM): CitationKey[] {
  const out: CitationKey[] = [];
  for (const s of wdm.sections) for (const l of s.lines) if (l.citation) out.push(l.citation);
  return out;
}
