-- =====================================================
-- IPAN STORE - SUPABASE MIGRATION SCRIPT
-- Version: 1.0.0
-- Created: 2026
-- =====================================================

-- ============================================
-- 1. TABEL ADMIN_USERS (Whitelist users yang bisa login ke admin panel)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

COMMENT ON TABLE admin_users IS 'Daftar whitelist email yang dapat mengakses admin panel';

-- ============================================
-- 2. TABEL ADMIN_AUDIT_LOG (Logging aktivitas admin)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., "order_status_changed", "service_created", "testimonial_deleted"
  target_id UUID, -- Bisa null jika tidak ada target spesifik
  metadata JSONB, -- Extra data dalam format JSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin_email ON admin_audit_log(admin_email);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS 'Audit log untuk tracking semua aksi penting di admin panel';

-- ============================================
-- 3. TABEL SERVICES (Layanan & Paket IPAN STORE)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE, -- Untuk URL, contoh: "boost-fps-free-fire"
  name TEXT NOT NULL, -- Contoh: "Boost FPS Free Fire"
  description TEXT, -- Deskripsi lengkap layanan (boleh berisi HTML)
  price NUMERIC(10, 2) NOT NULL, -- Harga dalam IDR
  is_active BOOLEAN DEFAULT true, -- Toggle visibility di homepage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_is_active ON services(is_active);

COMMENT ON TABLE services IS 'Data layanan dan paket yang ditampilkan di homepage IPAN STORE';

-- ============================================
-- 4. TABEL ORDERS (Order dari DOKU Checkout)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE, -- Format: IPN-YYYYMMDD-XXXXX
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_id UUID NOT NULL REFERENCES services(id),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, COMPLETED, REFUNDED, EXPIRED
  doku_transaction_id TEXT, -- ID transaksi dari DOKU
  doku_payment_channel TEXT, -- e.g., "dana", "gopay", " ShopeePay", "bank_transfer"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX idx_orders_service_id ON orders(service_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_doku_transaction_id ON orders(doku_transaction_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_paid_at ON orders(paid_at);

COMMENT ON TABLE orders IS 'Riwayat semua order dari DOKU Checkout dengan detail pembayaran';

-- ============================================
-- 5. TABEL TESTIMONIALS (Testimoni customer)
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  service_id UUID REFERENCES services(id), -- Layanan yang ditestimoni (nullable)
  is_approved BOOLEAN DEFAULT false, -- Approval status sebelum ditampilkan di homepage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_service_id ON testimonials(service_id);

COMMENT ON TABLE testimonials IS 'Testimoni dari customer, perlu approval sebelum tampil di homepage';

-- ============================================
-- 6. TABEL FAQS (Frequently Asked Questions)
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL, -- Jawaban (boleh berisi HTML)
  sort_order INTEGER DEFAULT 0, -- Urutan tampilan di halaman FAQ
  is_active BOOLEAN DEFAULT true, -- Toggle visibility
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faqs_sort_order ON faqs(sort_order ASC, is_active DESC);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);

COMMENT ON TABLE faqs IS 'FAQ page content management';

-- ============================================
-- 7. TRIGGERS UNTUK UPDATED_AT
-- ============================================
-- Function auto-update timestamp when row is updated
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at column
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- admin_users: Only authenticated admins can read/write (whitelist email policy)
CREATE POLICY admin_can_view_own ON admin_users
  FOR SELECT USING (email = auth.email());

CREATE POLICY admin_can_manage_own ON admin_users
  FOR ALL USING (email = auth.email());

-- admin_audit_log: Only admins can insert/read
CREATE POLICY admin_can_insert_audit_log ON admin_audit_log
  FOR INSERT WITH CHECK (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY admin_can_view_audit_log ON admin_audit_log
  FOR SELECT USING (auth.email() IN (SELECT email FROM admin_users));

-- services: Public can view active only, admins can do everything
CREATE POLICY public_can_view_active_services ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY admin_can_manage_services ON services
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

-- orders: Only admins who are whitelisted can access
CREATE POLICY admin_can_view_orders ON orders
  FOR SELECT USING (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY admin_can_update_orders ON orders
  FOR UPDATE USING (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY admin_can_insert_orders ON orders
  FOR INSERT WITH CHECK (auth.email() IN (SELECT email FROM admin_users));

-- testimonials: Public can view approved only, admins can manage all
CREATE POLICY public_can_view_approved_testimonials ON testimonials
  FOR SELECT USING (is_approved = true);

CREATE POLICY admin_can_manage_testimonials ON testimonials
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

-- faqs: Public can view active only, admins can manage all
CREATE POLICY public_can_view_active_faqs ON faqs
  FOR SELECT USING (is_active = true);

CREATE POLICY admin_can_manage_faqs ON faqs
  FOR ALL USING (auth.email() IN (SELECT email FROM admin_users));

-- ============================================
-- 9. SEED DATA (Data awal kosong, tambahkan via admin panel nanti)
-- ============================================
-- Default admin user (anda akan menambahkan email admin Anda setelah setup pertama)
INSERT INTO admin_users (email) VALUES ('admin@ipanstore.id');
