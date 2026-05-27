/**
 * §III — Combined AGI and Pro-Rata Shares.
 *
 * Mechanical: combined AGI sums both parents; Percentage of Income (PI)
 * divides each parent's AGI by combined.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { authorityLine, cite, h, p, t, table, type Block } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "III. Combined AGI and Pro-Rata Shares"));

  const agi = wdm.sections.find((s) => s.id === "agi");
  const l4 = agi?.lines.find((l) => l.screenLineNo === "4");
  const l5 = agi?.lines.find((l) => l.screenLineNo === "5");

  blocks.push(
    p(
      t(
        "Each parent's Percentage of Income is determined by dividing that parent's AGI by combined AGI (Rule .02(20)). PI then determines each parent's pro-rata share of the BCSO and mandatory add-ons under ",
      ),
      cite("addon_health"),
      t(", "),
      cite("addon_childcare"),
      t(", and "),
      cite("addon_medical"),
      t("."),
    ),
  );

  blocks.push(
    table([
      ["", wdm.parentALabel, wdm.parentBLabel, "Combined"],
      [
        "AGI (Rule .02(1))",
        l4?.a?.display ?? "—",
        l4?.b?.display ?? "—",
        l4?.total?.display ?? "—",
      ],
      [
        "PI (Rule .02(20))",
        l5?.a?.display ?? "—",
        l5?.b?.display ?? "—",
        "100.00%",
      ],
    ]),
  );

  blocks.push(authorityLine("pro_rata"));
  return blocks;
}
