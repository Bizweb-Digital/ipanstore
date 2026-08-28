-- =====================================================
-- IPAN STORE - SQL PATCH GABUNGAN v1.0 (AMAN DI-RUN ULANG)
-- 
-- Tujuan ganda:
--   A) PERBAIKAN: error 'column used_count does not exist' + 2 RPC promo yang hilang
--   B) PASTIKAN fitur lama tetap aktif: policy testimoni, realtime, trigger promo
--
-- SEMUA perintah idempotent (aman dijalankan berkali-kali, tidak akan error
-- "already exists"). Data lama (orders, promo HEMAT5, testimoni) TIDAK dihapus.
--
-- CARA PAKAI: Hapus semua isi editor -> paste SEMUA isi ini -> Run.
-- =====================================================

BEGIN;

-- ===================================================================
-- BAGIAN A: PERBAIKAN SISTEM PROMO (penyebab error used_count)
-- ===================================================================

-- ── A1. Lengkapi kolom tabel promo_codes (yang kurang ditambah, yang ada tidak diubah)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS value NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

-- ── A2. Kolom promo di tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- ── A3. Function consume_promo_code (dipakai backend saat klik "Bayar Sekarang")
-- Atomic: lock + guarded update, anti dobel pakai promo & race condition.
CREATE OR REPLACE FUNCTION public.consume_promo_code(p_code TEXT, p_price NUMERIC)
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
    AND is_active = true
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

  IF v_promo.type = 'percent' THEN
    v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE
    v_discount := ROUND(v_promo.value::numeric);
  END IF;

  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);

  RETURN json_build_object(
    'ok', true,
    'promo_code', v_promo.code,
    'type', v_promo.type,
    'value', v_promo.value,
    'discount_amount', v_discount,
    'amount', v_total
  )::json;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'message', 'Error processing promo code: ' || SQLERRM)::json;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) TO service_role;

-- ── A4. Function validate_promo_code (dipakai backend endpoint /api/promo/validate, tombol "Pakai")
-- Preview diskon TANPA mengurangi kuota. Tidak expose used_count/max_uses (anti enumerasi).
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
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo tidak ditemukan.');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah kedaluwarsa.');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('ok', false, 'message', 'Kode promo sudah mencapai batas pemakaian.');
  END IF;

  IF v_promo.type = 'percent' THEN
    v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE
    v_discount := ROUND(v_promo.value::numeric);
  END IF;

  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);

  RETURN json_build_object(
    'ok', true, 'valid', true,
    'code', v_promo.code,
    'message', 'Kode promo berlaku!',
    'discount_amount', v_discount,
    'amount', v_total
  )::json;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'message', 'Error validating promo code: ' || SQLERRM)::json;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO service_role;

-- ===================================================================
-- BAGIAN B: PASTIKAN FITUR LAMA TETAP AKTIF (dari migration v2)
-- Pakai pola aman: DROP IF EXISTS dulu -> CREATE (tidak akan error duplikat)
-- ===================================================================

-- ── B1. Helper timestamp (dipakai trigger promo)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── B2. Trigger auto-update kolom updated_at di promo_codes
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── B3. RLS aktif di promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ── B4. Policy promo (DROP dulu agar tidak error "already exists", lalu buat ulang)
DROP POLICY IF EXISTS promo_public_view_active ON promo_codes;
CREATE POLICY promo_public_view_active ON promo_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS promo_admin_all ON promo_codes;
CREATE POLICY promo_admin_all ON promo_codes
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

-- ── B5. Policy: publik boleh kirim testimoni (moderasi)
DROP POLICY IF EXISTS public_can_submit_testimonial ON testimonials;
CREATE POLICY public_can_submit_testimonial ON testimonials
  FOR INSERT TO anon
  WITH CHECK (
    is_approved = false
    AND auth.uid() IS NULL
    AND name IS NOT NULL AND length(name) > 0
    AND message IS NOT NULL AND length(message) > 0
    AND rating BETWEEN 1 AND 5
  );

-- ── B6. Realtime: daftarkan tabel ke publication (sudah pakai IF NOT EXISTS di v2, aman)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['orders', 'services', 'testimonials', 'faqs']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ===================================================================
-- VERIFIKASI (opsional, jalankan terpisah setelah COMMIT):
--
-- 1. Kolom promo_codes lengkap?
-- SELECT column_name FROM information_schema.columns WHERE table_name='promo_codes' ORDER BY ordinal_position;
--
-- 2. RPC promo ada?
-- SELECT proname FROM pg_proc WHERE proname IN ('consume_promo_code','validate_promo_code');
--
-- 3. Data promo Anda masih ada & nilainya benar?
-- SELECT code, type, value, max_uses, used_count, is_active FROM promo_codes;
--
-- 4. Policy & realtime aktif?
-- SELECT policyname FROM pg_policies WHERE tablename IN ('promo_codes','testimonials');
-- SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
-- ===================================================================
