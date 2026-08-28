-- =====================================================
-- IPAN STORE - SQL PATCH KLIKQRIS SUPPORT v1.0 (CLEAN)
-- Menambahkan support Payment Gateway KlikQris (QRIS Dinamis)
--
-- Kolom yang ditambahkan ke tabel `orders`:
--   1. klikqris_signature - signature dari API KlikQris (verifikasi webhook)
--   2. qris_expired_at    - timestamp QRIS kedaluwarsa
--
-- Idempotent: aman dijalankan berkali-kali (ADD COLUMN IF NOT EXISTS).
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- STEP 1: Tambah kolom baru jika belum ada
-- ---------------------------------------------------------------

-- Signature dari KlikQris (digunakan untuk verifikasi webhook authenticity)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS klikqris_signature TEXT;
COMMENT ON COLUMN orders.klikqris_signature IS 'Signature dari KlikQris API saat create order atau webhook PAID';

-- Timestamp QRIS kedaluwarsa (expired at) - default NULL, diisi saat create order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qris_expired_at TIMESTAMPTZ;
COMMENT ON COLUMN orders.qris_expired_at IS 'Waktu kadaluarsa QRIS (null jika belum dibayar via QRIS)';

-- ---------------------------------------------------------------
-- STEP 2: Index untuk performa query (polling status + cleanup expired)
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_qris_expired_at ON orders(qris_expired_at) WHERE qris_expired_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_klikqris_sig ON orders(klikqris_signature) WHERE klikqris_signature IS NOT NULL AND klikqris_signature != '';

-- ---------------------------------------------------------------
-- STEP 3: Function helper - tandai EXPIRED untuk QRIS yang lewat waktu
-- Panggil manual: SELECT ipanstore_cleanup_expired_qris();
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION ipanstore_cleanup_expired_qris()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET
    status = 'EXPIRED'
  WHERE
    status IN ('PENDING', 'PROCESSING')
    AND qris_expired_at IS NOT NULL
    AND qris_expired_at < NOW()
    AND doku_payment_channel = 'QRIS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ipanstore_cleanup_expired_qris IS 'Manual trigger: update status EXPIRED untuk QRIS yang kadaluarsa';

-- ---------------------------------------------------------------
-- STEP 4: View monitoring - QRIS aktif + sisa waktu (untuk admin)
-- Pakai: SELECT * FROM ipanstore_v_active_qris_orders;
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW ipanstore_v_active_qris_orders AS
SELECT
  o.invoice_number,
  o.customer_name,
  o.customer_email,
  o.amount,
  o.status,
  o.created_at,
  o.qris_expired_at,
  CASE
    WHEN o.status = 'PAID' THEN 'LUNAS'
    WHEN o.status = 'EXPIRED' THEN 'KEDALUWARSA'
    WHEN o.qris_expired_at IS NOT NULL AND o.qris_expired_at < NOW() THEN 'LEWAT_WAKTU'
    ELSE 'PENDING'
  END AS qr_status_label,
  CASE
    WHEN o.qris_expired_at IS NULL THEN NULL
    ELSE GREATEST(ROUND(EXTRACT(EPOCH FROM (o.qris_expired_at - NOW())) / 60)::INTEGER, 0)
  END AS minutes_remaining
FROM orders o
WHERE
  o.status IN ('PENDING', 'PROCESSING')
  AND o.doku_payment_channel = 'QRIS'
  AND o.qris_expired_at IS NOT NULL
ORDER BY o.qris_expired_at ASC;

COMMENT ON VIEW ipanstore_v_active_qris_orders IS 'Dashboard monitoring: QRIS aktif + sisa waktu pembayaran';

COMMIT;

-- =====================================================
-- VERIFIKASI SETELAH RUN (paste satu-satu di SQL Editor):
--
-- 1. Cek kolom baru:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('klikqris_signature','qris_expired_at');
--
-- 2. Lihat QRIS aktif:
-- SELECT * FROM ipanstore_v_active_qris_orders LIMIT 10;
--
-- 3. Test function cleanup:
-- SELECT ipanstore_cleanup_expired_qris();
-- =====================================================
