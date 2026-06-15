import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/al_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — AL Child Support Calculator" },
      {
        name: "description",
        content:
          "How Alabama child support is calculated under Rule 32: combine income, read the schedule at the nearest $50 row, prorate by income share (rounded to nearest 1%), add mandatory add-ons, apply the CS-42-S shared-custody adjustment, and check the self-support reserve.",
      },
      {
        property: "og:title",
        content: "How Alabama child support is calculated",
      },
      {
        property: "og:description",
        content:
          "A step-by-step walk through the Rule 32 income-shares method, with the rule that authorizes each step.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/al/how-it-works" },
    ],
    links: [
      { rel: "canonical", href: "https://csg.tcblaw.org/al/how-it-works" },
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
        Alabama · Rule 32, Ala. R. Jud. Admin.
      </p>
      <h1 className="mt-2 font-serif text-4xl">How it works</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Alabama uses the income-shares model: the support obligation is the
        amount the parents would spend on the children if the household were
        intact, divided between them in proportion to income. Every step below is
        what the calculator does, with the rule that authorizes it.
      </p>

      <Step n={1} title="Determine each parent's adjusted gross income" cite="Rule 32(B), (C)(1); CS-42 Lines 1–2">
        <p>
          Start from each parent's gross income, then subtract preexisting child
          support and <strong>preexisting periodic alimony actually paid</strong>{" "}
          to reach adjusted gross income. The{" "}
          <Link
            to="/al/how-it-works/income"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            income page
          </Link>{" "}
          covers self-employment, imputation, and what counts as income.
        </p>
      </Step>

      <Step n={2} title="Combine income and read the schedule" cite="Rule 32(C)(1)">
        <p>
          Add both parents' adjusted gross incomes and read the basic obligation
          from the schedule at the nearest $50 row for the number of children.
          The schedule runs to $30,000 combined monthly income.
        </p>
      </Step>

      <Step n={3} title="Prorate by income share" cite="Rule 32(C)(2)–(3); CS-42 Line 3">
        <p>
          Each parent's percentage share of combined income — rounded to the
          nearest 1% — is their share of the basic obligation. The noncustodial
          parent pays their share to the custodial parent.
        </p>
      </Step>

      <Step n={4} title="Add the mandatory add-ons" cite="Rule 32(C)(4); CS-42 Lines 6–9">
        <p>
          Work-related childcare, the children's health-insurance premium, and
          extraordinary uninsured medical are added to the obligation and
          prorated by income share. A parent who pays an add-on directly is
          credited for it.
        </p>
      </Step>

      <Step
        n={5}
        title="Shared 50/50 custody — Form CS-42-S"
        cite="Rule 32(C)(7) (eff. 6/1/2023)"
      >
        <p>
          For shared 50/50 physical custody, the basic obligation is multiplied
          by 1.5 (150%); each parent is credited half of that adjusted
          obligation; and the parent with the higher adjusted obligation pays the
          difference. On CS-42-S the self-support reserve, the $50 minimum, and
          the zero-dollar provision do <strong>not</strong> apply. Alabama has no
          overnight band — parenting time substantially in excess of customary
          but short of 50/50 is handled as a discretionary deviation (Rule
          32(A)(1)(a)), not a formula.
        </p>
      </Step>

      <Step
        n={6}
        title="Self-support reserve and the minimum order"
        cite="Rule 32(C)(5)–(6)"
      >
        <p>
          A low-income obligor's order is limited to the income available after a
          $981/month reserve, discounted by an 85% economic-incentive factor
          (~15% payroll taxes). If that available amount is below $50, a
          rebuttable $50 minimum order applies. A zero-dollar order is presumed
          for an obligor with no income who receives only means-tested assistance
          or is incarcerated/institutionalized 180+ days.
        </p>
      </Step>

      <Step
        n={7}
        title="Above the schedule, and deviations"
        cite="Rule 32(C)(1) & Editors' Notes; Ex parte Dyas, 683 So. 2d 971 (Ala. 1996)"
      >
        <p>
          Above $30,000 combined monthly income the amount is discretionary — it
          must rationally relate to the children's reasonable needs and the
          obligor's ability to pay, with findings on the record; a pure
          chart-extrapolation is reversible. A court may otherwise deviate from
          the guideline amount with written findings (Form CS-43) that applying
          the guidelines would be manifestly unjust or inequitable.
        </p>
      </Step>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/al"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Alabama calculator
        </Link>
      </p>
    </div>
  );
}
