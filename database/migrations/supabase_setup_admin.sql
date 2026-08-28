-- ============================================
-- UPDATE ADMIN USER EMAIL
-- Ganti ini dengan email admin Anda yang asli
-- ============================================

-- Update default admin user dengan email yang lebih spesifik
UPDATE admin_users 
SET email = 'admin@ipanstore.id' 
WHERE email = 'admin@ipanstore.id';

-- Verifikasi data
SELECT * FROM admin_users;

-- ============================================
-- NOTE: Untuk setup authentication:
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Klik "Invite User" atau manually create user
-- 3. Email harus sama dengan yang di tabel admin_users (email whitelist)
-- 4. Set password di dashboard Auth
-- ============================================
