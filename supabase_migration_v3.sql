-- =====================================================
-- IPAN STORE - SUPABASE MIGRATION V3
-- Fitur baru: Klaim Garansi (form publik + admin panel)
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

-- ── 1. TABEL WARRANTY_CLAIMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warranty_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id),
  customer_name TEXT NOT NULL,
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  complaint TEXT NOT NULL,
  order_date_hint DATE,                       -- perkiraan tanggal order dari customer (opsional)
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'NEED_VERIFICATION', 'EXPIRED', 'PROCESSING', 'COMPLETED', 'REJECTED')),
  invoice_number TEXT,                        -- diisi otomatis dari hasil pencocokan order
  warranty_days INTEGER,                      -- lama garansi layanan saat klaim dibuat
  expires_at TIMESTAMPTZ,                     -- batas akhir masa garansi (ref_date + warranty_days)
  admin_notes TEXT,                           -- catatan internal admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_ticket ON warranty_claims(ticket_number);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_order ON warranty_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_created_at ON warranty_claims(created_at DESC);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

-- Publik TIDAK punya policy INSERT/SELECT langsung — semua insert lewat fungsi
-- RPC `submit_warranty_claim` (SECURITY DEFINER) agar data orders tidak bocor.
-- Manual claim admin via INSERT langsung (butuh admin) tetap lewat policy ALL di bawah.

-- Admin (whitelist admin_users) bisa lihat & kelola klaim.
-- Idempotent: drop dulu agar Re-Run tidak error "policy already exists".
DROP POLICY IF EXISTS admin_can_view_warranty_claims ON warranty_claims;
DROP POLICY IF EXISTS admin_can_manage_warranty_claims ON warranty_claims;

CREATE POLICY admin_can_view_warranty_claims ON warranty_claims
  FOR SELECT USING (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY admin_can_manage_warranty_claims ON warranty_claims
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users))
  WITH CHECK (auth.email() IN (SELECT email FROM admin_users));

DROP TRIGGER IF EXISTS update_warranty_claims_updated_at ON warranty_claims;
CREATE TRIGGER update_warranty_claims_updated_at BEFORE UPDATE ON warranty_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. FUNGSI RPC: SUBMIT KLAIM GARANSI (dipanggil halaman /garansi) ─────────
-- Pencocokan otomatis: nama customer + slug layanan ke tabel orders.
-- Garansi: standart=7 hari, elite=14 hari, extreme=30 hari, app-settinx=14 hari.
-- SET PC & ANTICHEAT LAGA tidak bisa diklaim (tidak ada di mapping).
CREATE OR REPLACE FUNCTION submit_warranty_claim(
  p_customer_name TEXT,
  p_service_slug TEXT,
  p_complaint TEXT,
  p_order_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warranty_days INT;
  v_exact_count INT;
  v_total_count INT;
  v_order_id UUID;
  v_invoice TEXT;
  v_service_name TEXT;
  v_ref_date TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_status TEXT;
  v_ticket TEXT;
BEGIN
  -- Validasi input dasar
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'Nama wajib diisi minimal 2 karakter.');
  END IF;
  IF p_complaint IS NULL OR length(trim(p_complaint)) < 10 THEN
    RETURN json_build_object('ok', false, 'error', 'Ceritakan keluhan kamu minimal 10 karakter.');
  END IF;

  -- Mapping garansi per layanan
  v_warranty_days := CASE trim(lower(p_service_slug))
    WHEN 'standart'   THEN 7
    WHEN 'elite'      THEN 14
    WHEN 'extreme'    THEN 30
    WHEN 'app-settinx' THEN 14
    ELSE NULL
  END;

  IF v_warranty_days IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Layanan ini tidak termasuk dalam garansi.');
  END IF;

  -- Cari kandidat order yang cocok (hanya order PAID/COMPLETED).
  -- Prioritas: nama persis > nama mengandung kata; terbaru dulu.
  -- Filter tanggal opsional (window -30 s/d +7 hari dari tanggal yang diisi customer).
  WITH cand AS (
    SELECT
      o.id,
      o.invoice_number,
      s.name AS service_name,
      COALESCE(o.paid_at, o.created_at) AS ref_date,
      CASE WHEN lower(trim(o.customer_name)) = lower(trim(p_customer_name)) THEN 1 ELSE 0 END AS is_exact
    FROM orders o
    JOIN services s ON s.id = o.service_id
    WHERE lower(trim(s.slug)) = trim(lower(p_service_slug))
      AND o.status IN ('PAID', 'COMPLETED')
      AND o.customer_name ILIKE '%' || trim(p_customer_name) || '%'
      AND (
        p_order_date IS NULL
        OR COALESCE(o.paid_at, o.created_at)::date BETWEEN (p_order_date - 30) AND (p_order_date + 7)
      )
  )
  SELECT
    count(*) FILTER (WHERE is_exact = 1),
    count(*)
  INTO v_exact_count, v_total_count
  FROM cand;

  IF v_total_count = 0 THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Data order tidak ditemukan. Pastikan nama sesuai dengan yang dipakai saat order dan paket yang dipilih benar.'
    );
  END IF;

  -- Ambil kandidat terbaik (nama persis dulu, lalu yang terbaru)
  WITH cand AS (
    SELECT
      o.id,
      o.invoice_number,
      s.name AS service_name,
      COALESCE(o.paid_at, o.created_at) AS ref_date,
      CASE WHEN lower(trim(o.customer_name)) = lower(trim(p_customer_name)) THEN 1 ELSE 0 END AS is_exact
    FROM orders o
    JOIN services s ON s.id = o.service_id
    WHERE lower(trim(s.slug)) = trim(lower(p_service_slug))
      AND o.status IN ('PAID', 'COMPLETED')
      AND o.customer_name ILIKE '%' || trim(p_customer_name) || '%'
      AND (
        p_order_date IS NULL
        OR COALESCE(o.paid_at, o.created_at)::date BETWEEN (p_order_date - 30) AND (p_order_date + 7)
      )
  )
  SELECT c.id, c.invoice_number, c.service_name, c.ref_date
  INTO v_order_id, v_invoice, v_service_name, v_ref_date
  FROM cand c
  ORDER BY c.is_exact DESC, c.ref_date DESC
  LIMIT 1;

  -- Tentukan status awal:
  -- - tepat 1 order nama persis → cek masa garansi (PENDING / EXPIRED)
  -- - lebih dari 1 order / hanya cocok sebagian nama → NEED_VERIFICATION
  IF v_exact_count = 1 THEN
    v_expires_at := v_ref_date + make_interval(days => v_warranty_days);
    v_status := CASE WHEN NOW() > v_expires_at THEN 'EXPIRED' ELSE 'PENDING' END;
  ELSE
    v_status := 'NEED_VERIFICATION';
  END IF;

  -- Generate nomor tiket CLM-YYYYMMDD-XXXXX
  v_ticket := 'CLM-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
              upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  INSERT INTO warranty_claims (
    ticket_number, order_id, customer_name, service_slug, service_name,
    complaint, order_date_hint, status, invoice_number, warranty_days, expires_at
  ) VALUES (
    v_ticket, v_order_id, trim(p_customer_name), trim(lower(p_service_slug)), v_service_name,
    trim(p_complaint), p_order_date, v_status, v_invoice, v_warranty_days, v_expires_at
  );

  RETURN json_build_object(
    'ok', true,
    'ticket_number', v_ticket,
    'invoice_number', v_invoice,
    'service_name', v_service_name,
    'customer_name', trim(p_customer_name),
    'complaint', trim(p_complaint),
    'status', v_status,
    'warranty_days', v_warranty_days,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_warranty_claim(TEXT, TEXT, TEXT, DATE) TO anon, authenticated;

-- ── 3. REALTIME: daftarkan tabel ke publication supabase_realtime ───────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['warranty_claims']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

-- ── 4. VERIFIKASI ────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'warranty_claims';

SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public' AND routine_name = 'submit_warranty_claim';

SELECT tablename FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  ORDER BY tablename;
