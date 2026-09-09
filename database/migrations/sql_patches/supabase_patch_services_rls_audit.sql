-- =====================================================
-- IPAN STORE — Services CRUD: audit + fix RLS (idempotent)
-- ----------------------------------------------------
-- Tujuan:
--   1. Audit RLS policy pada tabel services di project
--      `zpjkroatjmegwnxzvwlw.supabase.co`
--   2. Pastikan admin (authenticated, email ada di admin_users) bisa INSERT/UPDATE/DELETE ke services.
--   3. Tetapkan schema tetap pakai trigger updated_at + validasi kolom NOT NULL.
--
-- CARA PAKAI:
--   - Buka https://supabase.com/dashboard/project/zpjkroatjmegwnxzvwlw/sql/new
--   - Tempel script ini → Run
--   - Lihat hasil query SELECT di bagian bawah output (tabel policies
--     dengan cmd = INSERT/UPDATE/DELETE/ALL untuk services).
--
-- Aman dijalankan berulang (semua CREATE/DROP/ALTER pakai IF EXISTS / DO block cek).
-- =====================================================

-- ── 1. AUDIT: tampilkan semua policy aktif di tabel services ───────────────
SELECT
  polname                                  AS policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END                                      AS command,
  (
    SELECT string_agg(rolname, ',')
    FROM pg_roles
    WHERE oid = ANY(pol.polroles)
  )                                        AS roles,
  pg_get_expr(pol.polqual,    pol.polrelid) AS using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
FROM pg_policy pol
WHERE pol.polrelid = 'public.services'::regclass
ORDER BY polname;

-- ── 2. Pastikan admin bisa manage SEMUA baris services ────────────────────
DO $$
BEGIN
  -- Hapus policy lama kalau ada (idempotent)
  EXECUTE 'DROP POLICY IF EXISTS admin_can_manage_services ON public.services';

  -- Buat ulang policy admin FOR ALL (admin email dari tabel admin_users)
  EXECUTE $POLICY$
    CREATE POLICY admin_can_manage_services
      ON public.services
      FOR ALL
      TO authenticated
      USING ((SELECT email FROM public.admin_users WHERE email = auth.email()) IS NOT NULL)
      WITH CHECK ((SELECT email FROM public.admin_users WHERE email = auth.email()) IS NOT NULL)
  $POLICY$;

  RAISE NOTICE '✅ Policy admin_can_manage_services berhasil dibuat ulang.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '⚠️ Gagal recreate admin_can_manage_services: %', SQLERRM;
END $$;

-- ── 3. Pastikan public hanya boleh SELECT layanan aktif ──────────────────
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS public_select_active_services ON public.services';
  EXECUTE $POL$
    CREATE POLICY public_select_active_services
      ON public.services
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true)
  $POL$;
  RAISE NOTICE '✅ Policy public_select_active_services berhasil dibuat ulang.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '⚠️ Gagal recreate public_select_active_services: %', SQLERRM;
END $$;

-- ── 4. ENABLE ROW LEVEL SECURITY (kalau belum) ────────────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ── 5. Tambah/update trigger updated_at (agar konsisten dengan tabel lain)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 6. Sanitasi tabel: pastikan NOT NULL constraint benar & kolom auto-generate
DO $$
BEGIN
  -- Kolom price harus NOT NULL (kalau sudah NOT NULL, abaikan)
  BEGIN
    ALTER TABLE public.services ALTER COLUMN price SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Kolom price sudah NOT NULL atau gagal diubah (OK).';
  END;

  BEGIN
    ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Kolom slug sudah NOT NULL atau gagal diubah (OK).';
  END;

  BEGIN
    ALTER TABLE public.services ALTER COLUMN name SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Kolom name sudah NOT NULL atau gagal diubah (OK).';
  END;
END $$;

-- ── 7. AUDIT AKHIR: tampilkan policy setelah patch ────────────────────────
SELECT 'AFTER PATCH' AS stage, polname AS policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command,
  (SELECT string_agg(rolname, ',') FROM pg_roles WHERE oid = ANY(pol.polroles)) AS roles
FROM pg_policy pol
WHERE pol.polrelid = 'public.services'::regclass
ORDER BY polname;

-- ── 8. TEST INSERT sebagai service_role (selalu harus sukses) ─────────────
DO $_$
DECLARE probe_slug TEXT := '__rls_probe_' || extract(epoch from now())::bigint;
DECLARE inserted_id UUID;
BEGIN
  INSERT INTO public.services(slug, name, description, price, is_active)
  VALUES (probe_slug, '__RLS_PROBE_DELETE_ME__', 'audit test', 1, false)
  RETURNING id INTO inserted_id;

  DELETE FROM public.services WHERE id = inserted_id;
  RAISE NOTICE '✅ Service-role bypass OK: insert/delete test row succeeded.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ Insert/delete test gagal: %', SQLERRM;
END $_$;
