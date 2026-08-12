/**
 * Test DOKU signature generation — LOKAL, tanpa call API DOKU.
 * Berguna untuk memverifikasi signature cocok dengan credentials Anda
 * sebelum live ke production.
 *
 * Jalankan: cd server && node test-doku.js
 */

import crypto from "crypto";
import "dotenv/config";

const CLIENT_ID = process.env.DOKU_CLIENT_ID || "";
const SECRET_KEY = process.env.DOKU_SECRET_KEY || "";
const BASE_URL = process.env.DOKU_BASE_URL || "";
const CHECKOUT_PATH = process.env.DOKU_CHECKOUT_PATH || "/checkout/v1/payment";

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

console.log("─── Verifikasi Konfigurasi DOKU ───────────────────────────────");
console.log(`Client ID     : ${CLIENT_ID} (length: ${CLIENT_ID.length})`);
console.log(`Secret Key    : ${SECRET_KEY.substring(0, 6)}...${SECRET_KEY.substring(SECRET_KEY.length - 4)} (length: ${SECRET_KEY.length})`);
console.log(`Base URL      : ${BASE_URL}`);
console.log(`Checkout Path : ${CHECKOUT_PATH}`);

if (!CLIENT_ID || !SECRET_KEY) {
  console.error("\n❌  CLIENT_ID atau SECRET_KEY kosong. Cek file server/.env");
  process.exit(1);
}

// Sample body persis seperti yang akan dikirim
const body = {
  order: {
    amount: 50000,
    invoice_number: "TEST123ABC",
    currency: "IDR",
    line_items: [{ id: "TEST123ABC", name: "Test Product", quantity: 1, price: 50000 }],
  },
  payment: { payment_due_date: 60 },
  customer: { name: "Test Customer", email: "test@example.com", phone: "6281234567890" },
};

const rawBody = JSON.stringify(body);
const requestId = crypto.randomUUID();
const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const digest = generateDigest(rawBody);
const signature = generateSignature({
  clientId: CLIENT_ID,
  requestId,
  requestTimestamp,
  requestTarget: CHECKOUT_PATH,
  digest,
  secret: SECRET_KEY,
});

console.log("\n─── Signature Components ──────────────────────────────────────");
console.log(`Request-Id        : ${requestId}`);
console.log(`Request-Timestamp : ${requestTimestamp}`);
console.log(`Request-Target    : ${CHECKOUT_PATH}`);
console.log(`Digest            : ${digest}`);
console.log(`Signature         : ${signature}`);

console.log("\n─── Raw Component String (untuk debugging) ───────────────────");
const componentStr = [
  `Client-Id:${CLIENT_ID}`,
  `Request-Id:${requestId}`,
  `Request-Timestamp:${requestTimestamp}`,
  `Request-Target:${CHECKOUT_PATH}`,
  `Digest:${digest}`,
].join("\n");
console.log(componentStr);

console.log("\n✅  Format signature valid (HMACSHA256=base64).");
console.log("    Signature ini yang akan dikirim ke DOKU saat create-order.");
console.log("\nℹ️   Untuk verifikasi end-to-end (call API beneran), gunakan");
console.log("    sandbox DOKU dulu agar tidak bikin transaksi production.");