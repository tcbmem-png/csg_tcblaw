import { Link, useRouterState } from "@tanstack/react-router";
import { CONSTANTS_EFFECTIVE_DATE } from "@/lib/calc/data/constants";

type StateCode = "TN" | "MS" | null;

function detectState(pathname: string): StateCode {
  if (pathname === "/tn" || pathname.startsWith("/tn/")) return "TN";
  if (pathname === "/ms" || pathname.startsWith("/ms/")) return "MS";
  return null;
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const state = detectState(pathname);

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
          {state && (
            <span className="ml-1 rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {state}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {state === "MS" ? (
            <>
              <Link
                to="/ms"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
                activeOptions={{ exact: true }}
              >
                Calculator
              </Link>
              <Link
                to="/ms/how-it-works"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
              >
                How it works
              </Link>
              <Link
                to="/ms/about"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
              >
                About
              </Link>
            </>
          ) : state === "TN" ? (
            <>
              <Link
                to="/tn"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
                activeOptions={{ exact: true }}
              >
                Calculator
              </Link>
              <Link
                to="/tn/how-it-works"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
              >
                How it works
              </Link>
              <Link
                to="/tn/about"
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
              >
                About
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/tn"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Tennessee
              </Link>
              <Link
                to="/ms"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Mississippi
              </Link>
            </>
          )}
          {state && (
            <Link
              to="/"
              className="rounded border border-rule px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Switch state
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


const APP_VERSION = "v1.0.0";
const GITHUB_URL = "https://github.com/tcb-law/tn-child-support-calculator";

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
              implementations of the Tennessee (Rule 1240-02-04) and
              Mississippi (Miss. Code Ann. § 43-19-101) child support
              guidelines.
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
          <div className="text-xs">
            <div>Not legal advice. For estimates only.</div>
            <div>
              Consult a licensed attorney in your state for guidance on your
              specific case.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
