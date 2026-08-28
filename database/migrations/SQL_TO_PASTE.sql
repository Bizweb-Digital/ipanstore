-- =====================================================
-- IPAN STORE - SECURITY PATCH v2 (Ready to Paste)
-- ----------------------------------------------------
-- COPY-PASTE SEMUA kode di bawah ini ke Supabase SQL Editor
-- Kemudian klik "RUN" (atau Ctrl+Enter)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

DROP POLICY IF EXISTS "public_select_active_services" ON public.services;
CREATE POLICY "public_select_active_services" ON public.services
  FOR SELECT USING (is_active = true);

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

DROP POLICY IF EXISTS "public_insert_testimonials" ON public.testimonials;
CREATE POLICY "public_insert_testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_approved_testimonials" ON public.testimonials;
CREATE POLICY "public_select_approved_testimonials" ON public.testimonials
  FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "admin_update_testimonials" ON public.testimonials;
CREATE POLICY "admin_update_testimonials" ON public.testimonials
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "admin_delete_testimonials" ON public.testimonials;
CREATE POLICY "admin_delete_testimonials" ON public.testimonials
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "public_select_promo_codes"      ON public.promo_codes;
DROP POLICY IF EXISTS "allow_public_read_promo_codes"  ON public.promo_codes;
DROP POLICY IF EXISTS "public_select_all_promo_codes"  ON public.promo_codes;

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

DROP POLICY IF EXISTS "any_public_order_policy" ON public.orders;
DROP POLICY IF EXISTS "public_select_orders"    ON public.orders;
DROP POLICY IF EXISTS "public_insert_orders"    ON public.orders;

DROP POLICY IF EXISTS "service_role_all_orders" ON public.orders;
CREATE POLICY "service_role_all_orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_view_warranty_claims" ON public.warranty_claims;
CREATE POLICY "admin_view_warranty_claims" ON public.warranty_claims
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "admin_update_warranty_claims" ON public.warranty_claims;
CREATE POLICY "admin_update_warranty_claims" ON public.warranty_claims
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "admin_select_self_row" ON public.admin_users;
CREATE POLICY "admin_select_self_row" ON public.admin_users
  FOR SELECT
  USING (email = auth.email());

DROP POLICY IF EXISTS "service_role_manage_admin_users" ON public.admin_users;
CREATE POLICY "service_role_manage_admin_users" ON public.admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_select_audit_log" ON public.admin_audit_log;
CREATE POLICY "admin_select_audit_log" ON public.admin_audit_log
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

DROP POLICY IF EXISTS "service_role_insert_audit_log" ON public.admin_audit_log;
CREATE POLICY "service_role_insert_audit_log" ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config' AND column_name = 'enable_signup'
  ) THEN
    UPDATE auth.config SET enable_signup = false;
    RAISE NOTICE '✅ Anon signup DISABLED via auth.config.enable_signup = false';
  ELSE
    RAISE NOTICE 'ℹ️ auth.config.enable_signup tidak ditemukan — disable manual via Dashboard';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ℹ️ Tidak bisa set auth.config (%) — disable manual via Dashboard', SQLERRM;
END $$;

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
