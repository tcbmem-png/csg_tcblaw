import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tn_/how-it-works/income")({
  head: () => ({
    meta: [
      {
        title:
          "How Tennessee calculates income for child support — TN Calculator",
      },
      {
        name: "description",
        content:
          "Plain-English guide to Tennessee's child-support income rules: W-2 Box 5 vs Box 1, variable income averaging, self-employment, and imputation under Rule 1240-02-04-.04(3).",
      },
      {
        property: "og:title",
        content: "How Tennessee calculates income for child support",
      },
      {
        property: "og:description",
        content:
          "Walkthrough of TN child-support income rules, including the W-2 Box 5 catch, averaging variable income, self-employment, and imputation.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/tn/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/tn/how-it-works/income",
      },
    ],
  }),
  component: HowItWorksIncome,
});

function HowItWorksIncome() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        Reference · Rule 1240-02-04-.04(3)
      </p>
      <h1 className="mt-2 font-serif text-4xl">
        How Tennessee calculates income for child support
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Just want to run the calculator?{" "}
        <Link
          to="/tn"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          Skip the law →
        </Link>
      </p>

      <h2 className="mt-10 font-serif text-2xl">The short version</h2>
      <p className="mt-3">
        For child support in Tennessee, "income" means your{" "}
        <strong>gross monthly income from all sources</strong>, before any
        deductions. Three things make this more complicated than it sounds:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6">
        <li>
          <strong>The W-2 Box 5 question.</strong> Use Medicare wages (Box 5),
          not federal wages (Box 1). Box 1 leaves out your 401(k)
          contributions. Tennessee does not.
        </li>
        <li>
          <strong>Variable income.</strong> Bonuses, commissions, and overtime
          get averaged over a "reasonable period" — typically 2 or 3 years.
          The period you pick changes the answer.
        </li>
        <li>
          <strong>Imputation.</strong> In some cases the court assigns income a
          parent does not actually earn (voluntary underemployment, refusal to
          produce income evidence, etc.).
        </li>
      </ol>
      <p className="mt-3">
        If your income is steady wages from a single job, you can skip most of
        this page. If any of the three things above apply to your case, keep
        reading.
      </p>

      <h2 className="mt-10 font-serif text-2xl">What counts as income</h2>
      <p className="mt-3">
        Rule 1240-02-04-.04(3)(a)(1) defines "gross income" broadly. It
        includes (non-exhaustive):
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Wages, salaries, commissions, tips</li>
        <li>Bonuses, overtime, severance pay</li>
        <li>Self-employment income (gross receipts − ordinary expenses)</li>
        <li>Rental income, royalties, dividends, interest</li>
        <li>Capital gains, trust income, annuity payments</li>
        <li>Pensions, retirement plans, social security retirement</li>
        <li>Unemployment, workers' compensation, disability insurance</li>
        <li>Gifts, prizes, lottery winnings (when recurring)</li>
        <li>Alimony or maintenance received from a person not in this case</li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl">What does NOT count</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          <strong>SSI</strong> (Supplemental Security Income, Title XVI) —
          Rule .04(3)(c)(2)
        </li>
        <li>TANF, food stamps, and other means-tested public assistance</li>
        <li>A current spouse's income</li>
        <li>The child's own income (e.g., job earnings, trust)</li>
        <li>Adoption assistance</li>
        <li>Child support received for other children</li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl">
        The W-2 Box 5 question (most common silent error)
      </h2>
      <p className="mt-3">
        W-2 Box 1 reports your <em>federal taxable</em> wages — what you owe
        income tax on. W-2 Box 5 reports your <em>Medicare wages and tips</em>{" "}
        — total compensation. The difference is voluntary retirement
        contributions (401(k), 403(b), etc.), which Box 1 excludes and Box 5
        includes.
      </p>
      <div className="mt-4 rounded-md border border-accent/60 bg-accent/10 p-4 text-sm">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Worked example
        </div>
        <p className="mt-2">Salary: $100,000. 401(k) contribution: $20,000.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Box 1 (federal wages):</strong> $80,000
          </li>
          <li>
            <strong>Box 5 (Medicare wages):</strong> $100,000
          </li>
          <li>
            <strong>For child support:</strong> use $100,000 ($8,333/mo)
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Using Box 1 here understates monthly gross by ~$1,667 and typically
          reduces support by hundreds of dollars per month.
        </p>
      </div>

      <h2 className="mt-10 font-serif text-2xl">
        Variable income and the averaging question
      </h2>
      <p className="mt-3">
        Rule 1240-02-04-.04(3)(b) directs that variable income (bonuses,
        commissions, overtime, investment income) be averaged "over a
        reasonable period of time consistent with the circumstances of the
        case." The rule does <em>not</em> mandate a specific period.
      </p>
      <p className="mt-3">
        Two-year averaging is the most common convention, but 3-year averaging
        is appropriate where the most recent year is unusually high or low.
        The period you choose is consequential and is a litigable question.
        The calculator surfaces this choice rather than burying it.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Self-employment income</h2>
      <p className="mt-3">
        Self-employment income is gross receipts minus{" "}
        <em>ordinary and reasonable</em> business expenses. Tennessee
        disallows certain Schedule C deductions for child-support purposes,
        most notably accelerated depreciation and investment tax credits.
        Those amounts get added back.
      </p>
      <p className="mt-3">
        Self-employment is the most heavily contested income category in
        family law. In high-stakes cases a forensic accountant is often
        retained. The calculator gives you a defensible starting point but
        not a final answer.
      </p>

      <h2 className="mt-10 font-serif text-2xl">
        Imputation: when the court assigns income you don't earn
      </h2>
      <p className="mt-3">
        Imputation is the exception, not the norm. Most child-support cases
        run on actual earnings. Three grounds support imputation under
        Rule .04(3)(a)(2)(ii):
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6">
        <li>
          <strong>Willful and voluntary underemployment.</strong> Parent took
          a lower-paying job, went part-time, or otherwise reduced earnings
          without compelling reason.
        </li>
        <li>
          <strong>No reliable income evidence.</strong> Default-judgment
          scenarios where the parent has refused to produce income data.
        </li>
        <li>
          <strong>Substantial non-income-producing assets.</strong> A parent
          with significant idle assets may be charged with a reasonable rate
          of return on those assets.
        </li>
      </ol>
      <p className="mt-3">
        Two carve-outs apply: an <strong>incarcerated parent</strong>{" "}
        (currently or expected to be in custody 180+ days) is not treated as
        voluntarily unemployed. <strong>Active-duty military</strong> parents
        are not subject to imputation. In both cases, actual income (including
        prison wages or military pay) is used.
      </p>
      <p className="mt-3">
        A <strong>stay-at-home parent</strong> status by itself does not
        justify imputation. The court must consider how long the parent has
        been out of work, the children's ages, and whether the stay-at-home
        role existed during the marriage.
      </p>

      <h2 className="mt-10 font-serif text-2xl">
        Statutory default income figures
      </h2>
      <p className="mt-3">
        For default-judgment situations where no income evidence exists,
        Rule .04(3)(a)(2)(iv)(I)(IV) provides median income figures from 2016
        Census data:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          <strong>Female:</strong> $35,936/yr ($2,994.67/mo)
        </li>
        <li>
          <strong>Male:</strong> $43,761/yr ($3,646.75/mo)
        </li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl">Authorities and citations</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Tenn. Comp. R. & Regs. 1240-02-04-.04(3) — gross income, AGI
          adjustments, imputation
        </li>
        <li>
          Tenn. Comp. R. & Regs. 1240-02-04-.04(3)(b) — averaging variable
          income
        </li>
        <li>
          Tenn. Comp. R. & Regs. 1240-02-04-.04(3)(c)(2) — SSI exclusion
        </li>
        <li>
          Tenn. Comp. R. & Regs. 1240-02-04-.04(3)(a)(2)(iv) — statutory
          default income figures
        </li>
        <li>Tenn. Code Ann. § 36-5-101 — child support generally</li>
      </ul>

      <div className="mt-12 rounded-md border border-rule bg-cream p-4 text-sm">
        Ready to run a calculation?{" "}
        <Link
          to="/tn"
          className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the calculator →
        </Link>
      </div>
    </div>
  );
}
