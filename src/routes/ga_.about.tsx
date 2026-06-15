import { createFileRoute } from "@tanstack/react-router";
import { GA_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/ga/schedule";

export const Route = createFileRoute("/ga_/about")({
  head: () => ({
    meta: [
      { title: "About — GA Child Support Calculator" },
      {
        name: "description",
        content:
          "About the Georgia Child Support Calculator by TCB Law: source of truth (O.C.G.A. § 19-6-15, post-SB 454), the digitized BCSO schedule and low-income table, scope, and limitations.",
      },
      { property: "og:title", content: "About the GA Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Implements O.C.G.A. § 19-6-15 (income shares) with the official BCSO schedule, the SB 454 parenting-time cross-credit, and the (p) low-income table.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ga/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ga/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The engine implements the Georgia child support guidelines (O.C.G.A. §
        19-6-15), an income-shares model, as amended by SB 454. The Basic Child
        Support Obligation table and the low-income adjustment table are loaded
        from the codified statute.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Effective date: <strong>{GA_SCHEDULE_EFFECTIVE_DATE}</strong> (SB 454
          parenting-time and low-income provisions eff. 1/1/2026)
        </li>
        <li>BCSO rows: 785 (to $40,000/mo combined), 1–6 children; nearest-$50 lookup</li>
        <li>Low-income adjustment table (p): 49 rows, plus the below-$1,500 percentage branch</li>
        <li>Parenting-time cross-credit oracle-validated to the cent against the statutory arithmetic</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">How the order is built</h2>
      <p className="mt-3">
        Both parents' adjusted gross incomes are combined; the basic obligation
        is read from the schedule and prorated by income share. The mandatory
        parenting-time cross-credit (§ 19-6-15(g)) then adjusts the noncustodial
        parent's share on a continuous power-of-2.5 day curve — the credit grows
        steeply as that parent's court-ordered overnights rise, with no
        threshold or cliff. Schedule D add-ons (health insurance + work-related
        child care) are mandatory and prorated. The low-income adjustment (§
        19-6-15(i.1)) caps a low-income parent's order at the lesser of the
        presumptive amount and the (p) table value (a percentage of income below
        $1,500). Above $40,000 combined the court sets the top-row amount and may
        deviate up.
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>The discretionary above-$40,000 increment (needs best-interest findings)</li>
        <li>Fill an AcroForm worksheet — Georgia's official tool is an Excel calculator, not a fillable PDF</li>
        <li>Alimony as an income deduction (in GA it is a deviation, not a deduction)</li>
        <li>The Schedule E deviations beyond a single entered amount (enter the net deviation)</li>
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        The parenting-time arithmetic was validated against a law-firm
        reproduction of the statutory steps (matched to the cent); a run through
        the Commission's official calculator would close it belt-and-suspenders.
        Final-order figures carry cents (the statute prescribes no rounding step).
      </p>

      <h2 className="mt-8 font-serif text-2xl">Other states</h2>
      <p className="mt-3">
        Tennessee, Mississippi, Arkansas, Louisiana, Alabama, Florida, and other
        states are available on the{" "}
        <a href="/" className="underline">state picker</a>.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Consult a licensed Georgia attorney before relying on any number produced
        here.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
