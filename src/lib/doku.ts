/**
 * Integrasi Payment Gateway DOKU — DOKU Checkout
 * (https://developers.doku.com/accept-payments/doku-checkout)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ALUR PAYMENT GATEWAY DOKU (DOKU Checkout)
 * ────────────────────────────────────────────────────────────────────────────
 * DOKU Checkout adalah produk "Payment Page" dari DOKU: sekali integrasi,
 * pelanggan disuguhi halaman pembayaran dari DOKU yang berisi banyak metode
 * sekaligus (QRIS, Virtual Account, e-Wallet, Credit Card, Alfamart, dll).
 *
 *  1. BACKEND membuat transaksi via API DOKU:
 *       POST https://api.doku.com/checkout/v1/payment
 *     Header wajib: Client-Id, Request-Id, Request-Timestamp, Signature
 *     → Server membalas `response.payment.url` (halaman checkout DOKU).
 *
 *  2. FRONTEND mengarahkan user ke `payment.url` tersebut (redirect).
 *
 *  3. NOTIFIKASI (webhook): saat pembayaran berhasil, DOKU mengirim POST ke
 *     Notification URL dengan body JSON (transaction.status = SUCCESS).
 *     Backend lalu memproses fulfillment + kirim email kredensial.
 *
 *  4. POLLING CADANGAN: bila webhook telat, frontend memanggil
 *     GET /api/doku-status/:orderId untuk memaksa cek status ke DOKU.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * KENAPA WAJIB VIA BACKEND?
 * ────────────────────────────────────────────────────────────────────────────
 * Signature header memakai SECRET_KEY. Menaruh SECRET_KEY di front-end =
 * mengundang orang lain memakai kredensial Anda. Karena itu modul ini memanggil
 * BACKEND Anda sendiri (VITE_BACKEND_URL) — server yang memegang rahasia DOKU.
 */

export interface DokuPaymentRequest {
  /** ID unik transaksi dari sisi merchant (menjadi invoice_number DOKU). */
  orderId: string;
  /** Nominal dalam Rupiah (angka murni, mis. 75000). */
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  description?: string;
  /** Kode promo (opsional) — divalidasi ulang oleh backend. */
  promoCode?: string;
}

export interface DokuPaymentResponse {
  /** URL halaman pembayaran DOKU (checkout page) untuk di-redirect ke user. */
  checkoutUrl?: string;
  /** Invoice number yang dipakai backend (alfanumerik, tanpa simbol). */
  orderId?: string;
  /** Raw response untuk debugging. */
  raw?: unknown;
  /** Pesan error jika gagal. */
  error?: string;
}

export interface DokuStatusResult {
  /** Status order di sisi kita: PENDING / PAID / COMPLETED / EXPIRED / … */
  status: string;
  /** true bila pembayaran sudah lunas & fulfillment sudah dijalankan. */
  paid: boolean;
  /** Status mentah dari DOKU (bila tersedia). */
  dokuStatus?: string | null;
  /** Asal data: "local" (DB kita), "doku" (tanya DOKU), "doku-sync" (baru disinkron). */
  source?: string;
}

/**
 * URL BACKEND Anda sendiri (server yang memegang Client ID & Secret Key DOKU).
 * Isi lewat env: VITE_BACKEND_URL=https://api.ipanstore.id
 */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

/** Endpoint untuk membuat order di backend Anda. */
export const DOKU_CREATE_TX_PATH = "/api/doku-create-order";

/** Endpoint cek status (polling cadangan bila webhook telat). */
export const DOKU_STATUS_PATH = "/api/doku-status";

/** Apakah backend sendiri sudah dikonfigurasi (mode produksi yang aman). */
export const isBackendConfigured = Boolean(BACKEND_URL);

/**
 * Membuat transaksi pembayaran DOKU dan mengembalikan URL checkout.
 * Mengembalikan `{ checkoutUrl }` bila sukses; bila gagal `{ error }` agar
 * caller bisa menampilkan pesan (mis. arahkan ke WhatsApp).
 */
export async function createDokuPayment(
  req: DokuPaymentRequest
): Promise<DokuPaymentResponse> {
  if (!isBackendConfigured) {
    return {
      error:
        "VITE_BACKEND_URL belum dikonfigurasi. Hubungi admin via WhatsApp untuk menyelesaikan pesanan.",
    };
  }

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
        promo_code: req.promoCode,
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
    if (!url) {
      return {
        error:
          "Backend tidak mengembalikan URL pembayaran DOKU. Hubungi kami via WhatsApp.",
        raw: data,
      };
    }
    return {
      checkoutUrl: url,
      orderId: (data.order_id as string) || req.orderId,
      raw: data,
    };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `Gagal menghubungi server pembayaran: ${e.message}`
          : "Gagal menghubungi server pembayaran.",
    };
  }
}

/**
 * Cek status pembayaran sebuah order.
 *
 * Dipakai setelah pembeli kembali dari halaman DOKU, dan juga sebagai polling
 * cadangan: backend akan menanyakan status langsung ke DOKU bila order masih
 * PENDING, lalu menyinkronkan (fulfillment + email) bila ternyata sudah lunas.
 */
export async function checkDokuStatus(orderId: string): Promise<DokuStatusResult | null> {
  if (!isBackendConfigured || !orderId) return null;
  try {
    const res = await fetch(
      `${BACKEND_URL}${DOKU_STATUS_PATH}/${encodeURIComponent(orderId)}`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.success === false) return null;
    return {
      status: String(data.status || "PENDING"),
      paid: Boolean(data.paid),
      dokuStatus: (data.dokuStatus as string | null) ?? null,
      source: data.source as string | undefined,
    };
  } catch {
    return null;
  }
}

/** Status yang dianggap sudah lunas. */
export function isPaidStatus(status: string | null | undefined): boolean {
  const s = String(status || "").toUpperCase();
  return s === "PAID" || s === "COMPLETED" || s === "SUCCESS";
}

// ── Penyimpanan sesi checkout (bertahan saat pembeli keluar ke halaman DOKU) ──
// Saat pembeli diarahkan ke checkout.doku.com, tab kita ditinggalkan. Setelah
// membayar, DOKU mengarahkan balik ke callback_url (https://ipanstore.id/order)
// TANPA parameter apa pun. Tanpa simpan sesi, pembeli kembali ke form kosong dan
// mengira pembayaran gagal — karena itu invoice + paket disimpan di sini.
const SESSION_KEY = "ipan_doku_pending_v1";

export interface DokuCheckoutSession {
  orderId: string;
  packageId: string;
  packageName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  promoCode: string | null;
  createdAt: number;
}

export function saveCheckoutSession(session: DokuCheckoutSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage penuh / diblokir (mode privat) — abaikan, bukan fatal.
  }
}

export function loadCheckoutSession(): DokuCheckoutSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DokuCheckoutSession;
    if (!data?.orderId) return null;
    // Buang sesi lebih dari 24 jam agar tidak menampilkan order basi.
    if (Date.now() - (data.createdAt || 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearCheckoutSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // abaikan
  }
}

/**
 * Ambil URL pembayaran dari respons DOKU Checkout.
 * Format respons sukses DOKU:
 *   { message: ["SUCCESS"], response: { payment: { url: "...", token_id: "..." } } }
 * Backend kita meneruskan sebagai `checkout_url`; tetap toleran terhadap
 * format lain agar tidak pecah bila backend berubah.
 */
function extractCheckoutUrl(data: Record<string, unknown>): string | undefined {
  const response = data.response as Record<string, unknown> | undefined;
  const payment = response?.payment as Record<string, unknown> | undefined;
  return (
    (data.checkout_url as string) ||
    (payment?.url as string) ||
    (data.payment_url as string) ||
    undefined
  );
}
