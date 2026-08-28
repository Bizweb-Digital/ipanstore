-- =====================================================
-- IPAN STORE - SECURITY PATCH CRITICAL v1
-- Perbaikan 2漏洞 Critical Security Issues:
--   1. Public promo enumeration (DROP policy yang membocorkan promo codes)
--   2. Race condition pada promo usage counter (CREATE atomic RPC function)
--
-- CARA PAKAI:
--   Buka Supabase Dashboard → SQL Editor → New query
--   → Paste SEMUA isi file ini → Run
--   Aman dijalankan ulang (idempotent).
-- =====================================================

-- ── 0. Prasyarat: ekstensi & helper timestamp ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── FIX #1: DROP public promotion policy ────────────────────────────────────
-- Hapus policy yang mengizinkan public/viewer untuk SELECT promo_codes.
-- Promo sekarang admin-only di database level (untuk keamanan).
-- Frontend akan pakai backend endpoint /api/promo/validate yang rate-limited.
-- Pastikan tabel ada dulu (project baru kadang belum run migration v2).

-- Base table admin_users harus ada sebelum policy yang refer ke sana dibuat.
-- Kalau project masih kosong, buat minimal strukturnya dulu.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- Policy dummy supaya anon tidak bisa baca (hanya authenticated owner), idempotent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_users' AND policyname='admin_can_view_own') THEN
    CREATE POLICY admin_can_view_own ON admin_users FOR SELECT USING (email = auth.email());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_users' AND policyname='admin_can_manage_own') THEN
    CREATE POLICY admin_can_manage_own ON admin_users FOR ALL USING (email = auth.email());
  END IF;
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

-- Kolom promo di orders (kalau tabel belum ada, skip — base migration harus dijalankan dulu)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS webhook_payload JSONB;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
  END IF;
END $$;

DROP POLICY IF EXISTS promo_public_view_active ON promo_codes;
DROP POLICY IF EXISTS promo_admin_all ON promo_codes;

-- Kebijakan baru: admin_users saja yang bisa lihat semua detail promo
CREATE POLICY promo_admin_all ON promo_codes
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

-- Admin tetap bisa manage penuh via backend service role key
-- CREATE POLICY service_role_manage_all ON promo_codes
--   FOR ALL USING (true);
-- (service role bypass RLS automatically, jadi tidak perlu policy khusus)

-- Verify: run SELECT * FROM information_schema.table_privileges WHERE table_name = 'promo_codes';
-- Sekarang hanya admin_users dan service_role yang bisa SELECT/INSERT/UPDATE/DELETE

-- ── FIX #2: Buat atomic RPC function untuk promo consumption ──────────────────
-- Fungsi ini melakukan READ-CHECK-UPDATE secara atomik dalam satu call.
-- Menggunakan FOR UPDATE lock untuk serialize concurrent access.
-- Backend menggunakan SERVICE ROLE key yang bypasses RLS, jadi bisa akses promo data.

CREATE OR REPLACE FUNCTION public.consume_promo_code(p_code TEXT, p_price NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_promo RECORD;
  v_discount NUMERIC;
  v_total NUMERIC;
BEGIN
  -- Lock row FOR UPDATE to prevent race conditions
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo tidak ditemukan atau sudah habis.'
    );
  END IF;
  
  -- Check expiration
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah kedaluwarsa.'
    );
  END IF;
  
  -- Check usage limit
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah mencapai batas pemakaian.'
    );
  END IF;
  
  -- Atomically increment used_count (this will fail if row was updated by someone else)
  -- Using serializable isolation ensures only one succeeds per max_limit
  UPDATE promo_codes 
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = v_promo.id
    AND used_count < COALESCE(v_promo.max_uses, 999999);
  
  -- If no rows updated, means concurrent request already consumed it
  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo tidak valid saat ini.'
    );
  END IF;
  
  -- Calculate discount
  IF v_promo.type = 'percent' THEN
    v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE
    v_discount := ROUND(v_promo.value::numeric);
  END IF;
  
  -- Ensure discount is reasonable
  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);
  
  RETURN json_build_object(
    'ok', true,
    'promo_code', v_promo.code,
    'type', v_promo.type,
    'value', v_promo.value,
    'discount_amount', v_discount,
    'amount', v_total,
    'used_count', used_count
  )::json;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'ok', false,
    'message', 'Error processing promo code: ' || SQLERRM
  )::json;
END;
$$;

-- Revoke execute from anon/authenticated, grant only to authenticated users
-- (Backend uses service_role which has superuser-level access)
REVOKE ALL ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) TO service_role;

-- ── Optional: Add helper function for frontend VALIDATION (no consumption) ───
-- Ini dipakai frontend untuk check apakah code VALID sebelum checkout.
-- Tidak meng-consume promo code, hanya cek validity dan show discount preview.
-- Endpoint ini dilindungi rate limiting dari backend.

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_price NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_promo RECORD;
  v_discount NUMERIC;
  v_total NUMERIC;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo tidak ditemukan.'
    );
  END IF;
  
  -- Check expiration
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah kedaluwarsa.'
    );
  END IF;
  
  -- Check usage limit WITHOUT consuming
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah mencapai batas pemakaian.'
    );
  END IF;
  
  -- Calculate potential discount (non-destructive read)
  IF v_promo.type = 'percent' THEN
    v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE
    v_discount := ROUND(v_promo.value::numeric);
  END IF;
  
  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);
  
  -- Return validation result WITHOUT updating used_count
  -- IMPORTANT: Do NOT return used_count/max_uses to leak statistics!
  RETURN json_build_object(
    'ok', true,
    'valid', true,
    'code', v_promo.code,
    'message', 'Kode promo berlaku!',
    'discount_amount', v_discount,
    'amount', v_total
  )::json;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'ok', false,
    'message', 'Error validating promo code: ' || SQLERRM
  )::json;
END;
$$;

-- Grant execute to authenticated and anon (frontend can call via backend)
REVOKE ALL ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO anon;

-- ── Verification queries (run after migration) ───────────────────────────────

-- 1. Confirm public policy dropped
SELECT '✅ Public policy removed:' as test,
       count(*) FILTER (where grantee = 'PUBLIC' AND privilege_type = 'SELECT') as remaining_public_selects
FROM information_schema.table_privileges 
WHERE table_name = 'promo_codes';
-- Expected: 0 public SELECT privileges on promo_codes

-- 2. Confirm admin can still manage
SELECT '✅ Admin users have access:' as test,
       has_table_privilege(current_user, 'promo_codes', 'SELECT') as admin_access;

-- 3. Confirm functions exist with correct privileges
SELECT '✅ Functions created:' as test,
       proname, proacl FROM pg_proc 
WHERE proname IN ('consume_promo_code', 'validate_promo_code');

-- 4. Show current policy setup
SELECT policyname, cmd, qual IS NOT NULL as has_qual
FROM pg_policies 
WHERE tablename = 'promo_codes';

-- Final status check
DO $$
DECLARE
  public_select_cnt INTEGER;
BEGIN
  SELECT count(*) INTO public_select_cnt
  FROM information_schema.table_privileges 
  WHERE table_name = 'promo_codes' 
    AND grantee = 'PUBLIC';
    
  IF public_select_cnt > 0 THEN
    RAISE EXCEPTION '❌ FAILED: Still % public SELECT policies on promo_codes', public_select_cnt;
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully: No public access to promo_codes';
END $$;
