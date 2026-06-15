import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ga_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — GA Child Support Calculator" },
      {
        name: "description",
        content:
          "How Georgia child support is calculated under O.C.G.A. § 19-6-15: combine income, read the BCSO schedule, prorate by income share, apply the mandatory parenting-time cross-credit, Schedule D add-ons, and the low-income adjustment.",
      },
      {
        property: "og:title",
        content: "How Georgia child support is calculated",
      },
      {
        property: "og:description",
        content:
          "A step-by-step walk through the § 19-6-15 income-shares method, with the rule that authorizes each step.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ga/how-it-works" },
    ],
    links: [
      { rel: "canonical", href: "https://csg.tcblaw.org/ga/how-it-works" },
    ],
  }),
  component: HowItWorks,
});

function Step({
  n,
  title,
  cite,
  children,
}: {
  n: number;
  title: string;
  cite: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-rule pt-6">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Step {n}
      </p>
      <h2 className="mt-1 font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{cite}</p>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/90">
        {children}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Georgia · O.C.G.A. § 19-6-15
      </p>
      <h1 className="mt-2 font-serif text-4xl">How it works</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Georgia uses the income-shares model. Every step below is what the
        calculator does, with the rule that authorizes it.
      </p>

      <Step n={1} title="Determine each parent's income" cite="§ 19-6-15(f)">
        <p>
          Start from gross income from all sources and reach adjusted gross
          income. Alimony is treated as a deviation in Georgia, not a deduction
          from income. The{" "}
          <Link
            to="/ga/how-it-works/income"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            income page
          </Link>{" "}
          covers self-employment, imputation, and what counts.
        </p>
      </Step>

      <Step n={2} title="Combine income and read the schedule" cite="§ 19-6-15(o)">
        <p>
          Add both parents' adjusted incomes and read the basic obligation from
          the schedule at the nearest $50 row for the number of children. The
          table runs to $40,000/mo combined; above that the court sets the
          top-row amount and may deviate up.
        </p>
      </Step>

      <Step n={3} title="Prorate by income share" cite="§ 19-6-15(b)(3)–(5)">
        <p>
          Each parent's percentage share of combined income is their share of
          the basic obligation. The noncustodial parent's share is the starting
          point for what they pay.
        </p>
      </Step>

      <Step
        n={4}
        title="Parenting-time cross-credit (mandatory)"
        cite="§ 19-6-15(g) (eff. 1/1/2026)"
      >
        <p>
          The noncustodial parent's share is adjusted by a continuous
          cross-credit: each parent's court-ordered days are raised to the 2.5
          power, cross-multiplied by the other parent's BCSO share, offset, and
          added back to the noncustodial share. The credit grows steeply as the
          noncustodial parent's days rise (~47% reduction at 150 days, ~91% at
          90) — this is the statutory arithmetic, applied faithfully. There is no
          threshold or cliff. With no court-ordered parenting time, no adjustment
          applies.
        </p>
      </Step>

      <Step n={5} title="Mandatory add-ons (Schedule D)" cite="§ 19-6-15(h)">
        <p>
          Health-insurance premiums for the children and work-related child care
          are added to the obligation and prorated by income share. These are
          mandatory adjustments, not discretionary deviations.
        </p>
      </Step>

      <Step
        n={6}
        title="Low-income adjustment"
        cite="§ 19-6-15(i.1) & table (p) (eff. 1/1/2026)"
      >
        <p>
          For a low-income parent, the order is the <strong>lesser</strong> of
          the presumptive amount (as changed by deviations) and the (p) table
          cap. Below $1,500 monthly income the cap is a percentage of that
          parent's income (19%–28% by number of children). The (p) value is a
          cap, never the obligation itself, and there is no self-support-reserve
          subtraction.
        </p>
      </Step>

      <Step n={7} title="Deviations" cite="§ 19-6-15(i) & Schedule E">
        <p>
          The court may deviate from the presumptive amount — for high income,
          extraordinary educational or medical expenses, special expenses (the
          7% screen), alimony, travel, and the catch-all best-interest factor —
          with written findings that the presumptive amount is unjust or
          inappropriate and that the deviation serves the child's best interest.
        </p>
      </Step>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/ga"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Georgia calculator
        </Link>
      </p>
    </div>
  );
}
