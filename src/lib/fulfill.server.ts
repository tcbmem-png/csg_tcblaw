import { render } from "@react-email/components";
import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { renderOfficialWorksheetPdf } from "@/lib/pdf/official-worksheet-pdf";
import { renderMSWorksheetPdf } from "@/lib/pdf/ms-worksheet-pdf";
import { template as worksheetReadyTemplate } from "@/lib/email-templates/worksheet-ready";
import { getOrCreateUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";


const SITE_NAME = "TCB Child Support Helper";
const SENDER_DOMAIN = "notify.tncsg.tcblaw.org";
const FROM_DOMAIN = "notify.tncsg.tcblaw.org";

export interface FulfillResult {
  ok: boolean;
  alreadyDelivered?: boolean;
  storagePath?: string;
  messageId?: string;
  error?: string;
}

type OrderState = "TN" | "MS";

function readState(payload: any): OrderState {
  return payload?.state === "MS" ? "MS" : "TN";
}

/**
 * Idempotently fulfill a paid order: render PDF(s), upload, enqueue email,
 * mark delivered. Safe to call multiple times — early-returns if already
 * delivered. Branches on payload.state for TN (two PDFs: summary + official
 * AOC) vs MS (single PDF).
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

  const payload = order.payload_json as { inputs: any; outputs: any; caption: any; state?: OrderState };
  const state = readState(payload);

  const storagePath = `${order.id}/worksheet.pdf`;
  let officialStoragePath: string | null = null;

  if (state === "MS") {
    const pdfBuf = await renderMSWorksheetPdf({
      inputs: payload.inputs,
      outputs: payload.outputs,
      caption: payload.caption,
    });
    const { error: upErr } = await sb.storage
      .from("worksheet-pdfs")
      .upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true });
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };
  } else {
    const [pdfBuf, officialPdfBuf] = await Promise.all([
      renderWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
      renderOfficialWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
    ]);
    officialStoragePath = `${order.id}/worksheet-official.pdf`;
    const [{ error: upErr }, { error: upErrOfficial }] = await Promise.all([
      sb.storage.from("worksheet-pdfs").upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true }),
      sb.storage.from("worksheet-pdfs").upload(officialStoragePath, officialPdfBuf, { contentType: "application/pdf", upsert: true }),
    ]);
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };
    if (upErrOfficial) return { ok: false, error: `upload official: ${upErrOfficial.message}` };
  }


  const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
  const officialDownloadUrl =
    state === "TN" ? `${origin}/unlock/${order.unlock_token}?variant=official` : undefined;
  const matterName = payload.caption?.matterName || undefined;

  const { amountMonthly, amountFromLabel } = formatAmounts(state, payload);

  const templateData = { state, matterName, downloadUrl, officialDownloadUrl, amountMonthly, amountFromLabel };

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
      pdf_official_storage_path: officialStoragePath,
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id);


  return { ok: true, storagePath, messageId };
}

function formatAmounts(state: OrderState, payload: any) {
  if (state === "MS") {
    const monthly = payload?.outputs?.proposedFinalMonthly;
    return {
      amountMonthly: monthly
        ? Number(monthly).toLocaleString("en-US", { maximumFractionDigits: 0 })
        : undefined,
      amountFromLabel:
        `${payload?.inputs?.obligorLabel || "Obligor"} → ${payload?.inputs?.obligeeLabel || "Obligee"}`,
    };
  }
  const amountMonthly = payload?.outputs?.allInMonthly
    ? Number(payload.outputs.allInMonthly).toLocaleString("en-US", { maximumFractionDigits: 0 })
    : undefined;
  const a = payload?.inputs?.parentALabel || "Parent A";
  const b = payload?.inputs?.parentBLabel || "Parent B";
  const dir = payload?.outputs?.allInDirection;
  const amountFromLabel =
    dir === "parent_a_to_b" ? `${a} → ${b}`
    : dir === "parent_b_to_a" ? `${b} → ${a}`
    : "No transfer";
  return { amountMonthly, amountFromLabel };
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

  const payload = order.payload_json as { inputs: any; outputs: any; caption: any; state?: OrderState };
  const state = readState(payload);
  const downloadUrl = `${origin}/unlock/${order.unlock_token}`;
  const officialDownloadUrl =
    state === "TN" ? `${origin}/unlock/${order.unlock_token}?variant=official` : undefined;
  const matterName = payload.caption?.matterName || undefined;
  const { amountMonthly, amountFromLabel } = formatAmounts(state, payload);

  const templateData = { state, matterName, downloadUrl, officialDownloadUrl, amountMonthly, amountFromLabel };

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
