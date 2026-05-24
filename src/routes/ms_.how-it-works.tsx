import { createFileRoute, Link } from "@tanstack/react-router";

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What model does Mississippi use to calculate child support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Mississippi uses a statutory percentage-of-income guideline under Miss. Code Ann. § 43-19-101. The presumptive award is a flat percentage of the obligor's adjusted gross income, ranging from 14% for one child up to 26% for five or more.",
      },
    },
    {
      "@type": "Question",
      name: "Can a Mississippi court deviate from the guideline amount?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. § 43-19-103 lists ten criteria a court may consider when finding that the guideline amount is unjust or inappropriate, including extraordinary medical expenses, independent income of the child, seasonal income, age of the child, and shared parenting arrangements.",
      },
    },
    {
      "@type": "Question",
      name: "When does a court have to make special findings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If the obligor's adjusted gross income exceeds $100,000 per year, or falls below $10,000 per year, the court must make written findings explaining why the guideline percentage is or is not reasonable.",
      },
    },
  ],
};

export const Route = createFileRoute("/ms_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — MS Child Support Calculator" },
      {
        name: "description",
        content:
          "Plain-English walkthrough of Mississippi child support: § 43-19-101 percentages, adjusted gross income, the 10 deviation factors, and threshold findings.",
      },
      { property: "og:title", content: "How Mississippi child support is calculated" },
      {
        property: "og:description",
        content:
          "Mississippi's flat-percentage guideline, the adjustments that go into AGI, and the ten statutory deviation factors of § 43-19-103.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ms/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ms/how-it-works" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">How this calculator works</h1>
      <p className="mt-4 text-muted-foreground">
        Mississippi child support is set by a percentage-of-income statute,
        not an income-shares schedule. The math is short; the judgment calls
        live in the deviation analysis.
      </p>

      <h2 className="mt-10 font-serif text-2xl">The statutory percentages</h2>
      <p className="mt-3">
        Under Miss. Code Ann. § 43-19-101, the presumptive award is a flat
        percentage of the obligor's adjusted gross income:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>1 child — 14%</li>
        <li>2 children — 20%</li>
        <li>3 children — 22%</li>
        <li>4 children — 24%</li>
        <li>5 or more children — 26%</li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl">Adjusted gross income</h2>
      <p className="mt-3">
        Start with annual gross income. Subtract federal, state, and FICA
        taxes; mandatory retirement contributions; and any pre-existing court
        orders for support actually being paid. Divide by 12, then subtract
        discretionary in-home deductions (other children living in the home,
        for example) to get monthly AGI.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Threshold findings</h2>
      <p className="mt-3">
        If annual AGI exceeds <strong>$100,000</strong> or is below{" "}
        <strong>$10,000</strong>, the court must make written findings that the
        guideline percentage is or is not reasonable. The calculator flags
        both thresholds automatically.
      </p>

      <h2 className="mt-10 font-serif text-2xl">The 10 deviation factors</h2>
      <p className="mt-3">
        § 43-19-103 lists ten criteria the court may consider to deviate
        upward or downward from the presumptive award. The calculator lets you
        toggle each factor on, enter a signed monthly dollar adjustment, and
        produce a worksheet that lays out the math and citation for each.
      </p>

      <div className="mt-12 flex justify-center">
        <Link
          to="/ms"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open the calculator &rarr;
        </Link>
      </div>
    </div>
  );
}
