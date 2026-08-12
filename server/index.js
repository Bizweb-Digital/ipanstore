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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, "orders.json");

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

// URL webhook untuk menerima notifikasi pembayaran dari DOKU.
// Dikirim per-transaksi via additional_info.override_notification_url,
// sehingga tidak perlu set manual di Dashboard DOKU.
const DOKU_NOTIFICATION_URL = process.env.DOKU_NOTIFICATION_URL || "";

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

// ── Penyimpanan Order (JSON file ringan) ────────────────────────────────────
// Menyimpan data order di server/orders.json (tidak memakai DB eksternal).
// Tiap order: invoice_number, data pembeli, item, status, email_sent.
const ordersStore = {
  file: ORDERS_FILE,
  data: {},
  load() {
    try {
      if (fs.existsSync(this.file)) {
        this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
      }
    } catch (e) {
      console.warn("⚠️  Gagal baca orders.json:", e.message);
      this.data = {};
    }
  },
  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("⚠️  Gagal tulis orders.json:", e.message);
    }
  },
  get(invoice) {
    return this.data[invoice] || null;
  },
  set(invoice, val) {
    this.data[invoice] = val;
    this.save();
  },
};
ordersStore.load();

// ── Email otomatis (nodemailer + SMTP Gmail / provider lain) ────────────────
// Konfigurasi di .env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || `IPAN STORE <${SMTP_USER}>`;

// Link Google Drive produk SettinX (dari .env, tidak di-hardcode)
const SETTINX_DOWNLOAD_URL =
  process.env.SETTINX_DOWNLOAD_URL ||
  "https://drive.google.com/drive/folders/1oB2BIILhM-xrgseTw7yYSYwxurLayTvq?usp=sharing";

const emailTransporter = SMTP_USER
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

/** Kirim email produk SettinX + invoice. Mengembalikan {ok, error?}. */
async function sendSettinXEmail({ to, customerName, invoiceNumber, amount, paidAt }) {
  if (!emailTransporter) return { ok: false, error: "SMTP belum dikonfigurasi (SMTP_USER kosong)." };
  if (!to) return { ok: false, error: "Email pembeli kosong." };

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

  const paidLabel = paidAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(paidAt))
    : new Date().toLocaleString("id-ID");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0f0f10;color:#e4e4e7;border-radius:12px;overflow:hidden;border:1px solid #27272a">
    <div style="background:linear-gradient(135deg,#18181b,#3f3f46);padding:28px 32px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">IPAN <span style="color:#a1a1aa">STORE</span></div>
      <div style="font-size:12px;color:#a1a1aa;margin-top:2px">Payment Confirmation</div>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:16px;font-weight:600;margin:0 0 4px">Halo, ${escapeHtml(customerName || "Pelanggan")} 👋</p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px">Terima kasih atas pembelian Anda. Pembayaran telah kami terima ✅</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">No. Invoice</td>
          <td style="padding:8px 0;text-align:right;font-family:monospace">${escapeHtml(invoiceNumber || "-")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">Produk</td>
          <td style="padding:8px 0;text-align:right">IPAN APP SettinX V1</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">Status</td>
          <td style="padding:8px 0;text-align:right;color:#4ade80;font-weight:600">LUNAS</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">Total Dibayar</td>
          <td style="padding:8px 0;text-align:right;font-size:16px;font-weight:800;color:#f4f4f5">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">Waktu</td>
          <td style="padding:8px 0;text-align:right">${escapeHtml(paidLabel)}</td>
        </tr>
      </table>

      <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:18px 20px;margin:22px 0">
        <div style="font-weight:700;margin-bottom:6px">📦 Download IPAN APP SettinX V1</div>
        <div style="font-size:13px;color:#a1a1aa;margin-bottom:12px">Klik tombol di bawah untuk mengunduh aplikasi (.exe) beserta tutorial penggunaannya.</div>
        <a href="${SETTINX_DOWNLOAD_URL}" style="display:inline-block;background:#f4f4f5;color:#18181b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">⬇️ Download SettinX V1</a>
      </div>

      <p style="font-size:12px;color:#71717a;line-height:1.6">
        Jika tombol tidak berfungsi, salin tautan berikut:<br/>
        <a href="${SETTINX_DOWNLOAD_URL}" style="color:#a1a1aa;word-break:break-all">${SETTINX_DOWNLOAD_URL}</a>
      </p>

      <p style="font-size:12px;color:#71717a;margin-top:24px;border-top:1px solid #27272a;padding-top:16px">
        Untuk bantuan &amp; aktivasi lisensi, hubungi kami via WhatsApp di website IPAN STORE.<br/>
        © ${new Date().getFullYear()} IPAN STORE
      </p>
    </div>
  </div>`;

  try {
    await emailTransporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: `✅ Pembayaran Diterima — Download IPAN APP SettinX V1 (${invoiceNumber || ""})`,
      html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** Escape HTML sederhana agar input user aman. */
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
      // Webhook URL dikirim per-transaksi (override) — tidak perlu set manual
      // di Dashboard DOKU. DOKU akan POST notifikasi status ke URL ini.
      ...(DOKU_NOTIFICATION_URL
        ? { additional_info: { override_notification_url: DOKU_NOTIFICATION_URL } }
        : {}),
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

    // Simpan data order sebelum dikirim ke pembeli (untuk kirim email saat lunas)
    ordersStore.set(invoiceNumber, {
      invoice_number: invoiceNumber,
      amount: Number(amount),
      item_name: String(item_name || "IPAN STORE Product"),
      customer_name: String(customer_name || ""),
      customer_email: String(customer_email || ""),
      customer_phone: String(customer_phone || ""),
      status: "PENDING",
      token_id: data?.response?.payment?.token_id || "",
      created_at: new Date().toISOString(),
      email_sent: false,
      email_sent_at: null,
    });

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
app.post("/api/doku-webhook", async (req, res) => {
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

    console.log(
      `✅ Webhook DOKU diterima: invoice=${invoice} status=${status} amount=${amount}`
    );

    // ── Proses order saat pembayaran SUCCESS ─────────────────────────────
    if (status === "SUCCESS") {
      const order = ordersStore.get(invoice);
      if (!order) {
        // Order tidak ada di store — buat minimal dari payload webhook.
        console.warn(`⚠️  Webhook SUCCESS untuk invoice tak dikenal: ${invoice}`);
      } else {
        // Tandai lunas
        order.status = "PAID";
        order.paid_at = new Date().toISOString();
        order.webhook_payload = payload;
        ordersStore.set(invoice, order);

        // Kirim email otomatis HANYA untuk paket IPAN APP SettinX V1
        const isSettinX =
          /settinx/i.test(order.item_name || "") || /settinx/i.test(order.invoice_number || "");

        if (isSettinX && order.customer_email && !order.email_sent) {
          console.log(`📧 Mengirim email SettinX ke ${order.customer_email} (invoice ${invoice})...`);
          const result = await sendSettinXEmail({
            to: order.customer_email,
            customerName: order.customer_name,
            invoiceNumber: invoice,
            amount: order.amount || amount,
            paidAt: order.paid_at,
          });

          if (result.ok) {
            order.email_sent = true;
            order.email_sent_at = new Date().toISOString();
            ordersStore.set(invoice, order);
            console.log(`📧 Email SettinX TERKIRIM: ${order.customer_email} (invoice ${invoice})`);
          } else {
            console.error(`📧 Email SettinX GAGAL ke ${order.customer_email}: ${result.error}`);
          }
        } else if (isSettinX) {
          console.warn(`⚠️  SettinX SUCCESS tapi email tidak dikirim: email_sent=${order.email_sent}, email=${order.customer_email || "KOSONG"}`);
        }
      }
    }

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
