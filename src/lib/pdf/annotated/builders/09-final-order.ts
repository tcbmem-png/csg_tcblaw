/**
 * §IX — Final Order Summary.
 *
 * Mechanical FCSO (with federal-benefit offset already applied in the
 * engine). FCSO = PCSO adjusted by any deviations granted under Rule .07.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { authorityLine, h, p, t, type Block } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "IX. Final Order Summary"));

  const final = wdm.sections.find((s) => s.id === "final");
  const monthly = final?.lines.find((l) => l.screenLineNo === "15");
  const annual = final?.lines.find((l) => l.screenLineNo === "16");

  blocks.push(
    p(
      t(
        "The Final Child Support Order is the Presumptive Child Support Order adjusted by any deviation the tribunal grants under Rule .07 with written findings. When no deviation is granted, FCSO equals PCSO. Any federal benefit paid to the child on the obligor's account offsets the obligor's FCSO per Tenn. Code Ann. § 36-5-101(a)(6) and Rule .04(10).",
      ),
    ),
  );
  blocks.push(authorityLine("fcso"));

  if (monthly?.total) {
    blocks.push(
      p(
        t("Final monthly all-in obligation on this worksheet: "),
        t(monthly.total.display, { bold: true }),
        t("."),
      ),
    );
  }
  if (annual?.total) {
    blocks.push(
      p(t("Annualized: "), t(annual.total.display, { bold: true }), t(".")),
    );
  }

  return blocks;
}
