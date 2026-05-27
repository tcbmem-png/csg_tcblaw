/**
 * §I — Income Determination.
 *
 * DRIFT-RISK HIGH (plan §0.1, §9 rules 9 + 10).
 *
 * Dispatch off WDM's per-parent IncomeMethodology. For each parent,
 * recite the rule that governs the chosen path and the user's election.
 * Category-C judgment paths (variable averaging, imputation) recite the
 * rule's factor list verbatim; no editorializing.
 *
 * Banned phrases per §9 rule 9: "the better view", "courts generally",
 * "typically averaged over", "the safer position". This builder uses
 * none of them.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import type { IncomeMethodology } from "@/lib/calc/types";
import {
  authorityLine,
  bullets,
  cite,
  h,
  money,
  p,
  t,
  userQuote,
  type Block,
} from "../layout/flow";
import type { CitationKey } from "@/lib/calc/citations";

interface PerParent {
  label: string;
  methodology?: IncomeMethodology;
  grossMonthly: number;
  imputed: boolean;
}

export function build(wdm: WDM): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "I. Income Determination"));

  blocks.push(
    p(
      t(
        "Gross monthly income is determined per parent under Rule .04(3). " +
          "The Guidelines enumerate twenty-three income categories at .04(3)(a)1.(i)–(xxiii). " +
          "Where the source path involves judgment — variable-income averaging period under " +
          ".04(3)(b), self-employment ordinary-expense determinations under .04(3)(a)3., or " +
          "imputation under .04(3)(a)2. — the rule supplies the factors the tribunal weighs; " +
          "the user's election is recited verbatim below.",
      ),
    ),
  );
  blocks.push(authorityLine("gross_income"));

  const agi = wdm.sections.find((s) => s.id === "agi");
  const line3 = agi?.lines.find((l) => l.screenLineNo === "3");
  const methodology = line3?.methodology ?? {};

  const parents: PerParent[] = [
    {
      label: wdm.parentALabel,
      methodology: methodology.parentA,
      grossMonthly: line3?.a?.amount ?? 0,
      imputed: line3?.a?.category === "judgment",
    },
    {
      label: wdm.parentBLabel,
      methodology: methodology.parentB,
      grossMonthly: line3?.b?.amount ?? 0,
      imputed: line3?.b?.category === "judgment",
    },
  ];

  for (const parent of parents) {
    blocks.push(h(2, parent.label));
    blocks.push(...renderParent(parent));
  }

  return blocks;
}

function renderParent(parent: PerParent): Block[] {
  const blocks: Block[] = [];
  const m = parent.methodology;
  const monthly = money(parent.grossMonthly);

  if (!m) {
    blocks.push(
      p(
        t("Gross monthly income on this worksheet: "),
        t(monthly, { bold: true }),
        t(". Source path not documented through the Income Helper."),
      ),
    );
    return blocks;
  }

  switch (m.path) {
    case "simple": {
      blocks.push(
        p(
          t("Income path: "),
          t("fixed wages / salary", { bold: true }),
          t(" under Rule .04(3)(a)1. Gross monthly: "),
          t(monthly, { bold: true }),
          t("."),
        ),
      );
      if (m.source === "w2_box5_annual") {
        blocks.push(
          p(
            t(
              'Source basis: W-2 Box 5 (Medicare wages, annual) per Rule .04(3)(a)1. Box 5 captures pre-tax retirement deferrals, which Box 1 omits.',
            ),
          ),
        );
      }
      blocks.push(authorityLine("income_simple"));
      break;
    }

    case "variable": {
      blocks.push(
        p(
          t("Income path: "),
          t("variable income (averaged)", { bold: true }),
          t(" under Rule .04(3)(b). Gross monthly: "),
          t(monthly, { bold: true }),
          t("."),
        ),
      );
      blocks.push(
        p(
          t(
            "Rule .04(3)(b) provides that variable income shall be averaged over a reasonable period of time consistent with the circumstances of the case. The averaging period is a judgment call for the court.",
          ),
        ),
      );
      blocks.push(
        p(
          t("Averaging period elected on this worksheet: "),
          userQuote(m.averagingMethod),
          t(` (${m.years.length} year${m.years.length === 1 ? "" : "s"} entered).`),
        ),
      );
      if (m.rationale)
        blocks.push(p(t("User-entered rationale: "), userQuote(m.rationale)));
      blocks.push(authorityLine("income_variable"));
      blocks.push(authorityLine("case.massey_v_casals", "See also"));
      break;
    }

    case "self_employed": {
      const gross = m.grossReceiptsAnnual / 12;
      const exp = m.ordinaryExpensesAnnual / 12;
      blocks.push(
        p(
          t("Income path: "),
          t("self-employment", { bold: true }),
          t(" under Rule .04(3)(a)3. Gross monthly: "),
          t(monthly, { bold: true }),
          t("."),
        ),
      );
      blocks.push(
        p(
          t("Derived as gross receipts ("),
          t(money(gross)),
          t("/mo) less ordinary and reasonable expenses ("),
          t(money(exp)),
          t("/mo). Per .04(3)(a)3.(ii)(II), accelerated depreciation and §179 add-backs are excluded from reasonable expenses."),
        ),
      );
      if (m.addBacks.length > 0) {
        blocks.push(p(t("Add-backs applied (user election under Rule .04(3)(a)3.):")));
        blocks.push(
          bullets(
            m.addBacks.map((ab) => [
              userQuote(`${ab.label}: ${money(ab.amount)}`),
            ]),
          ),
        );
      }
      blocks.push(authorityLine("income_self_employed"));
      break;
    }

    case "multi_source": {
      blocks.push(
        p(
          t("Income path: "),
          t("multiple income sources", { bold: true }),
          t(" under Rule .04(3)(a)1. Gross monthly: "),
          t(monthly, { bold: true }),
          t("."),
        ),
      );
      blocks.push(p(t("Sources summed to a single monthly figure (user-entered):")));
      blocks.push(
        bullets(
          m.sources.map((s) => [
            userQuote(`${s.label}: ${money(s.annual / 12)}/mo`),
          ]),
        ),
      );
      blocks.push(authorityLine("income_multi_source"));
      break;
    }

    case "imputed": {
      const ruleKey: CitationKey =
        m.method === "asset_based"
          ? "income_imputed_assets"
          : m.method === "vocational_capacity"
            ? "income_imputed_vocational"
            : "income_imputed_prior_earnings";
      blocks.push(
        p(
          t("Income path: "),
          t("imputation", { bold: true }),
          t(" under Rule .04(3)(a)2. Imputed gross monthly: "),
          t(monthly, { bold: true }),
          t(". Actual real-earnings monthly figure recorded for comparison: "),
          t(money(m.actualMonthlyGross), { bold: true }),
          t("."),
        ),
      );
      blocks.push(
        p(
          t("Imputation basis elected on this worksheet: "),
          userQuote(m.basis),
          t(". Imputation method: "),
          userQuote(m.method),
          t("."),
        ),
      );
      blocks.push(
        p(
          t(
            "Factors the rule directs the tribunal to weigh under .04(3)(a)2.(iii):",
          ),
        ),
      );
      blocks.push(
        bullets([
          [t("the parent's past and present employment")],
          [t("the parent's education, training, and ability to work")],
          [t("whether the parent is a stay-at-home caretaker")],
          [t("whether the parent's lifestyle is extravagant")],
          [t("whether the parent is the caretaker of a handicapped relative")],
          [t("the parent's pursuit of training")],
          [t("other relevant factors")],
        ]),
      );
      if (m.rationale)
        blocks.push(p(t("User-entered rationale: "), userQuote(m.rationale)));
      blocks.push(authorityLine(ruleKey));
      break;
    }

    case "special": {
      const ruleKey: CitationKey =
        m.situation === "incarcerated"
          ? "income_carveout_incarceration"
          : m.situation === "ssi_only"
            ? "income_carveout_means_tested"
            : m.situation === "federal_benefit_to_child"
              ? "income_federal_benefit_to_child"
              : "gross_income";
      blocks.push(
        p(
          t("Income path: "),
          t("special situation — ", { bold: true }),
          userQuote(m.situation),
          t(". Gross monthly carried: "),
          t(monthly, { bold: true }),
          t("."),
        ),
      );
      if (m.rationale)
        blocks.push(p(t("User-entered rationale: "), userQuote(m.rationale)));
      blocks.push(authorityLine(ruleKey));
      break;
    }
  }

  return blocks;
}
