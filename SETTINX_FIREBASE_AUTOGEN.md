# 🔐 Auto-Generate Kredensial SettinX V1 (Firebase) saat Pembelian

Dokumen ini menjelaskan **fitur baru**: setiap pembeli IPAN APP SettinX V1 yang sudah
**lunas (PAID)** otomatis dibuatkan **akun Firebase** (email + password acak) dan
**License Key** (= UID Firebase) oleh backend, lalu dikirim lewat email bersama
link download.

Aplikasi SettinX (`D:\Ipan-AppSettinX-V1\PROJECT-IPAN-X-ESCO\src\ipan_optimizer\app\auth.py`)
sudah dirancang persis untuk ini:
- Login pakai **Email/Password** → Firebase Auth return `localId` (UID).
- License key yang dimasukkan user **harus sama dengan UID** tersebut
  (`if license_key != uid: tolak`).
- `bind_device()` → 1 lisensi hanya untuk 1 perangkat.

---

## Yang SUDAH dikerjakan di kode (tinggal deploy + migrasi)

| File | Keterangan |
|---|---|
| `server/lib/settinxLicense.js` | Modul `assignSettinxLicense()`: buat akun Firebase Auth + simpan ke Firestore `settinx_licenses`, reuse bila email sama. |
| `server/index.js` | 2 jalur pembayaran (webhook KlikQris + polling) & endpoint DOKU kini otomatis generate + kirim kredensial di email. |
| `server/index.js` | Endpoint baru `POST /api/settinx/resend` (dipakai tombol di dashboard admin). |
| `src/pages/admin/Orders.tsx` | Tombol **"Generate & Kirim Ulang Kredensial"** untuk order SettinX + tampil License UID & error. |
| `sql_patches/add_settinx_license_columns.sql` | Migrasi 2 kolom baru di tabel `orders`. |
| `server/.env` + `server/.env.example` | Variabel `SETTINX_FIREBASE_PROJECT_ID` & `SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE`. |
| `server/secrets/settinx-service-account.json` | Service-account (RAHASIA, sudah di `.gitignore`). |

---

## ⚠️ LANGKAH MANUAL #1 — Jalankan migrasi di Supabase (WAJIB)

Buka **Supabase Dashboard** → login → pilih project yang sama dengan
`VITE_SUPABASE_URL` di `.env` → menu kiri **SQL Editor** → **New query** →
`Ctrl+A` lalu `Delete` (hapus query lama) → **paste SQL di bawah** → **Run**.

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS settinx_license_uid TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS settinx_license_error TEXT;
```

**Verifikasi:** berdiri di bawah query tersebut, jalankan:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders' AND column_name LIKE 'settinx%';
```

Hasil harus 2 baris: `settinx_license_error` dan `settinx_license_uid`.
File sumber: `sql_patches/add_settinx_license_columns.sql:9`

> Kalau gagal/error: screenshot pesannya & kirim ke saya, atau hubungi tim.

---

## ⚠️ LANGKAH MANUAL #2 — Firestore Rules: JANGAN UBAH APA PUN ❌

**Rules aktif yang ada di Firebase sekarang (versi "Device license binding for IPAN
Optimizer member access") SUDAH BENAR — biarkan seperti itu.**

Penjelasan:
- App SettinX mengakses Firestore lewat **REST API dengan idToken user** saat login,
  jadi aksesnya **terkena Security Rules**. Rules aktif mengizinkan:
  - `allow read` `deviceUsers/{uid}` hanya untuk pemilik UID-nya, dan
  - `allow create` pasangan `deviceUsers` + `deviceBindings` dengan cross-check
    anti-tamper (inilah fitur **1 lisensi = 1 perangkat**).
- Kalau rules diganti `allow read, write: if false` untuk semuanya → app **gagal
  login** karena tidak bisa menulis device binding-nya.
- Backend kita pakai `firebase-admin` (Admin SDK) yang **melewati semua rules**, jadi
  collection baru `settinx_licenses` bisa ditulis/dibaca backend tanpa rules tambahan.
- Karena tidak ada `match /settinx_licenses/...` di rules, aksesnya default **tolak
  untuk client biasa** → sudah aman dari sisi client.

Jadi: **Task Manual #2 batal — Firebase tidak perlu disentuh sama sekali.**

---

## ⚠️ LANGKAH MANUAL #3 — Deploy ke server (PM2)

Backend live jalan dengan **PM2** (bukan Docker) di server
`100.89.140.16`, folder `/project/website/padel/IpanStore/ipanstore`.

### a) Taruh service-account di server (sekali saja)

```bash
scp "D:\ipanstore\server\secrets\settinx-service-account.json" root@100.89.140.16:/root/ipanstore-secrets/settinx-service-account.json
```

> Kalau folder belum ada, jalankan dulu via SSH:
> `ssh root@100.89.140.16 "mkdir -p /root/ipanstore-secrets"`

### b) Push kode + pasang dependency + restart

```bash
git add server/index.js server/lib/settinxLicense.js server/package.json server/package-lock.json server/.env.example sql_patches/add_settinx_license_columns.sql src/pages/admin/Orders.tsx src/hooks/useOrders.ts src/lib/admin/supabase.ts SETTINX_FIREBASE_AUTOGEN.md .gitignore
git commit -m "feat: auto-generate kredensial SettinX V1 di Firebase saat pembelian"
git push origin main
```

Lalu di server:
```bash
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore && git pull && cd server && npm install && pm2 restart ipanstore-backend --update-env"
```

### c) Isi env di server

Di server edit `server/.env`:
```bash
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore/server && nano .env"
```
tambahkan:
```
SETTINX_FIREBASE_PROJECT_ID=ipan-app-settinx
SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE=/root/ipanstore-secrets/settinx-service-account.json
```
lalu `pm2 restart ipanstore-backend --update-env`.

> ⚠️ File `.env` & `server/secrets/*` **tidak ikut ter-commit** (`.gitignore`).
> Karena itu service-account harus dikirim manual via SCP (langkah a).

---

## Verifikasi lengkap

1. **Cek log backend**: `pm2 logs ipanstore-backend | grep -i settinx`
   → harus muncul `✨ SettinX license DIBUAT untuk ...` saat order SettinX lunas.
2. **Cek Firebase Console** → Build → **Authentication → Users** → akun pembeli
   harus muncul (email = username pembeli).
3. **Cek Firestore** → collection `settinx_licenses` → doc id = UID, field
   `username`, `password`, `licenseKey`, `from_invoice`.
4. **Cek email pembeli** → ada kartu **"🔐 Kredensial Login IPAN APP SettinX V1"**
   berisi Username / Password / License Key.
5. **Cek dashboard admin** → buka order SettinX → terlihat License UID & status email.

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Email terkirim tapi **tanpa kredensial** | Firebase belum dikonfigurasi di `server/.env` server (cek `SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE`), atau service-account file tidak ada di path itu. Cek `pm2 logs` untuk pesan `SettinX license GAGAL`. |
| `auth/email-already-exists` | User sudah ada di Firebase Auth tapi belum tercatat di Firestore → backend **otomatis pakai user lama** (log `⚠️ auth/email-already-exists`). Aman. |
| License key ditolak aplikasi SettinX | License key yang diketik user harus **persis License Key dari email** (= UID). Pastikan tidak ada spasi/kekurangan karakter. |
| Tombol di admin error `VITE_BACKEND_URL belum dikonfigurasi` | `.env` frontend belum punya `VITE_BACKEND_URL=https://api.ipanstore.id`. |