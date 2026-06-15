import { getStateByCode, GITHUB_ISSUES_URL } from "@/lib/states";

/**
 * Renders a tasteful "under verification" banner at the top of a state
 * calculator. Reads reviewStatus/reviewNote from the registry so flipping a
 * state's status in src/lib/states.ts is the only change required.
 *
 * Verified states render nothing.
 */
export function ReviewBanner({ code }: { code: string }) {
  const state = getStateByCode(code);
  if (!state || state.reviewStatus !== "under_review" || !state.reviewNote) {
    return null;
  }
  return (
    <div className="border-b border-rule bg-cream no-print">
      <div className="mx-auto max-w-6xl px-6 pt-5">
        <div
          role="status"
          className="rounded-md border border-rule bg-background/70 p-4 pl-5 shadow-[inset_4px_0_0_0_var(--primary)]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {state.name} · Being verified
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/90">
            {state.reviewNote}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Caught a wrong number?{" "}
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
            >
              Tell us on GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
