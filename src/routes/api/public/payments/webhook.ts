import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";
import { fulfillOrder } from "@/lib/fulfill.server";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook with bad env param:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        const origin = originFromRequest(request);
        const sb = admin();

        try {
          const event = await verifyWebhook(request, env);

          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object;
              const orderId: string | undefined = session.metadata?.order_id;
              if (orderId && session.payment_status === "paid") {
                const res = await fulfillOrder(sb, orderId, origin);
                if (!res.ok) {
                  console.error("Fulfill failed (will retry via sweep)", orderId, res.error);
                }
              } else {
                console.log("Session not yet paid or missing order_id", {
                  orderId,
                  paymentStatus: session.payment_status,
                });
              }
              break;
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
              const session = event.data.object;
              const orderId: string | undefined = session.metadata?.order_id;
              if (orderId) {
                await sb
                  .from("orders")
                  .update({ status: "failed" })
                  .eq("id", orderId)
                  .eq("status", "pending");
              }
              break;
            }
            default:
              console.log("Unhandled Stripe event:", event.type);
          }

          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

export const _buf = Buffer;
