import { createFileRoute, Link } from "@tanstack/react-router";

const GITHUB_URL = "https://github.com/tcbmem-png/csg_tcblaw";
const GITHUB_ISSUES_URL = "https://github.com/tcbmem-png/csg_tcblaw/issues";
const FIRM_URL = "https://tcblaw.org";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Child Support Guideline Calculators — TCB Law" },
      {
        name: "description",
        content:
          "Open-source child support calculators. Every line of math cites the rule that authorizes it. Tennessee Income Shares Model and Mississippi statutory-percentage guideline, with filing-ready worksheets. MIT licensed. No signup, no paywall.",
      },
      { property: "og:title", content: "Child Support Guideline Calculators — TCB Law" },
      {
        property: "og:description",
        content:
          "Open-source, MIT licensed. Every line of math cites the rule. Tennessee and Mississippi child support calculators with filing-ready worksheets.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="border-b border-rule bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Open-source &middot; MIT licensed &middot; No signup, no paywall
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-ink md:text-6xl">
            Child support,<br />
            <span className="italic text-primary">calculated right.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Every line of math cites the rule that authorizes it.
            <br />
            The worksheet is filing-ready. The code is public.
            <br />
            Pick a state to begin.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <StateCard
            to="/tn"
            tag="Tennessee"
            title="Income Shares Model"
            cite="Tenn. Comp. R. & Regs. 1240-02-04"
            body="Combined-income BCSO schedule, parenting-time adjustment, mandatory add-ons, SSR and PCSO ceiling checks, and a worksheet that mirrors the 2022 TN DHS form."
            feature="Includes a guided income module covering W-2 income, variable income, self-employment, multi-source, imputation, and special situations."
          />
          <StateCard
            to="/ms"
            tag="Mississippi"
            title="Statutory percentage guideline"
            cite="Miss. Code Ann. § 43-19-101"
            body="Flat percentage of the obligor's AGI (14%–26% by child count), with the 10 statutory deviation factors of § 43-19-103 and findings on the $10k / $100k thresholds."
            feature="Includes a structured § 43-19-103 deviation worksheet with two-attorney handoff for chancery filings."
          />
        </div>
      </section>

      <section className="border-t border-rule bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Why this exists
          </p>
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/90">
            <p>
              Tennessee's child support calculation lives inside a
              macro-enabled Excel file that not every computer can run.
              Mississippi's calculation is mechanically simple but rarely
              produces a shared worksheet a chancellor can read. Both states
              have good law on the books. Both have practitioners who do
              excellent work. Neither has tooling that matches the law.
            </p>
            <p>
              These calculators are an attempt to close that gap. Every
              dollar number traces back to the rule that authorizes it.
              Every worksheet is structured the way a chancellor expects to
              see it. Every line of code is{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                open
              </a>{" "}
              for anyone — practitioner, party, judge, academic, or
              competing firm — to audit, fork, or improve.
            </p>
            <p>
              The project is maintained by{" "}
              <a
                href={FIRM_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                TCB Law, PLLC
              </a>
              , but it is not a TCB Law product. Civic legal infrastructure
              should not be proprietary. If a Mississippi chancery
              practitioner finds the deviation worksheet inadequate for
              cases they handle, or a Tennessee family lawyer catches an
              interpretation of the rules that needs correcting,{" "}
              <a
                href={GITHUB_ISSUES_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                file an issue
              </a>{" "}
              and we'll fix it. The calculator improves through community
              input, not through gatekeeping by any single firm.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StateCard({
  to,
  tag,
  title,
  cite,
  body,
  feature,
}: {
  to: "/tn" | "/ms";
  tag: string;
  title: string;
  cite: string;
  body: string;
  feature: string;
}) {
  return (
    <Link
      to={to}
      className="group relative block rounded-lg border border-rule bg-background p-7 transition-all hover:border-primary hover:shadow-md"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {tag}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{cite}</p>
      <p className="mt-4 text-sm text-muted-foreground">{body}</p>
      <p className="mt-3 text-sm italic text-ink/80">{feature}</p>
      <p className="mt-6 flex items-center justify-between text-sm font-medium text-primary">
        <span>Open the {tag} calculator</span>
        <span
          aria-hidden
          className="text-2xl leading-none transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </p>
    </Link>
  );
}
