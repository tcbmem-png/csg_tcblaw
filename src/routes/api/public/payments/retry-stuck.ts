import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { fulfillOrder } from "@/lib/fulfill.server";

/**
 * Auto-retry sweep for orders that paid but didn't reach `delivered`
 * (e.g. transient PDF render or storage upload failure during the webhook).
 *
 * Called by pg_cron every 2 minutes. Picks orders older than 2 min, still
 * not delivered, max 10 per run, retries fulfillOrder idempotently.
 *
 * Auth: caller must pass the SUPABASE_PUBLISHABLE_KEY as `apikey` header
 * (the standard pg_cron pattern for /api/public/* routes).
 */
export const Route = createFileRoute("/api/public/payments/retry-stuck")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expectedApiKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const origin = new URL(request.url).origin;
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: stuck, error } = await sb
          .from("orders")
          .select("id")
          .eq("status", "paid")
          .is("pdf_storage_path", null)
          .lt("paid_at", cutoff)
          .limit(10);

        if (error) {
          console.error("retry-stuck query failed", error);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: Array<{ id: string; ok: boolean; error?: string }> = [];
        for (const row of stuck ?? []) {
          const r = await fulfillOrder(sb, row.id as string, origin);
          results.push({ id: row.id as string, ok: r.ok, error: r.error });
        }
        return Response.json({ ok: true, count: results.length, results });
      },
    },
  },
});
