import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/al_/how-it-works/income")({
  head: () => ({
    meta: [
      { title: "Determining income — AL Child Support Calculator" },
      {
        name: "description",
        content:
          "How Alabama determines income under Rule 32: what counts as gross income, self-employment, imputation of potential income, the preexisting child-support and periodic-alimony deductions, and the treatment of alimony received.",
      },
      {
        property: "og:title",
        content: "Determining income — Alabama child support",
      },
      {
        property: "og:description",
        content:
          "What counts as income under Rule 32(B), how self-employment and imputation work, and the AL-specific preexisting-support and alimony deductions.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/al/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/al/how-it-works/income",
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
        Alabama · Rule 32, Ala. R. Jud. Admin.
      </p>
      <h1 className="mt-2 font-serif text-4xl">Determining income</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        The single most consequential input is each parent's income. The
        calculator takes a monthly figure for each parent; this page explains
        what that figure should contain under Rule 32 so the result is accurate.
      </p>

      <H2 cite="Rule 32(B)(2)">What counts as gross income</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Gross income is income from any source — salary, wages, commissions,
        bonuses, dividends, severance, pensions, interest, trust income,
        annuities, capital gains, Social Security benefits, veterans' and
        workers'-compensation benefits, unemployment, gifts and prizes, and{" "}
        <strong>alimony received</strong> — plus the net income from
        self-employment. Child support received for other children and
        means-tested assistance (TANF, SSI, food assistance) are excluded.
      </p>

      <H2 cite="Rule 32(B)(3)–(4)">Self-employment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Self-employment income is gross receipts minus ordinary and necessary
        expenses required to produce it. Expenses that don't reduce actual
        spendable income — accelerated depreciation, the home-office deduction,
        and similar paper items — are added back, and one-half of the
        self-employment tax is deducted. Resolve self-employment to a monthly
        figure before entering it.
      </p>

      <H2 cite="Rule 32(B)(5)">Imputation / voluntary unemployment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        If a parent is voluntarily unemployed or underemployed, the court may
        impute income based on earning potential — work history, qualifications,
        and prevailing local job opportunities — unless the parent is physically
        or mentally unable to work or is caring for a child of the parties who is
        unable to attend school. When income is imputed, enter the imputed
        monthly figure.
      </p>

      <H2 cite="Rule 32(C)(1); Rule 32(B)(6); CS-42 Lines 1a–1b">
        Preexisting support and the alimony deduction
      </H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Adjusted gross income is gross income less preexisting child support
        actually paid <em>and</em> less preexisting periodic alimony actually
        paid to a former spouse. The periodic-alimony-paid deduction is allowed
        in Alabama — a key divergence from Arkansas. Rule 32(B)(6) also allows an
        imputed preexisting child-support obligation for other children the
        parent is actually supporting without a court order. Enter each parent's
        figure net of these deductions (or use the deductions field where the
        calculator provides one).
      </p>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/al/how-it-works"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          ← Back to How it works
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link
          to="/al"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the Alabama calculator →
        </Link>
      </p>
    </div>
  );
}
