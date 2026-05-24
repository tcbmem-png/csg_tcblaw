import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-background no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold text-primary">
            TCB
          </span>
          <span className="font-serif text-xl text-ink">
            TN Child Support Calculator
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            to="/calculator"
            className="text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary font-medium" }}
          >
            Calculator
          </Link>
          <Link
            to="/how-it-works"
            className="text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary font-medium" }}
          >
            How it works
          </Link>
          <Link
            to="/about"
            className="text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary font-medium" }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { CONSTANTS_EFFECTIVE_DATE } from "@/lib/calc/data/constants";

const APP_VERSION = "v1.0.0";
const GITHUB_URL = "https://github.com/tcb-law/tn-child-support-calculator";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-cream no-print">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="font-serif text-base text-ink">
              TCB Law, PLLC &middot; Tennessee Child Support Calculator
            </div>
            <div className="mt-1 max-w-xl">
              Open-source implementation of Tenn. Comp. R. & Regs. Chapter
              1240-02-04 (Income Shares Model).
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                <span className="text-muted-foreground">Schedule</span>
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
                <span>GitHub &rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-xs">
            <div>Not legal advice. For estimates only.</div>
            <div>
              Consult a licensed Tennessee attorney for guidance on your
              specific case.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
