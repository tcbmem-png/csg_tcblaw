import { createFileRoute } from "@tanstack/react-router";
import { IncomeSharesCalculator } from "@/components/calculator/income-shares/income-shares-calculator";
import { GA_INCOME_SHARES_SPEC } from "@/lib/calc/states/ga/spec";
import { GA_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/ga/schedule";

export const Route = createFileRoute("/ga")({
  head: () => ({
    meta: [
      { title: "Georgia Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Georgia child support under the income shares guidelines (O.C.G.A. § 19-6-15, post-SB 454). Combined-income schedule, the mandatory parenting-time cross-credit, Schedule D add-ons, and the low-income adjustment table. Free, no signup.",
      },
      {
        property: "og:title",
        content: "Georgia Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Run a Georgia income-shares calculation under § 19-6-15 — schedule to $40k, the SB 454 parenting-time cross-credit, mandatory add-ons, and the (p) low-income table.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ga" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ga" }],
  }),
  component: GeorgiaCalculatorPage,
});

function GeorgiaCalculatorPage() {
  return (
    <IncomeSharesCalculator
      spec={GA_INCOME_SHARES_SPEC}
      meta={{
        code: "GA",
        name: "Georgia",
        modelLabel: "Income Shares Model",
        cite: "O.C.G.A. § 19-6-15",
        effectiveDate: GA_SCHEDULE_EFFECTIVE_DATE,
        parentingNote:
          "Georgia applies a mandatory parenting-time cross-credit (SB 454, eff. 1/1/2026): pick the noncustodial parent and enter each parent's court-ordered overnights under 'Custom'. The credit grows steeply as the noncustodial parent's days rise (this is the statutory formula, not a bug). Use 'Standard' only when there is no court-ordered parenting time (no adjustment).",
      }}
    />
  );
}
