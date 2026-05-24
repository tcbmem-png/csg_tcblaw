import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createUnlockCheckout } from "@/lib/checkout.functions";
import type { MSInputs, MSOutputs } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";

interface Props {
  email: string;
  inputs: MSInputs;
  outputs: MSOutputs;
  caption: CaseCaption;
  returnUrl: string;
}

export function StripeMSWorksheetCheckout({
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
        state: "MS",
        payload: {
          inputs: inputs as unknown as Record<string, unknown>,
          outputs: outputs as unknown as Record<string, unknown>,
          caption,
        },
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
