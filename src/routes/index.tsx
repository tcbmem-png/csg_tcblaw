import { createFileRoute } from "@tanstack/react-router";
import { StateTileMap } from "@/components/home/state-tile-map";
import { StateList } from "@/components/home/state-list";

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
          "Open-source child support calculators. Tennessee and Mississippi live; Southeast next, all 50 states planned. Every line of math cites the rule.",
      },
      { property: "og:title", content: "Child Support Guideline Calculators — TCB Law" },
      {
        property: "og:description",
        content:
          "Open-source, MIT licensed. TN and MS calculators live, Southeast next, all 50 states on the roadmap. Every line of math cites the rule.",
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
            <span className="whitespace-nowrap">Open-source</span>
            <span aria-hidden="true"> &middot; </span>
            <span className="whitespace-nowrap">MIT licensed</span>
            <span aria-hidden="true"> &middot; </span>
            <span className="whitespace-nowrap">No signup, no paywall</span>
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* Mobile: list first (tap targets), map second. md+: map first, list second. */}
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="order-2 md:order-1">
            <StateTileMap />
          </div>
          <div className="order-1 md:order-2">
            <StateList />
          </div>
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
