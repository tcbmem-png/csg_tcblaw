import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ga_/how-it-works/income")({
  head: () => ({
    meta: [
      { title: "Determining income — GA Child Support Calculator" },
      {
        name: "description",
        content:
          "How Georgia determines income under O.C.G.A. § 19-6-15(f): what counts as gross income, self-employment, imputation, and why alimony is a deviation rather than an income deduction.",
      },
      {
        property: "og:title",
        content: "Determining income — Georgia child support",
      },
      {
        property: "og:description",
        content:
          "What counts as gross income under § 19-6-15(f), how self-employment and imputation work, and the GA treatment of alimony.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/ga/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/ga/how-it-works/income",
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
        Georgia · O.C.G.A. § 19-6-15
      </p>
      <h1 className="mt-2 font-serif text-4xl">Determining income</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        The calculator takes each parent's adjusted gross monthly income. This
        page explains what that figure should contain under § 19-6-15(f).
      </p>

      <H2 cite="§ 19-6-15(f)(1)">What counts as gross income</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Gross income is income from all sources — salary, wages, commissions,
        bonuses, overtime, self-employment income, severance, pensions, interest,
        dividends, trust income, annuities, capital gains, Social Security
        benefits, workers' compensation, unemployment, and recurring income —
        before taxes. Excluded are child support received for other children and
        means-tested public assistance (TANF, SNAP, SSI).
      </p>

      <H2 cite="§ 19-6-15(f)(1)(B)">Self-employment</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Self-employment income is gross receipts minus ordinary and reasonable
        expenses required to produce it. Paper deductions that don't reduce
        spendable income (accelerated depreciation, the home-office deduction,
        excessive promotional/vehicle expense) are added back. Resolve to a
        monthly figure before entering it.
      </p>

      <H2 cite="§ 19-6-15(f)(4)">Imputation</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        If a parent is willfully or voluntarily unemployed or underemployed,
        income may be imputed based on earning capacity — work history,
        qualifications, and prevailing earnings — unless precluded by the parent's
        role caring for a child under the age of the parties' youngest, or by
        physical or mental incapacity. Enter the imputed monthly figure when it
        applies.
      </p>

      <H2 cite="§ 19-6-15(i)(2)(I)">Alimony — a deviation, not a deduction</H2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
        Unlike Alabama and Florida, Georgia does <strong>not</strong> deduct
        alimony paid from gross income to reach adjusted income. Instead, alimony
        paid or received is a basis for a discretionary deviation under Schedule
        E, with written findings. So enter each parent's income without
        adjusting for alimony, and handle alimony in the deviation field.
      </p>

      <p className="mt-10 border-t border-rule pt-6 text-sm">
        <Link
          to="/ga/how-it-works"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          ← Back to How it works
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link
          to="/ga"
          className="text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the Georgia calculator →
        </Link>
      </p>
    </div>
  );
}
