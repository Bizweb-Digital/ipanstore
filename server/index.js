// ─────────────────────────────────────────────────────────────────────────────
// Backend IPAN STORE — integrasi Payment Gateway DOKU (DOKU Checkout)
//
// Kenapa butuh file ini?
//   DOKU Checkout butuh header Signature HMAC-SHA256 yang dibuat dari
//   CLIENT_ID + SECRET_KEY. Secret Key bersifat RAHASIA dan tidak boleh
//   dikirim dari browser → semua call ke DOKU harus lewat server ini.
//
// Endpoint yang disediakan:
//   POST /api/doku-create-order     → buat transaksi DOKU Checkout (redirect ke halaman DOKU)
//   POST /api/doku-webhook          → terima notifikasi pembayaran dari DOKU
//   GET  /api/doku-status/:orderId  → polling status (fallback bila webhook telat)
//   GET  /api/order-status/:orderId → status publik untuk halaman Lacak Order
//   POST /api/promo/validate        → validasi kode promo
//   GET  /api/health                → cek server hidup
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import cors from "cors";
import crypto from "crypto";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import {
  assignSettinxLicense,
  initSettinxFirebase,
  rotateSettinxPassword,
} from "./lib/settinxLicense.js";
import { assignModuleSettinxLicense } from "./lib/moduleSettinxLicense.js";
import { sendPaidEmail } from "./lib/notify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Helmet — security headers HTTP default (X-Content-Type-Options, X-Frame-Options,
// Referrer-Policy, dll). CSP dimatikan di sini karena frontend dilayani Vite/nginx
// (CSP ketat diatur di config/nginx.conf) agar tidak bentrok/dobel.
app.use(helmet({ contentSecurityPolicy: false }));

// SECURITY FIX #8 — origin berada di belakang Cloudflare Tunnel (cloudflared).
// Express harus memercayai hop pertama proxy agar `req.ip` berisi IP pengunjung
// asli (bukan 127.0.0.1 cloudflared). Tanpa ini, rate limiter "melihat" semua
// pengunjung sebagai IP yang sama → semua pengunjung share satu bucket (self-DoS).
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Domain front-end Anda (untuk CORS). WAJIB diisi di .env, pisahkan koma bila banyak.
// SECURITY (fail-closed): jika ALLOWED_ORIGINS kosong/tidak diset, server berhenti
// saat startup. Jangan pernah fallback diam-diam ke localhost — itu membuat server
// produksi tampak "jalan" padahal CORS salah konfigurasi (atau terlalu terbuka).
let ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// SECURITY FIX #7 — tolak wildcard "*" agar tidak jadi open CORS.
if (ALLOWED_ORIGINS.includes("*")) {
  console.error('❌ SECURITY: ALLOWED_ORIGINS mengandung "*" — wildcard ditolak. Pakai daftar domain spesifik (mis. https://ipanstore.id).');
  ALLOWED_ORIGINS = ALLOWED_ORIGINS.filter((o) => o !== "*");
}
if (ALLOWED_ORIGINS.length === 0) {
  console.error("❌ FATAL: ALLOWED_ORIGINS kosong/tidak diset di .env (atau hanya berisi wildcard yang ditolak).");
  console.error("   Isi daftar origin front-end yang sah, mis: ALLOWED_ORIGINS=https://ipanstore.id,https://www.ipanstore.id");
  console.error("   Server dihentikan (fail-closed) untuk mencegah CORS salah konfigurasi.");
  process.exit(1);
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
// Spesifikasi resmi (developers.doku.com → Signature Component from Request Header):
//
//   Client-Id:{clientId}
//   Request-Id:{requestId}
//   Request-Timestamp:{requestTimestamp}
//   Request-Target:{requestTarget}
//   Digest:{digest}
//
// ⚠️ PENTING: baris `Digest` HANYA untuk metode POST.
// Untuk GET (mis. Check Status API) baris Digest DIHILANGKAN sama sekali —
// menyertakannya membuat DOKU menolak dengan `invalid_signature`.
//
// Digest    = base64(sha256(jsonBody))
// Signature = "HMACSHA256=" + base64(hmac_sha256(secretKey, componentString))
function generateDokuDigest(rawBody) {
  return crypto.createHash("sha256").update(rawBody, "utf-8").digest("base64");
}

function generateDokuSignature({ clientId, requestId, requestTimestamp, requestTarget, digest }) {
  const parts = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
  ];
  // Digest hanya untuk POST (ada body). Untuk GET baris ini dihilangkan.
  if (digest) parts.push(`Digest:${digest}`);
  const hmac = crypto.createHmac("sha256", DOKU_SECRET_KEY).update(parts.join("\n")).digest("base64");
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
// ⚠️ PENJELASAN DUA VARIABEL (jangan tertukar):
//   SETTINX_DOWNLOAD_URL         → dipakai email PAKET NON-MODULE (App V1 / Set PC / Anti-Cheat).
//   SETTINX_MODULE_1_1_DOWNLOAD_URL → dipakai email "Ipan Module SettinX 1.1" (produk module_1_1).
// Sebelum 2026-11-18, var module_1_1 masih menunjuk FILE Google Drive LAMA
// (`/file/d/1U3uz7-…`), sehingga pembeli Module 1.1 menerima tautan basi.
// Sekarang keduanya memakai FOLDER Drive terbaru yang aktif.
const SETTINX_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1FhroO8GV6bdt9Y3fM-Nvr6cL5CwgGxmS?usp=sharing";

// Link Google Drive produk "Ipan Module SettinX 1.1" (dari .env, tidak di-hardcode).
const SETTINX_MODULE_DOWNLOAD_URL =
  process.env.SETTINX_MODULE_1_1_DOWNLOAD_URL ||
  process.env.SETTINX_DOWNLOAD_URL ||
  SETTINX_DRIVE_FOLDER_URL;

// Link Drive umum (paket non-module).
const SETTINX_DOWNLOAD_URL = process.env.SETTINX_DOWNLOAD_URL || SETTINX_DRIVE_FOLDER_URL;

// Kontak bantuan & grup komunitas untuk email "Ipan Module SettinX 1.1".
// Nomor WA admin: +62 889-7649-6870 → format wa.me tanpa spasi/strip.
const MODULE_SUPPORT_WA_URL = "https://wa.me/6288976496870";
const MODULE_COMMUNITY_GROUP_URL = "https://chat.whatsapp.com/IoLKaH87TBXA6Nyf6XdwjZ";

// ⚠️ FIX (2026-11-18): VPS ini TIDAK punya route IPv6, sedangkan smtp.gmail.com
// mengumumkan record AAAA. Node memilih IPv6 lebih dulu → koneksi gagal dengan
// `ENETUNREACH`, sehingga email lisensi tidak terkirim walau pembayaran sukses.
// `family: 4` memaksa resolusi & koneksi lewat IPv4.
// `connectionTimeout`/`greetingTimeout` mencegah request menggantung lama.
const emailTransporter = SMTP_USER
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      family: 4,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    })
  : null;

/**
 * Kartu kredensial login SettinX V1 untuk email.
 * Layout BERTUMPUK (label di atas, nilai monospace besar di bawah) agar terbaca
 * jelas & proporsional di Gmail mobile — nilai panjang tidak terpotong.
 */
function credentialsCardHtml(credentials) {
  if (!credentials?.username || !credentials?.password || !credentials?.licenseKey) return "";
  const field = (label, value) =>
    `<div style="margin:0 0 12px 0">
      <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#8b8b93;margin:0 0 4px 0">${label}</div>
      <div style="font-family:'Courier New',Consolas,monospace;font-size:16px;font-weight:700;color:#ffffff;line-height:1.5;word-break:break-all;background:#1c1c1f;border:1px solid #33333a;border-radius:8px;padding:10px 12px">${escapeHtml(value)}</div>
    </div>`;
  return `
    <div style="background:#131316;border:1px solid #3f3f46;border-radius:12px;padding:20px;margin:24px 0">
      <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:4px">🔐 Kredensial Login</div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.5;margin-bottom:16px">Gunakan data di bawah untuk login ke <strong style="color:#e4e4e7">IPAN APP SettinX V1</strong> setelah aplikasi terpasang.</div>
      ${field("Username (Email)", credentials.username)}
      ${field("Password", credentials.password)}
      ${field("License Key", credentials.licenseKey)}
      <div style="font-size:12px;color:#8b8b93;margin-top:6px;border-top:1px solid #2a2a30;padding-top:12px;line-height:1.5">
        ⚠️ Simpan kredensial ini baik-baik. Jangan pernah membagikannya. Satu lisensi hanya untuk satu perangkat.
      </div>
    </div>`;
}

/**
 * Kartu kredensial login "Ipan Module SettinX 1.1" untuk email.
 * Layout BERTUMPUK + font besar + langkah aktivasi, agar jelas & proporsional di Gmail mobile.
 */
function moduleCredentialsCardHtml(credentials) {
  if (!credentials?.id || !credentials?.password || !credentials?.licenseKey) return "";
  // ── Salin sekali klik ────────────────────────────────────────────────────
  // ⚠️ KENYATAAN TEKNIS: Gmail, Outlook, dan hampir semua klien email MEMBLOKIR
  // JavaScript (`<script>`, `onclick`) demi keamanan. Tombol
  // `navigator.clipboard.writeText()` TIDAK akan berfungsi di email — kalau
  // dipasang, tombolnya hanya jadi hiasan yang mengecewakan pembeli.
  //
  // Yang benar-benar bekerja di semua klien:
  //   `user-select: all` → SATU klik pada teks langsung menyeleksi SELURUH nilai,
  //   tinggal Ctrl+C (desktop) atau tekan lama → Copy (HP).
  // Ditambah petunjuk kecil di bawah tiap nilai agar pembeli tahu.
  const field = (label, value) =>
    `<div style="margin:0 0 12px 0">
      <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#8b8b93;margin:0 0 4px 0">${label}</div>
      <div style="font-family:'Courier New',Consolas,monospace;font-size:16px;font-weight:700;color:#ffffff;line-height:1.5;word-break:break-all;background:#1c1c1f;border:1px solid #33333a;border-radius:8px;padding:10px 12px;-webkit-user-select:all;-moz-user-select:all;-ms-user-select:all;user-select:all">${escapeHtml(value)}</div>
      <div style="font-size:10px;color:#71717a;margin-top:3px">Klik teks di atas untuk menyalin (HP: tekan lama &rarr; Copy)</div>
    </div>`;
  return `
    <div style="background:#131316;border:1px solid #3f3f46;border-radius:12px;padding:20px;margin:24px 0">
      <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:4px">🔐 Kredensial Login</div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.5;margin-bottom:16px">Gunakan data di bawah untuk login ke <strong style="color:#e4e4e7">IPAN Module SettinX 1.1</strong> setelah aplikasi terpasang.</div>
      ${field("ID Akun", credentials.id)}
      ${field("Password", credentials.password)}
      ${field("License Key", credentials.licenseKey)}
      <div style="margin:0 0 6px 0">
        <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#4ade80;margin:0 0 6px 0;font-weight:700">📋 Salin Semua Sekali Klik</div>
        <div class="copy-all-inline" style="font-family:'Courier New',Consolas,monospace;font-size:13px;color:#e4e4e7;line-height:1.9;word-break:break-all;background:#0e0e10;border:1px dashed #3f3f46;border-radius:8px;padding:12px;-webkit-user-select:all;-moz-user-select:all;-ms-user-select:all;user-select:all"><div>ID Akun: ${escapeHtml(credentials.id)}</div><div>Password: ${escapeHtml(credentials.password)}</div><div>License Key: ${escapeHtml(credentials.licenseKey)}</div></div>
        <div style="font-size:10px;color:#71717a;margin-top:4px">Klik kotak di atas → semua teks terpilih otomatis → Ctrl+C / tekan lama → Copy</div>
      </div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.7;margin-top:6px;border-top:1px solid #2a2a30;padding-top:14px">
        <strong style="color:#e4e4e7;font-size:14px">📖 Cara Pakai</strong><br/>
        1. Download &amp; install aplikasi dari tombol di bawah.<br/>
        2. Buka aplikasi → login memakai <strong style="color:#e4e4e7">ID Akun</strong> &amp; <strong style="color:#e4e4e7">Password</strong> di atas.<br/>
        3. Masukkan <strong style="color:#e4e4e7">License Key</strong> untuk aktivasi (1 key = 1 perangkat).<br/>
        4. Selesai — modul siap digunakan.
      </div>
      <div style="font-size:12px;color:#8b8b93;margin-top:12px;border-top:1px solid #2a2a30;padding-top:12px;line-height:1.5">
        ⚠️ Simpan kredensial ini baik-baik. Jangan pernah membagikannya kepada orang lain.
      </div>
    </div>`;
}

/**
 * Blok bantuan & grup komunitas WhatsApp untuk email Module SettinX.
 * Tombol full-width (bertumpuk) agar rapi & mudah ditekan di HP.
 */
function moduleSupportButtonsHtml() {
  const btn = (href, label) =>
    `<a href="${href}" style="display:block;background:#25D366;color:#0b1410;text-decoration:none;font-weight:700;padding:14px 18px;border-radius:8px;font-size:15px;text-align:center;margin:0 0 10px 0">${label}</a>`;
  return `
    <div style="background:#131316;border:1px solid #2a2a30;border-radius:12px;padding:20px;margin:24px 0">
      <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:4px">💬 Butuh Bantuan?</div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.5;margin-bottom:16px">Jika ada kekeliruan data, kendala aktivasi, atau ingin bertanya — hubungi kami:</div>
      ${btn(MODULE_SUPPORT_WA_URL, "💬 Hubungi WhatsApp Admin")}
      ${btn(MODULE_COMMUNITY_GROUP_URL, "📱 Gabung Grup Module Ipan")}
      <div style="font-size:12px;color:#8b8b93;text-align:center;margin-top:6px">Admin: +62 889-7649-6870</div>
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

/**
 * Baris ringkasan (label kecil di atas, nilai besar di bawah) — layout BERTUMPUK
 * agar terbaca jelas & proporsional di Gmail mobile (nilai panjang tidak terpotong).
 */
function summaryRowHtml(label, value, { mono = false, accent = false, big = false } = {}) {
  return `
    <div style="padding:12px 0;border-bottom:1px solid #2a2a30">
      <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#8b8b93;margin:0 0 4px 0">${label}</div>
      <div style="font-size:${big ? "20px" : "15px"};font-weight:700;line-height:1.4;word-break:break-all;color:${accent ? "#4ade80" : "#ffffff"};${mono ? "font-family:'Courier New',Consolas,monospace;" : ""}">${value}</div>
    </div>`;
}

/**
 * Bangun HTML lengkap email "Ipan Module SettinX 1.1".
 * Layout bertumpuk (label di atas, nilai besar di bawah) agar jelas & proporsional
 * dibaca di Gmail desktop maupun mobile.
 */
function buildModuleSettinxEmailHtml({ customerName, invoiceNumber, amount, paidAt, credentials }) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

  const paidLabel = paidAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(paidAt))
    : new Date().toLocaleString("id-ID");

  const downloadUrl = SETTINX_MODULE_DOWNLOAD_URL;
  const safeName = escapeHtml(String(customerName || "Pelanggan"));
  const safeInvoice = escapeHtml(String(invoiceNumber || "-"));

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0f0f10;color:#e4e4e7;border-radius:12px;overflow:hidden;border:1px solid #27272a">
    <div style="background:linear-gradient(135deg,#18181b,#3f3f46);padding:28px 24px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">IPAN <span style="color:#a1a1aa">STORE</span></div>
      <div style="font-size:12px;color:#a1a1aa;margin-top:2px">Payment Confirmation</div>
    </div>
    <div style="padding:24px">
      <p style="font-size:17px;font-weight:700;margin:0 0 4px;color:#ffffff">Halo, ${safeName} 👋</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.5;margin:0 0 20px">Terima kasih atas pembelian Anda. Pembayaran telah kami terima ✅</p>

      <div style="background:#131316;border:1px solid #2a2a30;border-radius:12px;padding:20px;margin:0 0 24px 0">
        <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:6px">🧾 Ringkasan Pesanan</div>
        ${summaryRowHtml("No. Invoice", safeInvoice, { mono: true })}
        ${summaryRowHtml("Produk", "IPAN Module SettinX 1.1")}
        ${summaryRowHtml("Status", "LUNAS", { accent: true })}
        ${summaryRowHtml("Total Dibayar", formattedAmount, { big: true })}
        <div style="padding:12px 0 0 0">
          <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#8b8b93;margin:0 0 4px 0">Waktu</div>
          <div style="font-size:15px;font-weight:600;color:#ffffff">${escapeHtml(paidLabel)}</div>
        </div>
      </div>

      ${moduleCredentialsCardHtml(credentials)}

      <div style="background:#131316;border:1px solid #2a2a30;border-radius:12px;padding:20px;margin:24px 0">
        <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:4px">📦 Download Aplikasi</div>
        <div style="font-size:13px;color:#a1a1aa;line-height:1.5;margin-bottom:14px">Unduh aplikasi IPAN Module SettinX 1.1 (.apk) lewat tombol berikut:</div>
        <a href="${downloadUrl}" style="display:block;background:#f4f4f5;color:#18181b;text-decoration:none;font-weight:800;padding:15px 18px;border-radius:8px;font-size:15px;text-align:center">⬇️ Download IPAN Module SettinX 1.1</a>
        <div style="font-size:12px;color:#8b8b93;line-height:1.6;margin-top:12px">Jika tombol tidak berfungsi, salin tautan ini:<br/><a href="${downloadUrl}" style="color:#a1a1aa;word-break:break-all">${downloadUrl}</a></div>
      </div>

      ${moduleSupportButtonsHtml()}

      <p style="font-size:12px;color:#71717a;line-height:1.6;margin-top:24px;border-top:1px solid #27272a;padding-top:16px;text-align:center">
        Untuk bantuan &amp; aktivasi lisensi, hubungi kami via WhatsApp di website IPAN STORE.<br/>
        © ${new Date().getFullYear()} IPAN STORE
      </p>
    </div>
  </div>`;
}

/**
 * Kirim email produk "Ipan Module SettinX 1.1" + invoice ke pembeli.
 * Berisi: ringkasan invoice, kredensial login (ID/Password/License Key) bila ada,
 * link download Google Drive, serta tombol bantuan WA & grup komunitas.
 * Mengembalikan { ok, error? }.
 */
async function sendModuleSettinxEmail({ to, customerName, invoiceNumber, amount, paidAt, credentials }) {
  if (!emailTransporter) return { ok: false, error: "SMTP belum dikonfigurasi (SMTP_USER kosong)." };
  const safeTo = String(to ?? "").trim();
  if (!isValidEmail(safeTo)) {
    return { ok: false, error: "Format email pembeli tidak valid." };
  }
  const safeName = sanitizeForHeader(customerName, 100);
  const safeInvoice = sanitizeForHeader(invoiceNumber, 64);

  const html = buildModuleSettinxEmailHtml({
    customerName: safeName,
    invoiceNumber: safeInvoice,
    amount,
    paidAt,
    credentials,
  });

  try {
    await emailTransporter.sendMail({
      from: MAIL_FROM,
      to: safeTo,
      subject: `✅ Pembayaran Diterima — Kredensial & Download IPAN Module SettinX 1.1 (${safeInvoice || ""})`,
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

// ── Validasi format Order ID ─────────────────────────────────────────────────
// Format orderId dibuat frontend: `IPAN-{SERVICE_ID}-{timestamp}`
// (lihat src/pages/Order.tsx) → hanya huruf kapital, angka, dan tanda hubung.
const ORDER_ID_RE = /^[A-Z0-9][A-Z0-9-]{3,63}$/i;
function isValidOrderId(id) {
  return typeof id === "string" && ORDER_ID_RE.test(id);
}

/**
 * Kirim kredensial akun admin baru ke email tujuan via Gmail SMTP.
 * Mengembalikan { ok, error? } — kegagalan email tidak menggagalkan pembuatan akun.
 */
async function sendAdminCredentialsEmail({ to, email, password, role }) {
  if (!emailTransporter) return { ok: false, error: "SMTP belum dikonfigurasi (SMTP_USER kosong)." };
  const safeTo = String(to ?? "").trim();
  if (!isValidEmail(safeTo)) return { ok: false, error: "Format email tujuan tidak valid." };

  const roleLabel = role === "super_admin" ? "Super Admin (akses penuh)" : "Viewer (akses terbatas)";
  const loginUrl = `${ALLOWED_ORIGINS[0] || ""}/admin/login`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0f0f10;color:#e4e4e7;border-radius:12px;overflow:hidden;border:1px solid #27272a">
    <div style="background:linear-gradient(135deg,#18181b,#3f3f46);padding:28px 32px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">IPAN <span style="color:#a1a1aa">STORE</span></div>
      <div style="font-size:12px;color:#a1a1aa;margin-top:2px">Akun Admin Baru</div>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:16px;font-weight:600;margin:0 0 4px">Halo 👋</p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px">Akun admin IPAN STORE telah dibuat untuk email ini. Berikut kredensial login kamu:</p>

      <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px 18px;font-size:14px">
        <div style="margin-bottom:10px"><span style="color:#a1a1aa">Email&nbsp;&nbsp;&nbsp;&nbsp;:</span> <strong style="color:#e4e4e7">${escapeHtml(email)}</strong></div>
        <div style="margin-bottom:10px"><span style="color:#a1a1aa">Password:</span> <strong style="color:#e4e4e7;font-family:monospace">${escapeHtml(password)}</strong></div>
        <div><span style="color:#a1a1aa">Role&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> <strong style="color:#e4e4e7">${escapeHtml(roleLabel)}</strong></div>
      </div>

      <a href="${loginUrl}" style="display:inline-block;background:#f4f4f5;color:#18181b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px;margin-top:20px">🔐 Masuk ke Dashboard Admin</a>

      <p style="font-size:11px;color:#71717a;margin-top:24px;border-top:1px solid #27272a;padding-top:16px;line-height:1.6">
        ⚠️ Simpan kredensial ini baik-baik dan segera ganti password setelah login pertama.
        Jangan pernah membagikannya kepada siapa pun.<br/>
        © ${new Date().getFullYear()} IPAN STORE
      </p>
    </div>
  </div>`;

  try {
    await emailTransporter.sendMail({
      from: MAIL_FROM,
      to: safeTo,
      subject: "🔐 Akun Admin IPAN STORE — Kredensial Login Kamu",
      html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Middleware: proteksi endpoint admin via JWT sesi Supabase ────────────────
// Header wajib: `Authorization: Bearer <access_token>` dari sesi admin yang login.
//
// ⚠️ SEJARAH KEAMANAN — JANGAN DIULANGI:
// Dulu endpoint ini diproteksi shared secret (x-admin-secret) yang nilainya juga
// disimpan di frontend lewat VITE_ADMIN_API_SECRET. Semua variabel VITE_* ikut
// ter-inline ke bundle JS publik saat build → nilai secret itu bisa dibaca siapa
// pun dari DevTools ipanstore.id, sehingga siapa pun bisa membuat akun admin.
// Sekarang TIDAK ADA lagi rahasia statis di browser: token berasal dari sesi
// user (berumur pendek, per-user, bisa dicabut) dan diverifikasi ke Supabase.
//
// Payload JWT tidak dipercaya mentah — selalu divalidasi ke /auth/v1/user
// (server-to-server) agar tanda tangan & masa berlaku token benar-benar dicek.
const ADMIN_ROLES = new Set(["super_admin", "viewer"]);

async function verifySupabaseUser(accessToken) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!r.ok) return null;
  const user = await r.json().catch(() => null);
  return user?.id && user?.email ? user : null;
}

/**
 * Cek apakah email terdaftar di whitelist `admin_users`.
 * Mengembalikan baris admin (termasuk role) atau null.
 */
async function findAdminByEmail(email) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, role")
    .eq("email", String(email).trim().toLowerCase())
    .maybeSingle();
  if (error) {
    console.error("❌ findAdminByEmail error:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Middleware: hanya admin terautentikasi (sesi Supabase + whitelist) yang lolos.
 * Set `req.admin = { id, email, role }` untuk dipakai handler.
 */
async function requireAdmin(req, res, next) {
  try {
    const auth = String(req.headers["authorization"] || "");
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return res.status(401).json({ success: false, message: "Sesi admin tidak ditemukan. Silakan login ulang." });
    }

    const user = await verifySupabaseUser(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi admin tidak valid atau sudah kedaluwarsa." });
    }

    const admin = await findAdminByEmail(user.email);
    if (!admin) {
      console.warn(`⚠️ Akses admin ditolak (tidak ada di admin_users): ${user.email}`);
      return res.status(403).json({ success: false, message: "Akun ini tidak terdaftar sebagai admin." });
    }

    const role = ADMIN_ROLES.has(String(admin.role)) ? String(admin.role) : "super_admin";
    req.admin = { id: admin.id, email: admin.email, role };
    return next();
  } catch (e) {
    console.error("[requireAdmin] error:", e);
    return res.status(401).json({ success: false, message: "Gagal memverifikasi sesi admin." });
  }
}

/** Khusus operasi yang butuh super_admin (mis. membuat admin baru). */
function requireSuperAdminRole(req, res, next) {
  if (req.admin?.role !== "super_admin") {
    return res.status(403).json({ success: false, message: "Aksi ini khusus super admin." });
  }
  return next();
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
app.use("/api/doku-webhook", express.raw({ type: "*/*" }));

// Body parser JSON untuk endpoint lain
app.use(express.json());

// ── Rate Limiting Middleware ─────────────────────────────────────────────────
// Proteksi abuse: enumeration promo, spam order, brute force.
// Keyed by IP (req.ip). Standard RateLimit headers dikirim ke client.
// SECURITY FIX #8 — pakai IP pengunjung asli (di belakang Cloudflare Tunnel).
//
// ⚠️ HARDENING: header `CF-Connecting-IP` HANYA boleh dipercaya bila request
// benar-benar datang dari hop lokal (cloudflared di mesin yang sama). Kalau
// backend suatu saat bisa dijangkau langsung (port VPS terbuka, port-forward,
// SSRF), penyerang cukup mengirim header acak untuk mem-bypass SEMUA rate limit
// (orderLimiter, promoLimiter, apiLimiter). Sekarang hop di luar loopback
// dipaksa memakai `req.ip` — tidak bisa dipalsukan lewat header.
const TRUSTED_PROXY_ADDRS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function ipKeyGenerator(req) {
  const hop = String(req.socket?.remoteAddress || "");
  const fromTrustedProxy = TRUSTED_PROXY_ADDRS.has(hop);
  const cfIp = req.headers?.["cf-connecting-ip"];
  if (fromTrustedProxy && typeof cfIp === "string" && cfIp.trim()) {
    return cfIp.trim();
  }
  return req.ip || hop || "unknown";
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

// ── Klasifikasi produk SettinX ───────────────────────────────────────────────
// Mengembalikan 'module_1_1' (Ipan Module SettinX 1.1, link MediaFire),
// 'app_v1' (IPAN APP SettinX V1, kredensial Firebase), atau null (bukan SettinX).
// Prioritas module dulu krn nama "Ipan Module SettinX 1.1" ikut cocok dgn /settinx/i.
async function classifySettinxProduct(order, svcSlugName = {}) {
  const haystack =
    `${order?.invoice_number || ""} ${order?.item_name || ""} ${order?.package_name || ""} ` +
    `${order?.service_name || ""} ${order?.notes || ""} ` +
    `${svcSlugName.slug || ""} ${svcSlugName.name || ""}`;
  const s = haystack.toLowerCase();

  // /module/i bisa nyangkut di invoice seperti "IPANIPANMODULE..." / slug "ipanmodule"
  // (tanpa word boundary) → jangan pakai \b. Tidak ada service lain bernama "module",
  // jadi aman. 1.1 bisa ditulis "SettinX 1.1", "settinx-1-1", dikapitalisasi, dsb.
  if (/module/i.test(s) || /settinx\s*1\s*[.\-]?\s*1/i.test(s)) return "module_1_1";
  if (/settinx|app[-\s]?settinx/i.test(s)) return "app_v1";
  return null;
}

// ── Resolve kredensial SettinX untuk email ───────────────────────────────────
// Urutan: buat/pakai ulang via assignSettinxLicense (rotate password bila reuse).
// Jika membuat akun gagal tapi license lama ada → rotateSettinxPassword sebagai
// fallback (menghasilkan password segar). Tidak pernah bergantung pada password
// yang disimpan (plaintext sudah dihapus dari Firestore).
async function resolveSettinxCredentials(customerEmail, customerName, invoiceNumber) {
  try {
    return await assignSettinxLicense({ customerEmail, customerName, invoiceNumber });
  } catch (e) {
    console.warn(`resolveSettinxCredentials: assignSettinxLicense gagal (${e.message}) — coba rotate license lama.`);
  }
  try {
    return await rotateSettinxPassword(customerEmail);
  } catch (e2) {
    if (e2.code !== "LICENSE_NOT_FOUND") {
      console.warn(`resolveSettinxCredentials: rotateSettinxPassword gagal (${e2.message}).`);
    }
  }
  return null;
}

// ── Cek Status Order Publik ─────────────────────────────────────────────────
// Endpoint publik untuk halaman "Lacak Order" (/cek-order). Response MINIMAL
// (tanpa email/nama lengkap/amount) demi privasi — hanya status & ringkasan.
app.get("/api/order-status/:orderId", apiLimiter, async (req, res) => {
  try {
    const orderId = String(req.params.orderId || "").trim();
    if (!isValidOrderId(orderId)) {
      return res.status(400).json({ success: false, message: "Format orderId tidak valid." });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, message: "Layanan belum tersedia." });
    }
    const order = await getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order tidak ditemukan." });
    }
    return res.json({
      success: true,
      orderId,
      status: order.status || "PENDING",
      packageName: order.package_name || order.item_name || order.service_name || null,
      paymentMethod: order.payment_method || "QRIS",
      createdAt: order.created_at || null,
    });
  } catch (e) {
    console.error("order-status error:", e);
    return res.status(500).json({ success: false, message: "Internal server error." });
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

// ── Fulfillment order DOKU (dipakai webhook & endpoint cek-status) ───────────
// Satu tempat untuk: tandai PAID → buat lisensi SettinX → kirim email kredensial.
// Dipakai oleh:
//   1. POST /api/doku-webhook  (jalur utama saat DOKU mengirim notifikasi)
//   2. GET  /api/doku-status   (fallback saat webhook telat / tidak sampai)
// Dengan satu fungsi, kedua jalur tidak mungkin berperilaku berbeda.
async function fulfillDokuOrder(order, payload, invoiceNumber) {
  if (!order) {
    console.warn(`⚠️  fulfillDokuOrder: order ${invoiceNumber} tidak ditemukan — dilewati.`);
    return { ok: false, reason: "order_not_found" };
  }

  const invoice = order.invoice_number || invoiceNumber;
  const amount = payload?.order?.amount || order.amount;
  const tokenId = payload?.transaction?.token_id || payload?.transaction?.id || "";
  // Kanal pembayaran (QRIS / VIRTUAL_ACCOUNT_BNI / EMONEY_DANA / …) untuk laporan admin.
  const channel =
    payload?.channel?.id ||
    payload?.acquirer?.id ||
    payload?.service?.id ||
    payload?.payment?.payment_method ||
    "";

  // Anti double-fulfillment: bila sudah PAID/COMPLETED, jangan kirim lisensi/email lagi.
  const current = String(order.status || "").toUpperCase();
  if (current === "PAID" || current === "COMPLETED") {
    console.log(`⏭️  fulfillDokuOrder: order ${invoice} sudah ${current} — fulfillment diabaikan.`);
    return { ok: false, reason: "already_paid" };
  }

  // 1) Tandai lunas.
  await updateOrder(invoice, {
    status: "PAID",
    paid_at: new Date().toISOString(),
    webhook_payload: payload,
    doku_transaction_id: tokenId || order.doku_transaction_id,
    ...(channel ? { doku_payment_channel: String(channel).slice(0, 64) } : {}),
  });

  // 2) Fulfillment SettinX (App V1 / Module 1.1).
  let svcSlugName = { slug: "", name: "" };
  if (order.service_id && supabase) {
    const { data: svc } = await supabase
      .from("services")
      .select("slug, name")
      .eq("id", order.service_id)
      .single();
    if (svc) svcSlugName = { slug: svc.slug || "", name: svc.name || "" };
  }
  const productType = await classifySettinxProduct(order, svcSlugName);

  if (productType === "module_1_1" && order.customer_email) {
    console.log(`📧 Mengirim email Module SettinX ke ${order.customer_email} (invoice ${invoice})...`);
    let moduleCredentials = null;
    let moduleLicenseErr = null;
    try {
      moduleCredentials = await assignModuleSettinxLicense({
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        invoiceNumber: invoice,
      });
    } catch (e) {
      moduleLicenseErr = e.message;
      console.error(`⚠️  Module SettinX license GAGAL untuk ${order.customer_email}:`, e.message);
    }

    const moduleResult = await sendModuleSettinxEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      invoiceNumber: invoice,
      amount,
      paidAt: order.paid_at,
      credentials: moduleCredentials,
    });

    if (moduleResult.ok) {
      await updateOrder(invoice, {
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        settinx_type: "module_1_1",
        settinx_license_uid: moduleCredentials?.uid || order.settinx_license_uid || null,
        settinx_license_error: moduleLicenseErr || null,
      });
      console.log(`📧 Email Module SettinX TERKIRIM: ${order.customer_email} (invoice ${invoice})`);
      return { ok: true, productType };
    }
    console.error(`📧 Email Module SettinX GAGAL ke ${order.customer_email}: ${moduleResult.error}`);
    return { ok: false, productType, error: moduleResult.error };
  }

  if (productType === "app_v1" && order.customer_email) {
    console.log(`📧 Mengirim email SettinX ke ${order.customer_email} (invoice ${invoice})...`);
    let credentials = null;
    let licenseUid = null;
    let licenseErr = null;
    try {
      const lic = await resolveSettinxCredentials(
        order.customer_email,
        order.customer_name,
        invoice
      );
      if (!lic) throw new Error("Tidak ada kredensial SettinX yang tersedia.");
      credentials = lic;
      licenseUid = lic.licenseKey;
    } catch (e) {
      licenseErr = e.message;
      console.error(`⚠️  SettinX license GAGAL untuk ${order.customer_email}:`, e.message);
    }

    const result = await sendSettinXEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      invoiceNumber: invoice,
      amount,
      paidAt: order.paid_at,
      credentials,
    });

    if (result.ok) {
      await updateOrder(invoice, {
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        settinx_license_uid: licenseUid || order.settinx_license_uid || null,
        settinx_license_error: licenseErr || null,
      });
      console.log(`📧 Email SettinX TERKIRIM: ${order.customer_email} (invoice ${invoice})`);
      return { ok: true, productType };
    }
    console.error(`📧 Email SettinX GAGAL ke ${order.customer_email}: ${result.error}`);
    return { ok: false, productType, error: result.error };
  }

  if (productType) {
    console.warn(`⚠️  SettinX SUCCESS tapi email tidak dikirim: email=${order.customer_email || "KOSONG"}`);
  }
  return { ok: true, productType: productType || null };
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

    // ── OVERRIDE E2E (khusus non-produksi) ──────────────────────────────────
    // Memungkinkan uji end-to-end dengan nominal kecil TANPA mengubah harga di
    // tabel `services`.
    //
    // ⚠️ FAIL-CLOSED (patch keamanan): sebelumnya cukup flag
    // DOKU_ALLOW_TEST_AMOUNT=true, sehingga kalau flag itu tidak sengaja ikut
    // ter-set di VPS produksi, pembeli bisa membayar Rp 1.000 untuk produk
    // Rp 50.000 (uang hilang langsung). Sekarang override HANYA mungkin bila
    // DOKU_BASE_URL memang sandbox. Di produksi flag itu diabaikan sepenuhnya.
    const isSandboxEnv = /sandbox/i.test(DOKU_BASE_URL);
    const allowTestAmount =
      process.env.DOKU_ALLOW_TEST_AMOUNT === "true" && isSandboxEnv;
    if (process.env.DOKU_ALLOW_TEST_AMOUNT === "true" && !isSandboxEnv) {
      console.warn(
        "⛔ DOKU_ALLOW_TEST_AMOUNT=true DIABAIKAN: DOKU_BASE_URL bukan sandbox (mode produksi)."
      );
    }
    const requestedAmount = Number(amount);
    if (
      allowTestAmount &&
      Number.isFinite(requestedAmount) &&
      requestedAmount >= 1000 &&
      requestedAmount < basePrice
    ) {
      console.warn(
        `🧪 E2E override aktif: harga DB ${basePrice} → ${requestedAmount} (DOKU_ALLOW_TEST_AMOUNT=true)`
      );
      basePrice = requestedAmount;
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
      // JANGAN kirim `raw` ke browser — berisi token_id/request_id DOKU.
      return res.status(r.status).json({ success: false, message: errMsg });
    }

    const paymentUrl = data?.response?.payment?.url;
    if (!paymentUrl) {
      console.error("doku-create-order: tidak ada payment.url:", JSON.stringify(data));
      return res.status(502).json({
        success: false,
        message: "Respons DOKU tidak berisi URL pembayaran.",
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
      // Channel sebenarnya baru diketahui setelah pembeli memilih metode di
      // halaman DOKU → di-update oleh fulfillDokuOrder. Nilai awal "DOKU"
      // agar laporan admin tahu order ini lewat jalur DOKU.
      doku_payment_channel: "DOKU",
      // Tabel `orders` TIDAK punya kolom item_name/package_name. Nama produk
      // disimpan di `notes` agar fulfillDokuOrder tetap bisa mengklasifikasi
      // produk SettinX walau service_id gagal di-resolve.
      notes: String(item_name || "").slice(0, 255) || null,
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
    return res.json({
      success: true,
      order_id: invoiceNumber,
      checkout_url: paymentUrl,
      amount: finalAmount,
      // JANGAN kirim respons mentah DOKU (token_id, request_id) ke browser.
      // Detail lengkap sudah dicatat di log server di atas.
    });
  } catch (e) {
    console.error("doku-create-order error:", e);
    return res.status(500).json({
      success: false,
      message: "Gagal menghubungi DOKU.",
    });
  }
});
// ── Cek Status DOKU (polling fallback saat webhook telat) ────────────────────
// Frontend memanggil endpoint ini setelah pembeli kembali dari halaman DOKU,
// karena webhook bisa tertunda beberapa detik/menit. Endpoint ini:
//   1. Baca order dari Supabase (sumber kebenaran status kita).
//   2. Jika masih PENDING, tanya DOKU Check Status API (SNAP non-SNAP path).
//   3. Bila DOKU bilang SUCCESS tapi webhook belum masuk → sinkronkan status.
// GET /api/doku-status/:orderId
app.get("/api/doku-status/:orderId", apiLimiter, async (req, res) => {
  try {
    const orderId = String(req.params.orderId || "").trim();
    if (!isValidOrderId(orderId)) {
      return res.status(400).json({ success: false, message: "Format orderId tidak valid." });
    }

    // 1) Status lokal dulu (cepat & tidak membebani DOKU).
    const order = await getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order tidak ditemukan." });
    }

    const localStatus = String(order.status || "PENDING").toUpperCase();
    const alreadyFinal = localStatus === "PAID" || localStatus === "COMPLETED";
    if (alreadyFinal) {
      return res.json({
        success: true,
        orderId,
        status: localStatus,
        paid: true,
        source: "local",
      });
    }

    // 2) Tanya DOKU bila kredensial tersedia.
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      return res.json({ success: true, orderId, status: localStatus, paid: false, source: "local" });
    }

    const invoiceNumber = String(order.invoice_number || orderId);
    // Request-Target harus persis path yang di-hit (tanpa query string).
    // Invoice kita sudah alfanumerik, jadi tidak perlu encode.
    const requestTarget = `/orders/v1/status/${invoiceNumber}`;
    const requestId = crypto.randomUUID();
    const requestTimestamp = dokuTimestamp();
    // GET tidak punya body → baris Digest DIHILANGKAN dari komponen signature.
    const signature = generateDokuSignature({
      clientId: DOKU_CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget,
    });

    const r = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
      method: "GET",
      headers: {
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        "Signature": signature,
      },
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.warn("doku-status DOKU error:", JSON.stringify(data).slice(0, 300));
      return res.json({ success: true, orderId, status: localStatus, paid: false, source: "local" });
    }

    const txStatus = String(data?.transaction?.status || data?.order?.status || "").toUpperCase();
    const isPaidRemotely = txStatus === "SUCCESS";

    // 3) Webhook belum masuk tapi DOKU sudah SUCCESS → sinkronkan.
    if (isPaidRemotely && !alreadyFinal) {
      console.log(`🔄 doku-status: order ${invoiceNumber} SUCCESS di DOKU tapi lokal ${localStatus} → sinkron ke PAID`);
      try {
        await fulfillDokuOrder(order, data, invoiceNumber);
      } catch (e) {
        console.error("doku-status: gagal sinkron status:", e?.message || e);
      }
      return res.json({ success: true, orderId, status: "PAID", paid: true, source: "doku-sync" });
    }

    return res.json({
      success: true,
      orderId,
      status: localStatus,
      paid: false,
      dokuStatus: txStatus || null,
      source: "doku",
    });
  } catch (e) {
    console.error("doku-status error:", e);
    return res.status(500).json({ success: false, message: "Gagal mengecek status pembayaran." });
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
        // Order tidak ada di DB — catat minimal dari payload webhook.
        // Tidak dibuat otomatis menjadi PAID agar tidak ada produk terkirim
        // untuk invoice yang tidak pernah kita buat sendiri.
        console.warn(`⚠️  Webhook SUCCESS untuk invoice tak dikenal: ${invoice}`);
        await saveOrder({
          invoice_number: invoice || `UNKNOWN-${Date.now()}`,
          amount: Number(amount) || 0,
          status: "PENDING",
          doku_transaction_id: payload?.transaction?.token_id || "",
          webhook_payload: payload,
          notes: "Invoice tidak dikenal — perlu verifikasi manual admin.",
        });
      } else {
        // Satu pintu fulfillment (sama persis dengan GET /api/doku-status).
        await fulfillDokuOrder(order, payload, invoice);
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
//
// ⚠️ PATCH KEAMANAN: endpoint ini sebelumnya TANPA autentikasi sama sekali —
// siapa pun yang tahu invoice_number bisa membatalkan pesanan orang lain.
// Sekarang wajib sesi admin (Bearer JWT + whitelist admin_users).
app.post("/api/doku-cancel-order", requireAdmin, async (req, res) => {
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
      return res.status(r.status).json({ success: false, message: data.message?.[0] || `HTTP ${r.status}` });
    }
    console.log(`✅ Order dibatalkan: ${invoice_number}`);
    
    // Update status di Supabase
    await updateOrder(invoice_number, { status: "REFUNDED", refunded_at: new Date().toISOString() });
    
    return res.json({ success: true });
  } catch (e) {
    console.error("doku-cancel-order error:", e);
    return res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Gagal." });
  }
});

// ── Resend kredensial SettinX (manual dari dashboard admin) ───────────────────
// Untuk order SettinX yang emailnya gagal terkirim / pembeli minta dikirim ulang.
// Generate atau reuse license (by customer email), lalu kirim ulang email berisi
// kredensial. Idempotent: jika kredensial sudah ada, tidak membuat akun ganda.
app.post("/api/settinx/resend", requireAdmin, async (req, res) => {
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
    let svcSlugName = { slug: "", name: "" };
    if (order.service_id && supabase) {
      const { data: svc } = await supabase
        .from("services")
        .select("slug, name")
        .eq("id", order.service_id)
        .single();
      if (svc) svcSlugName = { slug: svc.slug || "", name: svc.name || "" };
    }
    const productType = await classifySettinxProduct(order, svcSlugName);
    if (!productType) {
      return res.status(400).json({ success: false, message: "Order ini bukan produk SettinX." });
    }
    if (!isValidEmail(order.customer_email)) {
      return res.status(400).json({ success: false, message: "Order tidak memiliki email pembeli yang valid." });
    }

    // ── Produk "Ipan Module SettinX 1.1": generate akun + license baru ─────
    // Setiap kirim ulang membuat AKUN BARU (ID berbeda) + license key BARU.
    // Akun lama TIDAK diubah (password lama tetap hidup) — sesuai keputusan user.
    if (productType === "module_1_1") {
      let moduleCredentials = null;
      let moduleLicenseErr = null;
      try {
        moduleCredentials = await assignModuleSettinxLicense({
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          invoiceNumber: order.invoice_number,
        });
      } catch (e) {
        moduleLicenseErr = e.message;
        console.error(`🔁 Module SettinX generate GAGAL utk ${order.customer_email}:`, e.message);
      }

      if (!moduleCredentials) {
        return res.status(502).json({
          success: false,
          message: `Gagal menyiapkan kredensial Module SettinX: ${moduleLicenseErr || "credential kosong"}`,
        });
      }

      const resendResult = await sendModuleSettinxEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        invoiceNumber: order.invoice_number,
        amount: order.amount,
        paidAt: order.paid_at,
        credentials: moduleCredentials,
      });
      if (!resendResult.ok) {
        return res.status(502).json({ success: false, message: `Gagal kirim email: ${resendResult.error}` });
      }
      await updateOrder(order.invoice_number || order.id, {
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        settinx_type: "module_1_1",
        settinx_license_uid: moduleCredentials.uid || order.settinx_license_uid || null,
        settinx_license_error: moduleLicenseErr || null,
      });
      console.log(`🔁 Module SettinX akun+license baru TERKIRIM: ${order.customer_email} (invoice ${order.invoice_number}, ID ${moduleCredentials.id})`);
      return res.json({ success: true, message: "Akun & kredensial Module SettinX baru berhasil dikirim." });
    }

    // ── Produk "IPAN APP SettinX V1": kredensial Firebase ─────────────────
    // Rotasi password (generate baru) — jangan pernah kirim ulang password lama
    // yang sudah pernah dikirim/di-log. License (UID) tetap sama.
    let credentials = null;
    let licenseErr = null;
    try {
      credentials = await rotateSettinxPassword(order.customer_email);
    } catch (e) {
      licenseErr = e.message;
      console.error(`🔁 SettinX rotate GAGAL utk ${order.customer_email}:`, e.message);
      // License belum ada → buat baru sekalian (email + license masih kosong di rekaman).
      if (e.code === "LICENSE_NOT_FOUND") {
        try {
          credentials = await assignSettinxLicense({
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            invoiceNumber: order.invoice_number,
          });
        } catch (createErr) {
          licenseErr = createErr.message;
        }
      }
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
// ── Buat akun admin baru (Auth + whitelist + email kredensial) ───────────────
// Dipanggil dari dashboard admin (halaman Admins). Butuh sesi admin (Bearer JWT)
// dan role super_admin — TIDAK lagi memakai shared secret.
app.post("/api/admin/create", requireAdmin, requireSuperAdminRole, async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanRole = role === "viewer" ? "viewer" : "super_admin";

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Format email tidak valid." });
    }
    if (cleanPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password minimal 8 karakter." });
    }
    if (!supabase) {
      return res.status(500).json({ success: false, message: "Supabase belum dikonfigurasi di server." });
    }

    // 1) Buat akun di Supabase Auth (pakai service role — hanya di server).
    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { role: cleanRole },
    });
    if (authError) {
      const msg = /already (been )?registered|already exists|User already registered/i.test(authError.message)
        ? "Email ini sudah punya akun Auth. Gunakan email lain atau reset password-nya."
        : authError.message;
      return res.status(400).json({ success: false, message: msg });
    }

    // 2) Tambahkan ke whitelist admin_users (abaikan jika sudah ada / duplikat).
    const { error: wlError } = await supabase
      .from("admin_users")
      .upsert({ email: cleanEmail, role: cleanRole }, { onConflict: "email" });
    if (wlError) {
      console.error("[admin/create] gagal upsert whitelist:", wlError.message);
    }

    // 3) Kirim kredensial ke email admin baru via Gmail SMTP.
    const mail = await sendAdminCredentialsEmail({
      to: cleanEmail,
      email: cleanEmail,
      password: cleanPassword,
      role: cleanRole,
    });
    if (!mail.ok) {
      console.error("[admin/create] gagal kirim email:", mail.error);
    }

    return res.json({
      success: true,
      emailSent: !!mail.ok,
      message: mail.ok
        ? `Akun admin ${cleanEmail} dibuat & kredensial terkirim ke email.`
        : `Akun admin ${cleanEmail} dibuat, tapi email kredensial gagal dikirim.`,
    });
  } catch (e) {
    console.error("[admin/create] error:", e);
    return res.status(500).json({ success: false, message: e.message || "Gagal membuat akun admin." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend IPAN STORE jalan di http://localhost:${PORT}`);
  console.log(`   CORS diizinkan untuk: ${ALLOWED_ORIGINS.join(", ")}`);
});