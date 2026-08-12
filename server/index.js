// ─────────────────────────────────────────────────────────────────────────────
// Backend IPAN STORE — integrasi Payment Gateway DOKU (DOKU Checkout)
//
// Kenapa butuh file ini?
//   DOKU Checkout butuh header Signature HMAC-SHA256 yang dibuat dari
//   CLIENT_ID + SECRET_KEY. Secret Key bersifat RAHASIA dan tidak boleh
//   dikirim dari browser → semua call ke DOKU harus lewat server ini.
//
// Endpoint yang disediakan:
//   POST /api/doku-create-order → membuat transaksi DOKU Checkout
//   POST /api/doku-webhook      → menerima notifikasi pembayaran dari DOKU
//   GET  /api/health            → cek server hidup
//
// (Endpoint Cashi.id lama tetap dipertahankan sebagai legacy reference.)
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import crypto from "crypto";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3001;

// Domain front-end Anda (untuk CORS). Isi di .env, pisahkan koma bila banyak.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:8080")
  .split(",")
  .map((s) => s.trim());

// ── Kredensial DOKU — WAJIB diisi di .env (jangan di-hardcode di sini) ───────
// Dari Dashboard DOKU → Integrations → API Keys
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || "";
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || "";

// Base URL API DOKU: sandbox https://api-sandbox.doku.com | production https://api.doku.com
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || "https://api-sandbox.doku.com";

// Path endpoint DOKU Checkout (Request-Target untuk signature)
const DOKU_CHECKOUT_PATH = process.env.DOKU_CHECKOUT_PATH || "/checkout/v1/payment";

// URL "Back to merchant" setelah pembayaran (opsional, mis. https://ipanstore.my.id/order)
const DOKU_CALLBACK_URL = process.env.DOKU_CALLBACK_URL || "";

if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
  console.warn("⚠️  DOKU_CLIENT_ID / DOKU_SECRET_KEY belum diisi di .env — endpoint doku-create-order akan gagal.");
}

// ── Helper Signature DOKU (HMAC-SHA256) ──────────────────────────────────────
// Component string:
//   Client-Id:...\nRequest-Id:...\nRequest-Timestamp:...\nRequest-Target:...\nDigest:...
// Digest = base64(sha256(jsonBody))
// Signature = "HMACSHA256=" + base64(hmac_sha256(secretKey, componentString))
function generateDokuDigest(rawBody) {
  return crypto.createHash("sha256").update(rawBody, "utf-8").digest("base64");
}

function generateDokuSignature({ clientId, requestId, requestTimestamp, requestTarget, digest }) {
  const component = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");
  const hmac = crypto.createHmac("sha256", DOKU_SECRET_KEY).update(component).digest("base64");
  return `HMACSHA256=${hmac}`;
}

// Timestamp ISO8601 UTC (tanpa milidetik, sesuai contoh DOKU)
function dokuTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      // Izinkan request tanpa origin (curl/server-to-server) & origin yang terdaftar.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Origin tidak diizinkan oleh CORS"));
    },
  })
);

// Webhook butuh RAW body untuk verifikasi signature → daftarkan SEBELUM express.json()
app.use("/api/cashi-webhook", express.raw({ type: "*/*" }));
app.use("/api/doku-webhook", express.raw({ type: "*/*" }));

// Body parser JSON untuk endpoint lain
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ipanstore-backend", time: new Date().toISOString() });
});

// ── Create Order ─────────────────────────────────────────────────────────────
// Front-end memanggil ini; server meneruskan ke Cashi dengan API key rahasia.
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, order_id, customer_name, customer_email, customer_phone, item_name, description } =
      req.body || {};

    if (!amount || !order_id) {
      return res.status(400).json({ success: false, message: "amount dan order_id wajib diisi." });
    }
    if (!CASHI_API_KEY) {
      return res.status(500).json({ success: false, message: "Server belum dikonfigurasi (API key kosong)." });
    }

    const r = await fetch(`${CASHI_BASE_URL}/api/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CASHI_API_KEY,
      },
      body: JSON.stringify({
        amount,
        order_id,
        customer_name,
        customer_email,
        customer_phone,
        item_name,
        description,
      }),
    });

    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    console.error("create-order error:", e);
    return res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : "Gagal menghubungi Cashi.",
    });
  }
});

// ── Webhook Cashi ────────────────────────────────────────────────────────────
// Cashi memanggil URL ini saat status pembayaran berubah (PAID/EXPIRED/dll).
// Verifikasi signature HMAC-SHA256 memakai WEBHOOK SECRET KEY.
app.post("/api/cashi-webhook", (req, res) => {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["x-cashi-signature"] || req.headers["signature"];
    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);

    if (CASHI_WEBHOOK_SECRET) {
      const expected = crypto.createHmac("sha256", CASHI_WEBHOOK_SECRET).update(rawBody).digest("hex");
      const valid =
        typeof signature === "string" &&
        signature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

      if (!valid) {
        console.warn("⚠️  Webhook signature TIDAK valid — ditolak.");
        return res.status(401).json({ success: false, message: "Invalid signature" });
      }
    } else {
      console.warn("⚠️  CASHI_WEBHOOK_SECRET kosong — webhook diterima TANPA verifikasi (tidak aman).");
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = req.body;
    }

    // TODO: proses order di sini — tandai lunas, kirim WA/email ke pelanggan, dsb.
    console.log("✅ Webhook Cashi diterima:", JSON.stringify(payload));

    return res.json({ success: true });
  } catch (e) {
    console.error("webhook error:", e);
    return res.status(500).json({ success: false });
  }
});

// ── Create Order DOKU Checkout ───────────────────────────────────────────────
// Front-end memanggil endpoint ini. Server menandatangani request dengan
// SECRET_KEY lalu meneruskan ke DOKU. Mengembalikan response.payment.url.
app.post("/api/doku-create-order", async (req, res) => {
  try {
    const { amount, order_id, customer_name, customer_email, customer_phone, item_name } =
      req.body || {};

    if (!amount || !order_id) {
      return res.status(400).json({ success: false, message: "amount dan order_id wajib diisi." });
    }
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server belum dikonfigurasi (DOKU_CLIENT_ID / DOKU_SECRET_KEY kosong).",
      });
    }

    // Invoice number DOKU: hanya alfanumerik (hindari simbol — beberapa channel menolaknya).
    const invoiceNumber = String(order_id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "IPANORDER";

    const requestId = crypto.randomUUID();
    const requestTimestamp = dokuTimestamp();
    const requestTarget = DOKU_CHECKOUT_PATH;

    // Body request DOKU Checkout — pakai parameter dasar yang aman untuk
    // hampir semua channel (VA, QRIS, e-Wallet, Alfamart, dsb).
    const body = {
      order: {
        amount: Number(amount),
        invoice_number: invoiceNumber,
        currency: "IDR",
        ...(DOKU_CALLBACK_URL ? { callback_url: DOKU_CALLBACK_URL, auto_redirect: true } : {}),
        line_items: [
          {
            id: invoiceNumber,
            name: String(item_name || "IPAN STORE Product").slice(0, 255),
            quantity: 1,
            price: Number(amount),
          },
        ],
      },
      payment: {
        payment_due_date: 60,
      },
      customer: {
        name: String(customer_name || "Customer").slice(0, 255),
        ...(customer_email ? { email: String(customer_email).slice(0, 128) } : {}),
        ...(customer_phone ? { phone: String(customer_phone).replace(/[^0-9]/g, "").slice(0, 16) } : {}),
      },
    };

    const rawBody = JSON.stringify(body);
    const digest = generateDokuDigest(rawBody);
    const signature = generateDokuSignature({
      clientId: DOKU_CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget,
      digest,
    });

    const r = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        "Signature": signature,
      },
      body: rawBody,
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      const errMsg =
        (Array.isArray(data.error_messages) && data.error_messages[0]) ||
        (data.message && data.message[0]) ||
        `DOKU error (HTTP ${r.status})`;
      console.error("doku-create-order DOKU error:", JSON.stringify(data));
      return res.status(r.status).json({ success: false, message: errMsg, raw: data });
    }

    const paymentUrl = data?.response?.payment?.url;
    if (!paymentUrl) {
      console.error("doku-create-order: tidak ada payment.url:", JSON.stringify(data));
      return res.status(502).json({
        success: false,
        message: "Respons DOKU tidak berisi URL pembayaran.",
        raw: data,
      });
    }

    console.log(`✅ DOKU order dibuat: ${invoiceNumber} | ${data?.response?.payment?.token_id || ""}`);
    return res.json({ success: true, checkout_url: paymentUrl, raw: data });
  } catch (e) {
    console.error("doku-create-order error:", e);
    return res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : "Gagal menghubungi DOKU.",
    });
  }
});

// ── Webhook DOKU ─────────────────────────────────────────────────────────────
// DOKU memanggil URL ini saat pembayaran berubah status (SUCCESS / FAILED / dll).
// Verifikasi signature memakai CLIENT_ID + SECRET_KEY + Request-Target path ini.
app.post("/api/doku-webhook", (req, res) => {
  try {
    const clientId = req.headers["client-id"];
    const requestId = req.headers["request-id"];
    const requestTimestamp = req.headers["request-timestamp"];
    const signature = (req.headers["signature"] || "").replace(/^HMACSHA256=/i, "");

    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);

    if (!signature || !clientId || !requestTimestamp) {
      return res.status(401).json({ success: false, message: "Header webhook DOKU tidak lengkap." });
    }

    // Request-Target untuk notifikasi = path dari Notification URL itu sendiri.
    const requestTarget = "/api/doku-webhook";

    const digest = generateDokuDigest(rawBody);
    const expectedRaw = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      digest,
    }).replace(/^HMACSHA256=/i, "");

    const valid =
      typeof signature === "string" &&
      signature.length === expectedRaw.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedRaw));

    if (!valid) {
      console.warn("⚠️  Webhook DOKU signature TIDAK valid — ditolak.");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = req.body;
    }

    const status = payload?.transaction?.status;
    const invoice = payload?.order?.invoice_number;
    const amount = payload?.order?.amount;

    // TODO: proses order di sini — tandai lunas, kirim WA/email ke pelanggan, dsb.
    console.log(
      `✅ Webhook DOKU diterima: invoice=${invoice} status=${status} amount=${amount}`
    );

    return res.json({ success: true });
  } catch (e) {
    console.error("doku-webhook error:", e);
    return res.status(500).json({ success: false });
  }
});

// ── Cancel Order DOKU (v3/cancellations) ────────────────────────────────────
// Untuk membatalkan checkout yang belum dibayar. Berguna jika user batal order
// atau stok berubah. Lihat: https://developers.doku.com/.../cancel-order-api.md
app.post("/api/doku-cancel-order", async (req, res) => {
  try {
    const { invoice_number, original_request_id, note } = req.body || {};
    if (!invoice_number || !original_request_id) {
      return res.status(400).json({
        success: false,
        message: "invoice_number dan original_request_id wajib diisi.",
      });
    }
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "Kredensial DOKU kosong." });
    }

    const CANCEL_PATH = "/checkout/v3/cancellations";
    const requestId = crypto.randomUUID();
    const requestTimestamp = dokuTimestamp();

    const body = {
      order: { invoice_number: String(invoice_number) },
      payment: { original_request_id: String(original_request_id) },
      note: String(note || "cancelled by merchant").slice(0, 255),
    };

    const rawBody = JSON.stringify(body);
    const digest = generateDokuDigest(rawBody);
    const signature = generateDokuSignature({
      clientId: DOKU_CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget: CANCEL_PATH,
      digest,
    });

    const r = await fetch(`${DOKU_BASE_URL}${CANCEL_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        "Signature": signature,
      },
      body: rawBody,
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("doku-cancel-order error:", JSON.stringify(data));
      return res.status(r.status).json({ success: false, message: data.message?.[0] || `HTTP ${r.status}`, raw: data });
    }
    console.log(`✅ Order dibatalkan: ${invoice_number}`);
    return res.json({ success: true, raw: data });
  } catch (e) {
    console.error("doku-cancel-order error:", e);
    return res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Gagal." });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend IPAN STORE jalan di http://localhost:${PORT}`);
  console.log(`   CORS diizinkan untuk: ${ALLOWED_ORIGINS.join(", ")}`);
});
