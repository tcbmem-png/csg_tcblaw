import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { fulfillOrder } from "@/lib/fulfill.server";

export const Route = createFileRoute("/api/public/admin/fulfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("x-admin-secret");
        const expectedSecret = process.env.ADMIN_FULFILL_SECRET;
        if (!auth || !expectedSecret || auth !== expectedSecret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { orderId } = (await request.json()) as { orderId?: string };
        if (!orderId) return Response.json({ ok: false, error: "missing orderId" }, { status: 400 });
        const origin = new URL(request.url).origin;
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const res = await fulfillOrder(sb, orderId, origin);
        return Response.json(res, { status: res.ok ? 200 : 500 });
      },
    },
  },
});
