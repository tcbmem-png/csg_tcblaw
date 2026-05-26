/**
 * Status banner — top of the deviations area. Renders one of four
 * variants based on the derived handoff moment (drafting renders
 * nothing). Copy is verbatim from the MS Deviation Handoff UX spec.
 */
import type { MomentContext } from "@/lib/calc/ms/moment";

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
  context: MomentContext;
  onResend?: () => void;
  onCancel?: () => void;
}

export function MSHandoffStatusBanner({ context, onResend, onCancel }: Props) {
  const when = fmtDateTime(context.timestamp);
  const who = context.counterpartyLabel;

  switch (context.moment) {
    case "drafting":
      return null;

    case "sent_awaiting":
      return (
        <div
          className="mb-4 rounded-md border-l-4 border-accent bg-accent/10 p-3 text-sm text-ink no-print"
          data-testid="handoff-status-banner"
          data-moment="sent_awaiting"
        >
          <div className="font-medium">
            📤 Sent to <strong>{who}</strong>
            {when ? ` on ${when}` : ""}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Waiting for opposing counsel to add their client's positions.
            They'll either send the link back to you or download the
            final worksheet for filing.
          </p>
          {(onResend || onCancel) && (
            <div className="mt-2 flex gap-2 text-xs">
              {onResend && (
                <button
                  type="button"
                  onClick={onResend}
                  className="rounded border border-input bg-background px-2 py-1 text-ink hover:bg-accent/40"
                >
                  Resend link
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded border border-input bg-background px-2 py-1 text-muted-foreground hover:bg-accent/40"
                >
                  Cancel and start over
                </button>
              )}
            </div>
          )}
        </div>
      );

    case "your_turn_receiver":
      return (
        <div
          className="mb-4 rounded-md border-l-4 border-primary bg-primary/5 p-3 text-sm text-ink no-print"
          data-testid="handoff-status-banner"
          data-moment="your_turn_receiver"
        >
          <div className="font-medium">
            📥 Received from <strong>{who}</strong>
            {when ? ` on ${when}` : ""}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your turn — add your client's positions on each factor below.
            The opposing side's columns are locked. When you're done,
            send the link back to {context.counterpartyLabel} for review,
            or download the final worksheet if you've agreed.
          </p>
        </div>
      );

    case "returned_for_review":
      return (
        <div
          className="mb-4 rounded-md border-l-4 border-primary bg-primary/5 p-3 text-sm text-ink no-print"
          data-testid="handoff-status-banner"
          data-moment="returned_for_review"
        >
          <div className="font-medium">
            ↩️ Returned by <strong>{who}</strong>
            {when ? ` on ${when}` : ""}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Both sides are now filled in. Review their positions; you can
            amend yours and send back, or download the final worksheet
            for filing.
          </p>
        </div>
      );

    case "complete":
      return (
        <div
          className="mb-4 rounded-md border-l-4 border-primary bg-primary/10 p-3 text-sm text-ink no-print"
          data-testid="handoff-status-banner"
          data-moment="complete"
        >
          <div className="font-medium">
            ✅ Worksheet complete{when ? ` — generated on ${when}` : ""}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ready to file. Both sides locked.
          </p>
        </div>
      );

    default:
      return null;
  }
}
