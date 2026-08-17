// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Hook layanan aktif dari Supabase (dengan fallback statis)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { ActiveService, fetchActiveServices, toActiveService } from "@/lib/services";

/**
 * Ambil layanan aktif dari tabel `services` Supabase.
 * `fallback` dipakai bila fetch gagal / tabel kosong (agar halaman tetap tampil).
 */
export function useActiveServices(fallback: ActiveService[]) {
  const [services, setServices] = useState<ActiveService[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [fromDb, setFromDb] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const rows = await fetchActiveServices();
    if (rows && rows.length > 0) {
      setServices(rows.map(toActiveService));
      setFromDb(true);
    } else {
      setServices(fallback);
      setFromDb(false);
    }
    setLoading(false);
  }, [fallback]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { services, loading, fromDb, refetch };
}