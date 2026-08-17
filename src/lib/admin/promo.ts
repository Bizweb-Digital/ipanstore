// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Kode Promo / Diskon
// Dipakai di halaman Order (cek & tampilkan diskon) dan admin Promos (CRUD).
// Validasi final TETAP di server (server/index.js) saat membuat order DOKU.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/admin/supabase";

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
export async function lookupPromoCode(code: string): Promise<PromoCode | null> {
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