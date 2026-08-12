/**
 * Integrasi Payment Gateway DOKU — DOKU Checkout
 * (https://developers.doku.com/accept-payments/doku-checkout.md)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ALUR PAYMENT GATEWAY DOKU (DOKU Checkout)
 * ────────────────────────────────────────────────────────────────────────────
 * DOKU Checkout adalah produk "Payment Page" dari DOKU: sekali integrasi,
 * pelanggan disuguhi halaman pembayaran dari DOKU yang berisi banyak metode
 * sekaligus (QRIS, Virtual Account, e-Wallet, Credit Card, Alfamart, dll).
 *
 *  Alur lengkapnya:
 *
 *  1. DAFTAR & VERIFIKASI (KYC) di https://dashboard.doku.com
 *     → Akun sudah dibuat & KYC sudah disetujui oleh DOKU. ✓
 *
 *  2. AMBIL KREDENSIAL dari Dashboard DOKU → Integrations → API Keys
 *     → CLIENT_ID  (contoh: MCH-0001-xxxxxxxxxxxxxx)
 *     → SECRET_KEY (RAHASIA — tidak boleh pernah bocor ke browser)
 *     → Ada 2 environment: SANDBOX (testing) & PRODUCTION (live).
 *
 *  3. SETUP NOTIFICATION URL di Dashboard DOKU (untuk webhook/konfirmasi
 *     pembayaran otomatis) → Integrations → Notifications → Notification URL.
 *
 *  4. BACKEND membuat transaksi via API:
 *       POST https://api-sandbox.doku.com/checkout/v1/payment   (sandbox)
 *       POST https://api.doku.com/checkout/v1/payment           (production)
 *     Header wajib: Client-Id, Request-Id, Request-Timestamp, Signature
 *     → Server membalas dengan `response.payment.url` (halaman checkout DOKU).
 *
 *  5. FRONTEND mengarahkan user ke `payment.url` tersebut
 *     → Redirect langsung, atau popup via DOKU Checkout JS (jokul-checkout).
 *
 *  6. NOTIFIKASI (webhook): saat pembayaran berhasil, DOKU mengirim POST ke
 *     Notification URL dengan header + body JSON (transaction.status = SUCCESS).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * KENAPA WAJIB VIA BACKEND?
 * ────────────────────────────────────────────────────────────────────────────
 * Signature header memakai SECRET_KEY. Menaruh SECRET_KEY di front-end =
 * mengundang orang lain memakai kredensial Anda. Karena itu modul ini memanggil
 * BACKEND Anda sendiri (VITE_BACKEND_URL) — server yang memegang rahasia DOKU.
 *
 * Cadangan bila backend belum aktif: DOKU Payment Link statis (bisa dibuat di
 * dashboard DOKU → menu Payment Link) yang disimpan di DOKU_PAYMENT_LINKS.
 */

export interface DokuPaymentRequest {
  /** ID unik transaksi dari sisi merchant (menjadi invoice_number DOKU). */
  orderId: string;
  /** ID paket (kunci ke DOKU_PAYMENT_LINKS), mis. "elite". */
  pkgId?: string;
  /** Nominal dalam Rupiah (angka murni, mis. 75000). */
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  description?: string;
}

export interface DokuPaymentResponse {
  /** URL halaman pembayaran DOKU (checkout page) untuk di-redirect ke user. */
  checkoutUrl?: string;
  /** Raw response untuk debugging. */
  raw?: unknown;
  /** Pesan error jika gagal. */
  error?: string;
}

/**
 * URL BACKEND Anda sendiri (VPS / server Tailscale) yang memegang Client ID &
 * Secret Key DOKU. Isi lewat env: VITE_BACKEND_URL=http://<hostname>:3001
 * Bila diisi, front-end memanggil backend ini (TANPA secret apa pun) — aman.
 * Bila kosong, front-end jatuh ke DOKU_PAYMENT_LINKS sebagai cadangan.
 */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

/** Endpoint untuk membuat order di backend Anda. */
export const DOKU_CREATE_TX_PATH = "/api/doku-create-order";

/** Apakah backend sendiri sudah dikonfigurasi (mode produksi yang aman). */
export const isBackendConfigured = Boolean(BACKEND_URL);

/**
 * DOKU Payment Link statis per produk (dibuat di Dashboard DOKU).
 * Bila ada, frontend langsung redirect ke link ini — tanpa backend.
 * Cara tercepat untuk front-end statis; nominal di kunci oleh DOKU.
 * Format contoh: "https://checkout.doku.com/payment/<kode-unik>"
 */
export const DOKU_PAYMENT_LINKS: Record<string, string> = {
  "set-pc": "",
  "custom-ff": "",
  "standart": "",
  "elite": "",
  "extreme": "",
  "anti-cheat-laga": "",
  "app-settinx": "",
};

/**
 * Membuat transaksi pembayaran DOKU dan mengembalikan URL checkout.
 * Mengembalikan `{ checkoutUrl }` bila sukses; bila belum dikonfigurasi /
 * gagal, mengembalikan `{ error }` agar caller bisa fallback (mis. WhatsApp).
 */
export async function createDokuPayment(
  req: DokuPaymentRequest
): Promise<DokuPaymentResponse> {
  const key = req.pkgId ?? "";

  // ── PRIORITAS 1: Backend sendiri (paling aman — signature di server) ───────
  if (isBackendConfigured) {
    try {
      const res = await fetch(`${BACKEND_URL}${DOKU_CREATE_TX_PATH}`, {
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
          error:
            (data.message as string) ||
            (data.error as string) ||
            `Backend error (HTTP ${res.status})`,
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

  // ── PRIORITAS 2: DOKU Payment Link statis (tanpa backend) ───────────────────
  const staticLink = DOKU_PAYMENT_LINKS[key];
  if (staticLink) return { checkoutUrl: staticLink };

  // ── FALLBACK: tidak ada yang dikonfigurasi ──────────────────────────────────
  return {
    error:
      "Belum dikonfigurasi: isi VITE_BACKEND_URL (backend DOKU) atau DOKU_PAYMENT_LINKS.",
  };
}

/**
 * Ambil URL pembayaran dari respons DOKU Checkout.
 * Format respons sukses DOKU:
 *   { message: ["SUCCESS"], response: { payment: { url: "...", token_id: "..." } } }
 * Juga toleran terhadap format generic { checkout_url } / { payment_url }.
 */
function extractCheckoutUrl(data: Record<string, unknown>): string | undefined {
  const response = data.response as Record<string, unknown> | undefined;
  const payment = response?.payment as Record<string, unknown> | undefined;
  return (
    (payment?.url as string) ||
    (data.checkout_url as string) ||
    (data.payment_url as string) ||
    undefined
  );
}
