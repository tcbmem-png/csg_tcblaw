import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

function clientIp(): string {
  try {
    const req = getRequest();
    const h = req?.headers;
    if (!h) return "unknown";
    const fwd =
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      h.get("x-forwarded-for");
    if (!fwd) return "unknown";
    return fwd.split(",")[0]!.trim().slice(0, 64) || "unknown";
  } catch {
    return "unknown";
  }
}

async function enforceCheckoutRateLimit(
  sb: ReturnType<typeof createClient>,
  ip: string,
): Promise<void> {
  if (ip === "unknown") return; // fail open rather than block legitimate traffic
  const now = new Date();
  const cutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const { data: existing } = await (sb as any)
    .from("checkout_rate_limits")
    .select("ip, window_start, attempts")
    .eq("ip", ip)
    .maybeSingle();

  const withinWindow =
    existing && new Date(existing.window_start as string) > cutoff;

  if (withinWindow) {
    if ((existing.attempts as number) >= RATE_LIMIT_MAX) {
      throw new Error("Too many checkout attempts. Please try again later.");
    }
    await (sb as any)
      .from("checkout_rate_limits")
      .update({ attempts: (existing.attempts as number) + 1 })
      .eq("ip", ip);
  } else {
    await (sb as any)
      .from("checkout_rate_limits")
      .upsert({ ip, window_start: now.toISOString(), attempts: 1 });
  }
}

const envSchema = z.enum(["sandbox", "live"]);
const captionSchema = z.object({
  matterName: z.string().max(200),
  docketNumber: z.string().max(100),
  court: z.string().max(200),
  preparedBy: z.string().max(200),
  client: z.string().max(200),
});

const stateSchema = z.enum(["TN", "MS"]);

const inputSchema = z.object({
  email: z.string().email().max(320),
  returnUrl: z.string().url().max(1000),
  environment: envSchema,
  /** Which state's calculator this order is for. Defaults to TN for backward compat. */
  state: stateSchema.optional(),
  // Pass through the full calculator state. Validate as object — calculator
  // schema is large and already produced by trusted client code; we only
  // re-render it server-side at delivery time.
  payload: z.object({
    inputs: z.record(z.string(), z.any()),
    outputs: z.record(z.string(), z.any()),
    caption: captionSchema,
  }),
});

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const createUnlockCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = admin();

    const state = data.state ?? "TN";

    // Stable hash of the worksheet payload (canonical-ish JSON).
    const worksheetHash = await sha256Hex(JSON.stringify({ state, payload: data.payload }));

    // Create pending order. Persist state on payload_json so fulfillment
    // can branch on it without a schema change.
    const { data: order, error: orderErr } = await sb
      .from("orders")
      .insert({
        email: data.email.toLowerCase(),
        worksheet_hash: worksheetHash,
        payload_json: { ...data.payload, state },
        status: "pending",
        amount_cents: 9900,
      })
      .select("id, unlock_token")
      .single();

    if (orderErr || !order) {
      console.error("Failed to create order", orderErr);
      throw new Error("Could not create order");
    }

    const stripe = createStripeClient(data.environment as StripeEnv);
    const prices = await stripe.prices.list({
      lookup_keys: ["worksheet_unlock_onetime"],
    });
    if (!prices.data.length) throw new Error("Price not configured");

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer_email: data.email,
      payment_intent_data: {
        description: state === "MS" ? "MS Child Support Worksheet PDF" : "TN Child Support Worksheet PDF",
      },
      metadata: {
        order_id: order.id as string,
        managed_payments: "true",
      },
      // Stripe end-to-end compliance handling (tax + fraud + disputes + support).
      // Not yet in the typed SessionCreateParams in stripe@22 — cast through any.
      ...({ managed_payments: { enabled: true } } as any),
    } as any);

    // Link session back to order.
    await sb
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    if (!session.client_secret) throw new Error("Stripe did not return a client secret");
    return { clientSecret: session.client_secret, orderId: order.id as string };
  });

export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ sessionId: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = admin();
    const { data: order } = await sb
      .from("orders")
      .select("id, status, unlock_token, email")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!order) return { found: false as const };
    return {
      found: true as const,
      status: order.status as string,
      unlockToken: order.unlock_token as string,
      email: order.email as string,
    };
  });
