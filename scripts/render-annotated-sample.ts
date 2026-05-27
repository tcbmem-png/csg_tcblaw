/**
 * Render three sample annotated worksheet PDFs to /mnt/documents/.
 *
 * Test inputs from the cycle prompt:
 *   1. TBJ Story 1   — Parent A $20K/yr, Parent B $0/yr, 2 children, standard parenting (non-earner=PRP, ARP=A)
 *   2. TBJ Story 2b  — Parent A $50K/yr, Parent B $18K/yr, 3 children, Equal 50/50
 *   3. Deviations    — F04 fixture (imputation + private school + special expenses)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { calculate, defaultInputs } from "../src/lib/calc/calc";
import { buildWDM } from "../src/lib/calc/wdm/build";
import { FIXTURES } from "../src/lib/calc/wdm/__tests__/fixtures";
import { renderAnnotatedPdf } from "../src/lib/pdf/annotated";
import type { CalcInputs } from "../src/lib/calc/types";

const OUT_DIR = "/mnt/documents/annotated-sample";

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

interface Sample {
  slug: string;
  label: string;
  inputs: CalcInputs;
}

const f04 = FIXTURES.find((f) => f.slug === "f04-standard-imputed-with-deviations")!;

const SAMPLES: Sample[] = [
  {
    slug: "tbj-story-1-non-earner-prp",
    label: "TBJ Story 1 — non-earner PRP, 2 children, standard parenting",
    inputs: {
      ...defaultInputs(),
      parentALabel: "Mother",
      parentBLabel: "Father",
      parentAGrossMonthly: 20000 / 12,
      parentBGrossMonthly: 0,
      numChildren: 2,
      parentingType: "standard",
      arpForStandard: "parent_a",
    },
  },
  {
    slug: "tbj-story-2b-equal-50-50",
    label: "TBJ Story 2b — Equal 50/50, 3 children, $50K / $18K",
    inputs: {
      ...defaultInputs(),
      parentALabel: "Mother",
      parentBLabel: "Father",
      parentAGrossMonthly: 50000 / 12,
      parentBGrossMonthly: 18000 / 12,
      numChildren: 3,
      parentingType: "equal",
    },
  },
  {
    slug: "deviations-imputed-private-school-special-expenses",
    label: "Deviations — imputation + private school + special expenses",
    inputs: f04.inputs,
  },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const assets = await loadAssets();
  for (const s of SAMPLES) {
    const outputs = calculate(s.inputs);
    const wdm = buildWDM(s.inputs, outputs, undefined, {
      preparedOnDisplay: "05/27/2026",
    });
    const pdf = await renderAnnotatedPdf(wdm, {
      assets,
      meta: {
        title: `Annotated Worksheet — ${s.label}`,
        subject: s.label,
        preparedOnDisplay: "Prepared 05/27/2026",
        publicUrl: "csg.tcblaw.org/tn",
      },
    });
    const outPath = path.join(OUT_DIR, `${s.slug}.annotated.pdf`);
    await fs.writeFile(outPath, pdf);
    console.log(`wrote ${outPath} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
