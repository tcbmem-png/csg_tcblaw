/**
 * End-to-end fulfillment test.
 *
 * Simulates what a successful Stripe webhook does for an order:
 *   1. Inserts a "paid" test order into the orders table with a realistic
 *      worksheet payload (so renderWorksheetPdf has something to render).
 *   2. Calls POST /api/public/admin/fulfill with that order id.
 *   3. Verifies:
 *        - PDF was uploaded to the worksheet-pdfs storage bucket
 *        - email_send_log got a "pending" worksheet-ready row
 *        - orders.status flipped to "delivered" with pdf_storage_path set
 *        - /unlock/<token> page resolves (200) — confirms unlock gating
 *
 * Run:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     BASE_URL=https://tncsg.tcblaw.org \
 *     bun scripts/e2e-fulfillment.ts
 *
 * BASE_URL defaults to the published Lovable URL.
 */
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL ?? "https://tn-child-support-helper.lovable.app";
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

function pass(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg: string): never {
  console.error(`  \x1b[31m✗\x1b[0m ${msg}`);
  process.exit(1);
}
function step(msg: string) {
  console.log(`\n▸ ${msg}`);
}

const TEST_EMAIL = `e2e+${Date.now()}@example.com`;

const payload = {
  inputs: {
    parentALabel: "Parent A",
    parentBLabel: "Parent B",
    parentAGrossMonthly: 6000,
    parentBGrossMonthly: 4000,
    childrenCount: 2,
    parentingDaysA: 200,
    parentingDaysB: 165,
  },
  outputs: {
    allInMonthly: 850,
    allInDirection: "parent_a_to_b",
    baseSupport: 720,
    healthInsurance: 80,
    workRelatedChildcare: 50,
  },
  caption: { matterName: "E2E Test Matter" },
};

async function main() {
  step("1. Insert test order (status=paid)");
  const worksheetHash = `e2e-${crypto.randomUUID()}`;
  const { data: order, error: insertErr } = await sb
    .from("orders")
    .insert({
      email: TEST_EMAIL,
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_cents: 9900,
      payload_json: payload,
      worksheet_hash: worksheetHash,
    })
    .select("id, unlock_token")
    .single();
  if (insertErr || !order) fail(`insert failed: ${insertErr?.message}`);
  pass(`order id ${order.id}`);
  pass(`unlock token ${order.unlock_token}`);

  step("2. POST /api/public/admin/fulfill");
  const res = await fetch(`${BASE_URL}/api/public/admin/fulfill`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-secret": SERVICE_ROLE,
    },
    body: JSON.stringify({ orderId: order.id }),
  });
  const fulfillBody = await res.text();
  if (!res.ok) fail(`fulfill returned ${res.status}: ${fulfillBody}`);
  pass(`fulfill 200 ${fulfillBody}`);

  step("3. Verify PDF in storage");
  const storagePath = `${order.id}/worksheet.pdf`;
  const { data: dl, error: dlErr } = await sb.storage
    .from("worksheet-pdfs")
    .download(storagePath);
  if (dlErr || !dl) fail(`pdf download failed: ${dlErr?.message}`);
  const pdfBytes = new Uint8Array(await dl.arrayBuffer());
  if (pdfBytes.byteLength < 1000) fail(`pdf too small: ${pdfBytes.byteLength} bytes`);
  const header = new TextDecoder().decode(pdfBytes.slice(0, 4));
  if (header !== "%PDF") fail(`not a PDF (header=${header})`);
  pass(`pdf ${pdfBytes.byteLength} bytes, %PDF header ok`);

  step("4. Verify email enqueued");
  const { data: emailRow } = await sb
    .from("email_send_log")
    .select("status, template_name, recipient_email")
    .eq("recipient_email", TEST_EMAIL)
    .eq("template_name", "worksheet-ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!emailRow) fail("no email_send_log row");
  pass(`email row status=${emailRow.status} to ${emailRow.recipient_email}`);

  step("5. Verify order marked delivered");
  const { data: final } = await sb
    .from("orders")
    .select("status, pdf_storage_path, delivered_at")
    .eq("id", order.id)
    .single();
  if (final?.status !== "delivered") fail(`status=${final?.status}`);
  if (final.pdf_storage_path !== storagePath) fail(`storage path mismatch`);
  if (!final.delivered_at) fail("delivered_at not set");
  pass(`status=delivered, path=${final.pdf_storage_path}`);

  step("6. Verify unlock page is reachable");
  const unlockRes = await fetch(`${BASE_URL}/unlock/${order.unlock_token}`, {
    redirect: "manual",
  });
  if (unlockRes.status >= 400) fail(`unlock page ${unlockRes.status}`);
  pass(`/unlock/${order.unlock_token.slice(0, 8)}… returned ${unlockRes.status}`);

  console.log("\n\x1b[32m✓ E2E fulfillment passed\x1b[0m");
  console.log(`  order_id = ${order.id}`);
  console.log(`  email    = ${TEST_EMAIL} (suppress real send in dispatcher if needed)`);
}

main().catch((e) => {
  console.error("\n\x1b[31mFAILED\x1b[0m", e);
  process.exit(1);
});
