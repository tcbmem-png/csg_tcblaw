import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createUnlockCheckout } from "@/lib/checkout.functions";
import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";

interface Props {
  email: string;
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
  returnUrl: string;
}

export function StripeWorksheetCheckout({
  email,
  inputs,
  outputs,
  caption,
  returnUrl,
}: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const res = await createUnlockCheckout({
      data: {
        email,
        returnUrl,
        environment: getStripeEnvironment(),
        payload: { inputs, outputs, caption },
      },
    });
    return res.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={getStripe()}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
