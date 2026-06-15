import { createFileRoute } from "@tanstack/react-router";
import { IncomeSharesCalculator } from "@/components/calculator/income-shares/income-shares-calculator";
import { AR_INCOME_SHARES_SPEC } from "@/lib/calc/states/ar/spec";
import { AR_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/ar/schedule";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "Arkansas Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Arkansas child support under Administrative Order No. 10 (income shares, Ark. Code Ann. § 9-12-312). Combined-income schedule, parenting offset, add-ons, and self-support reserve. Free, no signup.",
      },
      {
        property: "og:title",
        content: "Arkansas Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Run an Arkansas income-shares calculation under AO 10 — schedule lookup, shared-custody offset, add-ons, and the $900/$125 self-support reserve.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ar" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ar" }],
  }),
  component: ArkansasCalculatorPage,
});

function ArkansasCalculatorPage() {
  return (
    <IncomeSharesCalculator
      spec={AR_INCOME_SHARES_SPEC}
      meta={{
        code: "AR",
        name: "Arkansas",
        modelLabel: "Income Shares Model",
        cite: "Ark. Code Ann. § 9-12-312 · Admin. Order No. 10",
        effectiveDate: AR_SCHEDULE_EFFECTIVE_DATE,
        parentingNote:
          "Arkansas uses a straight dual-worksheet offset for approximately-equal custody (no 1.5× multiplier). 141–182 overnights is a discretionary band the court may adjust; under 141 is standard.",
      }}
    />
  );
}
