import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ms_/about")({
  head: () => ({
    meta: [
      { title: "About — MS Child Support Calculator" },
      {
        name: "description",
        content:
          "About the MS Child Support Calculator by TCB Law: statutory percentages, deviation factors, and limitations.",
      },
      { property: "og:title", content: "About the MS Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Built and maintained by TCB Law, PLLC. Implements Miss. Code Ann. §§ 43-19-101 and 43-19-103.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ms/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ms/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The calculator implements Miss. Code Ann. § 43-19-101 (the presumptive
        percentage-of-income guideline) and § 43-19-103 (the ten statutory
        deviation criteria). It produces a worksheet showing the AGI
        computation, presumptive award, threshold findings, and any
        deviations the user has elected to apply.
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Imputation of income for an underemployed or unemployed parent</li>
        <li>Alimony or spousal support</li>
        <li>Retroactive support computations</li>
        <li>Split parenting (children with different primary custodial parents)</li>
        <li>Emancipation timing or future child-aging-out projections</li>
        <li>Any pending amendment to § 43-19-101 (e.g., SB 2505) until enacted</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Consult a licensed Mississippi attorney before relying on any number
        produced by this calculator.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
