import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/components";
import * as React from "react";
import { Buffer } from "node:buffer";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";
import { renderWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { template as worksheetReadyTemplate } from "@/lib/email-templates/worksheet-ready";
import { getOrCreateUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";

const SITE_NAME = "TN Child Support Helper";
const SENDER_DOMAIN = "notify.tncsg.tcblaw.org";
const FROM_DOMAIN = "notify.tncsg.tcblaw.org";

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

async function fulfillOrder(orderId: string, origin: string) {
  const sb = admin();
  const { data: order, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) {
    console.error("Order not found for fulfillment", orderId, error);
    return;
  }
  if (order.status === "delivered") {
    console.log("Order already delivered, skipping", orderId);
    return;
  }

  // Mark paid first (idempotent).
  await sb
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .neq("status", "delivered");

  // Render PDF from stored payload.
  const payload = order.payload_json as {
    inputs: any;
    outputs: any;
    caption: any;
  };
  const pdfBuf = await renderWorksheetPdf({
    inputs: payload.inputs,
    outputs: payload.outputs,
    caption: payload.caption,
  });

  // Upload to private storage.
  const storagePath = `${order.id}/worksheet.pdf`;
  const { error: upErr } = await sb.storage
    .from("worksheet-pdfs")
    .upload(storagePath, pdfBuf, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (upErr) {
    console.error("Storage upload failed", upErr);
    throw upErr;
  }

  const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
  const matterName =
    (payload.caption?.matterName as string | undefined) || undefined;

  const amountMonthly = payload.outputs?.allInMonthly
    ? Number(payload.outputs.allInMonthly).toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })
    : undefined;
  const a = payload.inputs?.parentALabel || "Parent A";
  const b = payload.inputs?.parentBLabel || "Parent B";
  const dir = payload.outputs?.allInDirection;
  const amountFromLabel =
    dir === "parent_a_to_b"
      ? `${a} → ${b}`
      : dir === "parent_b_to_a"
        ? `${b} → ${a}`
        : "No transfer";

  // Enqueue email via the same pgmq queue the dispatcher drains.
  const templateData = {
    matterName,
    downloadUrl,
    amountMonthly,
    amountFromLabel,
  };
  const element = React.createElement(
    worksheetReadyTemplate.component,
    templateData,
  );
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof worksheetReadyTemplate.subject === "function"
      ? worksheetReadyTemplate.subject(templateData)
      : worksheetReadyTemplate.subject;

  const messageId = crypto.randomUUID();
  const unsubscribeToken = await getOrCreateUnsubscribeToken(sb, order.email);
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
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqueueErr) {
    console.error("Failed to enqueue worksheet email", enqueueErr);
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "worksheet-ready",
      recipient_email: order.email,
      status: "failed",
      error_message: "enqueue failed",
    });
  }

  await sb
    .from("orders")
    .update({
      status: "delivered",
      pdf_storage_path: storagePath,
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  console.log("Order fulfilled", order.id);
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

        try {
          const event = await verifyWebhook(request, env);

          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object;
              const orderId: string | undefined = session.metadata?.order_id;
              if (orderId && session.payment_status === "paid") {
                await fulfillOrder(orderId, origin);
              } else {
                console.log("Session not yet paid or missing order_id", {
                  orderId,
                  paymentStatus: session.payment_status,
                });
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

// Avoid tree-shaking the buffer import on edge.
export const _buf = Buffer;
