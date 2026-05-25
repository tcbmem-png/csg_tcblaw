import type { MSInputs, MSOutputs } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";

interface Props {
  inputs?: MSInputs;
  outputs?: MSOutputs;
  caption?: CaseCaption;
}

// Free during beta. No lead capture, no gate. Mirrors the TN panel.
export function MSUnlockPdfPanel(_props: Props) {
  return (
    <div
      id="pdf-info-panel"
      className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
    >
      <h2 className="font-serif text-lg text-ink">Free to use — including PDF</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the <strong>Print / Save PDF</strong> button on the Mississippi
        worksheet above to save a filing-ready copy. No sign-up, no email
        required.
      </p>
    </div>
  );
}
