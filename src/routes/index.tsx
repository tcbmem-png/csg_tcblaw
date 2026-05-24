import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TN Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Tennessee child support, calculated right. Open-source Income Shares calculator with official-style worksheet output.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="border-b border-rule bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Tenn. Comp. R. & Regs. 1240-02-04
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight text-ink md:text-6xl">
              Tennessee child support,<br />
              <span className="italic text-primary">calculated right.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              An open-source implementation of the Tennessee Income Shares
              Model — accurate to the rule, fast to change, and ready to
              output an official-style worksheet for negotiation or filing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/calculator"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Calculate now &rarr;
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent/40"
              >
                How it works
              </Link>
            </div>
          </div>
          <div className="hidden rounded-lg border border-rule bg-background p-6 shadow-sm md:block">
            <div className="border-b border-rule pb-3">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Verification benchmark
              </div>
              <div className="mt-1 font-serif text-base text-ink">
                Berger above-cap, 50/50
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Combined AGI" value="$79,417/mo" />
              <Row label="Children" value="3" />
              <Row label="Parenting" value="182.5 / 182.5" />
              <Row label="BCSO (above-cap)" value="$6,930" />
              <Row label="PI difference" value="29.06%" />
              <div className="my-2 border-t border-rule" />
              <Row
                label="Net presumptive"
                value="$2,014 A → B"
                emphasis
              />
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Matches the official TN DHS Excel worksheet within $1.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif text-3xl text-ink">
          What this calculator gets right that others get wrong
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Feature
            title="Correct income definition"
            body="Prompts you to use W-2 Box 5 (Medicare wages), not Box 1. Catches the most common income input error in TN child support cases."
            cite="Rule .04(3)"
          />
          <Feature
            title="Full above-cap formula"
            body="Properly handles combined AGI above $28,250/mo with the verified percentages (incl. the 8.05% / 4-child correction)."
            cite="Rule .09(2)(d)"
          />
          <Feature
            title="50/50 cross-credit, done right"
            body="Implements the literal reading of the equal-parenting rule. No folk formulas that double the obligation."
            cite="Rule .04(7)(b)(2)(i)"
          />
          <Feature
            title="Private school as a deviation"
            body="Treats private school as the discretionary deviation it is, allocated pro-rata if granted — never 75/25 or 80/20."
            cite="Rule .07(2)(d)"
          />
          <Feature
            title="Special expenses 7% rule"
            body="Computes the 7% of BCSO threshold automatically so amounts above it are properly treated as deviation."
            cite="Rule .07(2)(d)"
          />
          <Feature
            title="Statutory PCSO ceiling"
            body="Flags when the calculated PCSO exceeds the statutory threshold so the recipient knows they bear the burden."
            cite="T.C.A. § 36-5-101(e)(1)(B)"
          />
        </div>
      </section>

      <section className="border-t border-rule bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl text-ink">
            Built for negotiation and filing.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Change any input and the result updates instantly. Print an
            official-style worksheet to PDF with one click — formatted to
            match the TN DHS Income Shares Worksheet courts recognize.
          </p>
          <Link
            to="/calculator"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open the calculator &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasis
            ? "font-serif text-lg text-primary"
            : "font-mono text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Feature({
  title,
  body,
  cite,
}: {
  title: string;
  body: string;
  cite: string;
}) {
  return (
    <article className="rounded-lg border border-rule bg-background p-6">
      <h3 className="font-serif text-lg text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-accent-foreground/70">
        {cite}
      </p>
    </article>
  );
}
