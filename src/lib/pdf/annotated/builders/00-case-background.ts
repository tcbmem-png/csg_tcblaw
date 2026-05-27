/**
 * Case Background and Inputs.
 *
 * Category-B recital: caption, party labels, child count, parenting type.
 * No editorializing. All values pulled from WDM verbatim.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { h, p, t, type Block } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "Case Background and Inputs"));

  if (wdm.hasCaption) {
    const c = wdm.caption;
    blocks.push(
      p(
        t("Matter: ", { bold: true }),
        t(c.matterName || "—"),
        t(c.docketNumber ? `   Docket: ${c.docketNumber}` : ""),
        t(c.court ? `   Court: ${c.court}` : ""),
      ),
    );
    if (c.preparedBy)
      blocks.push(p(t("Prepared by: ", { bold: true }), t(c.preparedBy)));
  }

  blocks.push(
    p(
      t("Parents: ", { bold: true }),
      t(`${wdm.parentALabel} and ${wdm.parentBLabel}.`),
    ),
  );
  blocks.push(
    p(
      t("Children covered: ", { bold: true }),
      t(`${wdm.numChildren} ${wdm.numChildren === 1 ? "child" : "children"}.`),
    ),
  );

  const idSection = wdm.sections.find((s) => s.id === "identification");
  const parentingLine = idSection?.lines.find((l) => l.screenLineNo === "2");
  if (parentingLine?.total) {
    blocks.push(
      p(
        t("Parenting arrangement: ", { bold: true }),
        t(parentingLine.total.display),
        t("."),
      ),
    );
  }
  return blocks;
}
