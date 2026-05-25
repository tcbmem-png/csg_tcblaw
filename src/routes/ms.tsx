import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateMS, defaultMSInputs } from "@/lib/calc/ms/calc";
import type {
  MSInputs,
  HandoffSide,
  HandoffState,
} from "@/lib/calc/ms/types";
import { defaultHandoffState } from "@/lib/calc/ms/types";
import { MSCalculatorInputs } from "@/components/calculator/ms/inputs";
import { MSResultSidebar } from "@/components/calculator/ms/result-sidebar";
import { MSWorksheetPreview } from "@/components/calculator/ms/worksheet-preview";
import { MSHandoffLandingBanner } from "@/components/calculator/ms/handoff-landing-banner";
import { CaseCaptionForm } from "@/components/calculator/case-caption";
import { defaultCaption, type CaseCaption } from "@/lib/calc/share";
import {
  decodeMSShare,
  encodeMSShare,
  parseSideParam,
} from "@/lib/calc/ms/share";

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
  const [handoff, setHandoff] = useState<HandoffState>(() => defaultHandoffState());
  const [activeSide, setActiveSide] = useState<HandoffSide | null>(null);
  const [tab, setTab] = useState<Tab>("inputs");
  const hydratedRef = useRef(false);
  const outputs = useMemo(() => calculateMS(inputs), [inputs]);

  // ---- Hydrate from URL ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    if (s) {
      const decoded = decodeMSShare(s);
      if (decoded) {
        setInputs(decoded.inputs);
        setCaption(decoded.caption);
        setHandoff(decoded.handoff);
        if (decoded.handoff.status !== "none") {
          setActiveSide(parseSideParam(params.get("side")));
        }
      }
    }
    hydratedRef.current = true;
  }, []);

  // Receiving-side edit detector: when this session is the receiving
  // side and the inputs change, bump lastReceivingEditAt and flip
  // status: originated → in_progress.
  const isReceivingSession =
    activeSide !== null &&
    handoff.status !== "none" &&
    activeSide !== handoff.originatingSide;

  const setInputsWithReceivingEdit = useCallback(
    (next: MSInputs | ((prev: MSInputs) => MSInputs)) => {
      const value =
        typeof next === "function"
          ? (next as (p: MSInputs) => MSInputs)(inputs)
          : next;
      setInputs(value);
      if (isReceivingSession && handoff.status !== "completed") {
        setHandoff((h) => ({
          ...h,
          status: h.status === "originated" ? "in_progress" : h.status,
          lastReceivingEditAt: new Date().toISOString(),
        }));
      }
    },
    [inputs, isReceivingSession, handoff.status],
  );

  // ---- URL auto-sync ----
  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    const handle = window.setTimeout(() => {
      const encoded = encodeMSShare(inputs, caption, handoff);
      const url = new URL(window.location.href);
      const prev = url.searchParams.get("s");
      const prevSide = url.searchParams.get("side");

      // ?side= preservation rules:
      //   - completed → always keep ?side= (locks downstream openers)
      //   - receiving session mid-edit → keep ?side=
      //   - originator session → drop ?side= (their URL shouldn't lock)
      let nextSide: string | null = null;
      if (handoff.status === "completed" || isReceivingSession) {
        nextSide = activeSide;
      }

      if (prev === encoded && prevSide === nextSide) return;
      url.searchParams.set("s", encoded);
      if (nextSide) url.searchParams.set("side", nextSide);
      else url.searchParams.delete("side");
      window.history.replaceState(window.history.state, "", url.toString());
    }, 600);
    return () => window.clearTimeout(handle);
  }, [inputs, caption, handoff, activeSide, isReceivingSession]);

  return (
    <div>
      <div className="border-b border-rule bg-cream no-print">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Mississippi
          </p>
          <h1 className="font-serif text-3xl text-ink">Calculator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Implements Miss. Code Ann. § 43-19-101 (presumptive percentage) with
            the § 43-19-103 deviation criteria.
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
              <MSHandoffLandingBanner
                handoff={handoff}
                setHandoff={setHandoff}
                inputs={inputs}
                caption={caption}
                activeSide={activeSide}
              />
              <CaseCaptionForm caption={caption} setCaption={setCaption} />
              <MSCalculatorInputs
                inputs={inputs}
                setInputs={setInputsWithReceivingEdit}
                lockedSide={
                  handoff.status !== "none" && activeSide
                    ? handoff.originatingSide
                    : null
                }
              />
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
            handoff={handoff}
            setHandoff={setHandoff}
            activeSide={activeSide}
            isReceivingSession={isReceivingSession}
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
