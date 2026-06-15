import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/fl_/how-it-works/income")({
  head: () => ({
    meta: [
      { title: "Determining net income — FL Child Support Calculator" },
      {
        name: "description",
        content:
          "How Florida determines net income under § 61.30(2)–(3): what counts as gross income, the ordered deductions to net, self-employment, imputation, and why you supply actual tax/FICA rather than the engine estimating.",
      },
      {
        property: "og:title",
        content: "Determining net income — Florida child support",
      },
      {
        property: "og:description",
        content:
          "What counts as gross income under § 61.30(2), the § 61.30(3) deductions to net, and how imputation and self-employment work.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/fl/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/fl/how-it-works/income",
      },
    ],
  }),
  component: IncomePage,
});

function H2({ children, cite }: { children: React.ReactNode; cite: string }) {
  return (
    <>
      <h2 className="mt-8 font-serif text-2xl text-ink">{children}</h2>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{cite}</p>
    </>
  );
}

function IncomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Florida · Fla. Stat. § 61.30
      </p>
      <h1 className="mt-2 font-serif text-4xl">Determining net income</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Florida calculates support on <strong>net</strong> income. The
        calculator takes each parent's gross and the deductions you supply, and
        computes net. This page explains what goes into each.
      </p>

      <H2 cite="§ 61.30(2)(a)">What counts as gross income</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Gross income includes salary and wages, bonuses, commissions, overtime,
        tips, business income from self-employment, disability and workers'
        compensation, unemployment, pension and retirement, Social Security,
        spousal support received from a previous marriage or the marriage before
        the court, interest, dividends, rental income, and recurring gains.
        Spousal support actually paid is deducted (below); spousal support
        received is income.
      </p>

      <H2 cite="§ 61.30(3)(a)–(g)">The deductions to net — and why you supply them</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Net income is gross less, in order: (a) federal income tax (using actual
        filing status and allowable dependents), (b) FICA or self-employment tax,
        (c) mandatory union dues, (d) mandatory retirement (voluntary
        contributions do not count), (e) the parent's own health-insurance
        premium — <em>not</em> the children's, which is a § 61.30(8) add-on, (f)
        court-ordered support for other children actually paid, and (g) spousal
        support paid. By design this calculator has you enter the{" "}
        <strong>actual</strong> tax and FICA amounts from your financial
        affidavit (Form 12.902(e)) rather than estimating them — § 61.30(3)(a)
        keys to actual liability, and the affidavit is where it is sworn.
      </p>

      <H2 cite="§ 61.30(2)(b)">Self-employment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Self-employment income is gross receipts minus ordinary and necessary
        business expenses. Paper deductions that don't reduce spendable income
        (accelerated depreciation, home office, personal vehicle use) are added
        back. Resolve self-employment to a monthly gross before entering it; the
        self-employment tax is captured in the FICA/SECA deduction line.
      </p>

      <H2 cite="§ 61.30(2)(b)">Imputation</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        If a parent is voluntarily unemployed or underemployed, income is imputed
        based on recent work history, occupational qualifications, and prevailing
        earnings in the community — unless the lack of employment results from
        physical or mental incapacity or other circumstances beyond the parent's
        control. Enter the imputed monthly gross when it applies.
      </p>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/fl/how-it-works"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          ← Back to How it works
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link
          to="/fl"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the Florida calculator →
        </Link>
      </p>
    </div>
  );
}
