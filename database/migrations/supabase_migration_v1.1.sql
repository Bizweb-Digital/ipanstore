-- =====================================================
-- IPAN STORE - MIGRATION v1.1: Tambah kolom email tracking & webhook payload
-- ─────────────────────────────────────────────────────────────────────────────
-- Kolom ini dipakai oleh server/index.js tapi belum ada di migration awal
-- =====================================================

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS webhook_payload JSONB,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON orders(email_sent);

COMMENT ON COLUMN orders.webhook_payload IS 'Raw payload webhook terakhir dari DOKU';
COMMENT ON COLUMN orders.email_sent IS 'Apakah email produk sudah dikirim ke customer';
COMMENT ON COLUMN orders.email_sent_at IS 'Waktu email produk dikirim';
