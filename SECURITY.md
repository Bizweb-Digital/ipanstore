# Security Policy — IPAN STORE

> Dokumen ini menjelaskan kebijakan keamanan, kontrol yang sudah diterapkan,
> dan prosedur pelaporan kerentanan untuk tim IPAN STORE.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| `main` (production `https://ipanstore.id`) | ✅ |
| branch fitur lain | ❌ (tidak di-deploy) |

## Reporting a Vulnerability

JANGAN buat issue publik di GitHub. Hubungi langsung:

- **Email**: `security@ipanstore.id` (atau `support@ipanstore.id` bila belum ada)
- **Sertakan**: deskripsi, langkah reproduksi, dampak, dan PoC (jika ada)
- **SLA**: konfirmasi dalam 24 jam, fix critical dalam 48 jam, publikasi setelah patch live

## Arsitektur Keamanan Saat Ini

### 1. Database — Supabase + RLS (`supabase_migration*.sql:151`, `sql_patches/supabase_patch_security_critical.sql:1`)
- RLS `ENABLE` di `admin_users`, `services`, `orders`, `testimonials`, `faqs`, `promo_codes`
- `promo_codes` **TIDAK** lagi punya policy `promo_public_view_active` — hanya `promo_admin_all` (`auth.email() IN (SELECT email FROM admin_users)`)
- Validasi promo untuk user lewat `POST /api/promo/validate` (`server/index.js:501`) yang rate-limited (30/15m) — bukan query langsung
- `consume_promo_code(p_code, p_price)` (`sql_patches/...:49`) atomic: `SELECT ... FOR UPDATE` + `UPDATE ... WHERE used_count < max_uses` — mencegah race condition `max_uses`
- `validate_promo_code(p_code, p_price)` — read-only, tidak kurangi kuota, tidak bocorkan `used_count`/`max_uses`
- Admin panel CRUD (`src/pages/admin/Promos.tsx:64`) hanya jalan bila sesi Supabase Auth ter-autentikasi sebagai admin

### 2. Payment — DOKU Checkout (`server/index.js:36`)
- `CLIENT_ID` / `SECRET_KEY` HANYA di `server/.env` (tidak pernah di `VITE_` / frontend `src/lib/doku.ts:19`)
- Signature `HMACSHA256` (`server/index.js:84`) diverifikasi dengan `crypto.timingSafeEqual` di webhook
- Webhook `POST /api/doku-webhook` (`server/index.js:767`) — ada pengecekan `Client-Id`/`Request-Id`/`Request-Timestamp`/`Signature`
- Email link download produk tetap lewat server (`server/index.js:264`) — tidak hardcode di frontend

### 3. Rate Limiting (`server/index.js:373`)
- `express-rate-limit` terpasang:
  - `apiLimiter` — 100 req / 15 menit / IP untuk semua `/api/`
  - `promoLimiter` — 30 req / 15 menit / IP untuk `/api/promo/validate` (anti enumeration)
  - `orderLimiter` — 10 req / jam / IP untuk `/api/doku-create-order`
- Backend membalas `429` dengan header `RateLimit-*`

### 4. Kredensial & Secrets (`src/lib/admin/supabase.ts:4`, `.gitignore:15`, `server/.env.example:1`)
- `.env` dan `server/.env` masuk `.gitignore` — tidak boleh di-commit
- Hardcoded fallback `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` **dihapus** — fail-fast bila kosong
- Rotasi: ganti key di dashboard (Supabase / DOKU) → update `server/.env` + `VITE_` di build → restart

### 5. Dependency & Supply Chain (`.github/dependabot.yml:1`, `.github/workflows/security.yml:1`)
- Dependabot scan mingguan (npm root + `server/`, + Docker) — PR auto-create
- CI `Security Scan` tiap push/PR: `npm audit --audit-level=high` FE+BE, `gitleaks` secret scan, `tsc --noEmit` + `npm run build`
- Nodemailer sudah `^9.0.5` (fix GHSA-mm7p-fcc7-pg87 dkk.) — `server` `npm audit` 0 vuln

## Secret Management Checklist (untuk developer)

- [ ] Jangan commit `.env`, `*.pem`, `id_rsa` — cek `git diff --cached --name-only`
- [ ] Gunakan `VITE_` hanya untuk nilai public (URL anon key) — secret pakai `server/.env`
- [ ] Enable GitHub **Secret scanning** + **Push protection** di Settings → Code security
- [ ] Aktifkan 2FA untuk semua anggota org `Bizweb-Digital`

## Incident Response (ringkas)

1. **Deteksi** — alert dari CI, Dependabot, atau laporan manual
2. **Containment** — revoke key yang bocor (Supabase / DOKU), blok IP bila perlu (rate limiter / Cloudflare)
3. **Eradication** — patch code + jalankan migrasi `sql_patches/*.sql` di SQL Editor
4. **Recovery** — `git pull` + `docker compose up --build -d` di VPS `100.89.140.16`, verifikasi `https://ipanstore.id/health`
5. **Postmortem** — tulis di `LASTACTIVITY.md` (§ MASALAH & CHECKLIST)

## Checklist Sebelum Deploy

- [ ] `npx tsc --noEmit` 0 error
- [ ] `npm run build` sukses
- [ ] `node --check server/index.js` OK
- [ ] `npm audit --audit-level=high` di `server/` 0 vuln (root dev-deps high boleh ditunda bila butuh `--force` breaking)
- [ ] Jalankan file `sql_patches/*.sql` yang baru di Supabase SQL Editor bila ada
- [ ] Cek `ALLOWED_ORIGINS` di `server/.env` hanya berisi `https://ipanstore.id` (+ localhost dev)

## Referensi File Kunci

- DB migration base: `supabase_migration.sql:151`, `supabase_migration_v2.sql:42`, `sql_patches/supabase_patch_security_critical.sql:1`
- Backend: `server/index.js:36` (kredensial), `373` (rate limiter), `501` (promo validate), `648` (create-order limiter), `767` (webhook)
- Frontend: `src/lib/admin/supabase.ts:4`, `src/lib/admin/promo.ts:16`, `src/pages/Order.tsx:160`
- CI: `.github/dependabot.yml:1`, `.github/workflows/security.yml:1`
