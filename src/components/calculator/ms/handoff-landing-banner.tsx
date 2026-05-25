/**
 * Receiving-side landing banner. Visible above the inputs when this
 * session is the receiving attorney (?side= matches the non-originating
 * slate). Surfaces:
 *
 *   - Case caption summary + status line (originated / in_progress /
 *     completed) so a stale-link opener sees whether the other side has
 *     finished.
 *   - Originating counsel's name + firm.
 *   - Inline optional capture: receiving counsel's own name + firm
 *     (writes into handoff.receivingAttorney on blur).
 *
 * Also rendered (in a passive form) when the originator session opens
 * its own handoff URL from the same browser — see `isOriginatorBrowser`.
 */
import { useEffect, useState } from "react";
import type {
  HandoffSide,
  HandoffState,
  MSInputs,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import { isOriginatorBrowser } from "@/lib/calc/ms/share";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLine(handoff: HandoffState): string {
  switch (handoff.status) {
    case "originated":
      return "Awaiting receiving counsel's entries.";
    case "in_progress":
      return handoff.lastReceivingEditAt
        ? `Worksheet in progress — last updated by receiving counsel on ${fmtDateTime(handoff.lastReceivingEditAt)}.`
        : "Worksheet in progress.";
    case "completed":
      return `Worksheet completed in calculator on ${fmtDateTime(handoff.completedAt)}.`;
    default:
      return "";
  }
}

interface Props {
  handoff: HandoffState;
  setHandoff: (next: HandoffState) => void;
  inputs: MSInputs;
  caption: CaseCaption;
  /** Which slate this session is editing (from ?side=). */
  activeSide: HandoffSide | null;
}

export function MSHandoffLandingBanner({
  handoff,
  setHandoff,
  inputs,
  caption,
  activeSide,
}: Props) {
  const [name, setName] = useState(handoff.receivingAttorney?.name ?? "");
  const [firm, setFirm] = useState(handoff.receivingAttorney?.firm ?? "");
  const [isOriginator, setIsOriginator] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isOriginatorBrowser(inputs, caption).then((v) => {
      if (!cancelled) setIsOriginator(v);
    });
    return () => {
      cancelled = true;
    };
  }, [inputs, caption]);

  if (handoff.status === "none") return null;

  const isReceivingSession =
    activeSide !== null && activeSide !== handoff.originatingSide;

  const obligor = inputs.obligorLabel || "Obligor";
  const obligee = inputs.obligeeLabel || "Obligee";
  const originatingPartyLabel =
    handoff.originatingSide === "A" ? obligor : obligee;

  const orig = handoff.originatingAttorney;
  const originatingLine = orig
    ? `${orig.name || "(name not provided)"}${orig.firm ? ` — ${orig.firm}` : ""}`
    : "(name not provided)";

  const commitReceiving = () => {
    const next = name || firm ? { name, firm } : null;
    if (
      (next?.name ?? "") !== (handoff.receivingAttorney?.name ?? "") ||
      (next?.firm ?? "") !== (handoff.receivingAttorney?.firm ?? "")
    ) {
      setHandoff({ ...handoff, receivingAttorney: next });
    }
  };

  return (
    <div className="mb-6 rounded-md border-l-4 border-accent bg-accent/15 p-4 text-sm text-ink no-print">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Two-attorney handoff
          </div>
          <div className="mt-1 font-serif text-base">
            {caption.matterName || "Untitled matter"}
            {caption.docketNumber ? ` — ${caption.docketNumber}` : ""}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{statusLine(handoff)}</div>
      </div>

      <div className="mt-2 text-xs text-ink">
        Originating counsel ({originatingPartyLabel}): <strong>{originatingLine}</strong>.{" "}
        {isReceivingSession
          ? `You are filling in proposed deviations for the ${handoff.originatingSide === "A" ? obligee : obligor} side; the other side is locked.`
          : `This URL is locked to the ${handoff.originatingSide === "A" ? obligor : obligee} side.`}
      </div>

      {isOriginator && isReceivingSession && (
        <div className="mt-2 rounded border border-primary/40 bg-primary/5 px-2 py-1 text-[11px] text-ink">
          ⚠ This browser generated this handoff URL. Entries here will be
          attributed to opposing counsel in the PDF.
        </div>
      )}

      {isReceivingSession && handoff.status !== "completed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground">
              Your name (optional)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitReceiving}
              className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              placeholder="Opposing counsel name"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground">
              Your firm (optional)
            </label>
            <input
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
              onBlur={commitReceiving}
              className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              placeholder="Firm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
