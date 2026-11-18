/**
 * Helper autentikasi untuk memanggil endpoint admin di backend.
 *
 * ── KENAPA FILE INI ADA ─────────────────────────────────────────────────────
 * Dulu endpoint admin backend (`/api/admin/create`, `/api/settinx/resend`)
 * diproteksi dengan **shared secret** yang disimpan di frontend lewat
 * `VITE_ADMIN_API_SECRET`. Masalahnya: semua variabel `VITE_*` ikut ter-inline
 * ke bundle JavaScript publik saat `npm run build`, jadi secret itu bisa dibaca
 * siapa pun yang membuka DevTools → kontrol admin bisa dipakai orang luar.
 *
 * Penggantinya: **JWT sesi Supabase**. Setelah admin login, browser sudah
 * memegang access token (per user, berumur pendek, bisa dicabut). Token itu
 * dikirim lewat header `Authorization: Bearer <token>`; backend memverifikasi
 * ke Supabase lalu memastikan email-nya terdaftar di tabel `admin_users`.
 *
 * ⚠️ JANGAN pernah mengembalikan pola shared secret di frontend. Tidak ada
 * rahasia apa pun yang boleh dibaca browser di file ini.
 */

import { supabase } from '@/lib/admin/supabase';

/**
 * Ambil access token sesi admin yang sedang login.
 * Melempar error dengan pesan ramah bila sesi tidak ada / kedaluwarsa.
 */
export async function getAdminAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error('Gagal membaca sesi login. Coba muat ulang halaman.');
  }
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan atau sudah kedaluwarsa. Silakan login ulang.');
  }
  return token;
}

/**
 * Header siap pakai untuk memanggil endpoint admin di backend.
 * Tidak mengandung rahasia statis — token berasal dari sesi user yang login.
 */
export async function adminAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAdminAccessToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
