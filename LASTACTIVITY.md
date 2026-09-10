# LASTACTIVITY — IPAN STORE

## STATUS: ✅ 🔐 FIX keamanan kredensial SettinX ter-commit + ter-push + ter-deploy (commit ce465d3)

## PERUBAHAN SESI INI (keamanan — ✅ SUDAH commit/push/deploy)

### P0. Password SettinX TIDAK lagi disimpan plaintext di Firestore
- **Sebelum**: `server/lib/settinxLicense.js` menyimpan field `password` plaintext di collection `settinx_licenses`
  (Firestore). Siapa pun dengan akses read Firestore (admin, bocoran key, dll.) bisa melihat password login app.
- **Sesudah**: hanya `passwordHash` (SHA-256, satu arah) disimpan. `findExistingLicense()` kini mengembalikan
  `passwordHash` (bukan `password`). Password otoritatif hanya ada di Firebase Auth; dihasilkan/dirotasi saat
  perlu dan dikirim via email, TIDAK disimpan.
- ⚠️ **Data lama**: dokumen `settinx_licenses` yang sudah ada masih berisi field `password` plaintext —
  perlu dihapus manual di Firestore Dashboard (lihat catatan di bawah).

### P0. Reuse license → password di-ROTATE otomatis
- `assignSettinxLicense()` saat menemukan email yang sama (reuse) kini memanggil `auth.updateUser()` dengan
  password baru → pembeli dapat password segar setiap beli, password lama mati.

### P1. Webhook KlikQris menolak order palsu
- `POST /api/klikqris-webhook` sekarang melakukan `getOrder(orderId)` DI AWAL dan menolak (404) bila order
  tidak pernah dibuat di DB. Sebelumnya webhook BISA membuat order baru sendiri (celah "ciptakan order palsu"
  untuk barang gratis) — blok itu dihapus.

### P1. Endpoint `/api/settinx/resend` → rotate password
- Resend V1 kini pakai `rotateSettinxPassword()` (password baru setiap kirim ulang), bukan mengirim ulang
  password lama dari Firestore. License (UID) tetap sama. Bila license belum ada → buat baru.

### P1. Refactor caller email → `resolveSettinxCredentials()`
- Helper baru: coba `assignSettinxLicense` (auto-rotate saat reuse) → fallback `rotateSettinxPassword` bila
  akun gagal dibuat. Memastikan email SELALU berisi password segar (bukan record tanpa password dari
  `findExistingLicense`). Dipakai di 3 tempat: proses webhook V1, loop order admin, tidak di resend (resend
  sudah langsung rotate).

### 🔒 Data lama yang perlu dibersihkan manual (SQL/Firestore)
- Dokumen lama di Firestore `settinx_licenses` yang masih punya field `password` plaintext:
  buka **Firestore Dashboard** → collection `settinx_licenses` → hapus field `password` saja di tiap dokumen.
  Aplikasi tidak bisa login dengan password lama lagi; password baru didapat via admin "Generate & Kirim Ulang
  Kredensial" (endpoint resend yang sudah di-rotate).
- Tidak ada migrasi Supabase baru yang wajib dijalankan.

### Status verifikasi
- `node --check server/index.js` ✅, `node --check server/lib/settinxLicense.js` ✅.
- **✅ SUDAH commit `ce465d3` + push `origin/main` + deploy** (VPS `git pull` + `docker compose up --build -d`).
- Verifikasi live: `https://ipanstore.id` → HTTP 200.

### 🔒 Data lama yang perlu dibersihkan manual (Firestore)
- Dokumen lama `settinx_licenses` yang masih menyimpan field `password` plaintext PERLU dihapus manual
  di Firestore Dashboard (hanya hapus field `password`, biarkan `passwordHash`/Field lainnya).
  Aplikasi tidak bisa login dengan password lama lagi; password baru didapat via admin
  "Generate & Kirim Ulang Kredensial" (resend yang sudah di-rotate). 🔴 Belum dikerjakan user.

## Rekap SEMUA Perubahan (Sesi Ini, kronologis)

### 0. ⚠️ FIX server-side: tambah ADMIN_API_SECRET di VPS — ✅ tuntas
- **Akar masalah**: backend produksi dijalankan via **PM2** (`ipanstore-backend`, fork, cwd `server/`,
  port 5159) — BUKAN di Docker. Docker di VPS hanya serve frontend static (nginx, port 5007).
  Jadi `docker compose restart` TIDAK memuat ulang secret backend; yang benar adalah `pm2 restart`.
- `.env` server VPS tidak punya `ADMIN_API_SECRET` → semua endpoint admin produksi
  (resend, create-admin) menolak 401, padahal frontend build sudah membawa `5f6e3d427b890c1a`.
- **Fix**: tambah `ADMIN_API_SECRET=5f6e3d427b890c1a` di `/project/website/padel/IpanStore/ipanstore/server/.env`
  (langsung di VPS, file ini gitignored — tidak perlu commit), lalu `pm2 restart ipanstore-backend`.
- **Verifikasi**: `POST https://api.ipanstore.id/api/settinx/resend` dengan header
  `x-admin-secret` kini `success:true` (sebelumnya 401). `pm2 restart` baru pid 551195, port 5159 up.

### 1. Tes end-to-end kirim produk "Ipan Module SettinX 1.1" — ✅ email nyata terkirim (2x terkonfirmasi)
- Order dummy QRIS dibuat via API produksi: invoice `IPNMOD20260910062600`,
  nama `ipan`, WA `082119117699`, email `ipanasik123@gmail.com`, produk
  `Ipan Module SettinX 1.1` (Rp 50.521, status PENDING, payment QRIS).
- Order tersimpan di tabel `orders` (service id `f4358811...` = slug `ipanmodule`).
- Trigger kirim email produk via endpoint `/api/settinx/resend` (backend lokal port 5159
  = kode & DB & SMTP produksi yang sama). Hasil: `success:true` — email link download
  MediaFire terkirim oleh pengirim `muhammadrizvandysukma@gmail.com` → `ipanasik123@gmail.com`.
- Verifikasi DB: `email_sent:true`, `email_sent_at:2026-09-09T23:33:42Z`, `settinx_type:module_1_1`.
- ⚠️ **Temuan bug**: server VPS `.env` TIDAK punya `ADMIN_API_SECRET` →
  semua endpoint admin di produksi (termasuk tombol "Kirim Ulang" di dashboard admin)
  menolak 401. Frontend produksi SUDAH berisi secret `5f6e3d427b890c1a` (ter-bake di dist).
  FIX: tambahkan `ADMIN_API_SECRET=5f6e3d427b890c1a` ke `/project/.../server/.env` di VPS
  lalu restart container. Sampai itu dilakukan, tes resend lewat API produksi gagal 401.
  → ✅ SUDAH DIKERJAKAN sesi ini (lihat bagian 0): secret ditambahkan + `pm2 restart`. **Fix tuntas.**

### 1. Fitur "Ipan Module SettinX 1.1" — ✅ deployed & live
- `server/index.js`: classifier produk SettinX membedakan `module_1_1` (Ipan Module SettinX 1.1)
  vs `app_v1` (IPAN APP SettinX V1) → auto-email setelah LUNAS berisi link MediaFire
  (env `SETTINX_MODULE_1_1_DOWNLOAD_URL`) + ringkasan invoice; endpoint `/api/settinx/resend`
  menangani email link download Module terpisah dari generate kredensial Firebase V1.
- `server/.env.example`: tambah `SETTINX_MODULE_1_1_DOWNLOAD_URL`.
- `src/pages/admin/Orders.tsx`: tombol admin "Kirim Ulang Link Download" vs
  "Generate & Kirim Ulang Kredensial" tergantung tipe produk; kondisi tampil license UID/error
  hanya untuk V1.
- `database/migrations/sql_patches/add_settinx_type_column.sql`: patch idempotent
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settinx_type TEXT;`
- Test: `/api/health` OK; auto-email Module (via resend admin) berhasil terkirim ke buyer test;
  `email_sent` trackable setelah kolom ada; `npm run build` lolos.
- **Deploy**: commit `db6e958`, push `main`, server pull + `docker compose up --build -d`.
  Frontend `https://ipanstore.id` → 200, API `https://api.ipanstore.id/api/health` → 200.

### 2. Polish UI kartu paket (Layanan/Paket/Order) — ✅ dibuild & ter-deploy
`src/pages/Layanan.tsx`:
- Subtitle "Modul & paket tambahan dari tim IPAN STORE." → `leading-relaxed max-w-xl mx-auto`, judul `mb-3`.
- Header card APP SETTINX → `flex items-start justify-between gap-3 mb-5` (badge "LISENSI LIFETIME" sejajar
  dengan ikon, tidak loncat ke atas); fallback spacer `<span className="w-24">` jika highlight kosong.
- Title `mb-1`, price `mb-5` (spacing proporsional).

`src/pages/Paket.tsx`:
- Header card → `items-start justify-between gap-3 mb-5 min-h-[24px]`.
- Badge highlight (REKOMENDASI / PALING LARIS / PRO CHOICE / TOURNAMENT SECURE) sejajar atas; title `mb-1`, price `mb-5`.

`src/pages/Order.tsx`:
- Card paket rapi: category `block mb-1`, title `mb-0.5`, price `mb-3`, list fitur `mb-2 leading-snug`, CTA "Terpilih" `mt-2`.

`src/lib/services.ts`:
- `parseFeatures()` — hanya ambil baris ber-bullet (•/-/*/*) untuk list fitur kartu;
  paragraf intro/penjelasan deskripsi tidak lagi masuk ke kartu Order.

### 2. Kategori Layanan eksplisit → ✅ (sudah dijalankan user + code ter-deploy)
- Kolom `category TEXT NOT NULL` di tabel Supabase `services` + backfill otomatis (8 layanan OK).
- Closed-list `CHECK` constraint: `"Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX"`.
- `src/lib/services.ts`: export `SERVICE_CATEGORIES`, `resolveCategory()` fallback slug-derived.
- `src/hooks/useServices.ts`: field `category` di interface Service.
- `src/pages/admin/Services.tsx`: dropdown "Kategori *" di form + validasi client-side (price, slug regex, slug unik).
- `src/pages/Layanan.tsx`: tab APP SETTINX render section "Produk APP SETTINX Lainnya" dari DB.
- Patch SQL:
  - `database/migrations/sql_patches/supabase_patch_services_add_category.sql`
  - `database/migrations/sql_patches/supabase_patch_services_rls_audit.sql`

### 3. Fix "Failed to fetch" di halaman Order → ✅ (akar masalah 2 lapis)

**Lapisan 1 — Backend produksi mati (502):**
- Penyebab di VPS (`100.89.140.16`, path `/project/website/padel/IpanStore/ipanstore`):
  - `server/node_modules/helmet` hilang (dependensi baru belum di-install di VPS).
  - `server/lib/notify.js` ada di lokal tapi belum pernah di-commit → tidak ada di VPS → PM2 crash `ERR_MODULE_NOT_FOUND`.
- Fix:
  - `npm install --omit=dev` di `server/` VPS (helmet terpasang).
  - scp `server/lib/notify.js` → VPS.
  - `pm2 restart ipanstore-backend --update-env` → port 5159 listening.
  - Verifikasi: `/api/health` 200; `POST /api/klikqris-create-order` payload valid → 200 + qris_url + qris_image.

**Lapisan 2 — Bundle frontend lama (http://localhost:5159):**
- Container `ipanstore` menyajikan bundle lama `index-mlP4BELe.js` → `Order-DdYmm95A.js` yang
  memakai `VITE_BACKEND_URL=http://localhost:5159` → browser pengunjung memanggil localhost sendiri → "Failed to fetch".
- Fix:
  - `.env` server root: `VITE_BACKEND_URL=https://sever-h81m-s2ph.tail23dc7f.ts.net` → `https://api.ipanstore.id`.
  - Build baru dari lokal dengan `VITE_BACKEND_URL=https://api.ipanstore.id` → bundle `index-BMMCKAfr.js` + Order pakai API URL benar.
  - Di VPS: dist lama di-arsip `dist.bak-prodef`, dist baru di-SCP, `docker compose up --build -d`.

**Bonus bug nginx (ketahuan saat deploy):**
- nginx crash `[emerg] unknown directive "server"` karena **BOM (UTF-8 BOM) di awal `nginx.conf`**.
- Fix: hapus BOM di VPS (`sed`) & di lokal (byte strip), commit `271633c`.

### 4. Git — commit & deploy (semua sudah push)
| Commit | Isi |
|---|---|
| `ecd76e7` | fix backend produksi (helmet+notify.js) + kategori layanan + polish UI + parseFeatures + file baru (Dockerfile, docker-compose, nginx.conf, notify.js, Admins, CekOrder, dst.) |
| `271633c` | fix: hapus BOM dari nginx.conf |
| `6a19831` | docs: update LASTACTIVITY |
- Deploy: `git pull` di VPS (fast-forward), `docker compose up --build -d`.

### 5. Status verifikasi akhir
| Endpoint | Status |
|---|---|
| `https://ipanstore.id/order` | ✅ 200 (serve `index-BMMCKAfr.js`) |
| `https://ipanstore.id` | ✅ 200 |
| `https://api.ipanstore.id/api/health` | ✅ 200 |
| `POST https://api.ipanstore.id/api/klikqris-create-order` (payload valid) | ✅ 200 + qris_url |
| DEV `http://localhost:8080` | ✅ 200 |
| DEV API `http://localhost:5159` | ✅ 200 |

## Catatan teknis penting untuk sesi berikutnya

- **VPS `git pull` bisa gagal** jika file untracked menabrak (Dockerfile/docker-compose/nginx.conf/notify.js).
  Cara aman: cek `diff` dengan `git show origin/main:<file>`; jika sama → backup ke `.backup-untracked/` lalu pull.
- **JANGAN simpan `nginx.conf` ber-BOM** — nginx akan error `unknown directive "server"`.
  Sudah bersih di repo.
  Verifikasi: `head -c 3 file | od -c` harus bukan `357 273 277`.
- File "junk" untracked di VPS (`.backup-untracked/`, `dist.bak-*`, `nginx.conf.bak-local`,
  `nginx.conf.new`, `server/orders.json`, `server/test-supabase.mjs`) bisa dibersihkan — tidak memengaruhi repo.
- Backend di VPS jalan via **PM2** (`ipanstore-backend`, port 5159), bukan Docker.
  Frontend jalan via **Docker** (`ipanstore`, port 5007→80).
- Cache browser: setelah deploy gunakan hard-reload (Ctrl+Shift+R) agar bundle baru termuat.

## Backward compatibility & desain kategori (dari sesi sebelumnya)

- Row lama tanpa `category` di-backfill otomatis sebelum NOT NULL dipasang.
- Karena CHECK constraint, typo kategori ditolak Supabase saat INSERT; dropdown baca `SERVICE_CATEGORIES` agar sinkron.
- `resolveCategory(row)` fallback slug→kategori untuk baris legacy.

## Saran Tambahan (BELUM dilakukan)

- [ ] Auto-refresh Daftar Layanan di admin ketika ada perubahan real-time (Supabase channel).
- [ ] Audit policies tabel testimonials/faqs/promo_codes (paralel dengan patch RLS).
- [ ] Admin form Services: warning inline kalau slug tidak match regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- [ ] Halaman `/paket` masih pakai array statis; extend auto-inject products from DB.
- [x] ~~Produk "Ipan Module SettinX 1.1" di DB masih kategori 'Optimize' — ubah ke 'APP SETTINX' via admin
      supaya muncul di tab APP SETTINX.~~ ✅ Sudah diubah user via dashboard Supabase.
- [ ] Bersihkan file junk untracked di VPS (daftar di atas).

## Riwayat Sesi

| Waktu | Aktivitas |
|---|---|
| 2026-09-10 | ✅ Deploy FIX keamanan SettinX (commit ce465d3): password plaintext dihapus dari Firestore, reuse/resend rotate password, webhook tolak order palsu. Frontend produksi 200. |
| 2026-09-10 | 🔐 FIX keamanan SettinX: password plaintext dihapus dari Firestore (hash SHA-256), reuse/resend rotate password, webhook tolak order palsu, refactor resolveSettinxCredentials. BELUM commit/push/deploy. |
| 2026-09-10 | Deploy fitur Ipan Module SettinX 1.1 (commit db6e958 push+deploy). Frontend & API produksi 200. |
| 2026-09-10 | Patch SQL kolom `settinx_type` di tabel `orders` berhasil dijalankan user (Success). |
| 2026-09-09 | FIX total "Failed to fetch": backend PM2 (helmet+notify.js), redeploy frontend, fix BOM nginx.conf. Web produksi & API 200. |
| 2026-09-09 | Commit+push+deploy: ecd76e7 (backend+kategori+UI+bundle), 271633c (BOM), 6a19831 (docs). |
| 2026-09-09 | Polish UI kartu paket Layanan/Paket/Order + parseFeatures bullets. |
| 2026-09-09 | Kolom category + backfill 8 layanan + dropdown admin + tab APP SETTINX render DB. |
| 2026-09-09 | Patch supabase add_category & rls_audit dijalankan user. |