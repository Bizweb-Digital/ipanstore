// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Kode Promo / Diskon
// Dipakai di halaman Order (cek & tampilkan diskon) dan admin Promos (CRUD).
// Validasi final TETAP di server (server/index.js) saat membuat order DOKU.
//
// SECURITY FIX #1: lookupPromoCode sekarang memanggil BACKEND endpoint
// `/api/promo/validate` dengan rate limiting, bukan query Supabase langsung.
// Public SELECT policy di promo_codes sudah dihapus via SQL migration.
// ─────────────────────────────────────────────────────────────────────────────
// ── VALIDASI PROMO VIA BACKEND (SECURITY FIX #1) ─────────────────────────────
// Endpoint ini aman karena:
//   1. Service-side validation (Secret key DOKU di server)
//   2. Rate-limited (max 30 requests / 15 menit per IP)
//   3. Tidak expose used_count / max_uses ke client
//   4. Promo data tidak bisa enumerate via public DB access
export async function lookupPromoCode(
  code: string,
  amount?: number
): Promise<{ ok: boolean; discount?: number; total?: number; message?: string } | null> {
  try {
    // Ambil dari URL param (?kode=HEMAT5) atau arguman
    const c = code || "";
    if (!c) return null;

    const url = import.meta.env.VITE_BACKEND_URL;
    if (!url) {
      console.warn("VITE_BACKEND_URL belum diisi, skip promo validation");
      return null;
    }

    // Panggil backend endpoint untuk validasi + perhitungan diskon.
    // `amount` (harga paket) dikirim karena promo tipe persen butuh basis harga.
    // Backend menghitung diskon — frontend TIDAK menentukan diskon sendiri.
    const res = await fetch(`${url}/api/promo/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c, amount: Number(amount) || 0 }),
    });

    const result = await res.json();
    if (result.ok) {
      return {
        ok: true,
        discount: result.discount_amount,
        total: result.amount,
        message: result.message,
      };
    }

    return { ok: false, message: result.message || "Kode promo tidak valid." };
  } catch (err) {
    console.error("Failed to validate promo code:", err);
    return { ok: false, message: "Gagal memeriksa kode promo." };
  }
}

export interface PromoCode {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export type PromoValidation =
  | { ok: true; promo: PromoCode; discount: number; total: number }
  | { ok: false; message: string };

/** Hitung diskon dari kode promo terhadap harga asli. */
export function computePromo(price: number, promo: PromoCode): { discount: number; total: number } {
  const raw = promo.type === "percent" ? Math.round((price * promo.value) / 100) : Math.round(promo.value);
  const discount = Math.min(Math.max(raw, 0), price);
  return { discount, total: Math.max(price - discount, 1) };
}

/** Validasi lokal + hitung total. Backend tetap memvalidasi ulang. */
export function applyPromo(price: number, promo: PromoCode, now = new Date()): PromoValidation {
  if (!promo.is_active) {
    return { ok: false, message: "Kode promo tidak aktif." };
  }
  if (promo.expires_at && new Date(promo.expires_at) < now) {
    return { ok: false, message: "Kode promo sudah kedaluwarsa." };
  }
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
    return { ok: false, message: "Kode promo sudah mencapai batas pemakaian." };
  }
  const { discount, total } = computePromo(price, promo);
  return { ok: true, promo, discount, total };
}

/** Cari kode promo berdasarkan string (case-insensitive). */
export async function lookupPromoCodeFromDb(code: string): Promise<PromoCode | null> {
  if (!code.trim()) return null;
  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .ilike("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as PromoCode) || null;
  } catch (err) {
    console.error("Failed to lookup promo code:", err);
    return null;
  }
}