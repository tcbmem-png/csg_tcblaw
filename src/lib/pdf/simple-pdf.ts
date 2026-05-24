// Minimal Worker-compatible PDF primitive (Helvetica, A4-letter).
// Shared by worksheet-pdf.ts and official-worksheet-pdf.ts.

export const MARGIN = 36;
export const PAGE_W = 612;
export const PAGE_H = 792;

export type FontKey = "F1" | "F2";
export type Color = [number, number, number];

export const INK: Color = [0.1, 0.1, 0.1];
export const MUTED: Color = [0.4, 0.4, 0.4];
export const RULE: Color = [0.6, 0.6, 0.6];
export const HEAD_BG: Color = [0.92, 0.92, 0.92];
export const EMPH_BG: Color = [0.97, 0.97, 0.92];

const FONT_WIDTHS: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "#": 556, "$": 556, "%": 889, "&": 667, "'": 191,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556,
  "8": 556, "9": 556, ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556,
  "@": 1015, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722,
  I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722,
  S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, "[": 278,
  "\\": 278, "]": 278, "^": 469, _: 556, "`": 333, a: 556, b: 556, c: 500, d: 556,
  e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500,
  y: 500, z: 500, "{": 334, "|": 260, "}": 334, "~": 584,
};

export function cleanText(text: string) {
  return (text ?? "")
    .replace(/→/g, "->")
    .replace(/[—–]/g, "-")
    .replace(/•/g, "*")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^	\n\r\x20-\x7E]/g, "?");
}

function escapePdfText(text: string) {
  return cleanText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function widthOfText(text: string, size: number) {
  let total = 0;
  for (const c of cleanText(text)) total += FONT_WIDTHS[c] ?? 556;
  return (total / 1000) * size;
}

export function trimToWidth(text: string, size: number, maxWidth: number) {
  let s = cleanText(text);
  while (s && widthOfText(s, size) > maxWidth) s = s.slice(0, -1);
  return s;
}

export function wrapText(text: string, size: number, maxWidth: number): string[] {
  const words = cleanText(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (widthOfText(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export class SimplePdf {
  private pages: string[] = [];
  private content = "";

  constructor(private title: string) {
    this.newPage();
  }

  newPage() {
    if (this.content) this.pages.push(this.content);
    this.content = "";
  }

  fillRect(x: number, y: number, w: number, h: number, color: Color) {
    this.content += `q ${color.join(" ")} rg ${x} ${y} ${w} ${h} re f Q\n`;
  }

  strokeRect(x: number, y: number, w: number, h: number, color: Color, lineWidth = 1) {
    this.content += `q ${lineWidth} w ${color.join(" ")} RG ${x} ${y} ${w} ${h} re S Q\n`;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth = 0.5) {
    this.content += `q ${lineWidth} w ${color.join(" ")} RG ${x1} ${y1} m ${x2} ${y2} l S Q\n`;
  }

  text(text: string, x: number, y: number, size = 10, font: FontKey = "F1", color: Color = INK) {
    this.content += `BT ${color.join(" ")} rg /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET\n`;
  }

  save(): Uint8Array {
    if (this.content || this.pages.length === 0) this.pages.push(this.content);
    const objects: string[] = [];
    const add = (body: string) => {
      objects.push(body);
      return objects.length;
    };
    const catalogId = add("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = add("");
    const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pageIds: number[] = [];
    for (const page of this.pages) {
      const stream = page;
      const contentId = add(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}endstream`);
      const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    }
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    add(`<< /Title (${escapePdfText(this.title)}) /Author (TN Child Support Helper) /Producer (TN Child Support Helper) >>`);
    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new TextEncoder().encode(pdf);
  }
}
