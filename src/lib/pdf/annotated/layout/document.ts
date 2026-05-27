/**
 * pdfmake document shell. Converts a flat Block[] into a pdfmake doc
 * definition and produces a Uint8Array PDF byte buffer.
 *
 * This module is the ONLY place in the annotated-PDF pipeline that
 * knows about pdfmake. Swapping renderers later means rewriting this
 * file; builders stay untouched.
 *
 * Fonts: DejaVu Sans (regular + bold) is loaded once and registered
 * with pdfmake via the VFS so § / → / ↑ glyphs render the same way as
 * on the AOC overlay (which uses the same TTFs via @pdf-lib/fontkit).
 */

// pdfmake server-side Printer + VirtualFileSystem. Type declarations
// don't ship these; the runtime classes are stable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake/js/Printer").default as new (
  fontDescriptors: TFontDictionary,
  virtualfs?: unknown,
) => {
  createPdfKitDocument: (
    doc: TDocumentDefinitions,
  ) => NodeJS.ReadableStream & { end: () => void };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const VirtualFileSystem = require("pdfmake/js/virtual-fs.js")
  .default as new () => {
  writeFileSync: (name: string, content: Buffer) => void;
  readFileSync: (name: string) => Buffer;
  existsSync: (name: string) => boolean;
};

import type {
  Content,
  ContentStack,
  ContentText,
  TDocumentDefinitions,
  TFontDictionary,
} from "pdfmake/interfaces";

import { CITATIONS, type CitationKey } from "@/lib/calc/citations";
import type {
  Block,
  CitationBlock,
  HeadingBlock,
  InlineRun,
  ParagraphBlock,
  TableBlock,
  UnbreakableBlock,
} from "./flow";

export interface AnnotatedPdfAssets {
  /** DejaVu Sans Regular TTF bytes. */
  regularFont: Uint8Array;
  /** DejaVu Sans Bold TTF bytes. */
  boldFont: Uint8Array;
}

export interface AnnotatedPdfMeta {
  title: string;
  subject?: string;
  preparedOnDisplay: string;
  /** Cover-letter style header rendered on every page. */
  runningHeader: string;
  /** Footer template — supports %page% / %total% / %url% tokens. */
  footerTemplate?: string;
  publicUrl?: string;
}

const FONT_DEF_FILE_NAMES = {
  regular: "DejaVuSans.ttf",
  bold: "DejaVuSans-Bold.ttf",
};

function buildFonts(assets: AnnotatedPdfAssets): TFontDictionary {
  return {
    DejaVu: {
      normal: FONT_DEF_FILE_NAMES.regular,
      bold: FONT_DEF_FILE_NAMES.bold,
      italics: FONT_DEF_FILE_NAMES.regular,
      bolditalics: FONT_DEF_FILE_NAMES.bold,
    },
  };
}

function buildVfs(assets: AnnotatedPdfAssets): Record<string, string> {
  return {
    [FONT_DEF_FILE_NAMES.regular]: Buffer.from(assets.regularFont).toString(
      "base64",
    ),
    [FONT_DEF_FILE_NAMES.bold]: Buffer.from(assets.boldFont).toString("base64"),
  };
}

// ---------- Block → pdfmake Content ----------

function renderRun(run: InlineRun): ContentText | string {
  if (run.kind === "text") {
    return {
      text: run.text,
      bold: run.bold,
      italics: run.italic,
    } as ContentText;
  }
  if (run.kind === "user_quote") {
    // Per plan §2 / cycle prompt §B.3.2: user election text is rendered
    // verbatim, quoted, never paraphrased. Italics signal verbatim user
    // text to the reader.
    return { text: `"${run.text}"`, italics: true } as ContentText;
  }
  // citation
  const c = CITATIONS[run.citationKey];
  return { text: c.rule, italics: true } as ContentText;
}

function renderParagraph(block: ParagraphBlock): Content {
  return {
    text: block.runs.map(renderRun),
    margin: [0, 0, 0, 6],
    lineHeight: 1.25,
  };
}

function renderHeading(block: HeadingBlock): Content {
  const style =
    block.level === 1
      ? { fontSize: 14, bold: true, margin: [0, 14, 0, 6] as [number, number, number, number] }
      : block.level === 2
        ? { fontSize: 12, bold: true, margin: [0, 10, 0, 4] as [number, number, number, number] }
        : { fontSize: 10.5, bold: true, margin: [0, 6, 0, 2] as [number, number, number, number] };
  return { text: block.text, ...style };
}

function renderCitation(block: CitationBlock): Content {
  const c = CITATIONS[block.citationKey];
  const label = block.label ?? "Authority";
  return {
    text: [
      { text: `${label}: `, bold: true },
      { text: c.rule, italics: true },
      c.name ? { text: ` (${c.name}).` } : { text: "." },
    ],
    fontSize: 9,
    color: "#555555",
    margin: [0, 0, 0, 8],
  };
}

function renderTable(block: TableBlock): Content {
  return {
    table: {
      headerRows: 1,
      widths: block.widths ?? Array(block.rows[0]?.length ?? 1).fill("*"),
      body: block.rows.map((row, i) =>
        row.map((cell) => ({
          text: cell,
          bold: i === 0,
          fontSize: i === 0 ? 9.5 : 10,
        })),
      ),
    },
    layout: "lightHorizontalLines",
    margin: [0, 4, 0, 8],
  };
}

function renderBlock(block: Block): Content {
  switch (block.kind) {
    case "heading":
      return renderHeading(block);
    case "paragraph":
      return renderParagraph(block);
    case "citation":
      return renderCitation(block);
    case "bullet_list":
      return {
        ul: block.items.map((runs) => ({
          text: runs.map(renderRun),
          lineHeight: 1.2,
        })),
        margin: [0, 0, 0, 6],
      };
    case "table":
      return renderTable(block);
    case "spacer":
      return { text: " ", margin: [0, 0, 0, block.size] };
    case "unbreakable":
      return renderUnbreakable(block);
  }
}

function renderUnbreakable(block: UnbreakableBlock): Content {
  const stack: ContentStack = {
    stack: block.blocks.map(renderBlock),
    unbreakable: true,
  };
  return stack;
}

function flatten(blocks: Block[]): Content[] {
  return blocks.map(renderBlock);
}

// ---------- Renderer entry ----------

export async function renderBlocksToPdf(
  blocks: Block[],
  meta: AnnotatedPdfMeta,
  assets: AnnotatedPdfAssets,
): Promise<Uint8Array> {
  const vfs = new VirtualFileSystem();
  vfs.writeFileSync(FONT_DEF_FILE_NAMES.regular, Buffer.from(assets.regularFont));
  vfs.writeFileSync(FONT_DEF_FILE_NAMES.bold, Buffer.from(assets.boldFont));
  const printer = new PdfPrinter(buildFonts(assets), vfs);
  // buildVfs retained for potential debug introspection; unused at runtime
  void buildVfs;

  const footerTpl =
    meta.footerTemplate ??
    `Page %page% of %total% · Annotated Worksheet${
      meta.publicUrl ? ` · ${meta.publicUrl}` : ""
    }`;

  const doc: TDocumentDefinitions = {
    info: {
      title: meta.title,
      subject: meta.subject,
      creator: "TN Child Support Calculator",
      producer: "TN Child Support Calculator",
    },
    pageSize: "LETTER",
    pageMargins: [54, 72, 54, 54],
    defaultStyle: {
      font: "DejaVu",
      fontSize: 10,
      lineHeight: 1.25,
      color: "#111111",
    },
    header: () => ({
      columns: [
        { text: meta.runningHeader, fontSize: 8, color: "#666666" },
        {
          text: meta.preparedOnDisplay,
          alignment: "right",
          fontSize: 8,
          color: "#666666",
        },
      ],
      margin: [54, 30, 54, 0],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      text: footerTpl
        .replace("%page%", String(currentPage))
        .replace("%total%", String(pageCount))
        .replace("%url%", meta.publicUrl ?? ""),
      fontSize: 8,
      color: "#888888",
      alignment: "center",
      margin: [54, 16, 54, 0],
    }),
    content: flatten(blocks),
  };

  const pdfDoc = printer.createPdfKitDocument(doc);
  const chunks: Buffer[] = [];
  return await new Promise<Uint8Array>((resolve, reject) => {
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}

/** Surface for tests: walk the citation keys present in a block tree. */
export function collectCitationKeys(blocks: Block[]): CitationKey[] {
  const keys: CitationKey[] = [];
  const visit = (block: Block) => {
    if (block.kind === "citation") keys.push(block.citationKey);
    if (block.kind === "paragraph") {
      for (const run of block.runs) {
        if (run.kind === "citation") keys.push(run.citationKey);
      }
    }
    if (block.kind === "bullet_list") {
      for (const item of block.items) {
        for (const run of item) {
          if (run.kind === "citation") keys.push(run.citationKey);
        }
      }
    }
    if (block.kind === "unbreakable") block.blocks.forEach(visit);
  };
  blocks.forEach(visit);
  return keys;
}
