-- =====================================================
-- IPAN STORE - QUICK PATCH: kolom tracking license SettinX di orders
-- Untuk fitur auto-generate kredensial SettinX V1 (Firebase) saat pembelian.
--
-- Kolom baru:
--   settinx_license_uid  -> UID Firebase (license key) milik pembeli order ini
--   settinx_license_error-> pesan error bila generate license gagal (untuk debug admin)
--
-- Idempotent: aman di-run berulang kali.
-- =====================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS settinx_license_uid TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS settinx_license_error TEXT;

-- VERIFIKASI:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name LIKE 'settinx%';