import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ar_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — AR Child Support Calculator" },
      {
        name: "description",
        content:
          "How Arkansas child support is calculated under Administrative Order No. 10: combine income, read the Family Support Chart (round down to the $50 row), prorate by income share, add mandatory add-ons, apply the shared-custody offset, and check the self-support reserve.",
      },
      { property: "og:title", content: "How Arkansas child support is calculated" },
      {
        property: "og:description",
        content:
          "A step-by-step walk through the AO 10 income-shares method, line by line, with the rule that authorizes each step.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ar/how-it-works" },
    ],
    links: [
      { rel: "canonical", href: "https://csg.tcblaw.org/ar/how-it-works" },
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
        Arkansas · Administrative Order No. 10
      </p>
      <h1 className="mt-2 font-serif text-4xl">How it works</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Arkansas uses the income-shares model: the child support obligation is
        the amount the parents would spend on the children if the household were
        intact, split between them in proportion to income. Every step below is
        what the calculator does, with the rule that authorizes it.
      </p>

      <Step n={1} title="Determine each parent's income" cite="AO 10 § III">
        <p>
          Start from each parent's gross income, then subtract court-ordered
          pre-existing child support actually paid for other children. The result
          is each parent's child-support income. The{" "}
          <Link
            to="/ar/how-it-works/income"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            income page
          </Link>{" "}
          covers self-employment, imputation, and what counts as income.
        </p>
      </Step>

      <Step n={2} title="Combine income and read the chart" cite="AO 10 § III(D); § III(19)">
        <p>
          Add both parents' incomes. Round the combined figure{" "}
          <strong>down</strong> to the nearest $50 row on the Family Support
          Chart, then read the basic obligation for the number of children. The
          chart is tabulated for 1–6 children and runs to $30,000 combined
          monthly income.
        </p>
      </Step>

      <Step n={3} title="Prorate by income share" cite="AO 10 § III">
        <p>
          Each parent is responsible for the basic obligation in proportion to
          their share of combined income. The non-residential parent pays their
          share to the residential parent.
        </p>
      </Step>

      <Step n={4} title="Add the mandatory add-ons" cite="AO 10 § IV">
        <p>
          The children's health-insurance premium (§ IV(1)), work-related
          childcare (§ IV(3)), and extraordinary uninsured medical above the
          $250/child/year already built into the chart (§ IV(2)) are added and
          prorated by income share. A parent who pays an add-on directly is
          credited for it.
        </p>
      </Step>

      <Step
        n={5}
        title="Shared custody — the dual-worksheet offset"
        cite="AO 10 § V(2)"
      >
        <p>
          For approximately-equal custody, a worksheet is run for each parent as
          payor and the smaller obligation is offset against the larger; the
          higher earner pays the difference. Arkansas uses a straight offset
          with <strong>no 1.5× multiplier</strong> and no time-share
          cross-multiplication. Between 141 and 182 overnights the adjustment is
          discretionary (the court may, but need not, adjust); under 141 is
          standard.
        </p>
      </Step>

      <Step
        n={6}
        title="Self-support reserve and the minimum order"
        cite="AO 10 § II(3)"
      >
        <p>
          When the paying parent's gross income is under $900/month, the
          obligation is computed from the payor's gross alone (not combined), the
          add-ons drop out, and a presumptive minimum order of $125/month
          applies — so a low-income payor keeps enough to live on.
        </p>
      </Step>

      <Step
        n={7}
        title="Above the chart, and deviations"
        cite="AO 10 § II; § II(2); Parnell v. ADFA, 2022 Ark. 52"
      >
        <p>
          Above $30,000 combined monthly income the highest charted amount is a
          floor; any additional support is discretionary, based on the children's
          needs and the parents' ability to pay (a flat percentage-of-payor
          formula above the chart is reversible). A court may deviate from the
          presumptive amount in either direction with written findings explaining
          why the guideline amount is unjust or inappropriate.
        </p>
      </Step>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/ar"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Arkansas calculator
        </Link>
      </p>
    </div>
  );
}
