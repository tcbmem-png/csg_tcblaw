/**
 * Originator-side dialog. Generates a link that opposing counsel can
 * open in their browser, with the originator's slate locked and the
 * receiver's slate ready to fill in.
 *
 * Copy rewrite per MS Deviation Handoff UX spec — replaces "slate" /
 * "shareable URL" jargon with attorney-language ("link", "side",
 * "columns"). Logic unchanged except:
 *   - mints HandoffState.caseId on first Send (preserved on re-generate)
 *   - mailto opens with a "paste your link here" body — the URL is
 *     never embedded in the mailto, only on the clipboard
 */
import { useState } from "react";
import { toast } from "sonner";
import type {
  HandoffSide,
  HandoffState,
  MSInputs,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  encodeMSShare,
  otherSide,
  randomToken,
  recordOriginatedHandoff,
  scrubOppositeSlate,
} from "@/lib/calc/ms/share";

interface Props {
  open: boolean;
  onClose: () => void;
  inputs: MSInputs;
  caption: CaseCaption;
  handoff: HandoffState;
  onApply: (next: { inputs: MSInputs; handoff: HandoffState; url: string }) => void;
}

function mailtoSubject(caption: CaseCaption): string {
  const matter = caption.matterName?.trim();
  return matter
    ? `${matter} — MS deviation worksheet`
    : "MS deviation worksheet";
}

export function MSHandoffShareDialog({
  open,
  onClose,
  inputs,
  caption,
  handoff,
  onApply,
}: Props) {
  const [side, setSide] = useState<HandoffSide>(handoff.originatingSide || "A");
  const [name, setName] = useState(handoff.originatingAttorney?.name ?? "");
  const [firm, setFirm] = useState(handoff.originatingAttorney?.firm ?? "");
  const [blankSlate, setBlankSlate] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  if (!open) return null;

  const obligor = inputs.obligorLabel || "Obligor";
  const obligee = inputs.obligeeLabel || "Obligee";

  async function build(): Promise<{ url: string; handoff: HandoffState; inputs: MSInputs }> {
    const scrubbed = blankSlate ? scrubOppositeSlate(inputs, side) : inputs;
    // Preserve existing caseId on re-generate; mint on first Send.
    const caseId = handoff.caseId ?? randomToken(16);
    const nextHandoff: HandoffState = {
      ...handoff,
      status: "originated",
      originatingSide: side,
      originatingAttorney: name || firm ? { name, firm } : null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      caseId,
    };
    const encoded = encodeMSShare(scrubbed, caption, nextHandoff);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("s", encoded);
    url.searchParams.set("side", otherSide(side));
    const urlStr = url.toString();
    try {
      await recordOriginatedHandoff(caseId, scrubbed, caption);
    } catch {
      /* non-fatal */
    }
    return { url: urlStr, handoff: nextHandoff, inputs: scrubbed };
  }

  const copyLink = async () => {
    const { url, handoff: nextHandoff, inputs: scrubbed } = await build();
    setGeneratedUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard", {
        description: "Paste it into your email to opposing counsel.",
      });
    } catch {
      toast.error("Could not copy automatically — select the link below.");
    }
    onApply({ inputs: scrubbed, handoff: nextHandoff, url });
  };

  const copyAndEmail = async () => {
    const { url, handoff: nextHandoff, inputs: scrubbed } = await build();
    setGeneratedUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — opening your email client", {
        description: "Paste the link into the message body.",
      });
    } catch {
      toast.error("Could not copy automatically — select the link below.");
    }
    onApply({ inputs: scrubbed, handoff: nextHandoff, url });
    // URL is intentionally NOT in the mailto body — long share payloads
    // are clipped by many clients at ~2000 chars. Clipboard is the
    // transport; mailto only kickstarts the message.
    const body = "Paste your link below this line:\n\n----------\n\n";
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${encodeURIComponent(mailtoSubject(caption))}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 no-print"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-rule bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="font-serif text-lg text-ink">Send to opposing counsel</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Generates a link that opposing counsel can open in their
            browser. They'll see your client's positions locked, with
            their own columns ready to fill in. When they're done, they
            can send the link back to you for review or download the
            final worksheet for filing.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing leaves your browser when you click Send — the link
            itself carries the worksheet. You email it through whatever
            channel you'd normally use (Outlook, Clio, certified mail
            with a printed URL).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">
              Which party does your client represent?
            </label>
            <div className="mt-1 flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={side === "A"}
                  onChange={() => setSide("A")}
                />
                <span>Obligor — {obligor}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={side === "B"}
                  onChange={() => setSide("B")}
                />
                <span>Obligee — {obligee}</span>
              </label>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Obligor / obligee roles come from the case caption above.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">
                Your name (appears on the final PDF)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                placeholder="Jane Counsel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
                Your firm
              </label>
              <input
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                placeholder="Counsel & Co."
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-md border border-rule bg-cream p-3 text-sm">
            <input
              type="checkbox"
              checked={blankSlate}
              onChange={(e) => setBlankSlate(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Show opposing counsel a blank slate</strong>
              <span className="ml-1 text-xs text-muted-foreground">
                — recommended. If unchecked, opposing counsel will see
                whatever you'd typed in their column as a starting point.
                Leave checked unless you've already negotiated specific
                entries.
              </span>
            </span>
          </label>
        </div>

        {generatedUrl ? (
          <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs text-ink">
            <div className="font-medium">✓ Link ready</div>
            <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
              {generatedUrl}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-ink hover:bg-accent/40"
          >
            {generatedUrl ? "Done" : "Cancel"}
          </button>
          {!generatedUrl && (
            <>
              <button
                type="button"
                onClick={copyAndEmail}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent/40"
              >
                Copy link & open email
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Copy link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
