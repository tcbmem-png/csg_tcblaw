/**
 * Resume prompt — divergence-aware. Two variants:
 *
 *   "resumable"  — URL the receiver was last editing matches the URL
 *                  they're on now. Offer "Continue your edits" /
 *                  "Use the version they sent".
 *
 *   "diverged"   — originator sent a new URL since the receiver's last
 *                  save. Offer three options: continue, accept new, or
 *                  compare both (compare is scaffolded for a later cycle).
 *
 * Dismiss (X) is non-destructive: hides the prompt for this session,
 * preserves the saved draft. The receiver can re-summon via the
 * MSHandoffResumePill.
 */
import { toast } from "sonner";
import type { ReceivingDraft } from "@/lib/calc/ms/resume";

interface Props {
  variant: "resumable" | "diverged";
  draft: ReceivingDraft;
  onContinue: () => void;
  onAcceptNew: () => void;
  onDismiss: () => void;
}

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MSHandoffResumePrompt({
  variant,
  draft,
  onContinue,
  onAcceptNew,
  onDismiss,
}: Props) {
  return (
    <div
      className="mb-4 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm text-ink no-print"
      role="alert"
      data-testid="handoff-resume-prompt"
      data-variant={variant}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">
            {variant === "resumable"
              ? "Continue from where you left off?"
              : "You have unsaved edits — but opposing counsel sent a new version"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {variant === "resumable"
              ? `You had positions in progress when you last visited (${fmtWhen(draft.savedAt)}).`
              : `Your saved draft (${fmtWhen(draft.savedAt)}) was based on an earlier version of this link. Opposing counsel has since sent an updated worksheet.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent/40"
        >
          ×
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue your edits
        </button>
        <button
          type="button"
          onClick={onAcceptNew}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-ink hover:bg-accent/40"
        >
          {variant === "resumable"
            ? "Use the version they sent"
            : "Use the version they just sent"}
        </button>
        {variant === "diverged" && (
          <button
            type="button"
            onClick={() =>
              toast.info("Side-by-side compare", {
                description: "Coming in a later cycle. For now, copy your draft URL and the new URL into two browser tabs.",
              })
            }
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/40"
          >
            Compare both
          </button>
        )}
      </div>
    </div>
  );
}
