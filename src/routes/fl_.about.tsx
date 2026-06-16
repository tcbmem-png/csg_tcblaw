import { createFileRoute } from "@tanstack/react-router";
import { FL_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/fl/schedule";

export const Route = createFileRoute("/fl_/about")({
  head: () => ({
    meta: [
      { title: "About — FL Child Support Calculator" },
      {
        name: "description",
        content:
          "About the Florida Child Support Calculator by TCB Law: source of truth (Fla. Stat. § 61.30), the digitized net-income schedule, the user-supplied net design, scope, and limitations.",
      },
      { property: "og:title", content: "About the FL Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Implements Fla. Stat. § 61.30 (income shares on net income) with the official guidelines schedule. The user supplies actual deductions; the engine sums — no tax estimator.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/fl/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/fl/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The engine implements the Florida child support guidelines (Fla. Stat. §
        61.30), an income-shares model that runs on combined{" "}
        <strong>net</strong> income. The Schedule of basic obligations is loaded
        from the § 61.30(6) statutory table.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Schedule effective date: <strong>{FL_SCHEDULE_EFFECTIVE_DATE}</strong>
        </li>
        <li>Schedule rows: 185 ($800–$10,000 combined NET, $50 steps), 1–6 children</li>
        <li>Between-row lookups use proportional (linear) interpolation</li>
        <li>Anchors confirmed: $8,000 net/1ch = $1,290; $10,000/1ch = $1,437</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">The net-income design</h2>
      <p className="mt-3">
        Florida computes support on each parent's <em>net</em> income — gross
        less the § 61.30(3) deductions (federal income tax, FICA/self-employment
        tax, mandatory union dues, mandatory retirement, the parent's own
        health-insurance premium, court-ordered support for other children
        actually paid, and spousal support paid). By design, you{" "}
        <strong>supply the actual amounts</strong> from your financial affidavit
        (Form 12.902(e)); the engine sums them and never estimates your tax. The
        child's health-insurance premium is not a net deduction — it is a §
        61.30(8) add-on (counting it in both places would double-count it).
      </p>

      <h2 className="mt-8 font-serif text-2xl">How the order is built</h2>
      <p className="mt-3">
        Both parents' net incomes are combined; the basic obligation is read
        from the schedule and prorated by income share. Above $10,000 net the
        obligation is the top-row amount plus a marginal percentage of the excess
        (§ 61.30(6)(b)). Add-ons (childcare, the children's health insurance,
        uninsured medical) are prorated. When a parent has at least 20% of the
        overnights (73/year) the substantial-time-sharing gross-up applies (1.5×,
        cross-multiplied by overnights). A low-income obligor pays the lesser of
        the income-share amount and 90% of net above the single-person poverty
        guideline, with a nominal principle-of-payment order below that.
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Estimate your federal income tax or FICA — you supply the actual figures</li>
        <li>The optional 75% childcare / dependent-care-credit reduction (off by default)</li>
        <li>Fill an official AcroForm worksheet (Form 12.902(e) is the affidavit, not the worksheet)</li>
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        The single-person poverty guideline is pinned to the 2026 HHS figure
        ($1,330/mo) and updates each January; the between-row interpolation and
        final-order rounding follow prevailing practice and are being confirmed
        against the official DOR worksheet.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Other states</h2>
      <p className="mt-3">
        Calculators for seven Southeastern states are on the{" "}
        <a href="/" className="underline">state picker</a>, with more planned.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Consult a licensed Florida attorney before relying on any number
        produced here.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
