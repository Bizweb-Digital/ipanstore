-- =====================================================
-- IPAN STORE - QUICK PATCH: kolom settinx_type di orders
-- Fix error: column orders.settinx_type does not exist (42703)
-- saat webhook/resend SettinX menyimpan jenis produk
-- (module_1_1 untuk "Ipan Module SettinX 1.1", app_v1 untuk "IPAN APP SettinX V1").
--
-- Hanya menambah 1 kolom, tidak mengubah/menghapus apa pun.
-- Idempotent: aman di-run berulang kali.
-- =====================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settinx_type TEXT;

-- VERIFIKASI:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'settinx_type';