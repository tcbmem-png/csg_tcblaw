import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/unlock/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
          return new Response("Not found", { status: 404 });
        }
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { data: order } = await sb
          .from("orders")
          .select("id, status, pdf_storage_path")
          .eq("unlock_token", token)
          .maybeSingle();

        if (!order || !order.pdf_storage_path) {
          return new Response("Worksheet not ready yet. Please try again in a moment.", {
            status: 404,
          });
        }

        const { data: file, error } = await sb.storage
          .from("worksheet-pdfs")
          .download(order.pdf_storage_path);
        if (error || !file) {
          console.error("Download failed", error);
          return new Response("Could not load worksheet", { status: 500 });
        }

        const buf = await file.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'inline; filename="tn-child-support-worksheet.pdf"',
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
