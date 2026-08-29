# LASTACTIVITY — IPAN STORE

## STATUS: ✅ Fitur Multi-Admin + Reset Password + Tambah Admin Otomatis (email kredensial) — SELESAI

## Yang Dikerjakan (Sesi Ini)

### 1. Logo Ipan Store kembali di halaman login admin
- `src/pages/admin/Login.tsx`: ikon `Store` (lucide) diganti logo asli (picture/webp, sama seperti Navbar).
- Teks subjudul jadi "Login Admin".

### 2. Reset password via email (bukan toast WhatsApp lagi)
- `src/pages/admin/Login.tsx`: klik "Lupa password?" → form minta email (inline, 2 mode
  login/forgot) → `supabase.auth.resetPasswordForEmail()` dengan redirect ke
  `/admin/reset-password`. Pesan sukses netral (tidak bocorkan email terdaftar).
- `src/pages/admin/ResetPassword.tsx` (BARU): halaman tujuan link email — deteksi event
  `PASSWORD_RECOVERY`, form password baru + konfirmasi (min 8 char, harus cocok),
  `supabase.auth.updateUser()`, lalu redirect ke login. Ada state link tidak valid.
- `src/pages/admin/AdminRoutes.tsx`: route publik `reset-password`.
- Supabase Dashboard (manual oleh user):
  - Redirect URLs: `http://localhost:8080/admin/reset-password`, `https://ipanstore.id/admin/reset-password`.
  - Custom SMTP (Gmail `muhammadrizvandysukma@gmail.com`, smtp.gmail.com:465, App Password
    dari `server/.env`) — email reset sekarang dikirim dari IPAN STORE, bukan noreply Supabase.
  - ✅ Sudah dites user: email reset masuk & halaman password baru berfungsi.

### 3. Multi-admin (role) + policy RLS aman
- Kolom `role` (`super_admin`/`viewer`) di `admin_users` + kolom audit (`admin_audit_log`).
- **FIX infinite recursion RLS**: policy lama pakai subquery ke tabel yang sama → error 500
  "infinite recursion detected in policy". Solusi: fungsi `public.is_admin(email)` dengan
  `SECURITY DEFINER` (bypass RLS) + 4 policy (select/insert/update/delete) memakai fungsi itu.
- `src/components/admin/RequireSuperAdmin.tsx` (BARU): guard halaman khusus super_admin.
- Halaman `src/pages/admin/Admins.tsx` (BARU): list/ubah role/hapus admin (whitelist).

### 4. Login admin: pesan error jujur (bug "password kok salah")
- `src/hooks/useAdminAuth.tsx`: pisahkan 3 kasus — `wrong_credentials` (password salah),
  `not_admin` ("Email ini tidak terdaftar sebagai admin"), `whitelist_error` (gagal baca
  whitelist/RLS/jaringan). Dulu semua dibalas "Email atau password salah" → user mengira
  password berubah padahal benar.
- `src/pages/admin/Login.tsx`: kasus `not_admin`/`whitelist_error` TIDAK menambah counter
  lockout (tidak ada lagi lockout yang menyesatkan), pesan ditampilkan apa adanya.
- Lockout tersimpan di `localStorage: admin_login_attempts` (reset via DevTools console).

### 5. Tambah Admin otomatis (tanpa buka Supabase Dashboard lagi)
- `server/index.js`: endpoint BARU `POST /api/admin/create` (proteksi `x-admin-secret`):
  1. `supabase.auth.admin.createUser()` (service role) — email+password+email_confirm.
  2. Upsert whitelist `admin_users` (email, role).
  3. Kirim kredensial (email/password/role) ke admin baru via Gmail SMTP
     (`sendAdminCredentialsEmail`, template HTML dark IPAN STORE + tombol login).
- `src/lib/admin/admins.ts`: helper BARU `createAdminAccount()` → panggil backend
  (`VITE_BACKEND_URL` + header `x-admin-secret` dari `VITE_ADMIN_API_SECRET`).
- `src/pages/admin/Admins.tsx`: form tambah sekarang Email + Password + Role; tombol
  "Tambah & Kirim Email"; info box diperbarui (tidak perlu manual ke Supabase lagi).
- ✅ Sudah dites end-to-end via endpoint: `success:true, emailSent:true` (akun uji dibuat,
  email terkirim, lalu akun uji dihapus dari Auth + whitelist).

### 6. Lain-lain
- `.env` root: tambah `VITE_ADMIN_API_SECRET` (sama dengan `ADMIN_API_SECRET` server).
- `.env.example` + `server/.env.example`: dokumentasikan `VITE_ADMIN_API_SECRET`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- `AGENTS.md`: aturan 6b "JANGAN STUCK" (EADDRINUSE → kill port & restart; script Node
  `require()` → simpan `.cjs` karena `"type":"module"`; restart backend setelah ubah kode).

## Deploy
- `git push origin main` → ssh `root@100.89.140.16` → `git pull && docker compose down && up --build -d`.
- Live: https://ipanstore.id (web, port 5007) + https://api.ipanstore.id (backend, port 5159).

## CHECKLIST BERIKUTNYA (opsional)
- [ ] Ganti App Password Gmail (pernah terekspos di screenshot) → update `server/.env` + Custom SMTP Supabase.
- [ ] Pertimbangkan secret `ADMIN_API_SECRET` yang lebih panjang (32 hex) untuk produksi.
- [ ] Domain lama `ipanstore.my.id` / `api.ipanstore.my.id`: redirect 301 / hapus dari Cloudflare.
