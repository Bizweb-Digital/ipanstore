-- =====================================================
-- IPAN STORE - QUICK PATCH: kolom email tracking di orders
-- Fix error: Could not find the 'email_sent' column of 'orders'
--
-- Hanya menambah 2 kolom, tidak mengubah/menghapus apa pun.
-- Idempotent: aman di-run berulang kali.
-- =====================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- VERIFIKASI:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name LIKE 'email%';
