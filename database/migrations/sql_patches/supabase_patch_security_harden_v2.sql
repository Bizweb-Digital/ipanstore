-- =====================================================
-- IPAN STORE - SECURITY PATCH v2 (Replay Persist + RLS Hardening)
-- ----------------------------------------------------
-- Mencakup:
--   1. Tabel webhook_replays untuk persist replay protection (pasangan Task 2 di server/index.js)
--   2. Audit & hardening RLS untuk semua tabel utama (Task 4)
--   3. Catatan disable sign-up via dashboard (manual step)
--
-- CARA PAKAI:
--   1. Backup dulu:   Supabase Dashboard → Database → Backups (atau pg_dump)
--   2. Buka Supabase Dashboard → SQL Editor → New query
--   3. Paste SEMUA isi file ini → Run
--   4. Cek output NOTICE di akhir — pastikan semua tabel RLS enabled.
--   Aman dijalankan ulang (idempotent: DROP ... IF EXISTS + CREATE).
-- =====================================================

-- ── 0. Prasyarat ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Tabel webhook_replays (pasangan server/index.js Task 2) ──────
-- Backend menulis requestId ke tabel ini SETELAH webhook DOKU sukses diproses,
-- sehingga replay protection tahan restart server (memory map hilang saat restart).
DROP TABLE IF EXISTS public.webhook_replays CASCADE;
CREATE TABLE public.webhook_replays (
  request_id   TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_replays_processed_at
  ON public.webhook_replays (processed_at DESC);

COMMENT ON TABLE  public.webhook_replays IS 'Replay protection untuk DOKU webhooks (persist)';
COMMENT ON COLUMN public.webhook_replays.request_id IS 'Request-Id unik dari header DOKU webhook';
COMMENT ON COLUMN public.webhook_replays.processed_at IS 'Timestamp saat webhook sukses diproses';

-- ── 2. Enable RLS pada semua tabel penting ──────────
-- Tabel yang tidak ada akan dilewati dengan aman (DO block + EXCEPTION).
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'services','testimonials','promo_codes','orders',
    'warranty_claims','admin_users','admin_audit_log','webhook_replays'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Skip (tabel belum ada): %', t;
    END;
  END LOOP;
END $$;

-- ── 3. Policies: services ───────────────────────────
-- PUBLIC boleh SELECT layanan aktif (frontend halaman paket). Lainnya deny.
DROP POLICY IF EXISTS "public_select_active_services" ON public.services;
CREATE POLICY "public_select_active_services" ON public.services
  FOR SELECT USING (is_active = true);

-- Bersihkan policy PUBLIC lain (INSERT/UPDATE/DELETE) yang mungkin bocor.
DO $$
DECLARE
  p TEXT;
BEGIN
  FOR p IN
    SELECT pol.policyname FROM pg_policies pol
    WHERE pol.schemaname = 'public'
      AND pol.tablename  = 'services'
      AND pol.cmd IN ('INSERT','UPDATE','DELETE')
      AND 'public' = ANY(pol.roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.services;', p);
  END LOOP;
END $$;

-- ── 4. Policies: testimonials ───────────────────────
-- PUBLIC boleh INSERT (form submit testimoni) & SELECT yang approved.
DROP POLICY IF EXISTS "public_insert_testimonials" ON public.testimonials;
CREATE POLICY "public_insert_testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_approved_testimonials" ON public.testimonials;
CREATE POLICY "public_select_approved_testimonials" ON public.testimonials
  FOR SELECT USING (is_approved = true);

-- UPDATE/DELETE: hanya admin (authenticated yang terdaftar di admin_users).
DROP POLICY IF EXISTS "admin_update_testimonials" ON public.testimonials;
CREATE POLICY "admin_update_testimonials" ON public.testimonials
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "admin_delete_testimonials" ON public.testimonials;
CREATE POLICY "admin_delete_testimonials" ON public.testimonials
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

-- ── 5. Policies: promo_codes ────────────────────────
-- PUBLIC: deny semua (sudah dipatch v1 — di-sweep lagi di sini untuk jaga-jaga).
DROP POLICY IF EXISTS "public_select_promo_codes"      ON public.promo_codes;
DROP POLICY IF EXISTS "allow_public_read_promo_codes"  ON public.promo_codes;
DROP POLICY IF EXISTS "public_select_all_promo_codes"  ON public.promo_codes;

-- service_role (backend) & admin (authenticated) boleh CRUD.
DROP POLICY IF EXISTS "service_role_or_admin_crud_promo" ON public.promo_codes;
CREATE POLICY "service_role_or_admin_crud_promo" ON public.promo_codes
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email())
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email())
  );

-- ── 6. Policies: orders ─────────────────────────────
-- HANYA service_role (backend) yang bisa akses. Tidak ada policy PUBLIC/anon.
DROP POLICY IF EXISTS "any_public_order_policy" ON public.orders;
DROP POLICY IF EXISTS "public_select_orders"    ON public.orders;
DROP POLICY IF EXISTS "public_insert_orders"    ON public.orders;

DROP POLICY IF EXISTS "service_role_all_orders" ON public.orders;
CREATE POLICY "service_role_all_orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 7. Policies: warranty_claims ────────────────────
-- Submit publik lewat RPC submit_warranty_claim (SECURITY DEFINER) — tidak
-- butuh policy INSERT untuk anon. Admin bisa SELECT/UPDATE.
DROP POLICY IF EXISTS "admin_view_warranty_claims" ON public.warranty_claims;
CREATE POLICY "admin_view_warranty_claims" ON public.warranty_claims
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "admin_update_warranty_claims" ON public.warranty_claims;
CREATE POLICY "admin_update_warranty_claims" ON public.warranty_claims
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

-- ── 8. Policies: admin_users ───────────────────────
-- Admin terautentikasi bisa SELECT baris sendiri (untuk verifikasi role).
-- INSERT/UPDATE/DELETE hanya via service_role (dashboard/seed).
DROP POLICY IF EXISTS "admin_select_self_row" ON public.admin_users;
CREATE POLICY "admin_select_self_row" ON public.admin_users
  FOR SELECT
  USING (email = auth.email());

DROP POLICY IF EXISTS "service_role_manage_admin_users" ON public.admin_users;
CREATE POLICY "service_role_manage_admin_users" ON public.admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 9. Policies: admin_audit_log ───────────────────
-- Admin bisa SELECT audit log; service_role bisa INSERT.
DROP POLICY IF EXISTS "admin_select_audit_log" ON public.admin_audit_log;
CREATE POLICY "admin_select_audit_log" ON public.admin_audit_log
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "service_role_insert_audit_log" ON public.admin_audit_log;
CREATE POLICY "service_role_insert_audit_log" ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ── 10. Policies: webhook_replays ──────────────────
-- HANYA service_role (backend) yang bisa SELECT/INSERT/UPDATE.
DROP POLICY IF EXISTS "service_role_read_replays" ON public.webhook_replays;
CREATE POLICY "service_role_read_replays" ON public.webhook_replays
  FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_insert_replays" ON public.webhook_replays;
CREATE POLICY "service_role_insert_replays" ON public.webhook_replays
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_update_replays" ON public.webhook_replays;
CREATE POLICY "service_role_update_replays" ON public.webhook_replays
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 11. Disable anon signup via SQL (jika didukung) ─
-- Supabase versi baru menyimpan config auth di tabel auth.config.
-- Kolom yang relevan: enable_signup (bool). Jika kolom/tabel tidak ada,
-- block ini di-skip dengan aman (non-fatal).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config' AND column_name = 'enable_signup'
  ) THEN
    UPDATE auth.config SET enable_signup = false;
    RAISE NOTICE '✅ Anon signup DISABLED via auth.config.enable_signup = false';
  ELSE
    RAISE NOTICE 'ℹ️ auth.config.enable_signup tidak ditemukan — disable manual via Dashboard (lihat NOTES)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ℹ️ Tidak bisa set auth.config (%) — disable manual via Dashboard', SQLERRM;
END $$;

-- ── 12. Verifikasi final ────────────────────────────
DO $$
DECLARE
  t RECORD;
  cnt INT;
BEGIN
  RAISE NOTICE '────── AUDIT RLS SELESAI ──────';
  FOR t IN
    SELECT c.relname AS tablename, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'services','testimonials','promo_codes','orders',
        'warranty_claims','admin_users','admin_audit_log','webhook_replays'
      )
    ORDER BY c.relname
  LOOP
    RAISE NOTICE '  %-20s RLS=%', t.tablename, t.rls;
  END LOOP;

  -- Pastikan tidak ada policy PUBLIC di tabel sensitif.
  SELECT count(*) INTO cnt
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('orders','admin_users','warranty_claims','webhook_replays')
    AND 'public' = ANY(roles);
  IF cnt > 0 THEN
    RAISE WARNING '⚠️ Masih ada % policy PUBLIC di tabel sensitif!', cnt;
  ELSE
    RAISE NOTICE '✅ Tabel sensitif bersih dari akses PUBLIC';
  END IF;
END $$;

-- ── NOTES ───────────────────────────────────────────
-- 1. Jika "Allow new users to sign up" masih ON di Dashboard setelah script ini,
--    matikan manual:
--    Supabase Dashboard → Authentication → Sign In / Up → Providers → Email
--    → Toggle "Allow new users to sign up" = OFF.
--
-- 2. Setelah run, test dari browser (anon session):
--    - halaman /paket harus tetap tampil (services SELECT aktif = OK)
--    - halaman /testimoni harus tetap tampil (testimonials approved = OK)
--    - form klaim garansi harus tetap jalan (RPC security definer)
--    - akses langsung ke tabel orders via DevTools harus DITOLAK.
--
-- 3. Jika ada tabel baru di masa depan, ulang pola yang sama:
--    ENABLE RLS + policy minimal (service_role/admin only) kecuali memang publik.
-- -----------------------------------------------------
