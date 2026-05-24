import { render } from "@react-email/components";
import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { renderOfficialWorksheetPdf } from "@/lib/pdf/official-worksheet-pdf";
import { renderMSWorksheetPdf } from "@/lib/pdf/ms-worksheet-pdf";
import { template as worksheetReadyTemplate } from "@/lib/email-templates/worksheet-ready";
import { getOrCreateUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";


const SITE_NAME = "TCB Child Support Helper";
const FROM_EMAIL = "noreply@notify.tncsg.tcblaw.org";
const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend";

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

function publicOrigin(fallback: string): string {
  const env = process.env.PUBLIC_SITE_ORIGIN?.trim();
  if (!env) return fallback;
  const withScheme = /^https?:\/\//i.test(env) ? env : `https://${env}`;
  return withScheme.replace(/\/+$/, "");
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: Array<{ filename: string; content: string; content_type: string }>; // base64
  unsubscribeUrl: string;
}

async function sendViaResend(args: SendArgs): Promise<{ ok: boolean; error?: string; response?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY) return { ok: false, error: "LOVABLE_API_KEY not configured" };
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not configured" };

  const body = {
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: args.attachments,
    headers: {
      "List-Unsubscribe": `<${args.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };

  console.log("[resend] sending", {
    to: args.to,
    attachmentCount: args.attachments.length,
    attachmentSizes: args.attachments.map((a) => ({ filename: a.filename, base64Bytes: a.content.length })),
  });

  const res = await fetch(`${RESEND_GATEWAY}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const respText = await res.text().catch(() => "");
  console.log("[resend] response", res.status, respText.slice(0, 500));

  if (!res.ok) {
    return { ok: false, error: `resend ${res.status}: ${respText.slice(0, 300)}`, response: respText };
  }
  return { ok: true, response: respText };
}

function bufToBase64(buf: Uint8Array | ArrayBuffer): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // Worker runtime: Buffer is available via nodejs_compat
  return Buffer.from(u8).toString("base64");
}

/**
 * Idempotently fulfill a paid order: render PDF(s), upload, send email with
 * PDFs attached, mark delivered. Safe to call multiple times — early-returns
 * if already delivered. Branches on payload.state for TN (two PDFs: summary
 * + official AOC) vs MS (single PDF).
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
  let pdfBuf: Uint8Array;
  let officialPdfBuf: Uint8Array | null = null;

  if (state === "MS") {
    pdfBuf = await renderMSWorksheetPdf({
      inputs: payload.inputs,
      outputs: payload.outputs,
      caption: payload.caption,
    });
    const { error: upErr } = await sb.storage
      .from("worksheet-pdfs")
      .upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true });
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };
  } else {
    [pdfBuf, officialPdfBuf] = await Promise.all([
      renderWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
      renderOfficialWorksheetPdf({ inputs: payload.inputs, outputs: payload.outputs, caption: payload.caption }),
    ]);
    officialStoragePath = `${order.id}/worksheet-official.pdf`;
    const [{ error: upErr }, { error: upErrOfficial }] = await Promise.all([
      sb.storage.from("worksheet-pdfs").upload(storagePath, pdfBuf, { contentType: "application/pdf", upsert: true }),
      sb.storage.from("worksheet-pdfs").upload(officialStoragePath, officialPdfBuf!, { contentType: "application/pdf", upsert: true }),
    ]);
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };
    if (upErrOfficial) return { ok: false, error: `upload official: ${upErrOfficial.message}` };
  }


  const linkOrigin = publicOrigin(origin);
  const downloadUrl = `${linkOrigin}/unlock/${order.unlock_token}`;
  const officialDownloadUrl =
    state === "TN" ? `${linkOrigin}/unlock/${order.unlock_token}?variant=official` : undefined;
  const matterName = payload.caption?.matterName || undefined;

  const { amountMonthly, amountFromLabel } = formatAmounts(state, payload);

  const templateData = {
    state,
    matterName,
    downloadUrl,
    officialDownloadUrl,
    amountMonthly,
    amountFromLabel,
    attachmentsIncluded: true,
  };

  const element = React.createElement(worksheetReadyTemplate.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof worksheetReadyTemplate.subject === "function"
      ? worksheetReadyTemplate.subject(templateData)
      : worksheetReadyTemplate.subject;

  const attachments =
    state === "TN" && officialPdfBuf
      ? [
          { filename: "tn-child-support-worksheet-official.pdf", content: bufToBase64(officialPdfBuf) },
          { filename: "tn-child-support-worksheet.pdf", content: bufToBase64(pdfBuf) },
        ]
      : [{ filename: "ms-child-support-worksheet.pdf", content: bufToBase64(pdfBuf) }];

  const messageId = crypto.randomUUID();
  const unsubscribeToken = await getOrCreateUnsubscribeToken(sb, order.email);
  const unsubscribeUrl = `${linkOrigin}/unsubscribe?token=${unsubscribeToken}`;

  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "worksheet-ready",
    recipient_email: order.email,
    status: "pending",
  });

  const sendRes = await sendViaResend({
    to: order.email,
    subject,
    html,
    text,
    attachments,
    unsubscribeUrl,
  });

  if (!sendRes.ok) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "worksheet-ready",
      recipient_email: order.email,
      status: "failed",
      error_message: sendRes.error,
    });
    return { ok: false, error: `send: ${sendRes.error}` };
  }

  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "worksheet-ready",
    recipient_email: order.email,
    status: "sent",
  });

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
 * Re-download PDFs from storage and re-send the worksheet email with
 * attachments (recovery / "resend my worksheet" flow). Does not re-render PDF.
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
  const linkOrigin = publicOrigin(origin);
  const downloadUrl = `${linkOrigin}/unlock/${order.unlock_token}`;
  const officialDownloadUrl =
    state === "TN" ? `${linkOrigin}/unlock/${order.unlock_token}?variant=official` : undefined;
  const matterName = payload.caption?.matterName || undefined;
  const { amountMonthly, amountFromLabel } = formatAmounts(state, payload);

  // Pull PDFs back out of storage.
  const summaryDl = await sb.storage.from("worksheet-pdfs").download(order.pdf_storage_path as string);
  if (summaryDl.error || !summaryDl.data) {
    return { ok: false, error: `download summary: ${summaryDl.error?.message ?? "missing"}` };
  }
  const summaryBuf = new Uint8Array(await summaryDl.data.arrayBuffer());

  let officialBuf: Uint8Array | null = null;
  if (state === "TN" && order.pdf_official_storage_path) {
    const dl = await sb.storage
      .from("worksheet-pdfs")
      .download(order.pdf_official_storage_path as string);
    if (dl.error || !dl.data) {
      return { ok: false, error: `download official: ${dl.error?.message ?? "missing"}` };
    }
    officialBuf = new Uint8Array(await dl.data.arrayBuffer());
  }

  const templateData = {
    state,
    matterName,
    downloadUrl,
    officialDownloadUrl,
    amountMonthly,
    amountFromLabel,
    attachmentsIncluded: true,
  };

  const element = React.createElement(worksheetReadyTemplate.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof worksheetReadyTemplate.subject === "function"
      ? worksheetReadyTemplate.subject(templateData)
      : worksheetReadyTemplate.subject;

  const attachments =
    state === "TN" && officialBuf
      ? [
          { filename: "tn-child-support-worksheet-official.pdf", content: bufToBase64(officialBuf) },
          { filename: "tn-child-support-worksheet.pdf", content: bufToBase64(summaryBuf) },
        ]
      : [{ filename: "ms-child-support-worksheet.pdf", content: bufToBase64(summaryBuf) }];

  const messageId = crypto.randomUUID();
  const unsubscribeToken = await getOrCreateUnsubscribeToken(sb, order.email);
  const unsubscribeUrl = `${linkOrigin}/unsubscribe?token=${unsubscribeToken}`;

  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "worksheet-ready",
    recipient_email: order.email,
    status: "pending",
  });

  const sendRes = await sendViaResend({
    to: order.email,
    subject,
    html,
    text,
    attachments,
    unsubscribeUrl,
  });

  if (!sendRes.ok) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "worksheet-ready",
      recipient_email: order.email,
      status: "failed",
      error_message: sendRes.error,
    });
    return { ok: false, error: `send: ${sendRes.error}` };
  }

  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "worksheet-ready",
    recipient_email: order.email,
    status: "sent",
  });

  return { ok: true, messageId };
}
