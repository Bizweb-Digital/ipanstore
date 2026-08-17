// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Audit Log Helper (tabel admin_audit_log)
// Mencatat aksi penting admin (ubah status order, CRUD services/testimonials/faqs).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback } from "react";
import { supabase } from "@/lib/admin/supabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Catat aksi admin ke tabel `admin_audit_log`.
 * Butuh RLS `admin_can_insert_audit_log` (sudah ada di migration).
 */
export function useAuditLogger() {
  const { adminUser } = useAdminAuth();

  return useCallback(
    async (action: string, targetId?: string | null, metadata?: Record<string, unknown>) => {
      const adminEmail = adminUser?.email;
      if (!adminEmail) return;
      try {
        await supabase.from("admin_audit_log").insert({
          admin_email: adminEmail,
          action,
          target_id: targetId ?? null,
          metadata: metadata ?? null,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }
    },
    [adminUser]
  );
}

export interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Ambil riwayat audit log (admin only). */
export async function fetchAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Failed to fetch audit log:", error);
    return [];
  }
  return (data as AuditEntry[]) || [];
}