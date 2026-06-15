import { createFileRoute } from "@tanstack/react-router";
import { IncomeSharesCalculator } from "@/components/calculator/income-shares/income-shares-calculator";
import { LA_INCOME_SHARES_SPEC } from "@/lib/calc/states/la/spec";
import { LA_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/la/schedule";

export const Route = createFileRoute("/la")({
  head: () => ({
    meta: [
      { title: "Louisiana Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Louisiana child support under the income shares model (La. R.S. 9:315 et seq.). Combined-income schedule, 1.5× shared-custody cross-multiply offset, add-ons, and self-sufficiency reserve. Free, no signup.",
      },
      {
        property: "og:title",
        content: "Louisiana Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Run a Louisiana income-shares calculation under R.S. 9:315 — schedule lookup, the 1.5× cross-multiply shared-custody offset (Worksheet B), add-ons, and the $100 schedule floor.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/la" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/la" }],
  }),
  component: LouisianaCalculatorPage,
});

function LouisianaCalculatorPage() {
  return (
    <IncomeSharesCalculator
      spec={LA_INCOME_SHARES_SPEC}
      meta={{
        code: "LA",
        name: "Louisiana",
        modelLabel: "Income Shares Model",
        cite: "La. R.S. § 9:315 et seq.",
        effectiveDate: LA_SCHEDULE_EFFECTIVE_DATE,
        parentingNote:
          "For approximately-equal (shared) custody, Louisiana uses Worksheet B: the basic obligation is multiplied by 1.5, each parent's share is cross-multiplied by the OTHER parent's share of physical-custody time, and the two are offset. The result is capped at what the obligor would owe as the domiciliary parent — a ceiling, never a floor (R.S. 9:315.9).",
      }}
    />
  );
}
