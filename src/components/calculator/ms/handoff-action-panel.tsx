/**
 * State-aware action panel — bottom of the deviations area. Surfaces
 * the primary action for the current moment plus any alts/secondaries.
 *
 * Moments:
 *   drafting              → [Primary] Send to opposing counsel
 *                           [Secondary] Download draft as PDF (client review)
 *   sent_awaiting         → collapsed (resend lives in status banner)
 *   your_turn_receiver    → [Primary] Send back to <originator>
 *                           [Primary alt] Download final worksheet
 *                           [Secondary] Download my draft only
 *   returned_for_review   → [Primary] Send revisions back to <receiver>
 *                           [Primary alt] Download final worksheet
 *   complete              → [Primary] Re-download final PDF
 */
import { useState } from "react";
import { toast } from "sonner";
import type {
  HandoffSide,
  HandoffState,
  MSInputs,
  MSOutputs,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import type { MomentContext } from "@/lib/calc/ms/moment";
import { encodeMSShare, otherSide } from "@/lib/calc/ms/share";
import { clearReceivingDraft } from "@/lib/calc/ms/resume";
import { downloadMSDeviationPdf } from "@/lib/pdf/ms-deviation-pdf";
import { MSHandoffShareDialog } from "./handoff-share-dialog";

interface Props {
  context: MomentContext;
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  handoff: HandoffState;
  setHandoff: (next: HandoffState) => void;
  activeSide: HandoffSide | null;
  isReceivingSession: boolean;
}

function copyCurrentUrl(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return navigator.clipboard
    .writeText(window.location.href)
    .then(() => true)
    .catch(() => false);
}

async function copySendBackUrl(args: {
  inputs: MSInputs;
  caption: CaseCaption;
  handoff: HandoffState;
  activeSide: HandoffSide | null;
}): Promise<{ ok: boolean; url: string | null }> {
  if (typeof window === "undefined") return { ok: false, url: null };
  const encoded = encodeMSShare(args.inputs, args.caption, args.handoff);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("s", encoded);
  // Receiver's URL keeps ?side= so when the originator opens it the
  // originator's UI shows their own (locked) side.
  if (args.activeSide) {
    url.searchParams.set("side", otherSide(args.activeSide));
  } else {
    url.searchParams.set("side", args.handoff.originatingSide);
  }
  const urlStr = url.toString();
  try {
    await navigator.clipboard.writeText(urlStr);
    return { ok: true, url: urlStr };
  } catch {
    return { ok: false, url: urlStr };
  }
}

function openMailDraft(caption: CaseCaption, to: string) {
  if (typeof window === "undefined") return;
  const matter = caption.matterName?.trim();
  const subject = matter
    ? `${matter} — MS deviation worksheet`
    : "MS deviation worksheet";
  const body = `Paste your link below this line — sending back to ${to}:\n\n----------\n\n`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function MSHandoffActionPanel({
  context,
  inputs,
  outputs,
  caption,
  handoff,
  setHandoff,
  activeSide,
  isReceivingSession,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  const downloadFinalPdf = () => {
    let next = handoff;
    if (isReceivingSession && handoff.status === "in_progress") {
      next = { ...handoff, status: "completed", completedAt: new Date().toISOString() };
      setHandoff(next);
    }
    downloadMSDeviationPdf({ inputs, outputs, caption, handoff: next });
    if (next.status === "completed" && next.caseId) {
      clearReceivingDraft(next.caseId);
    }
  };

  const sendBack = async () => {
    const result = await copySendBackUrl({ inputs, caption, handoff, activeSide });
    const who = context.counterpartyLabel || "opposing counsel";
    if (result.ok) {
      toast.success("Link copied to clipboard", {
        description: `Paste it into your email to ${who} — when they open it, they'll see your client's positions filled in on their copy.`,
      });
      // Receiver successfully handed off — saved draft is now stale.
      if (handoff.caseId) clearReceivingDraft(handoff.caseId);
    } else {
      toast.error("Could not copy automatically — use Copy shareable link in the sidebar.");
    }
  };

  const sendBackAndEmail = async () => {
    const result = await copySendBackUrl({ inputs, caption, handoff, activeSide });
    const who = context.counterpartyLabel || "opposing counsel";
    if (result.ok) {
      toast.success("Link copied — opening your email client", {
        description: `Paste it into the message to ${who}.`,
      });
      if (handoff.caseId) clearReceivingDraft(handoff.caseId);
    } else {
      toast.error("Could not copy automatically — use Copy shareable link.");
    }
    openMailDraft(caption, who);
  };

  if (context.moment === "sent_awaiting") {
    // Action panel collapsed at this moment; resend lives in the status banner.
    return null;
  }

  return (
    <div
      className="mt-6 rounded-lg border border-rule bg-card p-4 no-print"
      data-testid="handoff-action-panel"
      data-moment={context.moment}
    >
      {context.moment === "drafting" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink">
            <div className="font-medium">Ready for opposing counsel?</div>
            <div className="text-xs text-muted-foreground">
              Email them a link to this worksheet. They fill in their
              client's positions in the browser; the link is the
              worksheet.
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => copyCurrentUrl().then((ok) => {
                if (ok) toast.success("Draft link copied for client review");
              })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-ink hover:bg-accent/40"
            >
              Copy draft link (for client review)
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send to opposing counsel →
            </button>
          </div>
        </div>
      )}

      {context.moment === "your_turn_receiver" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={sendBack}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send back to {context.counterpartyLabel} →
            </button>
            <button
              type="button"
              onClick={sendBackAndEmail}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-ink hover:bg-accent/40"
            >
              Send back & open email
            </button>
            <button
              type="button"
              onClick={downloadFinalPdf}
              className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Download final worksheet
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Sending back gives {context.counterpartyLabel} a link with
            both sides filled in. Downloading the final worksheet locks
            the case as filed.
          </div>
        </div>
      )}

      {context.moment === "returned_for_review" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={sendBack}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send revisions back to {context.counterpartyLabel} →
            </button>
            <button
              type="button"
              onClick={sendBackAndEmail}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-ink hover:bg-accent/40"
            >
              Send back & open email
            </button>
            <button
              type="button"
              onClick={downloadFinalPdf}
              className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Download final worksheet
            </button>
          </div>
        </div>
      )}

      {context.moment === "complete" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink">
            <div className="font-medium">Worksheet locked</div>
            <div className="text-xs text-muted-foreground">
              Both sides have agreed (or one side downloaded the final
              PDF). Re-download anytime.
            </div>
          </div>
          <button
            type="button"
            onClick={downloadFinalPdf}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Re-download final PDF
          </button>
        </div>
      )}

      <MSHandoffShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        inputs={inputs}
        caption={caption}
        handoff={handoff}
        onApply={({ handoff: nextHandoff }) => {
          setHandoff(nextHandoff);
        }}
      />
    </div>
  );
}
