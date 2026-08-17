// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Helper layanan/paket bersama
// Dipakai di halaman publik (Paket, Order) agar data datang dari tabel
// `services` Supabase (dikelola admin) dengan fallback ke data statis.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/admin/supabase";

export type ServiceCategory = "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";

export interface ActiveService {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: ServiceCategory;
  priceLabel: string;
  features: string[];
  highlight?: string;
}

/** Ambil fitur dari deskripsi layanan (HTML `<li>`), fallback ke teks biasa. */
export function parseFeatures(description?: string | null): string[] {
  if (!description) return [];
  const li = description.match(/<li[^>]*>(.*?)<\/li>/gis);
  if (li && li.length) {
    return li.map((x) =>
      x
        .replace(/<li[^>]*>/gi, "")
        .replace(/<\/li>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .trim()
        .replace(/^[-•]\s*/, "")
    ).filter(Boolean);
  }
  return description
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Tentukan kategori dari slug layanan (sinkron dengan tab halaman Paket/Layanan). */
export function deriveCategory(slug: string): ServiceCategory {
  const s = slug.toLowerCase();
  if (s.includes("anti-cheat") || s.includes("anticheat")) return "Anti Cheat";
  if (s.includes("settinx")) return "APP SETTINX";
  if (s.includes("set-pc") || s.includes("custom-ff") || s.includes("custom") || s.includes("emulator")) return "SET PC";
  return "Optimize";
}

/** Label highlight untuk paket yang dikenal. */
export const HIGHLIGHT_BY_SLUG: Record<string, string> = {
  "custom-ff": "REKOMENDASI",
  elite: "PALING LARIS",
  extreme: "PRO CHOICE",
  "anti-cheat-laga": "TOURNAMENT SECURE",
  "app-settinx": "LISENSI LIFETIME",
};

export function formatRupiah(n: number) {
  return "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

/**
 * Ambil semua layanan aktif dari Supabase. Return null saat gagal / kosong
 * agar caller bisa memakai fallback statis.
 */
export async function fetchActiveServices(): Promise<ServiceRow[] | null> {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, slug, name, description, price, is_active")
      .eq("is_active", true);
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data as ServiceRow[];
  } catch (err) {
    console.error("Failed to fetch active services:", err);
    return null;
  }
}

/** Ubah baris service Supabase jadi bentuk yang dipakai kartu paket. */
export function toActiveService(row: ServiceRow): ActiveService {
  const price = Number(row.price);
  const features = parseFeatures(row.description);
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    price,
    category: deriveCategory(row.slug),
    priceLabel: formatRupiah(price),
    features,
    highlight: HIGHLIGHT_BY_SLUG[row.slug],
  };
}