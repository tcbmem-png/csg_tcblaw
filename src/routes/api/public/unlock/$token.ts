import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/unlock/$token")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const token = params.token;
        if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
          return new Response("Not found", { status: 404 });
        }
        const url = new URL(request.url);
        const variant = url.searchParams.get("variant") === "official" ? "official" : "summary";

        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { data: order } = await sb
          .from("orders")
          .select("id, status, pdf_storage_path, pdf_official_storage_path, payload_json")
          .eq("unlock_token", token)
          .maybeSingle();

        const state = (order?.payload_json as any)?.state === "MS" ? "MS" : "TN";

        const path =
          variant === "official"
            ? order?.pdf_official_storage_path ?? order?.pdf_storage_path
            : order?.pdf_storage_path;

        if (!order || !path) {
          return new Response("Worksheet not ready yet. Please try again in a moment.", {
            status: 404,
          });
        }

        const { data: file, error } = await sb.storage
          .from("worksheet-pdfs")
          .download(path);
        if (error || !file) {
          console.error("Download failed", error);
          return new Response("Could not load worksheet", { status: 500 });
        }

        const buf = await file.arrayBuffer();
        const filename =
          state === "MS"
            ? "ms-child-support-worksheet.pdf"
            : variant === "official"
              ? "tn-child-support-worksheet-official.pdf"
              : "tn-child-support-worksheet.pdf";
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
