import { render } from "@react-email/components";
import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { renderOfficialWorksheetPdf } from "@/lib/pdf/official-worksheet-pdf";
import { template as worksheetReadyTemplate } from "@/lib/email-templates/worksheet-ready";
import { getOrCreateUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";


const SITE_NAME = "TN Child Support Helper";
const SENDER_DOMAIN = "notify.tncsg.tcblaw.org";
const FROM_DOMAIN = "notify.tncsg.tcblaw.org";

export interface FulfillResult {
  ok: boolean;
  alreadyDelivered?: boolean;
  storagePath?: string;
  messageId?: string;
  error?: string;
}

/**
 * Idempotently fulfill a paid order: render PDF, upload, enqueue email,
 * mark delivered. Safe to call multiple times — early-returns if already
 * delivered.
 */
export async function fulfillOrder(
  sb: SupabaseClient,
  orderId: string,
  origin: string,
): Promise<FulfillResult> {
  const { data: order, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) return { ok: false, error: "order not found" };
  if (order.status === "delivered") {
    return { ok: true, alreadyDelivered: true };
  }

  // Mark paid first (idempotent).
  await sb
    .from("orders")
    .update({ status: "paid", paid_at: order.paid_at ?? new Date().toISOString() })
    .eq("id", orderId)
    .neq("status", "delivered");

  const payload = order.payload_json as { inputs: any; outputs: any; caption: any };
  const [pdfBuf, officialPdfBuf] = await Promise.all([
    renderWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
    renderOfficialWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
  ]);

  const storagePath = `${order.id}/worksheet.pdf`;
  const officialStoragePath = `${order.id}/worksheet-official.pdf`;
  const [{ error: upErr }, { error: upErrOfficial }] = await Promise.all([
    sb.storage.from("worksheet-pdfs").upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true }),
    sb.storage.from("worksheet-pdfs").upload(officialStoragePath, officialPdfBuf, { contentType: "application/pdf", upsert: true }),
  ]);
  if (upErr) return { ok: false, error: `upload: ${upErr.message}` };
  if (upErrOfficial) return { ok: false, error: `upload official: ${upErrOfficial.message}` };


  const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
  const officialDownloadUrl = `${origin}/unlock/${order.unlock_token}?variant=official`;
  const matterName = payload.caption?.matterName || undefined;
  const amountMonthly = payload.outputs?.allInMonthly
    ? Number(payload.outputs.allInMonthly).toLocaleString("en-US", { maximumFractionDigits: 0 })
    : undefined;
  const a = payload.inputs?.parentALabel || "Parent A";
  const b = payload.inputs?.parentBLabel || "Parent B";
  const dir = payload.outputs?.allInDirection;
  const amountFromLabel =
    dir === "parent_a_to_b" ? `${a} → ${b}`
    : dir === "parent_b_to_a" ? `${b} → ${a}`
    : "No transfer";

  const templateData = { matterName, downloadUrl, officialDownloadUrl, amountMonthly, amountFromLabel };

  const element = React.createElement(worksheetReadyTemplate.component, templateData);
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
      idempotency_key: `worksheet-ready-${order.id}-${Date.now()}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqueueErr) {
    return { ok: false, error: `enqueue: ${enqueueErr.message}` };
  }

  await sb
    .from("orders")
    .update({
      status: "delivered",
      pdf_storage_path: storagePath,
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return { ok: true, storagePath, messageId };
}

/**
 * Enqueue a worksheet-ready email for an already-delivered order
 * (recovery / "resend my worksheet" flow). Does not re-render PDF.
 */
export async function resendWorksheetEmail(
  sb: SupabaseClient,
  orderId: string,
  origin: string,
): Promise<FulfillResult> {
  const { data: order } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "order not found" };
  if (order.status !== "delivered" || !order.pdf_storage_path) {
    return { ok: false, error: "order not yet delivered" };
  }

  const payload = order.payload_json as { inputs: any; outputs: any; caption: any };
  const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
  const matterName = payload.caption?.matterName || undefined;
  const amountMonthly = payload.outputs?.allInMonthly
    ? Number(payload.outputs.allInMonthly).toLocaleString("en-US", { maximumFractionDigits: 0 })
    : undefined;
  const a = payload.inputs?.parentALabel || "Parent A";
  const b = payload.inputs?.parentBLabel || "Parent B";
  const dir = payload.outputs?.allInDirection;
  const amountFromLabel =
    dir === "parent_a_to_b" ? `${a} → ${b}`
    : dir === "parent_b_to_a" ? `${b} → ${a}`
    : "No transfer";

  const templateData = { matterName, downloadUrl, amountMonthly, amountFromLabel };
  const element = React.createElement(worksheetReadyTemplate.component, templateData);
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
      label: "worksheet-ready-resend",
      idempotency_key: `worksheet-resend-${order.id}-${Date.now()}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqueueErr) return { ok: false, error: `enqueue: ${enqueueErr.message}` };

  return { ok: true, messageId };
}
