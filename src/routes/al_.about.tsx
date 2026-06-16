import { createFileRoute } from "@tanstack/react-router";
import { AL_SCHEDULE_EFFECTIVE_DATE } from "@/lib/calc/states/al/schedule";

export const Route = createFileRoute("/al_/about")({
  head: () => ({
    meta: [
      { title: "About — AL Child Support Calculator" },
      {
        name: "description",
        content:
          "About the Alabama Child Support Calculator by TCB Law: source of truth (Rule 32, Ala. R. Jud. Admin.), the digitized Schedule of Basic Child Support Obligations, scope, and limitations.",
      },
      { property: "og:title", content: "About the AL Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Implements Rule 32 (income shares) with the official Alabama Schedule of Basic Child Support Obligations, digitized and primary-source verified.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/al/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/al/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <h1 className="font-serif text-4xl">About this calculator</h1>

      <h2 className="mt-8 font-serif text-2xl">Source of truth</h2>
      <p className="mt-3">
        The engine implements Rule 32 of the Alabama Rules of Judicial
        Administration (the income-shares child support guidelines; Schedule
        effective May 1, 2022, with Rule 32 amendments effective June 1, 2023).
        The Schedule of Basic Child Support Obligations is loaded from the
        official Alabama Administrative Office of Courts publication.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>
          Schedule effective date: <strong>{AL_SCHEDULE_EFFECTIVE_DATE}</strong>
        </li>
        <li>Schedule rows: 596 (1–6 children), digitized in full</li>
        <li>Combined-income lookup uses the nearest-$50 row (Rule 32(C)(1))</li>
        <li>
          Income-share percentages and the recommended order are rounded to the
          nearest whole figure (Rule 32(C)(3): nearest 1% / nearest dollar)
        </li>
        <li>Anchors confirmed: $8,000/2ch = $1,519; $30,000/1ch = $2,456</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">How the order is built</h2>
      <p className="mt-3">
        Both parents' adjusted gross incomes are combined; the basic obligation
        is read from the schedule and prorated by income share. Adjusted gross
        is gross income less preexisting child support and{" "}
        <strong>preexisting periodic alimony actually paid</strong> (the alimony
        deduction is allowed in Alabama — a divergence from Arkansas). Mandatory
        add-ons (health-insurance premium, work-related childcare, extraordinary
        uninsured medical) are prorated. For shared 50/50 physical custody (Form
        CS-42-S, Rule 32(C)(7)) the obligation is multiplied by 1.5, each parent
        credited half, and the higher-share parent pays the difference — with the
        self-support reserve and $50 minimum turned off. A self-support reserve
        (Rule 32(C)(5)) limits a low-income obligor's order to 85% of income
        above $981/month, with a rebuttable $50 minimum. Above the $30,000
        combined-income cap the amount is discretionary (Ex parte Dyas).
      </p>

      <h2 className="mt-8 font-serif text-2xl">What this does NOT do</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          Fill the official CS-42 AcroForm — the published fillable CS-42 (Rev.
          7/2019) is a 10-line form without the self-support-reserve lines, so
          SSR cases need the Excel worksheet or a drawn continuation
        </li>
        <li>The discretionary above-$30,000 amount (Dyas needs findings)</li>
        <li>The zero-dollar order for no-income / incarcerated obligors</li>
        <li>Imputed preexisting support under Rule 32(B)(6)</li>
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Other states</h2>
      <p className="mt-3">
        Calculators for seven Southeastern states are on the{" "}
        <a href="/" className="underline">state picker</a>, with more planned.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        This tool produces an estimate based on the inputs you provide. It is
        not legal advice and does not create an attorney-client relationship.
        Outcomes depend on facts, evidence, judicial discretion, and deviation
        analysis this tool does not perform. Consult a licensed Alabama attorney
        before relying on any number produced here.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Maintained by</h2>
      <p className="mt-3">TCB Law, PLLC.</p>
    </div>
  );
}
