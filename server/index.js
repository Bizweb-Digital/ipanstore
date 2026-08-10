// ─────────────────────────────────────────────────────────────────────────────
// Backend IPAN STORE — integrasi Cashi.id
//
// Kenapa butuh file ini?
//   API Key Cashi bersifat RAHASIA dan tidak boleh dikirim dari browser.
//   Server kecil ini berjalan di VPS Anda (via SSH Tailscale), memegang API key,
//   lalu meneruskan request create-order ke Cashi dengan aman.
//
// Endpoint yang disediakan:
//   POST /api/create-order   → membuat transaksi pembayaran di Cashi
//   POST /api/cashi-webhook  → menerima notifikasi pembayaran dari Cashi
//   GET  /api/health         → cek server hidup
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

// Kunci Cashi — WAJIB diisi di .env (jangan di-hardcode di sini).
const CASHI_API_KEY = process.env.CASHI_API_KEY || "";
const CASHI_WEBHOOK_SECRET = process.env.CASHI_WEBHOOK_SECRET || "";
const CASHI_BASE_URL = process.env.CASHI_BASE_URL || "https://cashi.id";

if (!CASHI_API_KEY) {
  console.warn("⚠️  CASHI_API_KEY belum diisi di .env — endpoint create-order akan gagal.");
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

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend IPAN STORE jalan di http://localhost:${PORT}`);
  console.log(`   CORS diizinkan untuk: ${ALLOWED_ORIGINS.join(", ")}`);
});
