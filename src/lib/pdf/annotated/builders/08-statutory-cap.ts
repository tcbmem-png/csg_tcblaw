/**
 * §VIII — Statutory Cap Analysis.
 *
 * Pure: (WDM) => Block[]. Always rendered; text branches on
 * wdm.panels.statutoryCap.engaged. The cap panel is structured
 * Refinement 4 of the WDM — both branches receive the same shape so
 * this builder switches on a single boolean rather than reaching into
 * outputs.
 *
 * Authority block at end recites the rule + the three case-law keys
 * approved in Phase D ack §6.
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

  // Identify the threshold the worksheet is measured against.
  blocks.push(
    p(
      t(
        `The statutory presumptive maximum operates as a cap on the presumptive child support order. For `,
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

  // Both branches receive: calculated PCSO, statutoryMax, capNote.
  blocks.push(
    p(
      t(`Calculated presumptive order on this worksheet: `),
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
    // Below-cap branch — no burden-shift; no further analysis required.
    blocks.push(
      p(
        t(
          `Because the calculated presumptive order falls within the statutory cap, no above-cap burden-shift analysis is engaged. The presumptive order under `,
        ),
        cite("fcso"),
        t(` controls subject to any deviations under `),
        cite("deviation_general"),
        t(`.`),
      ),
    );
    blocks.push(spacer(4));
    blocks.push(h(3, "Authorities"));
    blocks.push(
      bullets([
        [cite("pcso_max")],
        [cite("case.nash_v_mulle")],
        [cite("case.richardson_v_spanos")],
        [cite("case.smallman_v_smallman")],
      ]),
    );
    return blocks;
  }

  // Engaged branch — burden-shift framework. Recite the factor list
  // verbatim from the WDM (sourced from PCSO_BURDEN_SHIFT_FACTORS in
  // wdm/build.ts; do NOT re-author here).
  blocks.push(
    p(
      t(
        `Above the statutory presumptive maximum the recipient parent bears the burden of proving by a preponderance of the evidence that additional support beyond the cap is reasonably necessary for the child. The tribunal weighs the rule-derived factors below.`,
      ),
    ),
  );
  blocks.push(authorityLine("case.nash_v_mulle"));

  if (panel.factors.length > 0) {
    blocks.push(h(3, "Factors weighed under the burden-shift framework"));
    blocks.push(bullets(panel.factors.map((f) => [t(f)])));
  }

  // User election surface: which branch did the user elect?
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

  blocks.push(spacer(4));
  blocks.push(h(3, "Authorities"));
  blocks.push(
    bullets([
      [cite("pcso_max")],
      [cite("case.nash_v_mulle")],
      [cite("case.richardson_v_spanos")],
      [cite("case.smallman_v_smallman")],
    ]),
  );

  return blocks;
}
