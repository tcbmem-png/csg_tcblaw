import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculate, defaultInputs } from "@/lib/calc/calc";
import type { CalcInputs } from "@/lib/calc/types";
import { CalculatorInputs } from "@/components/calculator/inputs";
import { IncomeHelperPanel } from "@/components/calculator/income-helper-panel";
import { IncomeMethodologyAppendix } from "@/components/calculator/income-methodology-appendix";
import { ResultSidebar } from "@/components/calculator/result-sidebar";
import { OfficialWorksheet } from "@/components/calculator/official-worksheet";
import { UnlockPdfPanel } from "@/components/calculator/unlock-pdf-panel";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
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
      <PaymentTestModeBanner />
      <div className="border-b border-rule bg-cream no-print">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Tennessee
          </p>
          <h1 className="font-serif text-3xl text-ink">Calculator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Implements Tenn. Comp. R. & Regs. 1240-02-04 (Income Shares Model).
            Schedule effective {outputs.scheduleEffectiveDate}.
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
              <OfficialWorksheet
                inputs={inputs}
                outputs={outputs}
                caption={caption}
              />
              <IncomeMethodologyAppendix inputs={inputs} />
              <ComparisonAppendix inputs={inputs} caption={caption} />
              <UnlockPdfPanel inputs={inputs} outputs={outputs} caption={caption} />
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start no-print">
          <ResultSidebar
            inputs={inputs}
            outputs={outputs}
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
