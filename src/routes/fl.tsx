import { createFileRoute } from "@tanstack/react-router";
import { IncomeSharesCalculator } from "@/components/calculator/income-shares/income-shares-calculator";
import { FL_INCOME_SHARES_SPEC } from "@/lib/calc/states/fl/spec";
import { FL_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/fl/schedule";

export const Route = createFileRoute("/fl")({
  head: () => ({
    meta: [
      { title: "Florida Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Florida child support under the net-income guidelines (Fla. Stat. § 61.30). Combined net-income schedule, the 73-overnight 1.5× gross-up, add-ons, and the poverty-guideline low-income adjustment. Free, no signup.",
      },
      {
        property: "og:title",
        content: "Florida Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Run a Florida net-income calculation under § 61.30 — enter your affidavit deductions, the schedule runs on combined net, and the 20%-overnight gross-up applies automatically.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/fl" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/fl" }],
  }),
  component: FloridaCalculatorPage,
});

function FloridaCalculatorPage() {
  return (
    <IncomeSharesCalculator
      spec={FL_INCOME_SHARES_SPEC}
      meta={{
        code: "FL",
        name: "Florida",
        modelLabel: "Income Shares Model (net income)",
        cite: "Fla. Stat. § 61.30",
        effectiveDate: FL_SCHEDULE_EFFECTIVE_DATE,
        parentingNote:
          "When a parent has at least 20% of the overnights (73/year), Florida mandates the substantial-time-sharing gross-up: the basic obligation is multiplied by 1.5 and cross-multiplied by each parent's overnight share, then offset. Below 73 overnights there is no gross-up (only a discretionary deviation). Enter each parent's overnights with the 'Custom' option.",
      }}
    />
  );
}
