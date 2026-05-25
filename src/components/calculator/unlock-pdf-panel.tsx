import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";

interface Props {
  inputs?: CalcInputs;
  outputs?: CalcOutputs;
  caption?: CaseCaption;
}

// Free during beta. No lead capture, no gate. The "Print / Save PDF" button
// on the worksheet above works unconditionally. Kept as a small explanatory
// panel so the section anchor (#unlock-pdf-panel) still resolves and the
// page layout is unchanged.
export function UnlockPdfPanel(_props: Props) {
  return (
    <div
      id="unlock-pdf-panel"
      className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
    >
      <h2 className="font-serif text-lg text-ink">Free to use — including PDF</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the <strong>Print / Save PDF</strong> button on the worksheet above
        to save a filing-ready copy. No sign-up, no email required.
      </p>
    </div>
  );
}
