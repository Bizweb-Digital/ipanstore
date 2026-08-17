-- =====================================================
-- IPAN STORE - SEED DATA FOR SERVICES (CORRECT)
-- ─────────────────────────────────────────────────────────────────────────────
-- Data paket yang BENAR-BENAR dijual di website IPAN STORE
-- Sesuai dengan src/pages/Order.tsx dan src/pages/Paket.tsx
--
-- CARA PAKAI:
-- 1. Hapus dulu data seed salah: DELETE FROM services;
-- 2. Jalankan query INSERT di bawah
-- =====================================================

-- Hapus data seed yang salah (jika ada)
DELETE FROM services;

-- ─── PAKET SET PC ──────────────────────────────────────────────────────────
INSERT INTO services (slug, name, description, price, is_active) VALUES
  ('set-pc', 
   'SET PC', 
   '<p>Paket optimasi dasar untuk setup PC gaming:</p><ul><li>Setting Regedit Tweak</li><li>Settingan RAM & CPU ideal</li><li>Sensi & DPI config</li><li>Free Fire V7A Terbaru</li><li>Tweaks Smoothness</li><li>Model Phone Emulator Unlock 144 FPS</li></ul>',
   50000,
   true),
  
  ('custom-ff', 
   'Custom FF & Emulator', 
   '<p>Paket rekomendasi untuk pemain Free Fire:</p><ul><li>FPS Boost</li><li>Mengurangi Input Lag</li><li>Mengurangi Recoil Senjata</li><li>Anti Force Close Emulator</li></ul>',
   20000,
   true);

-- ─── PAKET OPTIMIZE ────────────────────────────────────────────────────────
INSERT INTO services (slug, name, description, price, is_active) VALUES
  ('standart', 
   'STANDART', 
   '<p>Paket optimasi standar:</p><ul><li>Regedit & Tweaks</li><li>Optimize CPU/RAM/GPU</li><li>Boost FPS semua game</li><li>Tanpa install ulang</li><li>Windows Mod by Ipan</li><li>Lebih ringan & responsif</li></ul>',
   50000,
   true),
  
  ('elite', 
   'ELITE', 
   '<p>Paket PALING LARIS untuk gaming sehari-hari:</p><ul><li>Optimize CPU/RAM/GPU</li><li>Boost FPS semua game</li><li>Reduce latency</li><li>Windows Mod by Ipan</li><li>Lebih ringan & responsif</li><li>Cocok daily use</li></ul>',
   100000,
   true),
  
  ('extreme', 
   'EXTREME', 
   '<p>Paket PRO CHOICE untuk performa maksimal:</p><ul><li>Emulator & Keybind</li><li>Sensi X & Y</li><li>Boost FPS maksimal</li><li>Semua fitur lengkap</li><li>Performance maksimal</li><li>Windows Mod by Ipan</li></ul>',
   150000,
   true);

-- ─── PAKET ANTI CHEAT ──────────────────────────────────────────────────────
INSERT INTO services (slug, name, description, price, is_active) VALUES
  ('anti-cheat-laga', 
   'ANTICHEAT LAGA', 
   '<p>Paket TOURNAMENT SECURE untuk kompetisi:</p><ul><li>External & Internal Cheat</li><li>Streamer Cheat & Hidden Panel</li><li>Kernel Driver Cheat</li><li>Bypass & Manipulasi Emulator</li></ul>',
   100000,
   true);

-- ─── PAKET APP SETTINX (LISENSI LIFETIME) ──────────────────────────────────
INSERT INTO services (slug, name, description, price, is_active) VALUES
  ('app-settinx', 
   'IPAN APP SettinX V1', 
   '<p>Aplikasi tweak premium dengan LISENSI LIFETIME (1 akun = 1 PC):</p><ul><li>DragShot Velocity X</li><li>OneTap Vector X</li><li>Neural AimSync X</li><li>Emulator Overdrive X</li><li>Snapshot & Rollback</li></ul><p><em>Satu paket ini sudah mencakup semua fitur dari paket Optimize, SET PC, dan Anti Cheat.</em></p>',
   75000,
   true);

-- ─── VERIFIKASI ────────────────────────────────────────────────────────────
SELECT slug, name, price, is_active FROM services ORDER BY price ASC;
