/**
 * Helper multi-admin untuk tabel `admin_users`.
 *
 * ── SQL MIGRASI (opsional, jalankan sekali di Supabase SQL Editor) ───────────
 *   ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role text DEFAULT 'super_admin';
 *   -- Opsional: batasi nilai role
 *   ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
 *     CHECK (role IN ('super_admin', 'viewer'));
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PENTING: kolom `role` mungkin BELUM ada di DB lama. Semua fungsi di file ini
 * toleran terhadap itu: query memakai select('*'), lalu role dibaca dari row;
 * jika kolom tidak ada / null → fallback 'super_admin' (perilaku lama: semua
 * admin whitelist dianggap full-access).
 */

import { supabase } from '@/lib/admin/supabase';

export type AdminRole = 'super_admin' | 'viewer';

export interface AdminEntry {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string | null;
}

const TABLE = 'admin_users' as const;

function extractRole(row: Record<string, unknown>): AdminRole {
  const raw = row?.role;
  return typeof raw === 'string' && raw === 'viewer' ? 'viewer' : 'super_admin';
}

/** Ambil role user berdasarkan email. Fallback 'super_admin' jika row/kolom tidak ada. */
export async function getMyRole(email: string): Promise<AdminRole> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error || !data) return 'super_admin';
    return extractRole(data as Record<string, unknown>);
  } catch {
    // Jika query gagal (mis. kolom role belum ada), jangan blokir akses admin lama.
    return 'super_admin';
  }
}

/** Daftar semua admin whitelist. */
export async function listAdmins(): Promise<AdminEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    role: extractRole(row),
    created_at: (row.created_at as string | null) ?? null,
  }));
}

/** Tambah email ke whitelist admin_users. */
export async function addAdmin(email: string, role: AdminRole): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { error } = await supabase
    .from(TABLE)
    .insert({ email: normalized, role } as never);
  if (error) throw new Error(error.message);
}

/**
 * Buat akun admin lengkap (Auth + whitelist) lewat endpoint backend, lalu
 * backend mengirim kredensial ke email tujuan via Gmail SMTP.
 *
 * Membutuhkan:
 *   - VITE_BACKEND_URL  (base URL backend)
 *   - VITE_ADMIN_API_SECRET (harus sama dengan ADMIN_API_SECRET di server)
 */
export async function createAdminAccount(
  email: string,
  password: string,
  role: AdminRole,
): Promise<{ success: boolean; emailSent: boolean; message: string }> {
  const backendUrl = (import.meta.env.VITE_BACKEND_URL as string) || '';
  const secret = (import.meta.env.VITE_ADMIN_API_SECRET as string) || '';
  if (!backendUrl) throw new Error('VITE_BACKEND_URL belum dikonfigurasi.');
  if (!secret) throw new Error('VITE_ADMIN_API_SECRET belum dikonfigurasi di frontend.');

  const res = await fetch(`${backendUrl}/api/admin/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Gagal membuat akun admin (HTTP ${res.status}).`);
  }
  return {
    success: true,
    emailSent: !!data.emailSent,
    message: data.message || 'Akun admin dibuat.',
  };
}

/** Ubah role admin (super_admin / viewer). */
export async function updateAdminRole(id: string, role: AdminRole): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ role } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Hapus admin dari whitelist. */
export async function removeAdmin(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
