import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculate, defaultInputs } from "@/lib/calc/calc";
import type { CalcInputs } from "@/lib/calc/types";
import { CalculatorInputs } from "@/components/calculator/inputs";
import { IncomeHelperPanel } from "@/components/calculator/income-helper-panel";
import { IncomeMethodologyAppendix } from "@/components/calculator/income-methodology-appendix";
import { ResultSidebar } from "@/components/calculator/result-sidebar";
import { OfficialWorksheet } from "@/components/calculator/official-worksheet";
import { PdfDownloadButtons } from "@/components/calculator/pdf-download-buttons";
import { ComparisonView } from "@/components/calculator/comparison";
import { CaseCaptionForm } from "@/components/calculator/case-caption";
import { ComparisonAppendix } from "@/components/calculator/comparison-appendix";
import { FilingDetailsForm } from "@/components/calculator/filing-details";
import {
  defaultCaption,
  decodeShare,
  encodeShare,
  type CaseCaption,
} from "@/lib/calc/share";

export const Route = createFileRoute("/tn")({
  head: () => ({
    meta: [
      { title: "Tennessee Child Support Calculator — TCB Law" },
      {
        name: "description",
        content:
          "Calculate Tennessee child support under the Income Shares Model (Rule 1240-02-04). Generates an official-style worksheet for negotiation or filing.",
      },
      { property: "og:title", content: "Tennessee Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Run a full Tennessee Income Shares calculation with parenting-time, add-ons, and credits, and download an official-style worksheet.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/tn" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/tn" }],
  }),
  component: TNCalculatorPage,
});

type Tab = "inputs" | "comparison" | "worksheet";

function TNCalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>(() => defaultInputs());
  const [caption, setCaption] = useState<CaseCaption>(() => defaultCaption());
  const [tab, setTab] = useState<Tab>("inputs");
  const hydratedRef = useRef(false);
  const outputs = useMemo(() => calculate(inputs), [inputs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    if (s) {
      const decoded = decodeShare(s);
      if (decoded) {
        setInputs(decoded.inputs);
        setCaption(decoded.caption);
      }
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    const handle = window.setTimeout(() => {
      const encoded = encodeShare(inputs, caption);
      const url = new URL(window.location.href);
      if (url.searchParams.get("s") === encoded) return;
      url.searchParams.set("s", encoded);
      window.history.replaceState(window.history.state, "", url.toString());
    }, 600);
    return () => window.clearTimeout(handle);
  }, [inputs, caption]);

  // C-4: When the statutory PCSO cap binds and the practitioner has not yet
  // written a Part VI narrative, seed a placeholder framing the burden-shift
  // under Tenn. Code Ann. § 36-5-101(e)(1)(B). Practitioners edit verbatim.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!outputs.pcsoExceedsStatutoryMax) return;
    if (caption.deviationNarrative.trim().length > 0) return;
    const n = inputs.numChildren;
    const excess = Math.round(outputs.pcsoExcessOverCap);
    const stub = `Presumptive PCSO exceeds the statutory maximum for ${n} ${n === 1 ? "child" : "children"} by $${excess.toLocaleString("en-US")}/mo (Tenn. Code Ann. § 36-5-101(e)(1)(B)). Deviation supported by: ____`;
    setCaption({ ...caption, deviationNarrative: stub });
  }, [outputs.pcsoExceedsStatutoryMax, outputs.pcsoExcessOverCap, inputs.numChildren, caption.deviationNarrative]);



  return (
    <div>
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
            Tennessee Income Shares Model
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Tenn. Comp. R. & Regs. 1240-02-04 · Tenn. Code Ann. § 36-5-101
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Calculator</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80">
            Enter both parents' monthly gross incomes, the number of
            children, and the parenting schedule. The calculator applies the
            BCSO schedule, the above-cap formula where it engages, the
            statutory presumptive cap analysis under § 36-5-101(e)(1)(B),
            and any add-ons or deviations you specify. Every computed line
            shows the rule that authorizes it. The worksheet downloads in
            two formats: AOC-format for chancery filing and an annotated
            version for mediation and analysis. Free, no signup.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Schedule effective {outputs.scheduleEffectiveDate}.{" "}
            <Link to="/tn/how-it-works" className="underline decoration-rule underline-offset-2 hover:text-primary">
              How it works
            </Link>
            {" · "}
            <Link to="/tn/about" className="underline decoration-rule underline-offset-2 hover:text-primary">
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
              active={tab === "comparison"}
              onClick={() => setTab("comparison")}
            >
              Imputed vs Actual
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
              <IncomeHelperPanel inputs={inputs} setInputs={setInputs} />
              <CalculatorInputs inputs={inputs} setInputs={setInputs} />
              <FilingDetailsForm
                caption={caption}
                setCaption={setCaption}
                numChildren={inputs.numChildren}
                parentALabel={inputs.parentALabel}
                parentBLabel={inputs.parentBLabel}
              />
            </>
          )}
          {tab === "comparison" && <ComparisonView inputs={inputs} />}
          {tab === "worksheet" && (
            <>
              <PdfDownloadButtons
                inputs={inputs}
                outputs={outputs}
                caption={caption}
                className="mb-4"
              />
              {/* On-screen annotated worksheet. Both PDFs are generated
                  directly by the renderers in src/lib/pdf/ — the AOC PDF
                  is a true replica of the State of Tennessee form, while
                  the annotated PDF mirrors what's shown here. */}
              <OfficialWorksheet
                inputs={inputs}
                outputs={outputs}
                caption={caption}
              />
              <IncomeMethodologyAppendix inputs={inputs} />
              <ComparisonAppendix inputs={inputs} caption={caption} />
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start no-print">
          <ResultSidebar
            inputs={inputs}
            outputs={outputs}
            caption={caption}
            onViewWorksheet={() => setTab("worksheet")}
            onViewComparison={() => setTab("comparison")}
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
