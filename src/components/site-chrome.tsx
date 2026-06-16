import { Link, useRouterState } from "@tanstack/react-router";
import { CONSTANTS_EFFECTIVE_DATE } from "@/lib/calc/data/constants";



const GITHUB_URL = "https://github.com/tcbmem-png/csg_tcblaw";
const FIRM_URL = "https://tcblaw.org";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";
  const calculatorsHref = onHome ? "#calculators" : "/#calculators";

  return (
    <header className="border-b border-rule bg-background no-print">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold text-primary">
            TCB
          </span>
          <span className="font-serif text-xl text-ink">
            Child Support Calculator
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <a
            href={calculatorsHref}
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Calculators
          </a>
          <Link
            to="/about"
            className="text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary font-medium" }}
          >
            About
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Open source
          </a>
          <a
            href={FIRM_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground/80 transition-colors hover:text-primary"
          >
            TCB.Law <span aria-hidden>→</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

const APP_VERSION = "v1.0.0";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-cream no-print">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="font-serif text-base text-ink">
              TCB Law, PLLC &middot; Child Support Calculators
            </div>
            <div className="mt-1 max-w-xl">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                Open-source
              </a>{" "}
              implementations of state child support guidelines —
              Tennessee, Mississippi, Arkansas, Alabama, Louisiana, Georgia,
              and Florida, with more planned.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                <span className="text-muted-foreground">TN Schedule</span>
                <span>eff. {CONSTANTS_EFFECTIVE_DATE}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                <span className="text-muted-foreground">App</span>
                <span>{APP_VERSION}</span>
              </span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:border-primary hover:text-primary"
              >
                <span>Source on GitHub &rarr;</span>
              </a>
            </div>
          </div>
          <div className="max-w-xs text-xs">
            <div>
              Maintained by{" "}
              <a
                href={FIRM_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                TCB Law, PLLC
              </a>{" "}
              &mdash; Memphis &amp; Oxford, Mississippi.
            </div>
            <div className="mt-1">
              Issues, corrections, contributions:{" "}
              <a
                href="mailto:taylor@tcblaw.org"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                taylor@tcblaw.org
              </a>
            </div>
            <div className="mt-3 text-muted-foreground">
              These calculators are open source and in active verification
              against each state's own official tools. Found a wrong number?{" "}
              <a
                href="https://github.com/tcbmem-png/csg_tcblaw/issues"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
              >
                Tell us
              </a>
              .
            </div>
            <div className="mt-3 text-muted-foreground">
              Not legal advice. For estimates only. Consult a licensed
              attorney in your state for guidance on your specific case.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
