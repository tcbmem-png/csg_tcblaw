import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/fl_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — FL Child Support Calculator" },
      {
        name: "description",
        content:
          "How Florida child support is calculated under § 61.30: convert gross to net via your affidavit deductions, combine net income, read the schedule, prorate by income share, apply add-ons, the 73-overnight gross-up, and the low-income adjustment.",
      },
      {
        property: "og:title",
        content: "How Florida child support is calculated",
      },
      {
        property: "og:description",
        content:
          "A step-by-step walk through the § 61.30 net-income method, with the rule that authorizes each step.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/fl/how-it-works" },
    ],
    links: [
      { rel: "canonical", href: "https://csg.tcblaw.org/fl/how-it-works" },
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
        Florida · Fla. Stat. § 61.30
      </p>
      <h1 className="mt-2 font-serif text-4xl">How it works</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Florida is an income-shares state that calculates support on each
        parent's <strong>net</strong> income. Every step below is what the
        calculator does, with the rule that authorizes it.
      </p>

      <Step n={1} title="Convert each parent's gross to net" cite="§ 61.30(3)">
        <p>
          Net income is gross minus the statutory deductions: federal income tax,
          FICA/self-employment tax, mandatory union dues, mandatory retirement,
          the parent's own health-insurance premium, court-ordered support for
          other children actually paid, and spousal support paid. You enter the{" "}
          <strong>actual</strong> amounts from your financial affidavit; the
          calculator sums them — it does not estimate tax. See the{" "}
          <Link
            to="/fl/how-it-works/income"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            income page
          </Link>
          .
        </p>
      </Step>

      <Step n={2} title="Combine net income and read the schedule" cite="§ 61.30(6)">
        <p>
          Add both parents' net incomes and read the basic obligation from the
          schedule for the number of children. Between the $50 rows the figure is
          interpolated proportionally. Above $10,000 net the obligation is the
          top-row amount plus a marginal percentage of the excess (5%–12.5% by
          number of children, § 61.30(6)(b)).
        </p>
      </Step>

      <Step n={3} title="Prorate by income share" cite="§ 61.30(9)–(10)">
        <p>
          Each parent's percentage share of combined net income is their share of
          the obligation. The parent with fewer overnights pays their share to
          the majority parent.
        </p>
      </Step>

      <Step n={4} title="Add the add-ons" cite="§ 61.30(7)–(8)">
        <p>
          Work-related childcare and the children's health-insurance premium are
          added to the obligation and prorated; uninsured medical is allocated by
          share. A parent who pays an add-on directly is credited for it.
        </p>
      </Step>

      <Step
        n={5}
        title="Substantial time-sharing gross-up (≥20% overnights)"
        cite="§ 61.30(11)(b)"
      >
        <p>
          When a parent exercises at least 20% of the overnights — 73 nights a
          year — the gross-up is <strong>mandatory</strong>: multiply each
          parent's share of the obligation by 1.5, multiply each grossed-up share
          by the <em>other</em> parent's overnight percentage, and take the
          difference as the transfer. Equal (50/50) time does not zero out
          support — the higher earner still transfers to the lower earner. Below
          73 overnights there is no gross-up, only a possible discretionary
          deviation.
        </p>
      </Step>

      <Step
        n={6}
        title="Low-income adjustment"
        cite="§ 61.30(6)(a)1–2"
      >
        <p>
          For a low-income obligor, the order is the lesser of the income-share
          amount and 90% of the obligor's net income above the single-person
          federal poverty guideline. If the obligor's net is below the guideline,
          the court enters a nominal case-by-case order to establish the
          principle of payment — Florida has no flat dollar minimum.
        </p>
      </Step>

      <Step n={7} title="Deviations" cite="§ 61.30(1)(a), (11)(a)">
        <p>
          The guideline amount may vary within ±5% without findings; a deviation
          beyond ±5% requires a written finding that the guideline amount would
          be unjust or inappropriate, weighing the § 61.30(11)(a) factors.
        </p>
      </Step>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/fl"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Florida calculator
        </Link>
      </p>
    </div>
  );
}
