import { createFileRoute, Link } from "@tanstack/react-router";

const GITHUB_ISSUES_URL = "https://github.com/tcbmem-png/csg_tcblaw/issues";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "Arkansas — On the Roadmap — TCB Child Support Calculator" },
      {
        name: "description",
        content:
          "An Arkansas child support calculator (Ark. Code Ann. § 9-12-312, income shares model) is on the roadmap. Open invitation to Arkansas family law practitioners to contribute to the legal specification.",
      },
      {
        property: "og:title",
        content: "Arkansas — On the Roadmap — TCB Child Support Calculator",
      },
      {
        property: "og:description",
        content:
          "Arkansas income shares calculator on the roadmap. Open invitation to family law practitioners to contribute the legal specification.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ar" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ar" }],
  }),
  component: ArkansasRoadmap,
});

function ArkansasRoadmap() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Arkansas — On the roadmap
      </p>
      <h1 className="mt-3 font-serif text-4xl">
        Ark. Code Ann. § 9-12-312
        <span className="block text-2xl text-muted-foreground">
          (income shares model)
        </span>
      </h1>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink/90">
        <p>
          An Arkansas calculator is on the roadmap. The Tennessee and
          Mississippi calculators share an architecture that lets us add a
          state in a few days once the legal specification is complete. The
          work that takes time is the substantive law: confirming the
          schedule, the deviation factors, the case law, and the
          worksheet format the chancery practice expects.
        </p>
        <p>
          If you are an Arkansas family law practitioner who would
          contribute to that specification — confirming current schedule
          values, flagging recent legislative changes, sharing the
          AOC-recognized worksheet format used in your district —{" "}
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
          >
            file an issue on GitHub
          </a>{" "}
          and we'll start the conversation.
        </p>
        <p className="text-sm text-muted-foreground">
          No email gate, no countdown timer, no "we'll let you know when
          it's ready" form. The civic-infrastructure framing requires the
          same posture on placeholder pages as on the live calculators.
        </p>
      </div>

      <div className="mt-10 space-y-3 border-t border-rule pt-8 text-sm">
        <Link
          to="/tn"
          className="block text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Tennessee calculator
        </Link>
        <Link
          to="/ms"
          className="block text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → Open the Mississippi calculator
        </Link>
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="block text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          → File an issue on GitHub
        </a>
      </div>
    </div>
  );
}
