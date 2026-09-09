import { supabase } from '@/lib/admin/supabase';

/**
 * Tulis satu baris ke tabel admin_audit_log.
 *
 * Kolom tabel (lihat database/migrations/supabase_migration.sql):
 *   id, admin_email, action, target_id, metadata, created_at
 *
 * Fungsi ini SENGAJA tidak melempar error — kegagalan audit tidak boleh
 * mengganggu flow login/logout. Cukup console.warn untuk debugging.
 *
 * Catatan: policy RLS `admin_can_insert_audit_log` hanya mengizinkan insert
 * jika auth.email() terdaftar di admin_users. Insert yang ditolak policy
 * (mis. login_rejected_not_admin) akan diwarn saja tanpa efek samping.
 */
export async function logAudit(
  email: string,
  action: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_email: email,
      action,
      metadata: detail ?? null,
    });

    if (error) {
      console.warn('[audit] Gagal menulis audit log:', error.message);
    }
  } catch (err) {
    console.warn('[audit] Gagal menulis audit log:', err);
  }
}
