import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resendWorksheetEmail } from "@/lib/fulfill.server";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const RATE_WINDOW_MIN = 5;

export const requestWorksheetResend = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email().max(320),
        origin: z.string().url().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = admin();
    const email = data.email.toLowerCase();

    // Rate-limit: at most 1 resend per email per RATE_WINDOW_MIN minutes.
    const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const { count: recent } = await sb
      .from("email_send_log")
      .select("id", { count: "exact", head: true })
      .eq("recipient_email", email)
      .eq("template_name", "worksheet-ready")
      .gte("created_at", since);
    if ((recent ?? 0) > 0) {
      return {
        ok: true as const,
        sent: false as const,
        message: `If we have a worksheet for that email, we just sent it. Please wait ${RATE_WINDOW_MIN} minutes before requesting another resend.`,
      };
    }

    // Most-recent delivered order for this email.
    const { data: order } = await sb
      .from("orders")
      .select("id")
      .eq("email", email)
      .eq("status", "delivered")
      .order("delivered_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Always return a generic message so we don't leak who has bought.
    if (!order) {
      return {
        ok: true as const,
        sent: false as const,
        message:
          "If we have a worksheet for that email, we just sent a fresh download link. Check your inbox in a minute or two.",
      };
    }

    const res = await resendWorksheetEmail(sb, order.id as string, data.origin);
    if (!res.ok) {
      console.error("resend failed", res.error);
      return {
        ok: false as const,
        sent: false as const,
        message: "We hit a snag sending the email. Please try again in a minute.",
      };
    }
    return {
      ok: true as const,
      sent: true as const,
      message:
        "Sent! Check your inbox in a minute or two — the email contains a fresh download link.",
    };
  });
