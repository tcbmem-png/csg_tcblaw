import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculate, defaultInputs } from "@/lib/calc/calc";
import type { CalcInputs } from "@/lib/calc/types";
import { CalculatorInputs } from "@/components/calculator/inputs";
import { ResultSidebar } from "@/components/calculator/result-sidebar";
import { OfficialWorksheet } from "@/components/calculator/official-worksheet";
import { ComparisonView } from "@/components/calculator/comparison";
import { CaseCaptionForm } from "@/components/calculator/case-caption";
import {
  defaultCaption,
  decodeShare,
  encodeShare,
  type CaseCaption,
} from "@/lib/calc/share";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Calculator — TN Child Support" },
      {
        name: "description",
        content:
          "Calculate Tennessee child support under the Income Shares Model. Generates an official-style worksheet for negotiation or filing.",
      },
    ],
  }),
  component: CalculatorPage,
});

type Tab = "inputs" | "comparison" | "worksheet";

function CalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>(() => defaultInputs());
  const [caption, setCaption] = useState<CaseCaption>(() => defaultCaption());
  const [tab, setTab] = useState<Tab>("inputs");
  const hydratedRef = useRef(false);
  const outputs = useMemo(() => calculate(inputs), [inputs]);

  // Hydrate from ?s= on mount.
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

  // Mirror current state into ?s= so the URL is always shareable.
  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    const encoded = encodeShare(inputs, caption);
    const url = new URL(window.location.href);
    url.searchParams.set("s", encoded);
    window.history.replaceState({}, "", url.toString());
  }, [inputs, caption]);

  return (
    <div>
      <div className="border-b border-rule bg-cream no-print">
        <div className="mx-auto max-w-6xl px-6 py-6">
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
              <CalculatorInputs inputs={inputs} setInputs={setInputs} />
            </>
          )}
          {tab === "comparison" && <ComparisonView inputs={inputs} />}
          {tab === "worksheet" && (
            <OfficialWorksheet
              inputs={inputs}
              outputs={outputs}
              caption={caption}
            />
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
