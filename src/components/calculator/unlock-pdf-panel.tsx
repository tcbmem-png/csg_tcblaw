import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";

interface Props {
  inputs?: CalcInputs;
  outputs?: CalcOutputs;
  caption?: CaseCaption;
}

// Free beta: paywall removed. PDF print/save is available to all users via
// the "Print / Save PDF" button on the worksheet. The Stripe checkout flow
// is preserved in the codebase (StripeWorksheetCheckout) for re-enabling.
export function UnlockPdfPanel(_props: Props) {
  return (
    <div
      id="unlock-pdf-panel"
      className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
    >
      <h2 className="font-serif text-lg text-ink">
        Free during beta — download your PDF
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the <strong>Print / Save PDF</strong> button on the worksheet above
        to save a filing-ready copy. No account or payment needed while we're
        in testing.
      </p>
    </div>
  );
}
