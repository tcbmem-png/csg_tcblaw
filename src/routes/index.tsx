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

      <section id="calculators" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
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
            Why every state has one of these
          </p>
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/90">
            <p>
              None of it is an accident. In 1975 the federal government built
              the child support enforcement program. In 1984 it told the
              states to write guidelines. In 1988 the Family Support Act made
              those guidelines a rebuttable presumption — the number the
              guideline produces is the number the court starts from, and a
              judge can depart from it only with a written finding that it
              would be unjust. The same law put the guidelines on a clock:
              every state must review them at least once every four years.
            </p>
            <p>
              That four-year clock is why the numbers move — quietly, a state
              at a time. It's why a calculator has to be checked against each
              state's current official tool, not last cycle's. We do that in
              the open. When we found our Louisiana figures running on a
              superseded schedule, we said so and fixed it; the corrected
              states carry a mark, and their detail says what changed.
            </p>
            <p>
              Most states share one model — income shares. A few use a
              percentage of one parent's income. Three use the Melson
              formula. The law is mostly good. The tools that deliver it
              mostly aren't. That's the gap this closes.
            </p>
          </div>

          <p className="mt-10 font-mono text-xs uppercase tracking-widest text-primary">
            Why this exists
          </p>
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/90">
            <p>
              Across the seven states live today — Tennessee, Mississippi,
              Arkansas, Alabama, Louisiana, Georgia, and Florida — the
              official tools range from a macro-enabled Excel file that not
              every computer can run to mechanically simple calculations that
              rarely produce a shared worksheet a court can read. The law is
              on the books. Practitioners do excellent work. The tooling
              hasn't kept up.
            </p>
            <p>
              These calculators are an attempt to close that gap. Every
              dollar number traces back to the rule that authorizes it.
              Every worksheet is structured the way a court expects to see
              it. Every line of code is{" "}
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
              should not be proprietary. If you spot an interpretation of
              the rules that needs correcting in any of the live states,{" "}
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
