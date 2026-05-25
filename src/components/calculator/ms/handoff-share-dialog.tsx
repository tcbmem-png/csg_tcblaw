/**
 * Originator-side dialog for generating a two-attorney handoff URL.
 *
 *   - Field 1 (required): which side does your client represent? → originatingSide
 *   - Field 2 (optional): your name + firm → originatingAttorney
 *   - Field 3 (toggle, default ON): scrub my financial entries before handoff
 *
 * Generating stamps handoff.status="originated"+createdAt, optionally
 * scrubs the opposite slate, writes the originator-browser token into
 * localStorage, and copies the ?s=…&side=<other> URL to the clipboard.
 */
import { useState } from "react";
import type {
  HandoffSide,
  HandoffState,
  MSInputs,
} from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import {
  encodeMSShare,
  otherSide,
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
  const [scrub, setScrub] = useState(true);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  if (!open) return null;

  const obligor = inputs.obligorLabel || "Obligor";
  const obligee = inputs.obligeeLabel || "Obligee";

  const generate = async () => {
    const scrubbed = scrub ? scrubOppositeSlate(inputs, side) : inputs;
    const nextHandoff: HandoffState = {
      ...handoff,
      status: "originated",
      originatingSide: side,
      originatingAttorney: name || firm ? { name, firm } : null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const encoded = encodeMSShare(scrubbed, caption, nextHandoff);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("s", encoded);
    url.searchParams.set("side", otherSide(side));
    const urlStr = url.toString();
    try {
      await recordOriginatedHandoff(scrubbed, caption);
    } catch {
      /* non-fatal */
    }
    setGeneratedUrl(urlStr);
    try {
      await navigator.clipboard.writeText(urlStr);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    onApply({ inputs: scrubbed, handoff: nextHandoff, url: urlStr });
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
          <h3 className="font-serif text-lg text-ink">Hand off to opposing counsel</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generates a shareable URL that locks the other side's slate as
            yours and lets opposing counsel fill in their proposed
            deviations on a clean slate. No data leaves your browser.
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
                Your name (optional)
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
                Your firm (optional)
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
              checked={scrub}
              onChange={(e) => setScrub(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Scrub my financial entries on the other side</strong>
              <span className="ml-1 text-xs text-muted-foreground">
                — recommended. Zeros the opposite slate's proposed monthly
                amounts and clears its narrative fields. Your own slate is
                preserved verbatim.
              </span>
            </span>
          </label>
        </div>

        {generatedUrl ? (
          <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs text-ink">
            <div className="font-medium">
              {status === "copied"
                ? "✓ Handoff URL copied to clipboard"
                : status === "error"
                  ? "URL generated. Copy manually:"
                  : "URL generated."}
            </div>
            <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
              {generatedUrl}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-ink hover:bg-accent/40"
          >
            {generatedUrl ? "Done" : "Cancel"}
          </button>
          {!generatedUrl && (
            <button
              type="button"
              onClick={generate}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Generate & copy URL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
