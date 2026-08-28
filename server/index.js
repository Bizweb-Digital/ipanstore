// ─────────────────────────────────────────────────────────────────────────────
// Backend IPAN STORE — integrasi Payment Gateway DOKU (DOKU Checkout) & KlikQris (QRIS Dinamis)
//
// Kenapa butuh file ini?
//   DOKU Checkout butuh header Signature HMAC-SHA256 yang dibuat dari
//   CLIENT_ID + SECRET_KEY. Secret Key bersifat RAHASIA dan tidak boleh
//   dikirim dari browser → semua call ke DOKU harus lewat server ini.
//
// Endpoint yang disediakan:
//   POST /api/klikqris-create-order → membuat transaksi QRIS KlikQris (QR tampil di halaman order)
//   POST /api/klikqris-webhook      → menerima notifikasi PAID/EXPIRED dari KlikQris
//   GET  /api/klikqris-status/:orderId → polling status transaksi (fallback webhook)
//   POST /api/doku-create-order → membuat transaksi DOKU Checkout (fallback kanal lain)
//   POST /api/doku-webhook      → menerima notifikasi pembayaran dari DOKU
//   GET  /api/health            → cek server hidup
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import {
  assignSettinxLicense,
  findExistingLicense,
  initSettinxFirebase,
} from "./lib/settinxLicense.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// SECURITY FIX #8 — origin berada di belakang Cloudflare Tunnel (cloudflared).
// Express harus memercayai hop pertama proxy agar `req.ip` berisi IP pengunjung
// asli (bukan 127.0.0.1 cloudflared). Tanpa ini, rate limiter "melihat" semua
// pengunjung sebagai IP yang sama → semua pengunjung share satu bucket (self-DoS).
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Domain front-end Anda (untuk CORS). Isi di .env, pisahkan koma bila banyak.
let ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:8080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// SECURITY FIX #7 — tolak wildcard "*" agar tidak jadi open CORS.
// Jika .env terisi "*", kita saring dan fallback ke localhost (fail-closed).
if (ALLOWED_ORIGINS.includes("*")) {
  console.warn('⚠️ SECURITY: ALLOWED_ORIGINS mengandung "*" — wildcard ditolak. Pakai daftar domain spesifik (mis. https://ipanstore.id). Fallback ke localhost.');
  ALLOWED_ORIGINS = ALLOWED_ORIGINS.filter((o) => o !== "*");
  if (ALLOWED_ORIGINS.length === 0) ALLOWED_ORIGINS = ["http://localhost:8080"];
}

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

// URL "Back to merchant" setelah pembayaran (opsional, mis. https://ipanstore.id/order)
const DOKU_CALLBACK_URL = process.env.DOKU_CALLBACK_URL || "";

if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
  console.warn("⚠️  DOKU_CLIENT_ID / DOKU_SECRET_KEY belum diisi di .env — endpoint doku-create-order akan gagal.");
}

// ── Kredensial KlikQris (Payment Gateway QRIS Dinamis) ───────────────────────
// Dari dashboard KlikQris: https://klikqris.com/dokumentasi (Login) → Kredensial API.
const KLIKQRIS_API_KEY = process.env.KLIKQRIS_API_KEY || "";
// id_merchant juga dikirim sebagai header sesuai dokumentasi.
const KLIKQRIS_ID_MERCHANT = process.env.KLIKQRIS_ID_MERCHANT || "";
// Base URL API KlikQris (dokumentasi: https://klikqris.com/api)
const KLIKQRIS_BASE_URL = process.env.KLIKQRIS_BASE_URL || "https://klikqris.com/api";
// Callback/notification URL webhook (dikirim per-transaksi via callback_url).
const KLIKQRIS_CALLBACK_URL = process.env.KLIKQRIS_CALLBACK_URL || "";

if (!KLIKQRIS_API_KEY || !KLIKQRIS_ID_MERCHANT) {
  console.warn("⚠️  KLIKQRIS_API_KEY / KLIKQRIS_ID_MERCHANT belum diisi di .env — endpoint klikqris-create-order akan gagal.");
}
if (!KLIKQRIS_CALLBACK_URL) {
  console.warn("⚠️  KLIKQRIS_CALLBACK_URL belum diisi di .env — webhook KlikQris harus diset manual di dashboard (pengaturan global) agar order bisa dikonfirmasi lunas.");
}

// ── Polyfill WebSocket global (Node < 22) untuk @supabase/realtime-js ──────
// Node 20 tidak punya global WebSocket; supabase-js v2 butuh ini saat createClient().
import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

// ── Supabase client (Service Role — bypass RLS, hanya dipakai di server) ────
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

if (!supabase) {
  console.warn("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env — order tidak akan tersimpan ke database.");
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

// ── Penyimpanan Order (Supabase) ────────────────────────────────────────────
// Orders disimpan di tabel `orders` Supabase.
// Fallback ke in-memory map jika Supabase belum dikonfigurasi (dev/testing).
const ordersFallback = new Map();

// ── Webhook replay protection (in-memory + DB persist) ──────────────────────
// Simpan requestId DOKU yang sudah diproses (TTL 24 jam). Tanpa ini, attacker
// bisa replay webhook SUCCESS yang valid berulang kali → double email / state.
//
// SECURITY FIX #9 — dua lapis proteksi:
//   1. inFlightWebhooks (Set): requestId yang SEDANG diproses → cegah
//      concurrent duplicate webhook memproses dua kali sekaligus.
//   2. processedWebhooks (Map) + tabel Supabase `webhook_replays`: requestId
//      yang SUDAH selesai diproses → cegah replay (tahan restart server).
//
// Penting: markWebhookProcessed() dipanggil SETELAH proses sukses, bukan
// sebelum. Jika proses gagal (throw), DOKU akan retry dan kami tidak
// menandainya sebagai processed → order tidak hilang.
const processedWebhooks = new Map(); // requestId -> timestamp ms
const inFlightWebhooks = new Set(); // requestId sedang diproses (anti concurrent)
const WEBHOOK_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const WEBHOOK_MAX_AGE_MS = 15 * 60 * 1000; // 15 menit — tolok stale timestamp

async function isWebhookProcessed(requestId) {
  if (!requestId) return false;
  // Cek memory dulu (cepat)
  const ts = processedWebhooks.get(requestId);
  if (ts != null) {
    if (Date.now() - ts > WEBHOOK_TTL_MS) {
      processedWebhooks.delete(requestId);
      return false;
    }
    return true;
  }
  // Memory miss → cek DB (tahan restart). Webhook jarang, query DB OK.
  if (supabase && requestId.length <= 64) {
    try {
      const { data } = await supabase
        .from("webhook_replays")
        .select("request_id")
        .eq("request_id", requestId)
        .maybeSingle();
      if (data?.request_id) {
        processedWebhooks.set(requestId, Date.now());
        return true;
      }
    } catch {
      // Tabel belum ada / error → fallback ke in-memory saja (non-fatal).
    }
  }
  return false;
}

async function markWebhookProcessed(requestId) {
  if (!requestId) return;
  processedWebhooks.set(requestId, Date.now());
  // Persist ke DB agar tahan restart server
  if (supabase && requestId.length <= 64) {
    try {
      await supabase
        .from("webhook_replays")
        .upsert(
          { request_id: requestId, processed_at: new Date().toISOString() },
          { onConflict: "request_id" }
        );
    } catch {
      // Non-fatal — replay protection tetap jalan via memory.
    }
  }
  // Bersihkan entri lama tiap 100 inserts (ringan, tanpa setInterval)
  if (processedWebhooks.size > 500) {
    const cutoff = Date.now() - WEBHOOK_TTL_MS;
    for (const [k, v] of processedWebhooks) if (v < cutoff) processedWebhooks.delete(k);
  }
}

// Constants untuk email tracking
const ORDER_DEFAULTS = {
  email_sent: false,
  email_sent_at: null,
};

/**
 * Simpan order baru ke Supabase (atau fallback).
 * @param {object} order
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
async function saveOrder(order) {
  if (!supabase) {
    ordersFallback.set(order.invoice_number, { ...ORDER_DEFAULTS, ...order });
    return { ok: true, data: order };
  }

  // Upsert berdasarkan invoice_number (unique)
  const { data, error } = await supabase
    .from("orders")
    .upsert({ ...ORDER_DEFAULTS, ...order }, { onConflict: "invoice_number" })
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase saveOrder error:", error.message);
    // Fallback agar tidak hilang
    ordersFallback.set(order.invoice_number, { ...ORDER_DEFAULTS, ...order });
    return { ok: false, error: error.message };
  }
  return { ok: true, data };
}

/**
 * Ambil order berdasarkan invoice_number.
 * @param {string} invoice
 * @returns {Promise<object|null>}
 */
async function getOrder(invoice) {
  if (!supabase) {
    return ordersFallback.get(invoice) || null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("invoice_number", invoice)
    .single();

  if (error) {
    // Cek fallback
    return ordersFallback.get(invoice) || null;
  }
  return data;
}

/**
 * Update order berdasarkan invoice_number.
 * @param {string} invoice
 * @param {object} updates
 */
async function updateOrder(invoice, updates) {
  if (!supabase) {
    const existing = ordersFallback.get(invoice);
    if (existing) {
      ordersFallback.set(invoice, { ...existing, ...updates });
    }
    return { ok: !!existing };
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("invoice_number", invoice);

  if (error) {
    console.error("❌ Supabase updateOrder error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Resolve service_id dari item_name.
 * Frontend mengirim format "IPAN STORE - ${selected.name}" (lihat src/pages/Order.tsx)
 * Contoh: "IPAN STORE - SET PC", "IPAN STORE - ELITE", "IPAN STORE - IPAN APP SettinX V1"
 * @param {string} itemName
 * @returns {Promise<string|null>}
 */
async function resolveServiceId(itemName) {
  if (!supabase || !itemName) return null;

  // Strip prefix "IPAN STORE - " jika ada
  const cleanName = String(itemName).replace(/^IPAN STORE\s*-\s*/i, "").trim();
  if (!cleanName) return null;

  // 1. Coba exact match nama service
  let { data } = await supabase
    .from("services")
    .select("id")
    .ilike("name", cleanName)
    .limit(1)
    .single();

  if (data?.id) return data.id;

  // 2. Coba partial match (untuk kasus nama beda kapitalisasi/spasi)
  ({ data } = await supabase
    .from("services")
    .select("id")
    .ilike("name", `%${cleanName}%`)
    .limit(1)
    .single());

  if (data?.id) return data.id;

  // 3. Coba match via slug (untuk kasus "settinx" → "app-settinx")
  if (/settinx/i.test(cleanName)) {
    ({ data } = await supabase
      .from("services")
      .select("id")
      .eq("slug", "app-settinx")
      .limit(1)
      .single());
    if (data?.id) return data.id;
  }

  return null;
}

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

/**
 * Buat kartu kredensial login SettinX untuk email (ada isi → tampilkan; kosong → null).
 */
function credentialsCardHtml(credentials) {
  if (!credentials?.username || !credentials?.password || !credentials?.licenseKey) return "";
  const row = (label, value) =>
    `<tr>
      <td style="padding:6px 0;color:#a1a1aa;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 0;text-align:right;font-family:monospace;font-size:13px;font-weight:600;word-break:break-all">${escapeHtml(value)}</td>
    </tr>`;
  return `
    <div style="background:#0c0c0d;border:1px solid #3f3f46;border-radius:10px;padding:18px 20px;margin:22px 0">
      <div style="font-weight:700;margin-bottom:4px">🔐 Kredensial Login IPAN APP SettinX V1</div>
      <div style="font-size:12px;color:#a1a1aa;margin-bottom:10px">Gunakan kredensial ini untuk login pada aplikasi setelah di-download:</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${row("Username (Email)", credentials.username)}
        ${row("Password", credentials.password)}
        ${row("License Key", credentials.licenseKey)}
      </table>
      <div style="font-size:11px;color:#71717a;margin-top:10px;border-top:1px solid #27272a;padding-top:8px">
        ⚠️ Simpan kredensial ini baik-baik. Jangan pernah membagikannya kepada orang lain. Satu lisensi hanya untuk satu perangkat.
      </div>
    </div>`;
}

/** Kirim email produk SettinX + invoice. Mengembalikan {ok, error?}. */
async function sendSettinXEmail({ to, customerName, invoiceNumber, amount, paidAt, credentials }) {
  if (!emailTransporter) return { ok: false, error: "SMTP belum dikonfigurasi (SMTP_USER kosong)." };
  // SECURITY FIX #10 — validasi email pembeli & sanitize semua input user
  // sebelum masuk ke header email (anti header injection / BCC spam).
  const safeTo = String(to ?? "").trim();
  if (!isValidEmail(safeTo)) {
    return { ok: false, error: "Format email pembeli tidak valid." };
  }
  const safeName = sanitizeForHeader(customerName, 100);
  const safeInvoice = sanitizeForHeader(invoiceNumber, 64);

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
      <p style="font-size:16px;font-weight:600;margin:0 0 4px">Halo, ${escapeHtml(safeName || "Pelanggan")} 👋</p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px">Terima kasih atas pembelian Anda. Pembayaran telah kami terima ✅</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#a1a1aa">No. Invoice</td>
          <td style="padding:8px 0;text-align:right;font-family:monospace">${escapeHtml(safeInvoice || "-")}</td>
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

      ${credentialsCardHtml(credentials)}

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
      to: safeTo,
      subject: `✅ Pembayaran Diterima — Download IPAN APP SettinX V1 (${safeInvoice || ""})`,
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * SECURITY FIX #10 — validasi alamat email pembeli sebelum dikirim.
 * Mencegah email header injection (attacker sisipkan \r\n untuk BCC massal
 * atau ubah recipient). Hanya izinkan 1 alamat email standar.
 */
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
function isValidEmail(addr) {
  if (typeof addr !== "string") return false;
  const s = addr.trim();
  // Tolak CR/LF (header injection), panjang wajar, format email dasar.
  if (/[\r\n<>]/.test(s)) return false;
  if (s.length < 5 || s.length > 254) return false;
  return EMAIL_RE.test(s);
}

/**
 * Sanitize string untuk dipakai di header email (Subject, nama recipient).
 * Buang CR/LF & kontrol char, potong panjang. Mencegah header injection.
 */
function sanitizeForHeader(s, maxLen = 200) {
  return String(s ?? "")
    .replace(/[\r\n\0]/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
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
app.use("/api/klikqris-webhook", express.raw({ type: "application/json" }));
app.use("/api/doku-webhook", express.raw({ type: "*/*" }));

// Body parser JSON untuk endpoint lain
app.use(express.json());

// ── Rate Limiting Middleware ─────────────────────────────────────────────────
// Proteksi abuse: enumeration promo, spam order, brute force.
// Keyed by IP (req.ip). Standard RateLimit headers dikirim ke client.
// SECURITY FIX #8 — pakai IP pengunjung asli. Cloudflare Tunnel menambahkan
// CF-Connecting-IP; kalau header itu ada, kita pakai (anti sesama-pengunjung
// share bucket). Fallback ke req.ip (sudah benar berkat trust proxy = 1).
function ipKeyGenerator(req) {
  const cfIp = req.headers?.["cf-connecting-ip"];
  return typeof cfIp === "string" && cfIp.trim()
    ? cfIp.trim()
    : req.ip || req.socket?.remoteAddress || "unknown";
}
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // max 100 request / 15 menit / IP untuk semua endpoint umum
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
});

const promoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // max 30 validasi promo / 15 menit / IP — anti enumeration
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak pengecekan promo. Coba lagi dalam beberapa menit." },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // max 10 order / jam / IP
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Batas pembuatan order tercapai. Silakan coba lagi nanti." },
});

app.use("/api/", apiLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ipanstore-backend", time: new Date().toISOString() });
});

// ── Create Order KlikQris ─────────────────────────────────────────────────────
// Front-end memanggil ini; server meneruskan ke KlikQris dengan API key rahasia.
app.post("/api/klikqris-create-order", orderLimiter, async (req, res) => {
  try {
    const { amount, order_id, customer_name, customer_email, customer_phone, item_name, promo_code } =
      req.body || {};

    if (!amount || !order_id) {
      return res.status(400).json({ success: false, message: "amount dan order_id wajib diisi." });
    }
    if (!KLIKQRIS_API_KEY || !KLIKQRIS_ID_MERCHANT) {
      return res.status(500).json({
        success: false,
        message: "Server belum dikonfigurasi (KLIKQRIS_API_KEY / KLIKQRIS_ID_MERCHANT kosong).",
      });
    }

    // SECURITY FIX #4 — jangan percaya `amount` dari client (bisa di-tamper via DevTools/Burp).
    // Harga authoritative diambil dari tabel `services` berdasarkan `item_name`.
    let basePrice = Number(amount);
    if (supabase && item_name) {
      const clean = String(item_name).replace(/^IPAN STORE\s*-\s*/i, "").trim();
      if (clean) {
        let svcPrice = null;
        let { data: svc } = await supabase
          .from("services")
          .select("price")
          .ilike("name", clean)
          .limit(1)
          .maybeSingle();
        if (svc?.price != null) {
          svcPrice = Number(svc.price);
        } else {
          ({ data: svc } = await supabase
            .from("services")
            .select("price")
            .ilike("name", `%${clean}%`)
            .limit(1)
            .maybeSingle());
          if (svc?.price != null) svcPrice = Number(svc.price);
        }
        if (svcPrice == null) {
          console.warn(`⚠️ Service tidak ditemukan untuk "${clean}" — pakai amount client sementara.`);
        } else {
          basePrice = svcPrice;
        }
      }
    }
    // Guard: jangan izinkan pembayaran di bawah 1.000 IDR (anti tamper 0/1 rupiah)
    if (basePrice < 1000 || !Number.isFinite(basePrice)) {
      return res.status(400).json({ success: false, message: "Nominal pembayaran tidak valid." });
    }

    let finalAmount = basePrice;
    let appliedPromo = null;
    let discountAmount = 0;
    const promo_code_clean = String(promo_code || "").trim().toUpperCase();
    if (promo_code_clean) {
      const promo = await validateAndApplyPromo(promo_code_clean, basePrice);
      if (!promo.ok) {
        return res.status(400).json({ success: false, message: promo.message });
      }
      finalAmount = promo.amount;
      appliedPromo = promo.promo_code;
      discountAmount = Number(promo.discount_amount) || Math.max(basePrice - finalAmount, 0);
    }

    const invoiceNumber = String(order_id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "IPANORDER";

    const body = {
      order_id: invoiceNumber,
      id_merchant: KLIKQRIS_ID_MERCHANT,
      amount: Math.round(finalAmount),
      keterangan: `${item_name || "Pembayaran IPAN STORE"}${appliedPromo ? ` (promo ${appliedPromo})` : ""}`.slice(0, 255),
    };
    if (KLIKQRIS_CALLBACK_URL) {
      body.callback_url = KLIKQRIS_CALLBACK_URL;
    }

    const r = await fetch(`${KLIKQRIS_BASE_URL}/qris/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KLIKQRIS_API_KEY,
        "id_merchant": KLIKQRIS_ID_MERCHANT,
      },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.status) {
      console.error("klikqris-create-order KlikQris error:", JSON.stringify(data));
      return res.status(r.status || 502).json({
        success: false,
        message: data?.message || "Gagal membuat transaksi KlikQris.",
        raw: data,
      });
    }

    // total_amount = jumlah yang benar-benar harus dibayar (KlikQris menambah kode unik).
    const totalAmount =
      Number(data?.data?.total_amount || finalAmount) || finalAmount;

    // Simpan order PENDING di database.
    await saveOrder({
      invoice_number: invoiceNumber,
      customer_name: String(customer_name || "").trim(),
      customer_email: String(customer_email || "").trim(),
      customer_phone: String(customer_phone || "").trim() || null,
      service_id: await resolveServiceId(item_name),
      amount: totalAmount,
      status: "PENDING",
      doku_payment_channel: "QRIS",
      promo_code: appliedPromo,
      discount_amount: discountAmount,
      klikqris_signature: data?.data?.signature || null,
      qris_expired_at: data?.data?.expired_at || null,
      webhook_payload: null,
    });

    return res.json({
      success: true,
      order_id: invoiceNumber,
      qris_url: data?.data?.qris_url || null,
      qris_image: data?.data?.qris_image || null,
      total_amount: totalAmount,
      amount: Number(data?.data?.amount) || finalAmount,
      signature: data?.data?.signature || null,
      expired_at: data?.data?.expired_at || null,
      raw: data?.data || null,
    });
  } catch (e) {
    console.error("klikqris-create-order error:", e);
    return res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : "Gagal menghubungi KlikQris.",
    });
  }
});

// ── Helper: Proses fulfillment order jika baru saja LUNAS (PAID/SUCCESS) ───────
// Dipanggil oleh webhook AND polling status untuk menangani payment confirmation.
// Idempotent: skip jika order sudah PAID.
async function processPaymentConfirmation(orderId, payload = null) {
  const order = await getOrder(orderId);
  
  if (!order) {
    console.warn(`⚠️  Order ${orderId} tidak ditemukan di DB — abaikan.`);
    return { processed: false, reason: 'order_not_found' };
  }

  // Skip jika sudah lunas (anti double-send)
  if (order.status === "PAID" || order.status === "SUCCESS") {
    console.log(`⏭️  Order ${orderId} sudah ${order.status} — fulfillment diabaikan.`);
    return { processed: false, reason: 'already_paid' };
  }

  const status = payload?.status || 'PAID';
  if (status !== "PAID" && status !== "SUCCESS") {
    return { processed: false, reason: 'not_paid_yet' };
  }

  // Update order status + paid_at
  await updateOrder(orderId, {
    status: "PAID",
    paid_at: new Date().toISOString(),
    klikqris_signature: payload?.signature || order.klikqris_signature || null,
  });

  // Identifikasi apakah ini paket SettinX
  let isSettinX = /settinx/i.test(order.invoice_number || "");
  if (!isSettinX && order.service_id && supabase) {
    const { data: svc } = await supabase
      .from("services")
      .select("slug, name")
      .eq("id", order.service_id)
      .single();
    if (svc && /settinx/i.test(svc.slug || svc.name || "")) {
      isSettinX = true;
    }
  }

  if (!isSettinX) {
    return { processed: true, reason: 'non_settinx_product', order };
  }

  // Kirim email otomatis untuk SettinX V1
  if (!order.customer_email) {
    console.warn(`⚠️  SettinX SUCCESS tapi email kosong — skip kirim.`);
    return { processed: true, reason: 'no_customer_email', order };
  }

  // Generate kredensial Firebase (username/password/license key) OTOMATIS.
  // Aplikasi SettinX login memakai email+password+license(UID), jadi kita buat
  // akun di sini lalu sertakan kredensialnya dalam email. Jika Firebase belum
  // dikonfigurasi / gagal, email tetap terkirim (tanpa kredensial) dan log error.
  let credentials = null;
  let licenseUid = null;
  let licenseErr = null;
  try {
    const lic = await assignSettinxLicense({
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      invoiceNumber: orderId,
    });
    credentials = lic;
    licenseUid = lic.licenseKey;
  } catch (e) {
    licenseErr = e.message;
    console.error(`⚠️  SettinX license GAGAL dibuat untuk ${order.customer_email}:`, e.message);
    // Fallback: coba ambil license lama supaya email tetap punya kredensial.
    try {
      const existing = await findExistingLicense(order.customer_email);
      if (existing) credentials = existing;
    } catch (_) { /* abaikan */ }
  }

  console.log(`📧 Mengirim email SettinX ke ${order.customer_email} (invoice ${orderId})...`);
  const result = await sendSettinXEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    invoiceNumber: orderId,
    amount: payload?.total_amount || order.amount,
    paidAt: new Date().toISOString(),
    credentials,
  });

  if (result.ok) {
    await updateOrder(orderId, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      settinx_license_uid: licenseUid || order.settinx_license_uid || null,
      settinx_license_error: licenseErr || null,
    });
    console.log(`📧 Email SettinX TERKIRIM: ${order.customer_email} (invoice ${orderId})`);
  } else {
    console.error(`📧 Email SettinX GAGAL ke ${order.customer_email}: ${result.error}`);
  }

  return { processed: true, result, credentials, licenseErr, order };
}

// ── Webhook KlikQris ─────────────────────────────────────────────────────────
// KlikQris memanggil URL ini saat status transaksi berubah (PAID / EXPIRED).
// Validasi signature: bandingkan dengan signature yang didapat saat create.
// Selalu balas HTTP 200 supaya KlikQris tidak retry terus-menerus.
app.post("/api/klikqris-webhook", async (req, res) => {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);
    const payload = (() => {
      let raw = {};
      try {
        raw = JSON.parse(rawBody);
      } catch {
        raw = {};
      }
      // Beberapa versi dashboard/webhook membungkus payload di "data".
      return (typeof raw?.data === "object" && raw.data !== null ? raw.data : raw) || raw;
    })();

    const orderId = String(payload?.order_id || "").trim();
    const status = String(payload?.status || "").trim();

    console.log(`✅ Webhook KlikQris diterima: order_id=${orderId} status=${status}`);

    if (!orderId) {
      console.warn("⚠️  KlikQris webhook tanpa order_id — pemeriksaan manual.");
      return res.json({ success: true });
    }

    // DOUBLE SECURITY (sesuai dokumentasi KlikQris):
    // Bandingkan signature dari webhook dengan signature yang disimpan saat create order.
    const order = await getOrder(orderId);
    if (
      order &&
      order.klikqris_signature &&
      payload?.signature &&
      String(payload.signature) !== String(order.klikqris_signature)
    ) {
      console.warn(`⚠️  Signature webhook TIDAK COCOK untuk ${orderId} — kemungkinan fake webhook, ditolak.`);
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    if (!order) {
      console.warn(`⚠️  KlikQris webhook untuk order tak dikenal: ${orderId} — buat minimal dulu.`);
      await saveOrder({
        invoice_number: orderId,
        amount: Number(payload?.total_amount) || Number(payload?.amount) || 0,
        status: status === "PAID" || status === "SUCCESS" ? "PAID" : status,
        paid_at: status === "PAID" || status === "SUCCESS" ? new Date().toISOString() : null,
        doku_payment_channel: "QRIS",
        klikqris_signature: payload?.signature || null,
      });
      // Tidak bisa fulfill kalau order baru dibuat — belum punya customer_email
      return res.json({ success: true });
    }

    // Sudah lunas → abaikan (anti double-kirim produk/email).
    if (order.status === "PAID" || order.status === "SUCCESS") {
      console.log(`⏭️  KlikQris: order ${orderId} sudah ${order.status} — notifikasi diabaikan.`);
      return res.json({ success: true });
    }

    // Panggil helper untuk process fulfillment (update DB + kirim email)
    await processPaymentConfirmation(orderId, payload);

    // EXPIRED handler
    if (status === "EXPIRED") {
      await updateOrder(orderId, { status: "EXPIRED" });
      console.log(`⏳ KlikQris: order ${orderId} kedaluwarsa.`);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("klikqris-webhook error:", e);
    return res.status(500).json({ success: false });
  }
});

// ── Check Status KlikQris ─────────────────────────────────────────────────────
// Manual polling dari frontend (fallback kalau webhook telat). Panggil API
// KlikQris dan kembalikan status terbaru. Selain itu, jika status adalah SUCCESS/PAID,
// proses fulfillment (update DB + kirim email SettinX) seperti yang dilakukan webhook.
// Ini memastikan: meskipun webhook gagal/telat, pembelian tetap di-fulfill otomatis.
app.get("/api/klikqris-status/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId wajib diisi." });
    }

    const r = await fetch(`${KLIKQRIS_BASE_URL}/qris/status/${orderId}`, {
      method: "GET",
      headers: {
        "x-api-key": KLIKQRIS_API_KEY,
        "id_merchant": KLIKQRIS_ID_MERCHANT,
      },
    });

    const data = await r.json().catch(() => ({}));
    
    // Proses fulfillment jika status adalah SUCCESS/PAID
    // Idempotent: skip jika order sudah lunas
    const apiStatus = String(data?.data?.status || data?.status || "").trim();
    if (apiStatus === "SUCCESS" || apiStatus === "PAID") {
      await processPaymentConfirmation(orderId, data.data || data);
    }

    return res.status(r.status).json(data);
  } catch (e) {
    console.error("klikqris-status error:", e);
    return res.status(500).json({ success: false });
  }
});

// ── Kode Promo / Diskon ─────────────────────────────────────────────────────
// Promo di-validasi DI SERVER (bukan dipercaya dari browser) agar diskon
// tidak bisa dipalsukan. Backend menghitung ulang diskon dari tabel promo_codes.
//
// SECURITY FIX #1: Public SELECT policy di promo_codes sudah dihapus (sql_patches/
// supabase_patch_security_critical.sql) — enumerasi promo via anon key tidak
// mungkin lagi. Validasi frontend sekarang lewat endpoint ini (rate-limited).
//
// SECURITY FIX #2: Pemakaian promo (used_count++) dilakukan via RPC
// `consume_promo_code` yang atomic (FOR UPDATE + guarded UPDATE), sehingga
// concurrent request tidak bisa melewati max_uses.
//
// ── Endpoint: validasi promo (preview diskon, TIDAK mengurangi kuota) ────────
// Dipanggil frontend di halaman Order saat user klik "Pakai".
app.post("/api/promo/validate", promoLimiter, async (req, res) => {
  try {
    const { code, amount } = req.body || {};
    if (!code || !supabase) {
      return res.json({ ok: false, message: "Kode promo tidak valid." });
    }
    const cleanCode = String(code).trim().slice(0, 40); // batasi panjang input
    if (!cleanCode) {
      return res.json({ ok: false, message: "Kode promo tidak valid." });
    }

    const price = Number(amount);
    if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) {
      return res.json({ ok: false, message: "Nominal tidak valid." });
    }

    // Validasi via RPC (service role, bypass RLS, tidak mengubah used_count).
    // Fallback ke query langsung jika RPC belum ada (belum migrasi).
    let result = null;
    try {
      const { data, error } = await supabase.rpc("validate_promo_code", {
        p_code: cleanCode,
        p_price: price,
      });
      if (!error && data) {
        result = typeof data === "string" ? JSON.parse(data) : data;
      }
    } catch {
      /* RPC belum ada → fallback di bawah */
    }

    if (!result) {
      // Fallback: baca promo via service role (aman, tidak expose apa pun)
      const { data: promo, error } = await supabase
        .from("promo_codes")
        .select("code, type, value, max_uses, used_count, is_active, expires_at")
        .ilike("code", cleanCode)
        .limit(1)
        .maybeSingle();

      if (error || !promo || !promo.is_active) {
        return res.json({ ok: false, message: "Kode promo tidak ditemukan atau tidak aktif." });
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return res.json({ ok: false, message: "Kode promo sudah kedaluwarsa." });
      }
      if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) {
        return res.json({ ok: false, message: "Kode promo sudah mencapai batas pemakaian." });
      }

      const raw =
        promo.type === "percent"
          ? Math.round((price * Number(promo.value)) / 100)
          : Math.round(Number(promo.value));
      const discount = Math.min(Math.max(raw, 0), price);
      result = {
        ok: true,
        code: promo.code,
        message: "Kode promo berlaku!",
        discount_amount: discount,
        amount: Math.max(price - discount, 1),
      };
    }

    // Respons minimal: jangan expose used_count / max_uses / id / strategi promo.
    return res.json({
      ok: !!result.ok,
      valid: !!result.ok,
      code: result.code || cleanCode.toUpperCase(),
      message: result.message || (result.ok ? "Kode promo berlaku!" : "Kode promo tidak valid."),
      discount_amount: result.ok ? Number(result.discount_amount) || 0 : 0,
      amount: result.ok ? Number(result.amount) || 0 : 0,
    });
  } catch (e) {
    console.error("promo validate error:", e.message);
    return res.json({ ok: false, message: "Gagal memeriksa kode promo." });
  }
});

async function validateAndApplyPromo(code, amount) {
  if (!code || !supabase) return { ok: false, message: "Kode promo tidak valid." };
  const cleanCode = String(code).trim();
  if (!cleanCode) return { ok: false, message: "Kode promo tidak valid." };

  // SECURITY FIX #2: consume via RPC atomic (row lock + guarded update).
  // Satu request = satu increment yang dijamin konsisten di bawah max_uses.
  try {
    const { data, error } = await supabase.rpc("consume_promo_code", {
      p_code: cleanCode,
      p_price: Number(amount) || 0,
    });
    if (!error && data) {
      const r = typeof data === "string" ? JSON.parse(data) : data;
      if (r && r.ok) {
        return {
          ok: true,
          promo_code: r.promo_code,
          discount_amount: Number(r.discount_amount) || 0,
          amount: Number(r.amount) || 0,
        };
      }
      return { ok: false, message: r.message || "Kode promo tidak valid." };
    }
  } catch {
    /* RPC belum ada → fallback non-atomik di bawah (dev only) */
  }

  // ── FALLBACK (jika RPC belum dijalankan di Supabase) ────────────────────────
  // Logika lama (read-check-write). MASIH rentan race condition — jalankan
  // migrasi sql_patches/supabase_patch_security_critical.sql secepatnya.
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", cleanCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("promo lookup error:", error.message);
    return { ok: false, message: "Gagal memeriksa kode promo." };
  }
  if (!promo) return { ok: false, message: "Kode promo tidak ditemukan." };
  if (!promo.is_active) return { ok: false, message: "Kode promo tidak aktif." };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { ok: false, message: "Kode promo sudah kedaluwarsa." };
  }
  if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) {
    return { ok: false, message: "Kode promo sudah mencapai batas pemakaian." };
  }

  const price = Number(amount);
  const raw = promo.type === "percent" ? Math.round((price * Number(promo.value)) / 100) : Math.round(Number(promo.value));
  const discount = Math.min(Math.max(raw, 0), price);
  const total = Math.max(price - discount, 1);

  // Catat pemakaian promo (dicegah agar tidak dipakai berlebihan).
  await supabase
    .from("promo_codes")
    .update({ used_count: Number(promo.used_count) + 1 })
    .eq("id", promo.id);

  return { ok: true, promo_code: promo.code, discount_amount: discount, amount: total };
}

// ── Create Order ─────────────────────────────────────────────────────────────
// Front-end memanggil endpoint ini. Server menandatangani request dengan
// SECRET_KEY lalu meneruskan ke DOKU. Mengembalikan response.payment.url.
app.post("/api/doku-create-order", orderLimiter, async (req, res) => {
  try {
    const { amount, order_id, customer_name, customer_email, customer_phone, item_name, promo_code } =
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

    // SECURITY FIX #4 — jangan percaya `amount` dari client (bisa di-tamper via DevTools/Burp).
    // Harga authoritative diambil dari tabel `services` berdasarkan `item_name`.
    // Kalau service tidak ditemukan dan Supabase tersedia → reject (bukan fallback ke client).
    let basePrice = Number(amount);
    if (supabase && item_name) {
      const clean = String(item_name).replace(/^IPAN STORE\s*-\s*/i, "").trim();
      if (clean) {
        let svcPrice = null;
        // 1) exact name match
        let { data: svc } = await supabase
          .from("services")
          .select("price")
          .ilike("name", clean)
          .limit(1)
          .maybeSingle();
        if (svc?.price != null) svcPrice = Number(svc.price);
        // 2) partial match fallback
        if (svcPrice == null) {
          const r2 = await supabase
            .from("services")
            .select("price")
            .ilike("name", `%${clean}%`)
            .limit(1)
            .maybeSingle();
          if (r2.data?.price != null) svcPrice = Number(r2.data.price);
        }
        // 3) slug settinx fallback
        if (svcPrice == null && /settinx/i.test(clean)) {
          const r3 = await supabase.from("services").select("price").eq("slug", "app-settinx").limit(1).maybeSingle();
          if (r3.data?.price != null) svcPrice = Number(r3.data.price);
        }
        if (svcPrice != null && Number.isFinite(svcPrice) && svcPrice > 0) {
          if (svcPrice !== basePrice) {
            console.warn(`⚠️ amount client (${basePrice}) ≠ harga DB (${svcPrice}) untuk "${clean}" — pakai harga DB.`);
          }
          basePrice = svcPrice;
        } else if (svcPrice == null) {
          console.warn(`⚠️ Service tidak ditemukan untuk "${item_name}" — pakai amount client sementara.`);
          // Tetap lanjut pakai client amount bila service memang belum ada di DB (mis. project kosong).
          // Bila DB sudah terisi services, pertimbangkan untuk reject: return 400.
        }
      }
    }
    // Guard: jangan izinkan pembayaran di bawah 1.000 IDR (anti tamper 0/1 rupiah)
    if (basePrice < 1000 || !Number.isFinite(basePrice)) {
      return res.status(400).json({ success: false, message: "Nominal pembayaran tidak valid." });
    }

    // Validasi kode promo di server (authoritative) sebelum diteruskan ke DOKU.
    let finalAmount = basePrice;
    let discountAmount = 0;
    let appliedPromo = null;
    if (promo_code) {
      const promo = await validateAndApplyPromo(promo_code, basePrice);
      if (!promo.ok) {
        return res.status(400).json({ success: false, message: promo.message });
      }
      finalAmount = promo.amount;
      discountAmount = promo.discount_amount;
      appliedPromo = promo.promo_code;
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
        amount: finalAmount,
        invoice_number: invoiceNumber,
        currency: "IDR",
        ...(DOKU_CALLBACK_URL ? { callback_url: DOKU_CALLBACK_URL, auto_redirect: true } : {}),
        line_items: [
          {
            id: invoiceNumber,
            name: String(item_name || "IPAN STORE Product").slice(0, 255),
            quantity: 1,
            price: finalAmount,
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

    // Simpan data order ke Supabase sebelum dikirim ke pembeli (untuk kirim email saat lunas)
    const orderPayload = {
      invoice_number: invoiceNumber,
      customer_name: String(customer_name || ""),
      customer_email: String(customer_email || ""),
      customer_phone: String(customer_phone || ""),
      amount: finalAmount,
      status: "PENDING",
      doku_transaction_id: data?.response?.payment?.token_id || "",
      created_at: new Date().toISOString(),
      promo_code: appliedPromo,
      discount_amount: discountAmount,
    };

    await resolveServiceId(item_name).then(async (serviceId) => {
      if (serviceId) {
        orderPayload.service_id = serviceId;
      } else {
        console.warn(`⚠️  Service tidak ditemukan untuk item: ${item_name}`);
      }
      await saveOrder(orderPayload);
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

    // ── SECURITY FIX #6 — Replay protection ──────────────────────────────────
    // Timestamp freshness (15 menit) — header sudah terverifikasi via signature
    // di atas, jadi aman untuk di-trust sebagai waktu asli DOKU.
    const webhookAge = Math.abs(Date.now() - new Date(String(requestTimestamp)).getTime());
    if (!Number.isFinite(webhookAge) || webhookAge > WEBHOOK_MAX_AGE_MS) {
      const ageSec = Number.isFinite(webhookAge) ? Math.round(webhookAge / 1000) : "NaN";
      console.warn(`⚠️ Webhook stale: age=${ageSec}s, requestId=${requestId} — ditolak.`);
      return res.status(401).json({ success: false, message: "Webhook timestamp expired." });
    }
    // SECURITY FIX #9 — cegah concurrent duplicate (webhook diproses paralel)
    if (inFlightWebhooks.has(requestId)) {
      console.warn(`⚠️ Webhook masih diproses: requestId=${requestId} — skip (concurrent).`);
      return res.json({ success: true });
    }
    inFlightWebhooks.add(requestId);
    try {
      if (await isWebhookProcessed(requestId)) {
        console.warn(`⚠️ Webhook replay: requestId=${requestId} sudah diproses — skip.`);
        return res.json({ success: true });
      }
      // (markWebhookProcessed dipindah ke SETELAH proses sukses — lihat bawah)

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
      const order = await getOrder(invoice);
      
      if (!order) {
        // Order tidak ada di DB — buat minimal dari payload webhook.
        console.warn(`⚠️  Webhook SUCCESS untuk invoice tak dikenal: ${invoice}`);
        const orderPayload = {
          invoice_number: invoice || `UNKNOWN-${Date.now()}`,
          amount: Number(amount) || 0,
          status: "PAID",
          paid_at: new Date().toISOString(),
          doku_transaction_id: payload?.transaction?.token_id || "",
          webhook_payload: payload,
        };
        await saveOrder(orderPayload);
      } else {
        // Tandai lunas
        await updateOrder(order.invoice_number || order.id, {
          status: "PAID",
          paid_at: new Date().toISOString(),
          webhook_payload: payload,
          doku_transaction_id: payload?.transaction?.token_id || order.doku_transaction_id,
        });

        // Kirim email otomatis HANYA untuk paket IPAN APP SettinX V1
        // Cek via invoice_number atau service slug yang ter-resolve
        let isSettinX = /settinx/i.test(order.invoice_number || "");
        
        // Cek juga via service slug jika service_id ada
        if (!isSettinX && order.service_id && supabase) {
          const { data: svc } = await supabase
            .from("services")
            .select("slug, name")
            .eq("id", order.service_id)
            .single();
          if (svc && /settinx/i.test(svc.slug || svc.name || "")) {
            isSettinX = true;
          }
        }

        if (isSettinX && order.customer_email) {
          console.log(`📧 Mengirim email SettinX ke ${order.customer_email} (invoice ${order.invoice_number})...`);
          let credentials = null;
          let licenseUid = null;
          let licenseErr = null;
          try {
            const lic = await assignSettinxLicense({
              customerEmail: order.customer_email,
              customerName: order.customer_name,
              invoiceNumber: order.invoice_number,
            });
            credentials = lic;
            licenseUid = lic.licenseKey;
          } catch (e) {
            licenseErr = e.message;
            console.error(`⚠️  SettinX license GAGAL dibuat untuk ${order.customer_email}:`, e.message);
            try {
              const existing = await findExistingLicense(order.customer_email);
              if (existing) credentials = existing;
            } catch (_) { /* abaikan */ }
          }

          console.log(`📧 Mengirim email SettinX ke ${order.customer_email} (invoice ${order.invoice_number})...`);
          const result = await sendSettinXEmail({
            to: order.customer_email,
            customerName: order.customer_name,
            invoiceNumber: order.invoice_number,
            amount: order.amount || amount,
            paidAt: order.paid_at,
            credentials,
          });

          if (result.ok) {
            await updateOrder(order.invoice_number || order.id, {
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              settinx_license_uid: licenseUid || order.settinx_license_uid || null,
              settinx_license_error: licenseErr || null,
            });
            console.log(`📧 Email SettinX TERKIRIM: ${order.customer_email} (invoice ${order.invoice_number})`);
          } else {
            console.error(`📧 Email SettinX GAGAL ke ${order.customer_email}: ${result.error}`);
          }
        } else if (isSettinX) {
          console.warn(`⚠️  SettinX SUCCESS tapi email tidak dikirim: email=${order.customer_email || "KOSONG"}`);
        }
      }
    }

    // SECURITY FIX #9 — tandai SUKSES setelah proses selesai (bukan sebelum).
    // Jika throw di atas, kita tidak menandai → DOKU retry aman, order tidak hilang.
    await markWebhookProcessed(requestId);
    return res.json({ success: true });
    } finally {
      // Selalu hapus dari in-flight, baik sukses maupun gagal.
      inFlightWebhooks.delete(requestId);
    }
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
    
    // Update status di Supabase
    await updateOrder(invoice_number, { status: "REFUNDED", refunded_at: new Date().toISOString() });
    
    return res.json({ success: true, raw: data });
  } catch (e) {
    console.error("doku-cancel-order error:", e);
    return res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Gagal." });
  }
});

// ── Resend kredensial SettinX (manual dari dashboard admin) ───────────────────
// Untuk order SettinX yang emailnya gagal terkirim / pembeli minta dikirim ulang.
// Generate atau reuse license (by customer email), lalu kirim ulang email berisi
// kredensial. Idempotent: jika kredensial sudah ada, tidak membuat akun ganda.
app.post("/api/settinx/resend", async (req, res) => {
  try {
    const { orderId } = req.body || {};
    const invoice = String(orderId || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);
    if (!invoice) {
      return res.status(400).json({ success: false, message: "orderId wajib diisi." });
    }

    const order = await getOrder(invoice);
    if (!order) {
      return res.status(404).json({ success: false, message: `Order ${invoice} tidak ditemukan.` });
    }

    // Pastikan ini benar-benar produk SettinX.
    const isSettinX = /settinx/i.test(order.invoice_number || "");
    if (!isSettinX && order.service_id && supabase) {
      const { data: svc } = await supabase
        .from("services")
        .select("slug, name")
        .eq("id", order.service_id)
        .single();
      if (svc && /settinx/i.test(svc.slug || svc.name || "")) isSettinX = true;
    }
    if (!isSettinX) {
      return res.status(400).json({ success: false, message: "Order ini bukan produk IPAN APP SettinX V1." });
    }
    if (!order.customer_email) {
      return res.status(400).json({ success: false, message: "Order tidak memiliki email pembeli." });
    }

    let credentials = null;
    let licenseErr = null;
    try {
      credentials = await assignSettinxLicense({
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        invoiceNumber: order.invoice_number,
      });
    } catch (e) {
      licenseErr = e.message;
      try {
        const existing = await findExistingLicense(order.customer_email);
        if (existing) credentials = existing;
      } catch (_) { /* abaikan */ }
    }

    if (!credentials) {
      return res.status(502).json({
        success: false,
        message: `Gagal menyiapkan kredensial SettinX: ${licenseErr || "credential kosong"}`,
      });
    }

    const result = await sendSettinXEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      invoiceNumber: order.invoice_number,
      amount: order.amount,
      paidAt: order.paid_at,
      credentials,
    });

    if (!result.ok) {
      return res.status(502).json({ success: false, message: `Gagal kirim email: ${result.error}` });
    }

    await updateOrder(order.invoice_number || order.id, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      settinx_license_uid: credentials.licenseKey || order.settinx_license_uid || null,
      settinx_license_error: licenseErr || null,
    });

    console.log(`🔁 SettinX credential RE-SENT: ${order.customer_email} (invoice ${order.invoice_number})`);
    return res.json({ success: true, message: "Email kredensial berhasil dikirim ulang." });
  } catch (e) {
    console.error("settinx-resend error:", e);
    return res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Gagal." });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend IPAN STORE jalan di http://localhost:${PORT}`);
  console.log(`   CORS diizinkan untuk: ${ALLOWED_ORIGINS.join(", ")}`);
});
