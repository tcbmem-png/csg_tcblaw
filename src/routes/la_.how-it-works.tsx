import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/la_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — LA Child Support Calculator" },
      {
        name: "description",
        content:
          "How Louisiana child support is calculated under R.S. 9:315: combine income, read the schedule at the nearest $50 row, prorate by income share (Worksheet A), add mandatory add-ons, apply the 1.5× cross-multiply shared-custody offset (Worksheet B), and check the self-sufficiency reserve.",
      },
      {
        property: "og:title",
        content: "How Louisiana child support is calculated",
      },
      {
        property: "og:description",
        content:
          "A step-by-step walk through the R.S. 9:315 income-shares method, with the rule that authorizes each step.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/la/how-it-works" },
    ],
    links: [
      { rel: "canonical", href: "https://csg.tcblaw.org/la/how-it-works" },
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
        Louisiana · La. R.S. 9:315 et seq.
      </p>
      <h1 className="mt-2 font-serif text-4xl">How it works</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Louisiana uses the income-shares model: the support obligation is the
        amount the parents would spend on the children if the household were
        intact, divided between them in proportion to income. Every step below is
        what the calculator does, with the rule that authorizes it.
      </p>

      <Step n={1} title="Determine each parent's income" cite="La. R.S. 9:315.2(A)">
        <p>
          Start from each parent's gross income, then subtract pre-existing
          court-ordered child support actually paid for other children. The
          result is each parent's adjusted gross income. The{" "}
          <Link
            to="/la/how-it-works/income"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            income page
          </Link>{" "}
          covers self-employment, imputation, and what counts as income.
        </p>
      </Step>

      <Step n={2} title="Combine income and read the schedule" cite="La. R.S. 9:315.2(C); 9:315.19">
        <p>
          Add both parents' adjusted gross incomes and read the basic obligation
          from the schedule at the nearest $50 row for the number of children.
          The schedule runs to $40,000 combined monthly income; the lowest row
          builds in a $100 minimum.
        </p>
      </Step>

      <Step n={3} title="Prorate by income share (Worksheet A)" cite="La. R.S. 9:315.2(C)–(D); 9:315.8">
        <p>
          Each parent's percentage share of combined income is their share of
          the basic obligation. The non-domiciliary parent pays their share to
          the domiciliary parent.
        </p>
      </Step>

      <Step n={4} title="Add the mandatory add-ons" cite="La. R.S. 9:315.3–9:315.5">
        <p>
          Net work-related childcare (9:315.3), the children's health-insurance
          premium (9:315.4), and extraordinary uninsured medical above
          $250/child/year (9:315.5) are added to the obligation and prorated by
          income share. A parent who pays an add-on directly is credited for it.
          Extraordinary educational expenses (9:315.6) are discretionary —
          handled as a deviation rather than an automatic add-on.
        </p>
      </Step>

      <Step
        n={5}
        title="Shared custody — Worksheet B (1.5× cross-multiply, with a ceiling)"
        cite="La. R.S. 9:315.9"
      >
        <p>
          For approximately-equal custody, the basic obligation is multiplied by
          1.5 (the duplicated-household premium). Each parent's theoretical
          obligation is then cross-multiplied by the <strong>other</strong>{" "}
          parent's actual percentage of physical-custody time, and the two are
          offset — the higher pays the difference. The shared-custody result is{" "}
          <strong>capped</strong> at what the obligor would owe as the
          domiciliary parent: a ceiling, never a floor. Split custody (different
          children domiciled with different parents) uses a separate worksheet
          per group (9:315.10).
        </p>
      </Step>

      <Step
        n={6}
        title="Self-sufficiency reserve and the minimum order"
        cite="La. R.S. 9:315(B)(1); 9:315.1(C)(2)"
      >
        <p>
          The schedule incorporates a self-sufficiency reserve for low-income
          obligors, and the lowest schedule row builds in a $100 minimum
          obligation. A combined adjusted income of $950 or less is also an
          express deviation ground.
        </p>
      </Step>

      <Step
        n={7}
        title="Above the schedule, and deviations"
        cite="La. R.S. 9:315.13(B)(1); 9:315.1(B); Falterman v. Falterman"
      >
        <p>
          Above $40,000 combined monthly income the highest scheduled amount is a
          floor; any additional support is within the court's discretion based on
          the children's needs and the parents' circumstances. A court may
          deviate from the presumptive amount in either direction with written
          findings that the guideline amount would not be in the child's best
          interest or would be inequitable.
        </p>
      </Step>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/la"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Louisiana calculator
        </Link>
      </p>
    </div>
  );
}
