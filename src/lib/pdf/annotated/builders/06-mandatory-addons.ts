/**
 * §VI — Mandatory Add-Ons under Rule .04(8).
 *
 * Mechanical pro-rata math for health insurance premium, work-related
 * childcare, recurring uninsured medical. These are mandatory add-ons,
 * distinct from Rule .07(2)(d) discretionary deviations (no 7%
 * threshold; no court-discretion analysis).
 */
import type { WDM } from "@/lib/calc/wdm/types";
import {
  authorityLine,
  bullets,
  cite,
  h,
  p,
  t,
  table,
  type Block,
} from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "VI. Mandatory Add-Ons under Rule .04(8)"));

  blocks.push(
    p(
      t(
        "Rule .04(8) identifies three mandatory add-ons applied to the BCSO before the parenting-time adjustment: the children's portion of the health-insurance premium (.04(8)(b)), work-related childcare (.04(8)(c)), and recurring uninsured medical expenses (.04(8)(d)). These are pro-rated by each parent's PI; they are not subject to the 7% presumed-coverage threshold that applies to Special Expenses deviations under Rule .07(2)(d).",
      ),
    ),
  );

  const addons = wdm.sections.find((s) => s.id === "addons");
  if (!addons) return blocks;

  const get = (no: string) => addons.lines.find((l) => l.screenLineNo === no);
  const health = get("10"),
    medical = get("11"),
    childcare = get("12");

  blocks.push(
    table([
      ["Add-On", "Amount", "Authority"],
      ["Health insurance premium (children's portion)", health?.total?.display ?? "—", "Rule .04(8)(b)"],
      [
        "Recurring uninsured medical (pro-rata)",
        medical?.total?.display ?? "—",
        "Rule .04(8)(d)",
      ],
      ["Work-related childcare", childcare?.total?.display ?? "—", "Rule .04(8)(c)"],
    ]),
  );

  blocks.push(authorityLine("addon_health"));
  return blocks;
}
