/**
 * Phase D sample-prose checkpoint render script.
 * Produces 2 annotated PDFs (F02 + F04) using the step-3 registry
 * (§V parenting time, §VII deviations, §VIII statutory cap).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { calculate } from "../src/lib/calc/calc";
import { buildWDM } from "../src/lib/calc/wdm/build";
import { FIXTURES } from "../src/lib/calc/wdm/__tests__/fixtures";
import { renderAnnotatedPdf } from "../src/lib/pdf/annotated";

const OUT_DIR = "/mnt/documents/annotated-sample";
const TARGETS = new Set(["f02-equal-50-50", "f04-berger-imputed-with-deviations"]);

async function loadAssets() {
  const base = path.join("src/lib/pdf/assets/fonts");
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(base, "DejaVuSans.ttf")),
    fs.readFile(path.join(base, "DejaVuSans-Bold.ttf")),
  ]);
  return {
    regularFont: new Uint8Array(regular),
    boldFont: new Uint8Array(bold),
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const assets = await loadAssets();
  const fixtures = FIXTURES.filter((f) => TARGETS.has(f.slug));
  for (const fx of fixtures) {
    const outputs = calculate(fx.inputs);
    const wdm = buildWDM(fx.inputs, outputs, undefined, {
      preparedOnDisplay: "05/27/2026",
    });
    const pdf = await renderAnnotatedPdf(wdm, {
      assets,
      meta: {
        title: `Annotated Worksheet — ${fx.label}`,
        subject: fx.exercises.join("; "),
        preparedOnDisplay: "Prepared 05/27/2026",
        runningHeader: `Annotated Worksheet · ${fx.label}`,
        publicUrl: "csg.tcblaw.org/tn",
      },
    });
    const outPath = path.join(OUT_DIR, `${fx.slug}.annotated.pdf`);
    await fs.writeFile(outPath, pdf);
    console.log(`wrote ${outPath} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
