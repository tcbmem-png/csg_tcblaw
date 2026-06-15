import { createFileRoute } from "@tanstack/react-router";
import { LA_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/la/schedule";

export const Route = createFileRoute("/la_/about")({
  head: () => ({
    meta: [
      { title: "About — LA Child Support Calculator" },
      {
        name: "description",
        content:
          "About the Louisiana Child Support Calculator by TCB Law: source of truth (La. R.S. 9:315 et seq.), the digitized R.S. 9:315.19 schedule, scope, and limitations.",
      },
      { property: "og:title", content: "About the LA Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Implements La. R.S. 9:315 (income shares) with the official DCFS Schedule of Basic Child Support Obligations, digitized and primary-source verified.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/la/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/la/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The engine implements the Louisiana child support guidelines (La. R.S.
        9:315 et seq.), an income-shares model. The Schedule of Basic Child
        Support Obligations is loaded from the official Department of Children
        and Family Services publication of the R.S. 9:315.19 table, as amended
        by Acts 2020, No. 177 (effective January 1, 2021).
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Schedule effective date: <strong>{LA_SCHEDULE_EFFECTIVE_DATE}</strong>
        </li>
        <li>Schedule rows: 782 ($50 brackets, 1–6 children), digitized in full</li>
        <li>
          Combined-income lookup matches the nearest $50 schedule row; the $100
          floor is built into the lowest row
        </li>
        <li>
          Treatise worked examples (Worksheet A and Worksheet B) reproduce; the
          full schedule was confirmed against the DCFS source
        </li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">How the order is built</h2>
      <p className="mt-3">
        Both parents' adjusted gross incomes are combined; the basic obligation
        is read from the schedule and prorated by income share (Worksheet A).
        Mandatory add-ons — the children's health-insurance premium (9:315.4),
        net work-related childcare (9:315.3), and extraordinary uninsured medical
        above $250/child/year (9:315.5) — are prorated. For approximately-equal
        custody, Worksheet B multiplies the obligation by 1.5, cross-multiplies
        each parent's share by the <strong>other</strong> parent's share of
        physical-custody time, and offsets; the result is{" "}
        <strong>capped at the domiciliary-worksheet amount</strong> — a ceiling,
        never a floor (9:315.9). Above the $40,000 combined-income cap, the top
        schedule amount is a floor and any addition is discretionary
        (Falterman). A self-sufficiency reserve protects low-income obligors
        (9:315(B)(1)).
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          Generate a fillable AcroForm Worksheet A/B — Louisiana publishes the
          worksheets, but not (as confirmed) as a fillable PDF; use this as the
          computation and transcribe
        </li>
        <li>Split custody across separate custody groups (9:315.10)</li>
        <li>The discretionary increment above the $40,000 schedule cap</li>
        <li>
          Extraordinary educational expenses as an automatic add-on (9:315.6 is
          discretionary — handle as a deviation)
        </li>
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        A note on rounding: where a treatise example rounds the income-share
        percentage before multiplying, the order can differ by $1 from a
        full-precision computation. This calculator carries full precision and
        rounds the final order to the nearest dollar; the underlying convention
        is being confirmed against the official Worksheet B.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Other states</h2>
      <p className="mt-3">
        Tennessee, Mississippi, Arkansas, and other states are available on the{" "}
        <a href="/" className="underline">state picker</a>.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Outcomes depend on facts, evidence, judicial discretion, and deviation
        analysis this tool does not perform. Consult a licensed Louisiana
        attorney before relying on any number produced here.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
