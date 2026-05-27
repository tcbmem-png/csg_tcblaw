/**
 * §IV — Basic Child Support Obligation.
 *
 * Mechanical: schedule lookup OR above-cap formula derivation. Branch
 * driven by wdm bcso line's bcsoAboveCap structured field — never by
 * parsing display strings.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { authorityLine, cite, h, p, t, table, type Block, money } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "IV. Basic Child Support Obligation"));

  const bcso = wdm.sections.find((s) => s.id === "bcso");
  const line6 = bcso?.lines.find((l) => l.screenLineNo === "6");
  const isAboveCap = !!line6?.bcsoAboveCap;

  if (isAboveCap && line6?.bcsoAboveCap) {
    const brk = line6.bcsoAboveCap;
    blocks.push(
      p(
        t(
          "Combined AGI exceeds the schedule's $28,250 cap. The BCSO is derived from the above-schedule formula at Rule .09 (chapter end of Schedule .09).",
        ),
      ),
    );
    blocks.push(
      table([
        ["Step", "Value"],
        [`Top of schedule (${wdm.numChildren} children at $28,250 combined AGI)`, money(brk.topOfSchedule)],
        ["Combined AGI in excess of schedule cap", money(brk.excessAGI)],
        [`Above-cap rate (${(brk.rate * 100).toFixed(2)}%)`, `× ${money(brk.excessAGI)}`],
        ["Above-cap addition", money(brk.addition)],
        ["BCSO (top of schedule + above-cap addition)", line6.total?.display ?? "—"],
      ]),
    );
    blocks.push(authorityLine("above_cap"));
  } else {
    blocks.push(
      p(
        t(
          "BCSO is read from the Child Support Schedule (Rule .09) based on combined monthly AGI and the number of children, rounded up to the next schedule row per Rule .04(6)(b).",
        ),
      ),
    );
    const rowLine = bcso?.lines.find((l) => l.citation === "bcso_schedule_table");
    if (rowLine) blocks.push(p(t(rowLine.label)));
    blocks.push(
      p(
        t("BCSO on this worksheet: "),
        t(line6?.total?.display ?? "—", { bold: true }),
        t("."),
      ),
    );
    blocks.push(authorityLine("bcso_schedule_within"));
  }

  const line7 = bcso?.lines.find((l) => l.screenLineNo === "7");
  if (line7) {
    blocks.push(
      p(
        t("Pro-rata share of BCSO: "),
        t(`${wdm.parentALabel} ${line7.a?.display ?? "—"}, ${wdm.parentBLabel} ${line7.b?.display ?? "—"}.`),
      ),
    );
    blocks.push(authorityLine("pro_rata"));
  }

  return blocks;
}
