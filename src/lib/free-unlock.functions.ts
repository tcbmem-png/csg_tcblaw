import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fulfillOrder } from "@/lib/fulfill.server";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
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

function userAgent(): string | null {
  try {
    const ua = getRequest()?.headers.get("user-agent");
    return ua ? ua.slice(0, 500) : null;
  } catch {
    return null;
  }
}

function originFromRequest(): string {
  try {
    const req = getRequest();
    if (!req) return process.env.PUBLIC_SITE_ORIGIN || "";
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return process.env.PUBLIC_SITE_ORIGIN || "";
  }
}

async function enforceRateLimit(sb: any, ip: string): Promise<void> {
  if (ip === "unknown") return;
  const now = new Date();
  const cutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const { data: existing } = await sb
    .from("checkout_rate_limits")
    .select("ip, window_start, attempts")
    .eq("ip", ip)
    .maybeSingle();

  const withinWindow =
    existing && new Date(existing.window_start as string) > cutoff;

  if (withinWindow) {
    if ((existing.attempts as number) >= RATE_LIMIT_MAX) {
      throw new Error("Too many requests. Please try again later.");
    }
    await sb
      .from("checkout_rate_limits")
      .update({ attempts: (existing.attempts as number) + 1 })
      .eq("ip", ip);
  } else {
    await sb
      .from("checkout_rate_limits")
      .upsert({ ip, window_start: now.toISOString(), attempts: 1 });
  }
}

const captionSchema = z.object({
  matterName: z.string().max(200),
  docketNumber: z.string().max(100),
  court: z.string().max(200),
  preparedBy: z.string().max(200),
  client: z.string().max(200),
  comments: z.string().max(5000).optional(),
  parentARole: z.enum(["mother", "father"]).optional(),
  children: z
    .array(
      z.object({
        name: z.string().max(200),
        dob: z.string().max(40),
        daysWithA: z.number().min(0).max(366),
        daysWithB: z.number().min(0).max(366),
      }),
    )
    .max(10)
    .optional(),
  deviationNarrative: z.string().max(2000).optional(),
});

const inputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  state: z.enum(["TN", "MS"]),
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

export const requestFreeWorksheet = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = admin();
    const ip = clientIp();
    await enforceRateLimit(sb, ip);

    const worksheetHash = await sha256Hex(
      JSON.stringify({ state: data.state, payload: data.payload }),
    );

    // Dedupe: if this exact (email, hash) already produced an order, reuse it.
    const { data: existingLead } = await sb
      .from("beta_leads")
      .select("order_id")
      .eq("email", data.email)
      .eq("worksheet_hash", worksheetHash)
      .maybeSingle();

    let orderId: string;
    let unlockToken: string;

    if (existingLead?.order_id) {
      orderId = existingLead.order_id as string;
      const { data: ord } = await sb
        .from("orders")
        .select("unlock_token")
        .eq("id", orderId)
        .maybeSingle();
      if (!ord) throw new Error("Order missing for existing lead");
      unlockToken = ord.unlock_token as string;
    } else {
      const { data: order, error: orderErr } = await sb
        .from("orders")
        .insert({
          email: data.email,
          worksheet_hash: worksheetHash,
          payload_json: { ...data.payload, state: data.state },
          status: "pending",
          amount_cents: 0,
        })
        .select("id, unlock_token")
        .single();
      if (orderErr || !order) {
        console.error("Failed to create free order", orderErr);
        throw new Error("Could not create order");
      }
      orderId = order.id as string;
      unlockToken = order.unlock_token as string;

      const { error: leadErr } = await sb.from("beta_leads").insert({
        email: data.email,
        name: data.name,
        state: data.state,
        matter_name: data.payload.caption.matterName || null,
        worksheet_hash: worksheetHash,
        order_id: orderId,
        ip: ip === "unknown" ? null : ip,
        user_agent: userAgent(),
      });
      if (leadErr && leadErr.code !== "23505") {
        // Don't block fulfillment on lead-capture failure, but log it.
        console.error("beta_leads insert failed", leadErr);
      }
    }

    const origin = originFromRequest();
    const res = await fulfillOrder(sb, orderId, origin);
    if (!res.ok) {
      console.error("Free fulfill failed", orderId, res.error);
      throw new Error(res.error || "Could not send worksheet");
    }

    return { unlockToken, orderId };
  });
