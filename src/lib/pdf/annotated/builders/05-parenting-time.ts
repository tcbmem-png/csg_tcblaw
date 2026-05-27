/**
 * §V — Parenting Time and Net Presumptive Support.
 *
 * Pure: (WDM) => Block[]. Reads only WDM. No fixture awareness.
 * Branches off WDM-resident flags (parenting band, equal-parenting note,
 * SSR engagement) — never off identity.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { findLineByScreenNo } from "@/lib/calc/wdm/build";
import {
  authorityLine,
  bullets,
  cite,
  h,
  money,
  p,
  spacer,
  t,
  type Block,
} from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  const a = wdm.parentALabel;
  const b = wdm.parentBLabel;
  const line8 = findLineByScreenNo(wdm, "8");
  const line9 = findLineByScreenNo(wdm, "9");
  const bandText = line8?.label ?? "Band: —";
  const multiplierText = line8?.total?.display ?? "—";
  const netDisplay = line9?.total?.display ?? "—";

  blocks.push(h(1, "V. Parenting Time and Net Presumptive Support"));

  blocks.push(
    p(
      t(
        `The Guidelines classify parenting time into bands that govern whether the adjusted basic obligation is reduced for additional days spent with the alternate residential parent or increased for fewer than the baseline 80 days. `,
      ),
      t(`Determined band for this worksheet: `),
      t(bandText.replace(/^Band:\s*/i, ""), { bold: true }),
      t(`. Variable multiplier: `),
      t(multiplierText, { bold: true }),
      t(`.`),
    ),
  );
  blocks.push(authorityLine("parenting_time_day_constants"));

  // Equal-parenting branch: print the cross-credit explainer verbatim from WDM.
  if (wdm.panels.equalParentingLowSupportNote) {
    blocks.push(
      p(
        t(
          `Because the parents share equal time, the worksheet applies the equal-parenting designation under `,
        ),
        cite("parenting_time_5050"),
        t(
          `. The alternate-residential-parent designation is for parenting-time-adjustment purposes only and does not reflect a finding about either parent's role.`,
        ),
      ),
    );
    blocks.push(
      p(
        t(`Methodology note carried on the worksheet: `),
        t(wdm.panels.equalParentingLowSupportNote, { italic: true }),
      ),
    );
  }

  // Net presumptive line — mechanical value.
  blocks.push(spacer(4));
  blocks.push(
    p(
      t(`Net presumptive child support resulting from the parenting-time adjustment: `),
      t(netDisplay, { bold: true }),
      t(`. This figure represents the obligation before any mandatory add-ons under `),
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

  // SSR branch — surfaced verbatim from WDM when engaged.
  // The SSR note line is appended to the parenting-time section in
  // buildParentingTimeSection when outputs.ssrApplied is true.
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

  // ARP-day non-earner explainer — surfaced verbatim from WDM when present.
  if (wdm.panels.nonEarnerArpNote) {
    blocks.push(
      p(t(`Non-earner alternate residential parent: `), t(wdm.panels.nonEarnerArpNote)),
    );
  }

  // Rule-verbatim factor recital: list the day-band thresholds the rule
  // identifies, so the chancellor can audit the classification.
  blocks.push(spacer(4));
  blocks.push(h(3, "Day-band thresholds applied"));
  blocks.push(
    bullets([
      [t("80-day standard parenting baseline (Rule .04(7)(a))")],
      [t("68-day threshold for ARP parenting-time increase (Rule .04(7)(i))")],
      [t("92-day threshold for variable-multiplier reduction (Rule .04(7)(h))")],
      [t("182.5-day denominator for equal-parenting computation (Rule .04(7)(b)2.(i))")],
    ]),
  );

  // Reference back to the AOC numeric cells the reader is auditing.
  blocks.push(
    p(
      t(`Parents identified on this worksheet: ARP / PRP designations follow the band determination above; cross-reference Line 8 (band) and Line 9 (net presumptive) on the AOC form for `),
      t(a, { bold: true }),
      t(` and `),
      t(b, { bold: true }),
      t(`.`),
    ),
  );

  return blocks;
}
