/**
 * Integrasi Payment Gateway Cashi.id
 * (https://cashi.id — Solusi Payment Gateway & QRIS Indonesia)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * RISET CARA INTEGRASI CASHI.ID
 * ────────────────────────────────────────────────────────────────────────────
 * Cashi.id menyediakan API untuk membuat transaksi pembayaran (QRIS, Virtual
 * Account, dan e-Wallet) lengkap dengan dashboard real-time untuk merchant.
 *
 * Alur integrasi standar payment gateway seperti ini adalah:
 *
 *  1. DAFTAR & VERIFIKASI di https://cashi.id/dashboard
 *     → Buat akun merchant, lengkapi data bisnis/KYC.
 *
 *  2. AMBIL API KEY dari dashboard
 *     → Biasanya ada di menu "Developer" / "API Keys" / "Integrasi".
 *     → Ada 2 mode: SANDBOX (untuk testing) dan PRODUCTION (live).
 *
 *  3. SET ENV VARIABEL di project ini (file `.env`):
 *        VITE_CASHI_API_KEY=sk_live_xxxxxxxxxxxx     (API key dari dashboard)
 *        VITE_CASHI_BASE_URL=https://api.cashi.id    (base URL API, jika ada)
 *
 *  4. BUAT TRANSAKSI lewat fungsi `createCashiPayment()` di file ini.
 *     → Server Cashi mengembalikan `checkout_url` / `payment_url`.
 *     → User diarahkan (redirect) ke URL itu untuk membayar (scan QRIS /
 *       transfer VA / bayar e-wallet).
 *
 *  5. WEBHOOK / CALLBACK (opsional, untuk konfirmasi otomatis)
 *     → Daftarkan URL webhook di dashboard Cashi agar Cashi memberi tahu
 *       website saat pembayaran BERHASIL/GAGAL.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CATATAN PENTING TENTANG ARSITEKTUR WEBSITE INI
 * ────────────────────────────────────────────────────────────────────────────
 * Website IPAN STORE saat ini adalah FRONT-END STATIS (React + Vite, tanpa
 * backend/server). Payment gateway yang AMAN sebenarnya memerlukan BACKEND,
 * karena API KEY bersifat RAHASIA dan tidak boleh terekspos di browser.
 *
 * Dua opsi implementasi:
 *
 *  OPSI A (disarankan, aman): lewat backend ringan (serverless function /
 *  VPS kecil) yang memegang API KEY dan memanggil API Cashi. Frontend hanya
 *  memanggil backend Anda, bukan Cashi langsung.
 *
 *  OPSI B (cepat, untuk sekarang): jika Cashi menyediakan "Payment Link"
 *  statis per produk dari dashboard, kita cukup menyimpan link itu dan
 *  me-redirect user ke sana — tanpa API key sama sekali. Modul ini mendukung
 *  fallback ke WhatsApp bila API/link belum dikonfigurasi.
 *
 * File ini sudah menyiapkan kerangka lengkap agar tinggal diisi API KEY.
 */

export interface CashiPaymentRequest {
  /** ID unik transaksi dari sisi merchant. */
  orderId: string;
  /** ID paket (kunci ke CASHI_PAYMENT_LINKS), mis. "elite". */
  pkgId?: string;
  /** Nominal dalam Rupiah (angka murni, mis. 75000). */
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  description?: string;
}

export interface CashiPaymentResponse {
  /** URL halaman pembayaran (QRIS/VA/e-wallet) untuk di-redirect ke user. */
  checkoutUrl?: string;
  /** Raw response untuk debugging. */
  raw?: unknown;
  /** Pesan error jika gagal. */
  error?: string;
}

/**
 * URL BACKEND Anda sendiri (server SSH Tailscale) yang memegang API key Cashi.
 * Isi lewat env: VITE_BACKEND_URL=http://<hostname-tailscale>:3001
 * Bila diisi, front-end memanggil backend ini (TANPA API key) — paling aman.
 * Bila kosong, front-end jatuh ke payment link (Cara A) atau API langsung.
 */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

/** Base URL API Cashi langsung (hanya untuk Cara B-tanpa-backend / testing). */
export const CASHI_BASE_URL =
  (import.meta.env.VITE_CASHI_BASE_URL as string) || "https://cashi.id";

/** Endpoint untuk membuat order (sama di backend Anda maupun Cashi). */
export const CASHI_CREATE_TX_PATH = "/api/create-order";

/** API Key dari env. HANYA untuk testing lokal — produksi harus via backend. */
const CASHI_API_KEY = (import.meta.env.VITE_CASHI_API_KEY as string) || "";

/** Apakah API key dikonfigurasi langsung di front-end (mode testing). */
export const isCashiConfigured = Boolean(CASHI_API_KEY);

/** Apakah backend sendiri sudah dikonfigurasi (mode produksi yang aman). */
export const isBackendConfigured = Boolean(BACKEND_URL);

/**
 * Payment link per produk dari dashboard Cashi (menu "Buat Produk").
 * Bila ada, frontend langsung redirect ke link ini — tanpa API key, tanpa backend.
 * Ini cara tercepat & aman untuk front-end statis.
 */
export const CASHI_PAYMENT_LINKS: Record<string, string> = {
  "set-pc":          "https://cashi.id/go/set-pc-7o03",
  "custom-ff":       "https://cashi.id/go/custom-ff-emulator-0kpq",
  "standart":        "https://cashi.id/go/optimize-standart-2ypp",
  "elite":           "https://cashi.id/go/optimize-elite-guba",
  "extreme":         "https://cashi.id/go/optimize-extreme-hxso",
  "anti-cheat-laga": "https://cashi.id/go/anticheat-laga-d45w",
  "app-settinx":     "https://cashi.id/go/ipan-app-settinx-v1-1d7m",
};

/** Placeholder URL checkout (dipakai bila tidak ada). */
export const CASHI_CHECKOUT_URL = "";

/**
 * Membuat transaksi pembayaran di Cashi.id dan mengembalikan URL checkout.
 * Mengembalikan `{ checkoutUrl }` bila sukses; bila belum dikonfigurasi /
 * gagal, mengembalikan `{ error }` agar caller bisa fallback (mis. WhatsApp).
 */
export async function createCashiPayment(
  req: CashiPaymentRequest
): Promise<CashiPaymentResponse> {
  const key = req.pkgId ?? "";

  // ── PRIORITAS 1: Backend sendiri (Cara B — paling aman, otomatis) ──────────
  // Front-end memanggil server Anda; server yang menambahkan API key rahasia.
  if (isBackendConfigured) {
    try {
      const res = await fetch(`${BACKEND_URL}${CASHI_CREATE_TX_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: req.amount,
          order_id: req.orderId,
          customer_name: req.customerName,
          customer_email: req.customerEmail,
          customer_phone: req.customerPhone,
          item_name: req.itemName,
          description: req.description,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || data.success === false) {
        return {
          error: (data.message as string) || (data.error as string) || `Backend error (HTTP ${res.status})`,
          raw: data,
        };
      }
      const url = extractCheckoutUrl(data);
      if (url) return { checkoutUrl: url, raw: data };
      // Backend jalan tapi tak ada URL → lanjut ke payment link sebagai cadangan.
    } catch (e) {
      // Backend tak terjangkau → lanjut ke payment link sebagai cadangan.
      console.warn("Backend tidak terjangkau, pakai payment link:", e);
    }
  }

  // ── PRIORITAS 2: Payment link per produk (Cara A — tanpa backend) ──────────
  const staticLink = CASHI_PAYMENT_LINKS[key];
  if (staticLink) return { checkoutUrl: staticLink };

  // ── PRIORITAS 3: API Cashi langsung (testing lokal saja) ───────────────────
  if (!isCashiConfigured) {
    return { error: "Belum dikonfigurasi: backend, payment link, & API key semuanya kosong." };
  }

  try {
    const res = await fetch(`${CASHI_BASE_URL}${CASHI_CREATE_TX_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CASHI_API_KEY,
      },
      body: JSON.stringify({
        amount: req.amount,
        order_id: req.orderId,
        customer_name: req.customerName,
        customer_email: req.customerEmail,
        customer_phone: req.customerPhone,
        item_name: req.itemName,
        description: req.description,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.success === false) {
      return {
        error:
          (data.message as string) ||
          (data.error as string) ||
          `Cashi error (HTTP ${res.status})`,
        raw: data,
      };
    }

    const checkoutUrl = extractCheckoutUrl(data);

    if (checkoutUrl) return { checkoutUrl, raw: data };
    return { error: "Respons Cashi tidak berisi URL pembayaran.", raw: data };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Gagal menghubungi Cashi.",
    };
  }
}

/** Ambil URL pembayaran dari berbagai kemungkinan field respons Cashi. */
function extractCheckoutUrl(data: Record<string, unknown>): string | undefined {
  const inner = (data.data as Record<string, unknown>) || {};
  return (
    (data.payment_url as string) ||
    (data.checkout_url as string) ||
    (data.invoice_url as string) ||
    (data.redirect_url as string) ||
    (data.qris_url as string) ||
    (inner.payment_url as string) ||
    (inner.checkout_url as string) ||
    (inner.invoice_url as string) ||
    (inner.redirect_url as string) ||
    undefined
  );
}
