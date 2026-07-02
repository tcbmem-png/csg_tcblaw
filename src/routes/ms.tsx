import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { calculateMS, defaultMSInputs } from "@/lib/calc/ms/calc";
import type { MSInputs } from "@/lib/calc/ms/types";
import { MSCalculatorInputs } from "@/components/calculator/ms/inputs";
import { MSResultSidebar } from "@/components/calculator/ms/result-sidebar";
import { MSWorksheetPreview } from "@/components/calculator/ms/worksheet-preview";
import { CaseCaptionForm } from "@/components/calculator/case-caption";
import { defaultCaption, type CaseCaption } from "@/lib/calc/share";
import { ReviewBanner } from "@/components/review-banner";

export const Route = createFileRoute("/ms")({
  head: () => ({
    meta: [
      { title: "Mississippi Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Mississippi child support under the statutory percentage guideline (Miss. Code Ann. § 43-19-101) with the 10 statutory deviation factors.",
      },
      { property: "og:title", content: "Mississippi Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Statutory percentage guideline plus the 10 deviation criteria of § 43-19-103, with a filing-ready worksheet.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/ms" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/ms" }],
  }),
  component: MSCalculatorPage,
});

type Tab = "inputs" | "worksheet";

function MSCalculatorPage() {
  const [inputs, setInputs] = useState<MSInputs>(() => defaultMSInputs());
  const [caption, setCaption] = useState<CaseCaption>(() => defaultCaption());
  const [tab, setTab] = useState<Tab>("inputs");
  const outputs = useMemo(() => calculateMS(inputs), [inputs]);

  return (
    <div>
      <ReviewBanner code="MS" />
      <div className="border-b border-rule bg-cream no-print">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            ← All calculators
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-3 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Mississippi Statutory Percentage Guideline
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Miss. Code Ann. § 43-19-101 (with § 43-19-103 deviation analysis)
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Calculator</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80">
            Enter the obligor's annual adjusted gross income, the number of
            children, and the applicable statutory percentage. The calculator
            surfaces the high-income finding under § 43-19-101(4), the 2022
            imputation framework under § 43-19-101(5), the 2023 incarceration
            suspension under § 43-19-36, and a structured deviation
            worksheet covering all ten § 43-19-103 factors. Free, no signup.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <Link to="/ms/how-it-works" className="underline decoration-rule underline-offset-2 hover:text-primary">
              How it works
            </Link>
            {" · "}
            <Link to="/ms/about" className="underline decoration-rule underline-offset-2 hover:text-primary">
              About this calculator
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-6 flex gap-2 border-b border-rule no-print">
            <TabBtn active={tab === "inputs"} onClick={() => setTab("inputs")}>
              Inputs
            </TabBtn>
            <TabBtn
              active={tab === "worksheet"}
              onClick={() => setTab("worksheet")}
            >
              Worksheet
            </TabBtn>
          </div>

          {tab === "inputs" && (
            <>
              <CaseCaptionForm caption={caption} setCaption={setCaption} />
              <MSCalculatorInputs inputs={inputs} setInputs={setInputs} />
            </>
          )}
          {tab === "worksheet" && (
            <MSWorksheetPreview
              inputs={inputs}
              outputs={outputs}
              caption={caption}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start no-print">
          <MSResultSidebar
            inputs={inputs}
            outputs={outputs}
            caption={caption}
            onViewWorksheet={() => setTab("worksheet")}
          />
        </aside>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-ink")
      }
    >
      {children}
    </button>
  );
}
