import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ar_/how-it-works/income")({
  head: () => ({
    meta: [
      { title: "Determining income — AR Child Support Calculator" },
      {
        name: "description",
        content:
          "How Arkansas determines child-support income under Administrative Order No. 10: what counts as gross income, self-employment, imputation of potential income, pre-existing support, and the treatment of alimony.",
      },
      {
        property: "og:title",
        content: "Determining income — Arkansas child support",
      },
      {
        property: "og:description",
        content:
          "What counts as income under AO 10 § III, how self-employment and imputation work, and what is deducted to reach child-support income.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/ar/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/ar/how-it-works/income",
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
        Arkansas · Administrative Order No. 10
      </p>
      <h1 className="mt-2 font-serif text-4xl">Determining income</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        The single most consequential input is each parent's income. The
        calculator takes a monthly figure for each parent; this page explains
        what that figure should contain under AO 10 so the result is accurate.
      </p>

      <H2 cite="AO 10 § III(2)">What counts as gross income</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Gross income is income from any source, including wages, overtime,
        commissions, bonuses, self-employment and business income, rental
        income, pensions and retirement, annuities, Social Security (retirement
        and disability), unemployment and workers' compensation, military pay
        and allowances (BAH/BAS), veterans' benefits, interest, dividends,
        royalties, and recurring capital gains. Means-tested public assistance
        (SSI, TANF, SNAP, general assistance) is excluded, as is child support
        received for other children.
      </p>

      <H2 cite="AO 10 § III(3)">Self-employment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Self-employment income is gross receipts minus ordinary and necessary
        expenses required to produce it, including the employer share of FICA.
        Certain paper deductions are added back because they don't reduce
        spendable income — accelerated depreciation beyond straight-line, the
        home-office deduction, personal use of business entertainment and
        vehicles, and similar items. Reduced or deferred income may be averaged
        over three years. Resolve self-employment to a monthly figure before
        entering it.
      </p>

      <H2 cite="AO 10 § III(7)–(8); Ark. Code Ann. §§ 9-12-312, 9-14-106">
        Imputation of potential income
      </H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        If a parent is voluntarily unemployed or underemployed, the court may
        impute income based on full-time earning capacity, weighing assets,
        work and earnings history, job skills, education, age, health, criminal
        record, and the local job market. Substantial non-income-producing
        assets may be imputed a reasonable rate of return. Incarceration is
        treated as involuntary and is not, by itself, grounds for imputation.
        When income is imputed, enter the imputed monthly figure.
      </p>

      <H2 cite="AO 10 § III(1), § III(6)">Pre-existing support</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Court-ordered child support actually being paid for a child who is not
        the subject of this action (and is paid to a non-party) is deducted from
        the paying parent's gross to reach child-support income. Arrearage
        payments are not deductible.
      </p>

      <H2 cite="AO 10 § III">Alimony</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        AO 10's enumerated income inclusions do not list spousal support
        received, and it is not an enumerated deduction; absent a specific court
        finding, treat alimony as neither added to the recipient's income nor
        deducted from the payer's for the support calculation.
      </p>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/ar/how-it-works"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          ← Back to How it works
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link
          to="/ar"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the Arkansas calculator →
        </Link>
      </p>
    </div>
  );
}
