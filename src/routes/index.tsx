import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Child Support Guideline Calculators — TCB Law" },
      {
        name: "description",
        content:
          "Open-source child support calculators by TCB Law. Tennessee Income Shares Model and Mississippi statutory-percentage guideline, with filing-ready worksheets.",
      },
      { property: "og:title", content: "Child Support Guideline Calculators — TCB Law" },
      {
        property: "og:description",
        content:
          "Choose a state: Tennessee (Income Shares Model, Rule 1240-02-04) or Mississippi (Miss. Code Ann. § 43-19-101).",
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
            TCB Law &middot; Open-source guideline calculators
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-ink md:text-6xl">
            Child support,<br />
            <span className="italic text-primary">calculated right.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pick a state to begin. Each calculator implements the governing
            statute and rule exactly, and produces a filing-ready worksheet
            for negotiation, mediation, or court.
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
          />
          <StateCard
            to="/ms"
            tag="Mississippi"
            title="Statutory percentage guideline"
            cite="Miss. Code Ann. § 43-19-101"
            body="Flat percentage of the obligor's AGI (14%–26% by child count), with the 10 statutory deviation factors of § 43-19-103 and findings on the $10k / $100k thresholds."
          />
        </div>
      </section>

      <section className="border-t border-rule bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center text-sm text-muted-foreground">
          More states coming. Open source. Maintained by TCB Law, PLLC.
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
}: {
  to: "/tn" | "/ms";
  tag: string;
  title: string;
  cite: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-lg border border-rule bg-background p-7 transition-all hover:border-primary hover:shadow-md"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {tag}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{cite}</p>
      <p className="mt-4 text-sm text-muted-foreground">{body}</p>
      <p className="mt-6 text-sm font-medium text-primary">
        Open the {tag} calculator &rarr;
      </p>
    </Link>
  );
}
