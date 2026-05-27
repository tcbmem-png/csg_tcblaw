/**
 * Two-attorney handoff landing banner.
 *
 *   Receiving-side variant — shown when ?side= identifies this session
 *     as the receiving attorney. Plain-English: who sent it, when,
 *     what to do next.
 *
 *   Originator-receives-back variant — shown when the originator opens
 *     a URL that's been edited by the receiving attorney (isOriginator
 *     true AND status >= in_progress). Explains that both sides are
 *     filled in and offers review/amend/download as next steps.
 *
 *   Originator-mid-flight (sent, waiting) — handled by the status
 *     banner; this component returns null in that case.
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
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
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
    isOriginatorBrowser(handoff.caseId, inputs, caption).then((v) => {
      if (!cancelled) setIsOriginator(v);
    });
    return () => {
      cancelled = true;
    };
  }, [handoff.caseId, inputs, caption]);

  if (handoff.status === "none") return null;

  const isReceivingSession =
    activeSide !== null && activeSide !== handoff.originatingSide;
  const isOriginatorReceivingBack =
    isOriginator && !isReceivingSession && handoff.status !== "originated";

  // Show only when we actually have something explanatory to say —
  // moments 3 (receiver) and 4 (originator-receives-back). Moments 2
  // and 5 are owned by the status banner.
  if (!isReceivingSession && !isOriginatorReceivingBack) return null;

  const orig = handoff.originatingAttorney;
  const origName = orig?.name || "opposing counsel";
  const origFirm = orig?.firm ? ` (${orig.firm})` : "";

  const commitReceiving = () => {
    const next = name || firm ? { name, firm } : null;
    if (
      (next?.name ?? "") !== (handoff.receivingAttorney?.name ?? "") ||
      (next?.firm ?? "") !== (handoff.receivingAttorney?.firm ?? "")
    ) {
      setHandoff({ ...handoff, receivingAttorney: next });
    }
  };

  if (isOriginatorReceivingBack) {
    const rcv = handoff.receivingAttorney;
    const rcvName = rcv?.name || "Opposing counsel";
    const when = fmtDateTime(handoff.lastReceivingEditAt || handoff.completedAt);
    return (
      <div className="mb-6 rounded-md border-l-4 border-primary bg-primary/5 p-4 text-sm text-ink no-print">
        <div className="font-serif text-base">
          ↩️ <strong>{rcvName}</strong> sent this worksheet back
          {when ? ` on ${when}` : ""}. Both sides are now filled in.
        </div>
        <p className="mt-2 text-xs text-ink/80">
          Review their positions below — their column is shown with their
          proposed numbers and rationale. You can amend your side and
          send back for another round, or download the final worksheet
          for filing.
        </p>
      </div>
    );
  }

  // Receiving-side
  const when = fmtDateTime(handoff.createdAt);
  return (
    <div className="mb-6 rounded-md border-l-4 border-accent bg-accent/15 p-4 text-sm text-ink no-print">
      <div className="font-serif text-base">
        📥 You're opening a deviation worksheet from{" "}
        <strong>
          {origName}
          {origFirm}
        </strong>
        {when ? `, sent ${when}` : ""}.
      </div>
      <p className="mt-2 text-xs text-ink/80">
        Their side is locked below. Add your client's positions on each
        of the ten § 43-19-103 factors. The reconciliation panel on the
        right updates as you fill in your numbers, showing the dollar
        magnitude of every disagreement and a cumulative-through-age-21
        projection.
      </p>
      <p className="mt-2 text-xs text-ink/80">
        When you're done, send the link back to {origName} for review
        (use the "Send back" button below), or download the final
        worksheet if you've agreed.
      </p>

      {isOriginator && (
        <div className="mt-3 rounded border border-primary/40 bg-primary/5 px-2 py-1 text-[11px] text-ink">
          ⚠ This browser generated this handoff URL. Entries here will be
          attributed to opposing counsel in the PDF.
        </div>
      )}

      {handoff.status !== "completed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground">
              Your name (will appear on the final PDF)
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
              Your firm
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
