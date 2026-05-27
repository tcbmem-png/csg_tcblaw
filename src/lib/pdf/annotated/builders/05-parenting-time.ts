/**
 * §V — Parenting Time and Net Presumptive Support.
 *
 * Pure: (WDM) => Block[]. Reads only WDM. No fixture awareness.
 *
 * Dispatches on the parenting band actually determined for this
 * worksheet and recites the *operative* rule + the math that produced
 * the figure. Below-band-of-relevance threshold constants are NOT
 * enumerated as a "framework summary" — only the threshold that
 * governs THIS case is recited (drift-prevention rule #7).
 *
 *   - Equal parenting:    cross-credit formula per Rule .04(7)(b)(2)(i)
 *   - Standard (ARP):     pro-rata share with variable-multiplier
 *                         adjustment only when the band actually shifts
 *                         out of the 80-day baseline.
 *   - Split:              deferred per Phase E matrix (no fixture yet).
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { findLineByScreenNo } from "@/lib/calc/wdm/build";
import {
  authorityLine,
  cite,
  h,
  money as fmtMoney,
  p,
  spacer,
  t,
  type Block,
} from "../layout/flow";

type Band = "equal" | "standard" | "neutral" | "reduction" | "increase";

function parseBand(line8Label?: string): Band {
  const raw = (line8Label ?? "").replace(/^Band:\s*/i, "").trim().toLowerCase();
  if (raw === "equal") return "equal";
  if (raw === "reduction") return "reduction";
  if (raw === "increase") return "increase";
  if (raw === "neutral") return "neutral";
  return "standard";
}

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  const a = wdm.parentALabel;
  const b = wdm.parentBLabel;

  const line8 = findLineByScreenNo(wdm, "8");
  const line9 = findLineByScreenNo(wdm, "9");
  const band: Band = parseBand(line8?.label);
  const netDisplay = line9?.total?.display ?? "—";

  // PI values from §III (line 5) and BCSO from §IV (line 6) so we can
  // show the formula with actual values without re-reading CalcOutputs.
  const agi = wdm.sections.find((s) => s.id === "agi");
  const pi = agi?.lines.find((l) => l.screenLineNo === "5");
  const piA = pi?.a?.amount ?? null;
  const piB = pi?.b?.amount ?? null;

  const bcsoSection = wdm.sections.find((s) => s.id === "bcso");
  const bcsoLine = bcsoSection?.lines.find((l) => l.screenLineNo === "6");
  // For all bands except equal, Line 6 carries the BCSO; for equal,
  // Line 6 prints $0 and the real schedule-derived BCSO lives on the
  // panel field added in Phase D drift-fix.
  const bcsoAmount =
    band === "equal"
      ? wdm.panels.bcsoAmount
      : Math.abs(bcsoLine?.total?.amount ?? 0);

  blocks.push(h(1, "V. Parenting Time and Net Presumptive Support"));

  // -------------------- Equal 50/50 branch --------------------
  if (band === "equal") {
    blocks.push(
      p(
        t(
          `The parents share equal parenting time, so the worksheet applies the equal-parenting cross-credit method. Net presumptive child support is the basic obligation multiplied by the absolute difference in the parents' percentages of income; the higher-PI parent owes the lower-PI parent that amount.`,
        ),
      ),
    );
    blocks.push(authorityLine("parenting_time_5050"));

    // Formula + math, when we have the inputs we need.
    if (piA !== null && piB !== null && bcsoAmount > 0) {
      const diff = Math.abs(piA - piB);
      const product = bcsoAmount * diff;
      const higherIsA = piA >= piB;
      blocks.push(
        p(
          t(`Formula: `),
          t(`net presumptive = BCSO × |PI_${a[0]} − PI_${b[0]}|`, { bold: true }),
          t(`.`),
        ),
      );
      blocks.push(
        p(
          t(`Applied to this worksheet: `),
          t(
            `${fmtMoney(bcsoAmount)} × |${(piA * 100).toFixed(2)}% − ${(piB * 100).toFixed(2)}%| = ${fmtMoney(bcsoAmount)} × ${diff.toFixed(4)} = ${fmtMoney(Math.round(product))}`,
            { bold: true },
          ),
          t(`. Direction: higher-PI parent (`),
          t(higherIsA ? a : b, { bold: true }),
          t(`) → lower-PI parent (`),
          t(higherIsA ? b : a, { bold: true }),
          t(`).`),
        ),
      );
    }

    if (wdm.panels.equalParentingLowSupportNote) {
      blocks.push(
        p(
          t(`Methodology note carried on the worksheet: `),
          t(wdm.panels.equalParentingLowSupportNote, { italic: true }),
        ),
      );
    }
  }

  // -------------------- Standard / ARP branches --------------------
  if (band === "standard" || band === "neutral") {
    blocks.push(
      p(
        t(
          `The alternate residential parent's parenting time falls at the 80-day baseline, so no variable-multiplier adjustment applies. Net presumptive child support is the ARP's pro-rata share of the basic obligation, paid to the primary residential parent.`,
        ),
      ),
    );
    blocks.push(authorityLine("parenting_time_arp_reduction"));
    blocks.push(
      p(
        t(`Parenting-time adjustment: `),
        t(`none (ARP at 80-day baseline per Rule .04(7)(a))`, { bold: true }),
        t(`.`),
      ),
    );
  } else if (band === "reduction" || band === "increase") {
    const multiplierText = line8?.total?.display ?? "—";
    const opCite =
      band === "reduction"
        ? "parenting_time_reduction"
        : "parenting_time_increase";
    const threshold =
      band === "reduction"
        ? "ARP at 92+ days; variable multiplier reduces the ARP's share"
        : "ARP below 68 days; variable multiplier increases the ARP's share";
    blocks.push(
      p(
        t(
          `The alternate residential parent's parenting time falls in the `,
        ),
        t(band, { bold: true }),
        t(
          ` band: ${threshold}. The mechanical computation applies the rule-prescribed multiplier to the ARP's pro-rata share of the basic obligation.`,
        ),
      ),
    );
    blocks.push(authorityLine(opCite));
    blocks.push(
      p(
        t(`Variable multiplier applied: `),
        t(multiplierText.replace(/^multiplier\s+/i, ""), { bold: true }),
        t(`.`),
      ),
    );
  }

  // -------------------- Net presumptive result --------------------
  blocks.push(spacer(4));
  blocks.push(
    p(
      t(`Net presumptive child support resulting from the parenting-time computation: `),
      t(netDisplay, { bold: true }),
      t(
        `. This figure represents the obligation before any mandatory add-ons under `,
      ),
      cite("addon_health"),
      t(`, `),
      cite("addon_childcare"),
      t(`, or `),
      cite("addon_medical"),
      t(`, and before any deviations under `),
      cite("deviation_general"),
      t(`.`),
    ),
  );

  // -------------------- SSR check, when engaged --------------------
  const ssrLine = wdm.sections
    .find((s) => s.id === "parenting_time")
    ?.lines.find((l) => l.citation === "ssr");
  if (ssrLine) {
    blocks.push(
      p(
        t(`Self-support reserve check: `),
        t(ssrLine.label, { italic: true }),
      ),
    );
    blocks.push(authorityLine("ssr"));
  }

  if (wdm.panels.nonEarnerArpNote) {
    blocks.push(
      p(t(`Non-earner alternate residential parent: `), t(wdm.panels.nonEarnerArpNote)),
    );
  }

  // Cross-reference back to the AOC numeric cells the reader is auditing.
  blocks.push(spacer(4));
  blocks.push(
    p(
      t(
        `Cross-reference Line 8 (band) and Line 9 (net presumptive) on the AOC form for `,
      ),
      t(a, { bold: true }),
      t(` and `),
      t(b, { bold: true }),
      t(`.`),
    ),
  );

  return blocks;
}

}
