/**
 * §VIII — Statutory Cap Analysis.
 *
 * Pure: (WDM) => Block[]. Always rendered; text branches on
 * wdm.panels.statutoryCap.engaged. The cap operates on the **PCSO**
 * (pre-deviation net presumptive support + mandatory add-ons), not on
 * the FCSO; the panel field `calculatedPCSO` is the PCSO magnitude.
 *
 * Citation discipline (Phase D drift-fix A.1): the burden-shift case
 * lineage (Nash / Richardson / Smallman) is substantively cited ONLY
 * in the engaged branch. In the below-cap branch no above-cap case
 * authority is registered, so the global Authority Block does not list
 * cases the document never relied on (bidirectional citation invariant).
 */
import type { WDM } from "@/lib/calc/wdm/types";
import {
  authorityLine,
  bullets,
  cite,
  h,
  money,
  p,
  spacer,
  t,
  userQuote,
  type Block,
} from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  const panel = wdm.panels.statutoryCap;
  blocks.push(h(1, "VIII. Statutory Cap Analysis"));

  blocks.push(
    p(
      t(
        `The statutory presumptive maximum operates as a cap on the presumptive child support order (PCSO). For `,
      ),
      t(
        `${panel.numChildren} ${panel.numChildren === 1 ? "child" : "children"}`,
        { bold: true },
      ),
      t(`, the statutory maximum is `),
      t(money(panel.statutoryMax), { bold: true }),
      t(` per month.`),
    ),
  );
  blocks.push(authorityLine("pcso_max"));

  blocks.push(
    p(
      t(`Presumptive child support order (PCSO) on this worksheet: `),
      t(money(panel.calculatedPCSO), { bold: true }),
      t(`. `),
      t(
        panel.engaged
          ? `This exceeds the statutory presumptive maximum by ${money(panel.excessOverCap)}.`
          : `This is ${money(panel.headroom)} below the statutory presumptive maximum.`,
      ),
    ),
  );

  if (panel.capNote) {
    blocks.push(p(t(panel.capNote, { italic: true })));
  }

  if (!panel.engaged) {
    // Below-cap branch — no burden-shift; no above-cap case authority
    // is substantively engaged, so none is registered here. The global
    // Authority Block walks only what the body actually cited.
    blocks.push(
      p(
        t(
          `Because the PCSO falls within the statutory cap, no above-cap burden-shift analysis is engaged. The presumptive order under `,
        ),
        cite("fcso"),
        t(` controls subject to any deviations under `),
        cite("deviation_general"),
        t(`.`),
      ),
    );
    return blocks;
  }

  // Engaged branch — burden-shift framework. The case lineage is
  // substantively cited in-prose so the global Authority Block lists
  // exactly the cases the analysis relied on.
  blocks.push(
    p(
      t(
        `Above the statutory presumptive maximum the recipient parent bears the burden of proving by a preponderance of the evidence that additional support beyond the cap is reasonably necessary for the child. The Tennessee Supreme Court established this burden-shift framework in `,
      ),
      cite("case.nash_v_mulle"),
      t(`; the Court of Appeals has applied and refined it in `),
      cite("case.richardson_v_spanos"),
      t(` and `),
      cite("case.smallman_v_smallman"),
      t(`.`),
    ),
  );

  if (panel.factors.length > 0) {
    blocks.push(h(3, "Factors weighed under the burden-shift framework"));
    blocks.push(bullets(panel.factors.map((f) => [t(f)])));
  }

  blocks.push(h(3, "Election on this worksheet"));
  if (panel.userElectedPCSO === null) {
    blocks.push(
      p(
        t(
          `Position selected on this worksheet: the user has not yet entered an above-cap election. The presumptive order is reported as the calculated above-cap figure pending that election.`,
        ),
      ),
    );
  } else {
    blocks.push(
      p(
        t(`Position selected on this worksheet: PCSO held at `),
        userQuote(money(panel.userElectedPCSO.amount)),
        t(`.`),
      ),
    );
    if (panel.userElectedPCSO.rationale) {
      blocks.push(
        p(t(`User-entered rationale: `), userQuote(panel.userElectedPCSO.rationale)),
      );
    }
  }

  return blocks;
}
