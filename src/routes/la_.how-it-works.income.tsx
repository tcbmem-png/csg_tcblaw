import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/la_/how-it-works/income")({
  head: () => ({
    meta: [
      { title: "Determining income — LA Child Support Calculator" },
      {
        name: "description",
        content:
          "How Louisiana determines income under R.S. 9:315: what counts as gross income, self-employment, imputation of potential income, pre-existing support, and the treatment of alimony.",
      },
      {
        property: "og:title",
        content: "Determining income — Louisiana child support",
      },
      {
        property: "og:description",
        content:
          "What counts as income under La. R.S. 9:315, how self-employment and imputation work, and what is deducted to reach adjusted gross income.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/la/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/la/how-it-works/income",
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
        Louisiana · La. R.S. 9:315 et seq.
      </p>
      <h1 className="mt-2 font-serif text-4xl">Determining income</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        The single most consequential input is each parent's income. The
        calculator takes a monthly figure for each parent; this page explains
        what that figure should contain under R.S. 9:315 so the result is
        accurate.
      </p>

      <H2 cite="La. R.S. 9:315(C)(3), 9:315.2">What counts as gross income</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Gross income is income from any source — salary, wages, commissions,
        bonuses, dividends, severance, pensions, interest, trust income,
        annuities, capital gains, Social Security benefits, workers'
        compensation, unemployment, disability, and spousal support received
        from a party outside this proceeding — together with the net income from
        self-employment or a closely held business. Means-tested public
        assistance (FITAP/TANF, SNAP, SSI) and, generally, child support
        received for other children are excluded.
      </p>

      <H2 cite="La. R.S. 9:315(C)(3)(c)">Self-employment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Income from self-employment or a closely held business is gross receipts
        minus ordinary and necessary expenses required to produce it. Expenses
        that don't reduce actual spendable income — accelerated depreciation,
        investment tax credits, and similar paper deductions — are added back.
        Resolve self-employment to a monthly figure before entering it.
      </p>

      <H2 cite="La. R.S. 9:315.11; 9:315.2(B)">Imputation / voluntary unemployment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        If a parent is voluntarily unemployed or underemployed, child support is
        calculated based on income earning potential, unless the parent is
        caring for a child of the parties under age five or the unemployment is
        otherwise not voluntary. Potential income is determined from work
        history, qualifications, and job opportunities in the community. When
        income is imputed, enter the imputed monthly figure.
      </p>

      <H2 cite="La. R.S. 9:315.2(A)">Pre-existing support</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Pre-existing child support or spousal support obligations actually being
        paid under a court order are deducted from gross income to reach adjusted
        gross income. Amounts merely claimed but not paid are not deducted.
      </p>

      <H2 cite="La. R.S. 9:315(C)(3), 9:315.2(A)">Alimony</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Spousal support is treated asymmetrically: support received from a person
        outside this proceeding is income to the recipient, while a pre-existing
        spousal-support obligation actually paid is deducted from the payer's
        gross. Enter each parent's figure net of any such adjustment.
      </p>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/la/how-it-works"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          ← Back to How it works
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link
          to="/la"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the Louisiana calculator →
        </Link>
      </p>
    </div>
  );
}
