import { createFileRoute, Link } from "@tanstack/react-router";

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What model does Tennessee use to calculate child support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tennessee uses the Income Shares Model under Rule 1240-02-04. Both parents' incomes are combined to find a basic obligation, which is then prorated by income share and adjusted for parenting time and add-ons.",
      },
    },
    {
      "@type": "Question",
      name: "Which rule governs Tennessee child support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tenn. Comp. R. & Regs. Chapter 1240-02-04 (the Tennessee Child Support Guidelines), implementing the Income Shares Model with the BCSO schedule and statutory PCSO maximums.",
      },
    },
    {
      "@type": "Question",
      name: "Does the calculator produce an official worksheet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The tool generates an official-style Income Shares worksheet that mirrors the 2022 TN DHS form, suitable for negotiation, mediation, or filing.",
      },
    },
  ],
};

export const Route = createFileRoute("/tn_/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — TN Child Support Calculator" },
      {
        name: "description",
        content:
          "Plain-English walkthrough of Tennessee child support calculation under Rule 1240-02-04: income shares, BCSO, parenting time, and add-ons.",
      },
      { property: "og:title", content: "How Tennessee child support is calculated" },
      {
        property: "og:description",
        content:
          "Step-by-step walkthrough of Rule 1240-02-04: combined income, BCSO schedule, parenting-time adjustment, add-ons, and the final order.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/tn/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/tn/how-it-works" }],
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
        Tennessee child support is calculated by following a specific sequence
        of steps set out in <strong>Rule 1240-02-04</strong>. The calculator
        implements those steps exactly. This page walks through them in plain
        English.
      </p>

      <h2 className="mt-10 font-serif text-2xl">The big picture</h2>
      <p className="mt-3">
        Tennessee uses the <strong>Income Shares Model</strong>. The idea:
        children should receive the same proportion of parental income that
        they would have received if the parents lived together. The
        calculator works in three phases:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6">
        <li>
          <strong>Establish the baseline</strong> — combine the parents'
          income, find the Basic Child Support Obligation (BCSO).
        </li>
        <li>
          <strong>Allocate between parents</strong> — split the BCSO by each
          parent's percentage of combined income.
        </li>
        <li>
          <strong>Adjust for circumstances</strong> — parenting time, add-ons,
          deviations.
        </li>
      </ol>

      <h2 className="mt-10 font-serif text-2xl">The Box 5 trap</h2>
      <div className="mt-3 rounded-md border-l-4 border-accent bg-accent/10 p-4">
        <p>
          If you're using a W-2, you must use <strong>Box 5 (Medicare wages)</strong>,
          not Box 1. Box 1 is net of voluntary 401(k) / 403(b) contributions —
          the Guidelines don't permit deducting those. For high earners, the
          difference can change the final obligation by hundreds of dollars per
          month.
        </p>
      </div>

      <h2 className="mt-10 font-serif text-2xl">The three income zones</h2>
      <ul className="mt-3 space-y-3">
        <li>
          <strong>SSR zone</strong> (very low income obligor): A Self-Support
          Reserve check applies — the lower of pro-rata BCSO or obligor-only
          BCSO is used.
        </li>
        <li>
          <strong>Schedule zone</strong> (combined AGI ~$1,200 to $28,250):
          Direct lookup from the BCSO Schedule, rounded UP to the next $50.
        </li>
        <li>
          <strong>Above-cap zone</strong> (over $28,250): Top-of-schedule plus
          a percentage of the excess (6.81% / 7.22% / 7.77% / 8.05% / 8.66% by
          number of children). The 4-child rate is{" "}
          <strong>8.05%</strong>, not the 8.25% some third-party sources state.
        </li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl">50/50 parenting</h2>
      <p className="mt-3">
        For equal parenting (182.5 days each), the rule designates one parent
        as the ARP solely for purposes of the adjustment, and the variable
        multiplier becomes exactly 2.0. The algebra reduces to:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md bg-cream p-4 font-mono text-sm">
{`Net support = BCSO × |PI_A − PI_B|
Direction:    higher-earning parent → lower-earning parent`}
      </pre>
      <p className="mt-3">
        Per Rule .04(7)(f), when the PRP-by-designation actually earns more
        than the ARP-by-designation, support flows from PRP to ARP.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Add-ons vs. deviations</h2>
      <p className="mt-3">
        <strong>Add-ons</strong> (health insurance premium for the children,
        recurring uninsured medical, work-related childcare) are{" "}
        <em>mandatory</em> and allocated <strong>pro-rata</strong> to income
        share.
      </p>
      <p className="mt-3">
        <strong>Private school</strong> is a <em>discretionary deviation</em> —
        not a mandatory add-on. The court must make written findings that the
        deviation is in the child's best interest and consistent with the
        parents' finances. If granted, it is allocated pro-rata.
      </p>
      <p className="mt-3">
        <strong>Special expenses</strong> (camp, lessons, travel, school
        clubs) have a unique <strong>7% threshold</strong>: only amounts
        exceeding 7% of monthly BCSO are considered as a deviation, unless the
        parties agree to waive the threshold.
      </p>

      <h2 className="mt-10 font-serif text-2xl">High-income cases — the four protections</h2>
      <p className="mt-3">
        Tennessee's guidelines contain four distinct mechanisms that shape outcomes
        when one or both parents are high earners. These often get conflated; they
        serve different functions and operate at different points in the calculation.
      </p>

      <h3 className="mt-6 font-serif text-xl">Layer 1 — The schedule cap ($28,250/mo combined AGI)</h3>
      <p className="mt-2">
        The official BCSO schedule ends at $28,250 combined monthly AGI. This is
        <strong> not</strong> a cap on support — it's the cap on the lookup table.
        Above it, Rule .09(2)(d) applies an above-cap formula: top-of-schedule BCSO
        plus a per-child percentage of the excess AGI
        (6.81% / 7.22% / 7.77% / 8.05% / 8.66% for 1–5 children). There is no upper
        bound on BCSO under this formula.
      </p>

      <h3 className="mt-6 font-serif text-xl">Layer 2 — The statutory presumptive cap (burden shift)</h3>
      <p className="mt-2">
        Tenn. Code Ann. § 36-5-101(e)(1)(B) sets a per-child threshold:
        $2,100 (1) · $3,200 (2) · $4,100 (3) · $4,600 (4) · $5,000 (5+).
        When the calculated PCSO exceeds the threshold, the parent
        <em> receiving</em> support has the burden to prove by preponderance of
        the evidence that the excess is reasonably necessary for the children's
        needs. This is a <strong>rebuttable presumption, not a hard cap</strong>.
        Modest excesses are routinely approved with brief findings; substantial
        excesses face real scrutiny.
      </p>

      <h3 className="mt-6 font-serif text-xl">Layer 3 — The "actual needs" standard (case law)</h3>
      <p className="mt-2">
        How "reasonably necessary" gets evaluated under Layer 2 comes from case law:
        <em> Hugger v. Hugger</em> (Tenn. Ct. App. 1999), <em>Smith v. Smith</em>
        (Tenn. Ct. App. 2007), and <em>Nash v. Mulle</em>, 846 S.W.2d 803
        (Tenn. 1993). Courts look to the children's documented needs, their
        pre-divorce standard of living, and other contributions the obligor is
        already making — not just the obligor's ability to pay.
      </p>

      <h3 className="mt-6 font-serif text-xl">Layer 4 — The 50/50 cross-credit mechanic (structural)</h3>
      <p className="mt-2">
        In 50/50 cases, presumptive support depends on the
        <strong> difference</strong> in parental income shares, not the absolute
        level. Two high earners with similar incomes pay near-zero presumptive
        support, regardless of how high combined AGI is — the model assumes each
        can independently provide a comparable lifestyle. See
        Rule .04(7)(b)(2)(i).
      </p>

      <h3 className="mt-6 font-serif text-xl">Worked example</h3>
      <div className="mt-2 rounded-md border border-rule bg-cream p-4 text-sm">
        <p className="mb-2"><strong>Parent A $65,000/mo, Parent B $20,000/mo, 3 children, 50/50 custody, A pays $300/mo health.</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Combined AGI $85,000 → above the schedule cap, so Layer 1 engages.</li>
          <li>BCSO = $2,954 + ($56,750 × 7.77%) = <strong>$7,363</strong></li>
          <li>PI: A 76.5%, B 23.5%. 50/50 net = $7,363 × 53% = <strong>$3,902 (A→B)</strong></li>
          <li>Add A's share of premium → PCSO ≈ <strong>$4,128</strong></li>
          <li>Statutory cap (3 kids) = $4,100 → excess $28 — trivial, easily justified.</li>
          <li>Change to standard parenting and the same incomes produce PCSO ≈ $5,862 — excess $1,762, a real settlement lever.</li>
          <li>Change to two equal $42,500/mo earners on 50/50 and presumptive support drops to ~$0 — Layer 4 doing the work.</li>
        </ul>
      </div>

      <h2 className="mt-10 font-serif text-2xl">Lifecycle</h2>
      <p className="mt-3">
        This calculator produces a single-point-in-time snapshot. The
        obligation will change when a child ages out, private school tuition
        changes, health insurance changes, or either parent's income changes
        materially (a 15% variance triggers a modification right under T.C.A.
        § 36-5-101(g)). A well-drafted MDA should anticipate these triggers.
      </p>

      <div className="mt-12 flex justify-center">
        <Link
          to="/tn"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open the calculator &rarr;
        </Link>
      </div>
    </div>
  );
}
