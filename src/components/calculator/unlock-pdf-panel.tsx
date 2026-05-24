import { useState } from "react";
import { StripeWorksheetCheckout } from "@/components/StripeWorksheetCheckout";
import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import { useIsUnlocked } from "@/lib/calc/unlock";

interface Props {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
}

export function UnlockPdfPanel({ inputs, outputs, caption }: Props) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const unlocked = useIsUnlocked();

  if (unlocked) {
    return (
      <div
        id="unlock-pdf-panel"
        className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
      >
        <h2 className="font-serif text-lg text-ink">✓ Worksheet unlocked</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can now print or save this worksheet as a PDF using the buttons
          above. A copy was also emailed to you.
        </p>
      </div>
    );
  }

  return (
    <div
      id="unlock-pdf-panel"
      className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
    >
      <h2 className="font-serif text-lg text-ink">Get the filing-ready PDF — $99</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll email a clean, citation-ready PDF of this worksheet and give you
        an in-app download link. One case, one payment.
      </p>

      {!open ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm"
          />
          <button
            disabled={!valid}
            onClick={() => setOpen(true)}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Unlock for $99
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <StripeWorksheetCheckout
            email={email}
            inputs={inputs}
            outputs={outputs}
            caption={caption}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-muted-foreground underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
