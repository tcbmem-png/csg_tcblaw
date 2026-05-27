/**
 * Appendix B — Income Methodology Documentation.
 *
 * Per-parent income path documentation in narrative form. Mostly recital
 * of the user's Income Helper entries. Category-C income paths inherit
 * the factor lists already recited in §I; this appendix surfaces the
 * raw entries so an auditor can reconstruct the gross monthly figure.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import type { IncomeMethodology } from "@/lib/calc/types";
import { bullets, h, money, p, t, type Block, userQuote } from "../layout/flow";

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "Appendix B. Income Methodology — Per-Parent Documentation"));

  const line3 = wdm.sections
    .find((s) => s.id === "agi")
    ?.lines.find((l) => l.screenLineNo === "3");
  const m = line3?.methodology ?? {};

  const entries: Array<[string, IncomeMethodology | undefined]> = [
    [wdm.parentALabel, m.parentA],
    [wdm.parentBLabel, m.parentB],
  ];

  for (const [label, methodology] of entries) {
    blocks.push(h(2, label));
    if (!methodology) {
      blocks.push(p(t("No Income Helper entries captured for this parent.")));
      continue;
    }
    blocks.push(
      p(
        t("Path: "),
        userQuote(methodology.path),
        t(`. Result: ${money(methodology.monthlyGrossResult)}/mo.`),
      ),
    );
    switch (methodology.path) {
      case "variable":
        blocks.push(p(t("Year entries:")));
        blocks.push(
          bullets(
            methodology.years.map((y) => [userQuote(`${y.year}: ${money(y.amount)}`)]),
          ),
        );
        break;
      case "self_employed":
        blocks.push(
          p(
            t("Gross receipts (annual): "),
            t(money(methodology.grossReceiptsAnnual), { bold: true }),
            t("; ordinary expenses (annual): "),
            t(money(methodology.ordinaryExpensesAnnual), { bold: true }),
            t("."),
          ),
        );
        break;
      case "multi_source":
        blocks.push(
          bullets(
            methodology.sources.map((s) => [
              userQuote(`${s.label}: ${money(s.annual)}/yr`),
            ]),
          ),
        );
        break;
      case "imputed":
        blocks.push(
          p(
            t("Imputation basis: "),
            userQuote(methodology.basis),
            t("; method: "),
            userQuote(methodology.method),
            t("; actual real-earnings monthly: "),
            t(money(methodology.actualMonthlyGross), { bold: true }),
            t("."),
          ),
        );
        break;
      case "special":
        blocks.push(p(t("Special situation: "), userQuote(methodology.situation), t(".")));
        break;
      case "simple":
        blocks.push(p(t("Source: "), userQuote(methodology.source), t(".")));
        break;
    }
  }

  return blocks;
}
