import { createFileRoute } from "@tanstack/react-router";
import { IncomeSharesCalculator } from "@/components/calculator/income-shares/income-shares-calculator";
import { AL_INCOME_SHARES_SPEC } from "@/lib/calc/states/al/spec";
import { AL_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/al/schedule";

export const Route = createFileRoute("/al")({
  head: () => ({
    meta: [
      { title: "Alabama Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Alabama child support under Rule 32, Ala. R. Jud. Admin. (income shares). Combined-income schedule, CS-42-S shared-custody adjustment, add-ons, and the self-support reserve. Free, no signup.",
      },
      {
        property: "og:title",
        content: "Alabama Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Run an Alabama income-shares calculation under Rule 32 — nearest-$50 schedule lookup, the 1.5× CS-42-S shared-custody adjustment, add-ons, and the $981/85% self-support reserve.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/al" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/al" }],
  }),
  component: AlabamaCalculatorPage,
});

function AlabamaCalculatorPage() {
  return (
    <IncomeSharesCalculator
      spec={AL_INCOME_SHARES_SPEC}
      meta={{
        code: "AL",
        name: "Alabama",
        modelLabel: "Income Shares Model",
        cite: "Rule 32, Ala. R. Jud. Admin.",
        effectiveDate: AL_SCHEDULE_EFFECTIVE_DATE,
        parentingNote:
          "For shared 50/50 physical custody (Form CS-42-S, Rule 32(C)(7)), Alabama multiplies the basic obligation by 1.5, credits each parent half, and the higher-share parent pays the difference — and the self-support reserve and $50 minimum do not apply. Alabama has no overnight band; sub-50/50 parenting time substantially in excess of customary is a discretionary deviation, not a formula.",
      }}
    />
  );
}
