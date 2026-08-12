/**
 * Test end-to-end DOKU API call (PRODUCTION).
 * Membuat 1 transaksi Rp 100, verifikasi signature cocok, lalu cancel.
 *
 * Jalankan: cd server && node test-doku-e2e.js
 */

import crypto from "crypto";
import "dotenv/config";

const CLIENT_ID = process.env.DOKU_CLIENT_ID;
const SECRET_KEY = process.env.DOKU_SECRET_KEY;
const BASE_URL = process.env.DOKU_BASE_URL || "https://api.doku.com";
const CHECKOUT_PATH = process.env.DOKU_CHECKOUT_PATH || "/checkout/v1/payment";
const CANCEL_PATH = "/checkout/v1/payment/cancel";

function generateDigest(rawBody) {
  return crypto.createHash("sha256").update(rawBody, "utf-8").digest("base64");
}
function generateSignature({ clientId, requestId, requestTimestamp, requestTarget, digest, secret }) {
  const component = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");
  const hmac = crypto.createHmac("sha256", secret).update(component).digest("base64");
  return `HMACSHA256=${hmac}`;
}

console.log("═══ DOKU PRODUCTION End-to-End Test ═══");
console.log(`Client ID : ${CLIENT_ID}`);
console.log(`Base URL  : ${BASE_URL}\n`);

// ── Step 1: Create order Rp 100 ────────────────────────────────────────────
const invoiceNumber = `TEST${Date.now()}`;
const body = {
  order: {
    amount: 100,
    invoice_number: invoiceNumber,
    currency: "IDR",
    line_items: [{ id: invoiceNumber, name: "Test Item", quantity: 1, price: 100 }],
  },
  payment: { payment_due_date: 60 },
  customer: { name: "Test Customer", email: "test@example.com", phone: "6281234567890" },
};

const rawBody = JSON.stringify(body);
const requestId = crypto.randomUUID();
const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const digest = generateDigest(rawBody);
const signature = generateSignature({
  clientId: CLIENT_ID, requestId, requestTimestamp, requestTarget: CHECKOUT_PATH, digest, secret: SECRET_KEY,
});

console.log(`[1] Membuat order Rp 100 (invoice: ${invoiceNumber})...`);
const createRes = await fetch(`${BASE_URL}${CHECKOUT_PATH}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Client-Id": CLIENT_ID,
    "Request-Id": requestId,
    "Request-Timestamp": requestTimestamp,
    "Signature": signature,
  },
  body: rawBody,
});

const createData = await createRes.json().catch(() => ({}));

if (!createRes.ok) {
  console.error(`❌ GAGAL (HTTP ${createRes.status})`);
  console.error(JSON.stringify(createData, null, 2));
  process.exit(1);
}

const paymentUrl = createData?.response?.payment?.url;
const tokenId = createData?.response?.payment?.token_id;

console.log(`✅ BERHASIL — HTTP ${createRes.status}`);
console.log(`   Payment URL : ${paymentUrl}`);
console.log(`   Token ID    : ${tokenId}\n`);

// ── Step 2: Cancel order ────────────────────────────────────────────────────
console.log(`[2] Membatalkan order ${invoiceNumber}...`);
const cancelId = crypto.randomUUID();
const cancelTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const cancelBody = JSON.stringify({});
const cancelDigest = generateDigest(cancelBody);
const cancelSig = generateSignature({
  clientId: CLIENT_ID,
  requestId: cancelId,
  requestTimestamp: cancelTimestamp,
  requestTarget: CANCEL_PATH,
  digest: cancelDigest,
  secret: SECRET_KEY,
});

const cancelRes = await fetch(`${BASE_URL}${CANCEL_PATH}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Client-Id": CLIENT_ID,
    "Request-Id": cancelId,
    "Request-Timestamp": cancelTimestamp,
    "Signature": cancelSig,
  },
  body: cancelBody,
});

const cancelData = await cancelRes.json().catch(() => ({}));
console.log(`   HTTP ${cancelRes.status}`);
console.log(`   Response: ${JSON.stringify(cancelData).substring(0, 200)}`);

if (cancelRes.ok) {
  console.log(`\n✅ Order ${invoiceNumber} berhasil di-cancel.`);
} else {
  console.log(`\n⚠️  Cancel mungkin gagal (cek dashboard DOKU). Order kecil Rp100, dampaknya minimal.`);
}

console.log("\n═══ Selesai. Cek dashboard.doku.com → Transactions untuk konfirmasi. ═══");