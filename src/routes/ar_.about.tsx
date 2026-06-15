import { createFileRoute } from "@tanstack/react-router";
import { AR_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/ar/schedule";

export const Route = createFileRoute("/ar_/about")({
  head: () => ({
    meta: [
      { title: "About — AR Child Support Calculator" },
      {
        name: "description",
        content:
          "About the Arkansas Child Support Calculator by TCB Law: source of truth (Administrative Order No. 10), the digitized Family Support Chart, scope, and limitations.",
      },
      { property: "og:title", content: "About the AR Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Implements Administrative Order No. 10 (income shares) with the official Arkansas Family Support Chart, digitized and primary-source verified.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ar/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ar/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The engine implements Arkansas Supreme Court Administrative Order No. 10
        (the income-shares child support guidelines, effective July 1, 2020, as
        amended April 14, 2022) and Ark. Code Ann. § 9-12-312. The Family
        Support Chart of Basic Child Support Obligations is loaded from the
        official Administrative Office of the Courts publication.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Schedule effective date: <strong>{AR_SCHEDULE_EFFECTIVE_DATE}</strong>
        </li>
        <li>Chart rows: 580 ($50 brackets, 1–6 children), digitized in full</li>
        <li>Combined-income lookup rounds down to the $50 row (AO 10 § III(D))</li>
        <li>
          Every fixture's basic obligation was confirmed against the official
          chart; treatise worked examples reproduce
        </li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">How the order is built</h2>
      <p className="mt-3">
        Both parents' adjusted gross incomes are combined; the basic obligation
        is read from the chart and prorated by each parent's income share.
        Mandatory add-ons (health-insurance premium, work-related childcare, and
        extraordinary uninsured medical above the $250/child/year built into the
        chart) are prorated. Approximately-equal custody runs a dual-worksheet
        offset — Arkansas uses a straight offset with{" "}
        <strong>no 1.5× multiplier</strong>. Above the $30,000 combined-income
        cap, the top chart amount is a floor and any addition is discretionary
        (Parnell v. Ark. Dep't of Fin. &amp; Admin., 2022 Ark. 52). A
        self-support reserve protects low-income payors: when the payor's gross
        is under $900/month the obligation is computed from the payor's gross
        alone with a $125 minimum (AO 10 § II(3)).
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          Generate a fillable AcroForm worksheet — Arkansas publishes the Child
          Support Worksheet in the AO 10 Forms Addendum, but not (as confirmed)
          as a fillable PDF; use this as the computation and transcribe
        </li>
        <li>Split custody across separate custody groups (9:315.10-style)</li>
        <li>The discretionary increment above the $30,000 chart cap</li>
        <li>Alimony analysis (separate from the support calculation)</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Other states</h2>
      <p className="mt-3">
        Tennessee, Mississippi, and other states are available on the{" "}
        <a href="/" className="underline">state picker</a>.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Outcomes depend on facts, evidence, judicial discretion, and deviation
        analysis this tool does not perform. Consult a licensed Arkansas
        attorney before relying on any number produced here.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
