import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/components";
import * as React from "react";
import { renderWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { template as worksheetReadyTemplate } from "@/lib/email-templates/worksheet-ready";
import { getOrCreateUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";

const SITE_NAME = "TN Child Support Helper";
const SENDER_DOMAIN = "notify.tncsg.tcblaw.org";
const FROM_DOMAIN = "notify.tncsg.tcblaw.org";

export const Route = createFileRoute("/api/public/admin/fulfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("x-admin-secret");
        if (!auth || auth !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { orderId } = await request.json();
        const origin = new URL(request.url).origin;
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const { data: order, error } = await sb
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (error || !order) return Response.json({ ok: false, error: "not found" }, { status: 404 });

        const payload = order.payload_json as any;
        const pdfBuf = await renderWorksheetPdf({
          inputs: payload.inputs,
          outputs: payload.outputs,
          caption: payload.caption,
        });
        const storagePath = `${order.id}/worksheet.pdf`;
        const { error: upErr } = await sb.storage
          .from("worksheet-pdfs")
          .upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true });
        if (upErr) return Response.json({ ok: false, error: upErr.message }, { status: 500 });

        const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
        const matterName = payload.caption?.matterName || undefined;
        const amountMonthly = payload.outputs?.allInMonthly
          ? Number(payload.outputs.allInMonthly).toLocaleString("en-US", { maximumFractionDigits: 0 })
          : undefined;
        const a = payload.inputs?.parentALabel || "Parent A";
        const b = payload.inputs?.parentBLabel || "Parent B";
        const dir = payload.outputs?.allInDirection;
        const amountFromLabel =
          dir === "parent_a_to_b" ? `${a} → ${b}` : dir === "parent_b_to_a" ? `${b} → ${a}` : "No transfer";

        const templateData = { matterName, downloadUrl, amountMonthly, amountFromLabel };
        const element = React.createElement(worksheetReadyTemplate.component, templateData);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof worksheetReadyTemplate.subject === "function"
            ? worksheetReadyTemplate.subject(templateData)
            : worksheetReadyTemplate.subject;

        const messageId = crypto.randomUUID();
        await sb.from("email_send_log").insert({
          message_id: messageId,
          template_name: "worksheet-ready",
          recipient_email: order.email,
          status: "pending",
        });
        const { error: enqueueErr } = await sb.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: order.email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: "transactional",
            label: "worksheet-ready",
            idempotency_key: `worksheet-ready-${order.id}`,
            queued_at: new Date().toISOString(),
          },
        });
        if (enqueueErr) return Response.json({ ok: false, error: enqueueErr.message }, { status: 500 });

        await sb
          .from("orders")
          .update({
            status: "delivered",
            pdf_storage_path: storagePath,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        return Response.json({ ok: true, messageId, storagePath });
      },
    },
  },
});
