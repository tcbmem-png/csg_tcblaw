/**
 * Annotated-PDF layout primitives.
 *
 * Builders return Block[]; the document module flattens Block[] into a
 * pdfmake content array. Keeping Block layout-engine-agnostic isolates
 * builders from the renderer: a future renderer swap (or a per-block
 * accessibility / HTML export) does not touch any builder.
 *
 * Every primitive is pure data. No JSX, no pdfmake objects, no IO.
 *
 * Citation primitive: builders ALWAYS pass a CitationKey; the renderer
 * resolves to display text via CITATIONS[key]. This is the single
 * enforcement point for "no string-literal rule references in builders"
 * (drift-prevention rule #10).
 */

import type { CitationKey } from "@/lib/calc/citations";

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | CitationBlock
  | BulletListBlock
  | TableBlock
  | SpacerBlock
  | UnbreakableBlock;

export interface HeadingBlock {
  kind: "heading";
  /** 1 = section title (e.g. "V. Parenting Time"); 2 = subsection; 3 = inline. */
  level: 1 | 2 | 3;
  text: string;
}

/**
 * A paragraph is a sequence of inline runs so a builder can interleave
 * literal prose with citation references without inlining citation
 * strings.
 */
export interface ParagraphBlock {
  kind: "paragraph";
  runs: InlineRun[];
}

export type InlineRun =
  | { kind: "text"; text: string; bold?: boolean; italic?: boolean }
  | { kind: "citation"; citationKey: CitationKey }
  | { kind: "user_quote"; text: string };

/**
 * A standalone citation line, typically placed below the prose
 * paragraph it authorizes. Equivalent to "Authority: <rule>".
 */
export interface CitationBlock {
  kind: "citation";
  citationKey: CitationKey;
  /** Optional prefix label; defaults to "Authority". */
  label?: string;
}

export interface BulletListBlock {
  kind: "bullet_list";
  /** Each item is a sequence of inline runs (same shape as ParagraphBlock.runs). */
  items: InlineRun[][];
}

export interface TableBlock {
  kind: "table";
  /** 2-D string grid; first row is the header row. */
  rows: string[][];
  /** Optional column widths; pdfmake "*" / "auto" / number. */
  widths?: Array<"auto" | "*" | number>;
}

export interface SpacerBlock {
  kind: "spacer";
  /** Vertical space in points. */
  size: number;
}

/**
 * Groups a sub-list of blocks the renderer should keep on the same
 * page if possible (suppresses page breaks within). Used for
 * heading + first paragraph pairs to prevent orphan headings.
 */
export interface UnbreakableBlock {
  kind: "unbreakable";
  blocks: Block[];
}

// ---------- pure-data constructors (no logic — builders use these) ----------

export const h = (level: 1 | 2 | 3, text: string): HeadingBlock => ({
  kind: "heading",
  level,
  text,
});

export const p = (...runs: InlineRun[]): ParagraphBlock => ({
  kind: "paragraph",
  runs,
});

export const t = (
  text: string,
  opts?: { bold?: boolean; italic?: boolean },
): InlineRun => ({ kind: "text", text, ...opts });

export const cite = (citationKey: CitationKey): InlineRun => ({
  kind: "citation",
  citationKey,
});

export const userQuote = (text: string): InlineRun => ({
  kind: "user_quote",
  text,
});

export const authorityLine = (
  citationKey: CitationKey,
  label = "Authority",
): CitationBlock => ({ kind: "citation", citationKey, label });

export const bullets = (items: InlineRun[][]): BulletListBlock => ({
  kind: "bullet_list",
  items,
});

export const table = (
  rows: string[][],
  widths?: TableBlock["widths"],
): TableBlock => ({ kind: "table", rows, widths });

export const spacer = (size = 6): SpacerBlock => ({ kind: "spacer", size });

export const unbreakable = (...blocks: Block[]): UnbreakableBlock => ({
  kind: "unbreakable",
  blocks,
});

// ---------- formatting helpers (used by builders) ----------

/**
 * Money formatter shared across builders so the annotated PDF and the
 * AOC stay byte-aligned on numeric display. Negative values render as
 * "($N)" per accounting convention. Never adds locale-specific currency
 * codes.
 */
export function money(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${abs})` : `$${abs}`;
}

export function pct(fraction: number, places = 2): string {
  return `${(fraction * 100).toFixed(places)}%`;
}
