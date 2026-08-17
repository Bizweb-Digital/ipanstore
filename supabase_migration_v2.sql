-- =====================================================
-- IPAN STORE - SUPABASE MIGRATION V2
-- Fitur baru: kode promo/diskon, kolom promo di orders,
-- RLS submit testimoni publik, dan realtime publication.
--
-- CARA PAKAI:
--   Buka Supabase Dashboard → SQL Editor → New query
--   → tempel SEMUA isi file ini → Run.
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

-- ── 1. TABEL PROMO_CODES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'fixed')),
  value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_uses INTEGER,              -- NULL = tanpa batas
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,        -- NULL = tidak kedaluwarsa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Publik (anonim) hanya bisa membaca kode yang aktif — untuk cek diskon di halaman Order.
CREATE POLICY promo_public_view_active ON promo_codes
  FOR SELECT USING (is_active = true);

-- Admin (whitelist admin_users) bisa kelola penuh.
CREATE POLICY promo_admin_all ON promo_codes
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. KOLOM PROMO DI TABEL ORDERS ───────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- ── 3. RLS: PUBLIK BOLEH MENGIRIM TESTIMONI (perlu moderasi) ─────────────────
-- Sebelumnya publik hanya bisa SELECT yang sudah di-approve. Policy ini
-- mengizinkan anonim meng-INSERT review baru dengan is_approved = false.
CREATE POLICY public_can_submit_testimonial ON testimonials
  FOR INSERT TO anon
  WITH CHECK (
    is_approved = false
    AND auth.uid() IS NULL
    AND name IS NOT NULL AND length(name) > 0
    AND message IS NOT NULL AND length(message) > 0
    AND rating BETWEEN 1 AND 5
  );

-- ── 4. REALTIME: DAFTARKAN TABEL KE PUBLICATION supabase_realtime ───────────
-- WAJIB agar postgres_changes di Dashboard & Orders bisa subscribe secara live.
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

-- ── 5. VERIFIKASI ────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('promo_codes', 'orders')
  ORDER BY table_name;

SELECT tablename FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  ORDER BY tablename;