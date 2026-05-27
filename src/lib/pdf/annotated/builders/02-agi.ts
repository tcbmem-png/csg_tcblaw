/**
 * §II — Adjusted Gross Income.
 *
 * Mechanical: gross less SE-tax credit, prior support, in-home children
 * credit. All values pulled from WDM section "agi" lines 3a/3b/3c/4.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { authorityLine, h, p, t, table, type Block } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "II. Adjustments to Gross Income and AGI"));

  blocks.push(
    p(
      t(
        "Adjusted Gross Income is defined at Rule .02(1): gross income, plus any federal benefit paid to the child on that parent's account, minus applicable self-employment taxes and minus the qualified-other-children credit. The credits applied on this worksheet are recited below.",
      ),
    ),
  );
  blocks.push(authorityLine("agi"));

  const agi = wdm.sections.find((s) => s.id === "agi");
  if (!agi) return blocks;

  const get = (no: string) => agi.lines.find((l) => l.screenLineNo === no);
  const l3 = get("3"),
    l3a = get("3a"),
    l3b = get("3b"),
    l3c = get("3c"),
    l4 = get("4");

  blocks.push(
    table([
      ["Line", wdm.parentALabel, wdm.parentBLabel],
      ["Gross monthly income (Rule .04(3))", l3?.a?.display ?? "—", l3?.b?.display ?? "—"],
      ["Less: SE-tax credit (Rule .04(4))", l3a?.a?.display ?? "—", l3a?.b?.display ?? "—"],
      [
        "Less: pre-existing child support paid (Rule .04(5)(e)2.)",
        l3b?.a?.display ?? "—",
        l3b?.b?.display ?? "—",
      ],
      [
        "Less: qualified other in-home children (Rule .04(5)(e)1.)",
        l3c?.a?.display ?? "—",
        l3c?.b?.display ?? "—",
      ],
      ["Adjusted Gross Income (AGI)", l4?.a?.display ?? "—", l4?.b?.display ?? "—"],
    ]),
  );

  blocks.push(authorityLine("se_tax_credit", "See also"));
  return blocks;
}
