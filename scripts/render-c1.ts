/**
 * C1 render script — produces F02, F03, F04 overlay PDFs into
 * /mnt/documents/c1-aoc-renders/ for human pixel-fidelity review against
 * the blank official DHS form.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { calculate } from "../src/lib/calc/calc";
import { buildWDM } from "../src/lib/calc/wdm/build";
import { FIXTURES } from "../src/lib/calc/wdm/__tests__/fixtures";
import { renderOverlay } from "../src/lib/pdf/overlay-renderer";

const OUT_DIR = "/mnt/documents/c1-aoc-renders";
const TARGETS = new Set([
  "f02-equal-50-50",
  "f03-above-schedule-standard",
  "f04-berger-imputed-with-deviations",
]);

async function loadAssets() {
  const base = path.join("src/lib/pdf/assets");
  const [blankPdf, regular, bold] = await Promise.all([
    fs.readFile(path.join(base, "tn-cs-worksheet-blank.pdf")),
    fs.readFile(path.join(base, "fonts/DejaVuSans.ttf")),
    fs.readFile(path.join(base, "fonts/DejaVuSans-Bold.ttf")),
  ]);
  return {
    blankPdf: new Uint8Array(blankPdf),
    regularFont: new Uint8Array(regular),
    boldFont: new Uint8Array(bold),
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const assets = await loadAssets();
  const fixtures = FIXTURES.filter((f) => TARGETS.has(f.slug));
  if (fixtures.length !== TARGETS.size) {
    throw new Error(`Missing fixtures; found ${fixtures.map((f) => f.slug)}`);
  }
  for (const fx of fixtures) {
    const outputs = calculate(fx.inputs);
    const wdm = buildWDM(fx.inputs, outputs, undefined, {
      preparedOnDisplay: "05/27/2026",
    });
    const pdf = await renderOverlay(wdm, fx.inputs, outputs, assets, {
      titleMetadata: `TN Child Support Worksheet — ${fx.label}`,
      subjectMetadata: fx.exercises.join("; "),
    });
    const outPath = path.join(OUT_DIR, `${fx.slug}.pdf`);
    await fs.writeFile(outPath, pdf);
    console.log(`wrote ${outPath} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
