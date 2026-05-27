import { createFileRoute } from "@tanstack/react-router";

const GITHUB_URL = "https://github.com/tcbmem-png/csg_tcblaw";
const GITHUB_ISSUES_URL = "https://github.com/tcbmem-png/csg_tcblaw/issues";
const FIRM_URL = "https://tcblaw.org";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — TCB Child Support Calculator" },
      {
        name: "description",
        content:
          "About the TCB child support calculators: civic legal infrastructure maintained by TCB Law, PLLC. Open source, MIT licensed, no paywall, no telemetry.",
      },
      { property: "og:title", content: "About — TCB Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Civic legal infrastructure for Tennessee and Mississippi child support, maintained by TCB Law, PLLC. Open source, MIT licensed.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/about" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        About
      </p>
      <h1 className="mt-3 font-serif text-4xl">
        Civic legal infrastructure, not a product.
      </h1>

      <p className="mt-6 text-lg text-muted-foreground">
        The TCB child support calculators are open-source implementations of
        the Tennessee and Mississippi child support guidelines. They are
        free to use, free to fork, and free to audit. No signup, no paywall,
        no telemetry.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Mission</h2>
      <p className="mt-3">
        Good law deserves good tooling. Both Tennessee and Mississippi have
        well-developed child support regimes, but the official tooling
        ranges from a macro-enabled Excel file to ad-hoc spreadsheets that
        rarely produce a worksheet a chancellor can read. This project
        closes that gap with calculators that mirror the rule paragraph by
        paragraph and produce filing-ready output.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Maintenance model</h2>
      <p className="mt-3">
        The project is maintained by{" "}
        <a
          href={FIRM_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          TCB Law, PLLC
        </a>
        , a Memphis- and Oxford-based law firm. It is not a TCB Law product:
        there is no commercial tier, no lead-capture form, and no paid
        version with extra features. The firm's relationship to the
        calculator is the same as the Linux Foundation's relationship to
        Linux — we build it, we maintain it, we do not gate it.
      </p>
      <p className="mt-3">
        Substantive improvements come from community input. If you are a
        practitioner who spots a rule interpretation worth correcting, a
        chancellor who wants the worksheet to look different, or a developer
        who wants to fix a bug,{" "}
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          file an issue
        </a>{" "}
        or open a pull request against{" "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          the repository
        </a>
        .
      </p>

      <h2 className="mt-10 font-serif text-2xl">Author</h2>
      <p className="mt-3">
        Built and maintained by Taylor Black at TCB Law, PLLC. State-specific
        verification notes live on the per-state about pages.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Roadmap</h2>
      <p className="mt-3">
        Tennessee and Mississippi are live. Arkansas, Alabama, and Louisiana
        are on the roadmap; the calculators share an architecture that lets
        us add a state in a few days once the legal specification is
        complete. See the{" "}
        <a
          href="/ar"
          className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          Arkansas roadmap page
        </a>{" "}
        for the contribution invitation.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Contact</h2>
      <p className="mt-3">
        Issues, corrections, contributions:{" "}
        <a
          href="mailto:taylor@tcblaw.org"
          className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          taylor@tcblaw.org
        </a>
        .
      </p>

      <h2 className="mt-10 font-serif text-2xl">Disclaimer</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        These tools produce estimates based on the inputs you provide. They
        are not legal advice and do not create an attorney-client
        relationship. Outcomes in any specific case depend on facts,
        evidence, judicial discretion, and deviation analysis that these
        tools do not perform. Consult a licensed attorney in your
        jurisdiction before relying on any number produced by these
        calculators.
      </p>

      <div className="mt-12 border-t border-rule pt-6 text-sm text-muted-foreground">
        State-specific verification notes:{" "}
        <a href="/tn/about" className="underline decoration-rule underline-offset-2 hover:text-primary">
          Tennessee
        </a>
        {" · "}
        <a href="/ms/about" className="underline decoration-rule underline-offset-2 hover:text-primary">
          Mississippi
        </a>
      </div>
    </div>
  );
}
