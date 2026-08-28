-- =====================================================
-- IPAN STORE - SQL PATCH PROMO SYSTEM (MINIMAL)
-- Memperbaiki error: column "used_count" does not exist
-- + menambahkan RPC functions yang dibutuhkan backend.
--
-- Yang dilakukan:
--   1. Lengkapi kolom promo_codes (used_count, max_uses, dll) - idempotent
--   2. Pastikan kolom promo di tabel orders (promo_code, discount_amount)
--   3. Buat function consume_promo_code (atomic, anti race-condition)
--   4. Buat function validate_promo_code (preview diskon tanpa consume)
--   5. Set permission sesuai security patch
--
-- Idempotent: aman dijalankan berkali-kali.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- STEP 1: Lengkapi kolom tabel promo_codes (yang sudah ada tapi kurang kolom)
-- ---------------------------------------------------------------
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS value NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;         -- NULL = tanpa batas
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;   -- NULL = tidak kedaluwarsa
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

-- ---------------------------------------------------------------
-- STEP 2: Pastikan kolom promo di tabel orders
-- ---------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------
-- STEP 3: Function consume_promo_code (dipakai backend saat create order)
-- Atomic: lock row + guarded update, anti dobel consume / race condition.
-- ---------------------------------------------------------------
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
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo tidak ditemukan atau sudah habis.'
    );
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah kedaluwarsa.'
    );
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah mencapai batas pemakaian.'
    );
  END IF;

  UPDATE promo_codes
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = v_promo.id
    AND used_count < COALESCE(v_promo.max_uses, 999999);

  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo tidak valid saat ini.'
    );
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
  RETURN json_build_object(
    'ok', false,
    'message', 'Error processing promo code: ' || SQLERRM
  )::json;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_promo_code(TEXT, NUMERIC) TO service_role;

-- ---------------------------------------------------------------
-- STEP 4: Function validate_promo_code (preview diskon, TIDAK consume)
-- Dipakai backend endpoint /api/promo/validate (tombol "Pakai" di UI).
-- ---------------------------------------------------------------
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

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah kedaluwarsa.'
    );
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Kode promo sudah mencapai batas pemakaian.'
    );
  END IF;

  IF v_promo.type = 'percent' THEN
    v_discount := ROUND(p_price * v_promo.value / 100);
  ELSE
    v_discount := ROUND(v_promo.value::numeric);
  END IF;

  v_discount := LEAST(GREATEST(v_discount, 0), p_price);
  v_total := GREATEST(p_price - v_discount, 1);

  -- Jangan expose used_count / max_uses (anti enumerasi strategi promo)
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

REVOKE ALL ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO service_role;

COMMIT;

-- ---------------------------------------------------------------
-- VERIFIKASI (opsional, jalankan terpisah):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'promo_codes';
-- SELECT proname FROM pg_proc WHERE proname IN ('consume_promo_code','validate_promo_code');
-- SELECT * FROM promo_codes;
-- ---------------------------------------------------------------
