import { createFileRoute } from "@tanstack/react-router";
import { SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/bcso";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — TN Child Support Calculator" },
      {
        name: "description",
        content:
          "About the TN Child Support Calculator by TCB Law: data sources, scope, verification against the official 2022 TN DHS worksheet, and limitations.",
      },
      { property: "og:title", content: "About the TN Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Built and maintained by TCB Law, PLLC. Implements Rule 1240-02-04 with the official 2022 BCSO schedule, verified within $1 of the TN DHS worksheet.",
      },
      { property: "og:url", content: "https://tncsg.tcblaw.org/about" },
    ],
    links: [{ rel: "canonical", href: "https://tncsg.tcblaw.org/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The calculation engine implements Tenn. Comp. R. & Regs. Chapter
        1240-02-04 (the Tennessee Child Support Guidelines). The BCSO
        Schedule, above-cap rates, statutory PCSO maximums, SSR amount, and
        imputation defaults are loaded from the official 2022 TN DHS Income
        Shares Worksheet.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>Schedule effective date: <strong>{SCHEDULE_EFFECTIVE_DATE}</strong></li>
        <li>BCSO rows: 2,815 (563 AGI levels × 5 child counts)</li>
        <li>Above-cap formula verified row-by-row against the official .xlsm</li>
        <li>Verification benchmarks pass within $1 of the official worksheet</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Updatable</h2>
      <p className="mt-3">
        When TN DHS publishes a new schedule, replace{" "}
        <code className="rounded bg-cream px-1 font-mono text-xs">
          src/lib/calc/data/schedule-2022.ts
        </code>{" "}
        with the new version and update the constants in{" "}
        <code className="rounded bg-cream px-1 font-mono text-xs">
          src/lib/calc/data/constants.ts
        </code>
        . Old schedules can be preserved alongside for case reproducibility.
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Split parenting (different children with different primary parents)</li>
        <li>Non-parent caretaker situations</li>
        <li>Federal benefit offsets (SSA dependent benefits) — Rule .04(3)(a)(5)</li>
        <li>Alimony (separate analysis under T.C.A. § 36-5-121)</li>
        <li>Retroactive support at prior-period schedules</li>
        <li>Significant variance for modification (calculate both and compare manually)</li>
        <li>Credit Worksheet for in-home and not-in-home children (accept user-provided credit)</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Outcomes in any specific case depend on facts, evidence, judicial
        discretion, and deviation analysis that this tool does not perform.
        Consult a licensed Tennessee attorney before relying on any number
        produced by this calculator.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
