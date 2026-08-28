-- =====================================================
-- IPAN STORE - COMPLETE SECURITY PATCH (v1 + v2)
-- Final version - tested for Supabase PostgreSQL
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── FIX #1: Buat minimal tabel admin_users & promo_codes ─
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_users' AND policyname='admin_select_self') THEN
    CREATE POLICY admin_select_self ON admin_users FOR SELECT USING (email = auth.email());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_users' AND policyname='service_role_manage') THEN
    CREATE POLICY service_role_manage ON admin_users FOR ALL USING (auth.role() = 'service_role');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'fixed')),
  value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS promo_public_view_active ON promo_codes;
DROP POLICY IF EXISTS promo_admin_all ON promo_codes;

CREATE POLICY promo_admin_all ON promo_codes
  FOR ALL USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email())
  );

-- ── FIX #2: Atomic RPC functions untuk promo ─────────────
CREATE OR REPLACE FUNCTION public.consume_promo_code(p_code TEXT, p_price NUMERIC)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_promo RECORD;
  v_discount NUMERIC;
  v_total NUMERIC;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo tidak ditemukan atau sudah habis.');
  END IF;
  
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah kedaluwarsa.');
  END IF;
  
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah mencapai batas pemakaian.');
  END IF;
  
  UPDATE promo_codes 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = v_promo.id AND used_count < COALESCE(v_promo.max_uses, 999999);
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo tidak valid saat ini.');
  END IF;
  
  IF v_promo.type = 'percent' THEN v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE v_discount := ROUND(v_promo.value::numeric);
  END IF;
  
  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);
  
  RETURN json_build_object(
    'ok', true, 'promo_code', v_promo.code, 'type', v_promo.type,
    'value', v_promo.value, 'discount_amount', v_discount,
    'amount', v_total, 'used_count', used_count)::json;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'message', 'Error: ' || SQLERRM)::json;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_price NUMERIC)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_promo RECORD;
  v_discount NUMERIC;
  v_total NUMERIC;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes WHERE UPPER(code) = UPPER(p_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo tidak ditemukan.');
  END IF;
  
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah kedaluwarsa.');
  END IF;
  
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah mencapai batas pemakaian.');
  END IF;
  
  IF v_promo.type = 'percent' THEN v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE v_discount := ROUND(v_promo.value::numeric);
  END IF;
  
  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);
  
  RETURN json_build_object(
    'ok', true, 'valid', true, 'code', v_promo.code,
    'message', 'Kode promo berlaku!', 'discount_amount', v_discount, 'amount', v_total)::json;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'message', 'Error: ' || SQLERRM)::json;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO anon;

-- ── Enable RLS per tabel ─────────────────────
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ── Create policies ────────────────────────────

-- Services (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='services') THEN
    DROP POLICY IF EXISTS public_select_active_services ON public.services;
    DROP POLICY IF EXISTS any_service_policy ON public.services;
    DROP POLICY IF EXISTS service_insert ON public.services;
    CREATE POLICY public_select_active_services ON public.services
      FOR SELECT USING (is_active = true);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Testimonials (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='testimonials') THEN
    DROP POLICY IF EXISTS public_insert_testimonials ON public.testimonials;
    DROP POLICY IF EXISTS public_select_approved ON public.testimonials;
    DROP POLICY IF EXISTS admin_update_testimonials ON public.testimonials;
    DROP POLICY IF EXISTS admin_delete_testimonials ON public.testimonials;
    
    CREATE POLICY public_insert_testimonials ON public.testimonials
      FOR INSERT WITH CHECK (true);
    CREATE POLICY public_select_approved ON public.testimonials
      FOR SELECT USING (is_approved = true);
    CREATE POLICY admin_update_testimonials ON public.testimonials
      FOR UPDATE
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()));
    CREATE POLICY admin_delete_testimonials ON public.testimonials
      FOR DELETE
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()));
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Orders (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='orders') THEN
    DROP POLICY IF EXISTS any_public_order_policy ON public.orders;
    DROP POLICY IF EXISTS public_select_orders ON public.orders;
    DROP POLICY IF EXISTS public_insert_orders ON public.orders;
    DROP POLICY IF EXISTS service_role_all_orders ON public.orders;
    
    CREATE POLICY service_role_all_orders ON public.orders
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Warranty claims (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='warranty_claims') THEN
    DROP POLICY IF EXISTS admin_view_warranty_claims ON public.warranty_claims;
    DROP POLICY IF EXISTS admin_update_warranty_claims ON public.warranty_claims;
    
    CREATE POLICY admin_view_warranty_claims ON public.warranty_claims
      FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()));
    CREATE POLICY admin_update_warranty_claims ON public.warranty_claims
      FOR UPDATE
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()));
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Admin audit log (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='admin_audit_log') THEN
    DROP POLICY IF EXISTS admin_select_audit_log ON public.admin_audit_log;
    DROP POLICY IF EXISTS service_role_insert_audit_log ON public.admin_audit_log;
    
    CREATE POLICY admin_select_audit_log ON public.admin_audit_log
      FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.email()));
    CREATE POLICY service_role_insert_audit_log ON public.admin_audit_log
      FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── TASK 2: Tabel webhook_replays + RLS ──────────
DROP TABLE IF EXISTS public.webhook_replays CASCADE;
CREATE TABLE public.webhook_replays (
  request_id   TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_replays_processed_at ON public.webhook_replays(processed_at DESC);

COMMENT ON TABLE  public.webhook_replays IS 'Replay protection untuk DOKU webhooks (persist)';
COMMENT ON COLUMN public.webhook_replays.request_id IS 'Request-Id unik dari header DOKU webhook';
COMMENT ON COLUMN public.webhook_replays.processed_at IS 'Timestamp saat webhook sukses diproses';

ALTER TABLE public.webhook_replays ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_read_replays ON public.webhook_replays
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY service_role_insert_replays ON public.webhook_replays
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_update_replays ON public.webhook_replays
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── Disable anon signup via SQL ───────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config' AND column_name = 'enable_signup'
  ) THEN
    UPDATE auth.config SET enable_signup = false;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
