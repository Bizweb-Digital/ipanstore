# SETUP DOKU · SMTP GMAIL · DEPLOY VPS — IPAN STORE

> **Dokumen ini adalah catatan lengkap** semua yang sudah dikerjakan pada migrasi
> payment gateway **KlikQRIS → DOKU Checkout** dan perbaikan email transaksional.
> Tujuan: siapa pun (atau sesi AI berikutnya) bisa mengulang/mengaudit tanpa menebak.
>
> **Terakhir diperbarui:** 2026-11-18
> **Status:** Kode SELESAI & teruji E2E dengan pembayaran asli. **BELUM DI-DEPLOY** ke produksi
> (ditahan karena menunggu audit keamanan penuh).

---

## 0. Ringkasan Cepat

| Area | Status |
|---|---|
| Migrasi KlikQRIS → DOKU Checkout (kode) | ✅ Selesai, KlikQRIS dihapus total |
| E2E browser + pembayaran QRIS **asli Rp 1.000** | ✅ Sukses (order `IPANMODULESETTINX111794996849719`) |
| Auto-create akun + license key SettinX | ✅ Bekerja |
| Email transaksional (template lengkap) | ✅ Bekerja setelah fix **IPv4** |
| Audit env VPS (`DOKU_ALLOW_TEST_AMOUNT`) | ✅ Tidak di-set → **aman** |
| **Deploy ke produksi** | ⛔ **DITAHAN** — menunggu audit keamanan |
| Logo checkout DOKU | ⚠️ Manual via Dashboard DOKU (lihat §8) |

---

## 1. Kredensial & Konfigurasi DOKU

### 1.1 Cara memperoleh kredensial

1. Login ke **[DOKU Dashboard](https://dashboard.doku.com)**.
2. Masuk ke menu **Settings → API Keys** (atau *Integration → API Credentials*).
3. Ambil:
   - **Client ID** — boleh tampil di log/frontend.
   - **Secret Key** — **RAHASIA**, hanya untuk backend. Jangan pernah masuk ke bundle frontend.
4. Kredensial **production** berbeda dari **sandbox**. Pastikan `DOKU_BASE_URL` cocok dengan kredensial yang dipakai.

### 1.2 Environment variable backend (`server/.env`)

```dotenv
# ─── DOKU Checkout ──────────────────────────────────────────────────────────
DOKU_CLIENT_ID=BRN-xxxx-xxxxxxxxxxxxx        # dari Dashboard DOKU
DOKU_SECRET_KEY=SK-xxxx-xxxxxxxxxxxxxxxxxx    # RAHASIA — jangan commit!
DOKU_BASE_URL=https://api.doku.com            # PRODUCTION
# DOKU_BASE_URL=https://api-sandbox.doku.com  # untuk sandbox
DOKU_CHECKOUT_PATH=/checkout/v1/payment
DOKU_CALLBACK_URL=https://ipanstore.id/order
DOKU_NOTIFICATION_URL=https://api.ipanstore.id/api/doku-webhook

# ⚠️ WAJIB kosong/false di produksi. Lihat §1.4.
# DOKU_ALLOW_TEST_AMOUNT=true
```

### 1.3 Dua URL penting — jangan tertukar

| Variabel | Fungsi | Nilai produksi |
|---|---|---|
| `DOKU_NOTIFICATION_URL` | **Webhook server-to-server** dari DOKU ke backend. Ini yang menandai order PAID. | `https://api.ipanstore.id/api/doku-webhook` |
| `DOKU_CALLBACK_URL` | **Redirect browser** pembeli setelah bayar. | `https://ipanstore.id/order` |

> ⚠️ **Konsekuensi nyata (sudah terbukti saat E2E):** karena `DOKU_CALLBACK_URL` menunjuk domain
> produksi, pengujian di `localhost` akan **kehilangan sesi** setelah pembayaran — browser diredirect
> keluar dari localhost, sehingga data `localStorage` tidak bisa dibaca lagi. Ini **bukan bug**.
> Untuk E2E lokal, ubah sementara `DOKU_CALLBACK_URL` ke `http://127.0.0.1:8081/order`, atau
> verifikasi hasil pembayaran langsung dari DB + log backend (cara yang dipakai di sesi ini).

### 1.4 🔴 `DOKU_ALLOW_TEST_AMOUNT` — RISIKO UANG HILANG

Fitur ini membuat backend membolehkan nominal **lebih kecil** dari harga produk di DB.

- **Kalau `true` di produksi:** pembeli bisa membayar **Rp 1.000 untuk produk Rp 50.000**.
- **Aturan:** hanya `true` saat pengujian, **WAJIB tidak di-set (atau `false`) di produksi.**

**Cara audit di VPS:**
```bash
ssh root@100.89.140.16
grep -n "DOKU_ALLOW_TEST_AMOUNT" /project/website/padel/IpanStore/ipanstore/server/.env
pm2 describe ipanstore-backend | grep -i TEST_AMOUNT
```
**Hasil audit 2026-11-18:** ✅ **tidak ada** di `.env` maupun env PM2 → **aman**.

**Cara E2E tanpa risiko (yang dipakai sesi ini):** intersep request di browser
(`page.route('**/api/doku-create-order')` → paksa `amount: 1000`), **tanpa** mengubah DB
dan **tanpa** menyalakan `DOKU_ALLOW_TEST_AMOUNT` di server.

---

## 2. Arsitektur DOKU di Kode

### 2.1 Endpoint backend (`server/index.js`)

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/api/doku-create-order` | Buat checkout. Rate-limit `orderLimiter`. |
| `GET` | `/api/doku-status/:orderId` | Cek status order (polling frontend). |
| `POST` | `/api/doku-webhook` | Terima notifikasi pembayaran dari DOKU. |
| `POST` | `/api/doku-cancel-order` | Batalkan order. |

### 2.2 Signature DOKU (HMAC-SHA256)

```js
function generateDokuSignature({ clientId, requestId, requestTimestamp, requestTarget, digest }) {
  const parts = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
  ];
  // Digest hanya untuk POST (ada body). Untuk GET baris ini DIHILANGKAN.
  if (digest) parts.push(`Digest:${digest}`);
  const hmac = crypto.createHmac("sha256", DOKU_SECRET_KEY).update(parts.join("\n")).digest("base64");
  return `HMACSHA256=${hmac}`;
}
```

**Catatan penting:**
- Komponen digabung dengan `\n`, **urutan wajib** seperti di atas.
- `Digest` = `base64(sha256(rawBody))`. Untuk **GET** jangan disertakan — DOKU membalas
  `invalid_signature` kalau disertakan.
- Webhook **butuh RAW body**; karena itu `express.raw()` didaftarkan **sebelum** `express.json()`:
  ```js
  app.use("/api/doku-webhook", express.raw({ type: "*/*" }));
  ```
  Kalau urutan ini terbalik, signature **selalu gagal**.

### 2.3 Verifikasi webhook

- Header wajib: `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature`.
- Tanpa header lengkap → `401`.
- Signature tidak cocok → `401 Invalid signature`.
- Replay protection dua lapis: `inFlightWebhooks` (Set, cegah duplikat konkuren) +
  `processedWebhooks` (Map + tabel Supabase `webhook_replays`, tahan restart, TTL 24 jam).

### 2.4 Frontend

- `src/lib/doku.ts` — helper panggil backend. **Tidak ada kredensial DOKU di browser.**
- `src/pages/Order.tsx` — halaman order: pilih paket → isi data → `POST /api/doku-create-order`
  → `window.location.href = payment_url`.

---

## 3. Setup SMTP Gmail

### 3.1 Membuat App Password Gmail

Password akun Gmail biasa **tidak bisa** dipakai untuk SMTP. Harus **App Password**:

1. Aktifkan **2-Step Verification** dulu di akun Google (wajib).
2. Buka <https://myaccount.google.com/apppasswords>.
3. Buat app password baru (nama bebas, mis. `IPAN STORE Server`).
4. Google menampilkan **16 karakter** — copy (spasi boleh dihapus).

### 3.2 Environment (`server/.env`)

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=alamat@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx     # App Password 16 karakter (BUKAN password login)
MAIL_FROM="IPAN STORE <alamat@gmail.com>
```
> `MAIL_FROM` opsional; kalau kosong backend memakai `IPAN STORE <SMTP_USER>`.

### 3.3 🔴 BUG YANG DITEMUKAN & DIPERBAIKI (2026-11-18): `ENETUNREACH`

**Gejala** (dari log VPS, saat pembayaran asli sukses):
```
✅ Webhook DOKU diterima: invoice=... status=SUCCESS amount=1000
✨ Module SettinX license DIBUAT → ID ipanasik123
📧 Email Module SettinX GAGAL: connect ENETUNREACH 2404:6800:4003:c00::6d:465
```

**Dampak:** pembeli **sudah bayar** tapi **tidak menerima email** berisi lisensi.

**Akar masalah:**
- `smtp.gmail.com` mengumumkan record **A** (IPv4) **dan AAAA** (IPv6).
- VPS **tidak punya route IPv6** (`ping -6` → `Network is unreachable`).
- Node memilih IPv6 lebih dulu → koneksi gagal.
- **Bersifat intermittent** — uji ulang kadang berhasil. Ini yang membuatnya lolos dari pengujian awal.

**Perbaikan:** paksa IPv4 + timeout eksplisit, di **dua** tempat:

`server/index.js` (`emailTransporter`) **dan** `server/lib/notify.js` (`paidEmailTransporter`):

```js
nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  family: 4,                 // ← WAJIB: paksa IPv4
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});
```

> ⚠️ Kalau hanya memperbaiki satu tempat, jalur lain masih akan gagal. Keduanya **wajib** sama.

**Verifikasi di VPS:**
```bash
node -e "t.verify()"   # → "SMTP IPv4: OK"
```

---

## 4. Email Transaksional "Ipan Module SettinX 1.1"

### 4.1 Isi email (template asli — permanen)

1. Ringkasan Pesanan — invoice, produk, status **LUNAS**, total, waktu bayar.
2. **🔐 Kredensial Login** — ID Akun, Password, License Key.
3. **📋 Salin Semua Sekali Klik** — ketiga kredensial dalam satu kotak.
4. Tombol **⬇️ Download IPAN Module SettinX 1.1** + link teks cadangan.
5. **📖 Cara Pakai**.
6. Tombol WhatsApp admin + link grup komunitas.

### 4.2 Tombol salin — kenapa bukan tombol biasa

**Gmail, Outlook, dan hampir semua klien email MEMBLOKIR JavaScript** (`<script>`, `onclick`).
Tombol `navigator.clipboard.writeText()` **tidak akan berfungsi** di email.

Yang dipakai (bekerja tanpa JS):
- `user-select: all` → **satu klik menyeleksi seluruh nilai**, tinggal `Ctrl+C` / tekan lama → Copy.
- Petunjuk kecil di bawah setiap field.
- Blok `class="copy-all-inline"` untuk menyalin ketiga kredensial sekaligus.

> ⚠️ Saat mengubah template: **jangan** memakai newline mentah di dalam `<div>` — Gmail
> menghapusnya. Gunakan `<div>…</div>` per baris atau `<br/>`.

### 4.3 Link Drive — DUA variabel, jangan tertukar

| Variabel | Dipakai oleh |
|---|---|
| `SETTINX_DOWNLOAD_URL` | Email paket **non-module** (App V1 / Set PC / Anti-Cheat) |
| `SETTINX_MODULE_1_1_DOWNLOAD_URL` | Email **Module SettinX 1.1** (`module_1_1`) |

**Bug lama:** variabel module menunjuk **file** Drive basi (`/file/d/1U3uz7-…`), bukan folder aktif.
**Diperbaiki:** keduanya default ke folder Drive aktif:

```
https://drive.google.com/drive/folders/1FhroO8GV6bdt9Y3fM-Nvr6cL5CwgGxmS?usp=sharing
```

### 4.4 Link grup WhatsApp

```js
const MODULE_COMMUNITY_GROUP_URL = "https://chat.whatsapp.com/IoLKaH87TBXA6Nyf6XdwjZ";
```
> Diganti 2026-11-18 dari `DoKUsn9NlFOFJBX1VQcB8U`.

---

## 5. Auto-Create Akun + License Key (Supabase Module SettinX)

Project Supabase **terpisah** dari Supabase website:

```dotenv
MODULE_SETTINX_SUPABASE_URL=https://ydoubotecwoamuyacqhw.supabase.co
MODULE_SETTINX_SUPABASE_SERVICE_ROLE_KEY=...
```

**Alur saat order `module_1_1` LUNAS** (`server/lib/moduleSettinxLicense.js`):
1. ID akun dibuat dari email: `ipanasik123@gmail.com` → `ipanasik123` (akun `…@settinx.app`).
2. Kalau ID sudah dipakai (repeat purchase) → `ipanasik123-2`, `-3`, dst. Akun lama **tidak disentuh**.
3. Password digenerate acak, license key dibuat di tabel `public.licenses`.
4. Kredensial dikirim ke email pembeli lewat `sendModuleSettinxEmail()`.

> ⚠️ **Password TIDAK disimpan di DB** — hanya ada di memori saat dibuat. Kalau email gagal,
> password **hilang permanen** dan harus di-reset manual (`/api/settinx/resend` **tidak**
> mengembalikan password). Ini alasan kuat kenapa fix IPv4 di §3.3 itu **kritis**.

### 5.1 Notifikasi WhatsApp (Fonnte) — OPSIONAL

Di samping email, ada jalur notifikasi WhatsApp via **Fonnte** (`server/lib/notify.js`).

```dotenv
WA_NOTIFY_ENABLED=false            # true untuk mengaktifkan
FONNTE_TOKEN=your_fonnte_token     # dari dashboard Fonnte → API Token
```

**Perilaku:** hanya aktif bila **keduanya** terisi (`WA_NOTIFY_ENABLED=true` **dan** `FONNTE_TOKEN` ada).
Kalau salah satu kosong, backend mencatat `ℹ️ WA notify dilewati` dan **tidak** menggagalkan order.

> ⚠️ **Tidak bergantung pada email.** Kalau SMTP gagal (§3.3), WA bisa tetap terkirim — dan
> sebaliknya. Saat audit, periksa keduanya sebagai jalur independen.

### 5.2 `MAIL_FROM` — opsional

Kalau `MAIL_FROM` kosong, backend memakai default `IPAN STORE <SMTP_USER>`.
**Hasil audit VPS 2026-11-18:** `MAIL_FROM` kosong → memakai default, **bukan masalah**.

---

## 6. Setup VPS (Produksi)

### 6.1 Identitas host

```
Host Tailscale : root@100.89.140.16  (sever-h81m-s2ph)
Path project   : /project/website/padel/IpanStore/ipanstore
```
> ⚠️ Ada host Tailscale **lain** bernama `server` (`100.70.48.103`). **JANGAN tertukar** —
> VPS ini dipakai bersama banyak project Bizweb.

### 6.2 Komponen runtime

| Komponen | Detail |
|---|---|
| Backend | PM2, nama proses `ipanstore-backend`, script `server/index.js`, port **5159** |
| Frontend | Docker container `ipanstore`, port **5007** → 80 (nginx) |
| Reverse proxy | `https://api.ipanstore.id` → backend; `https://ipanstore.id` → frontend |
| Deploy script | `./deploy.sh` → `git pull && docker compose down && docker compose up --build -d` |

### 6.3 PM2

```bash
pm2 list                        # cek status
pm2 logs ipanstore-backend      # log realtime
pm2 describe ipanstore-backend  # detail (script path, env)
pm2 restart ipanstore-backend   # ⚠️ restart backend saja (frontend tidak ikut)
pm2 save                        # simpan state agar tahan reboot
```

### 6.4 Docker frontend

```bash
docker ps --filter name=ipanstore
docker compose -f config/docker/docker-compose.yml up --build -d
```

### 6.5 `.env` di VPS (lokasi)

```
/project/website/padel/IpanStore/ipanstore/server/.env
```
> **Jangan pernah** `cat` file ini ke terminal bersama / ke chat. Untuk audit, pakai pola
> **status saja**:
> ```bash
> for K in DOKU_CLIENT_ID DOKU_SECRET_KEY SMTP_PASS; do
>   V=$(grep -E "^${K}=" "$P" | cut -d= -f2-)
>   [ -z "$V" ] && echo "$K = KOSONG" || echo "$K = TERISI (${#V} char)"
> done
> ```
> Untuk variabel **non-rahasia** (URL, boolean), nilainya boleh ditampilkan.

---

## 7. Prosedur Deploy (JANGAN dijalankan sebelum audit keamanan selesai)

> ⛔ **SAAT INI DITAHAN** atas permintaan pemilik project (2026-11-18).

### 7.1 Pra-deploy checklist

- [ ] `DOKU_ALLOW_TEST_AMOUNT` **tidak** `true` di VPS
- [ ] `DOKU_NOTIFICATION_URL=https://api.ipanstore.id/api/doku-webhook`
- [ ] `DOKU_BASE_URL=https://api.doku.com` (production)
- [ ] `DOKU_CALLBACK_URL=https://ipanstore.id/order`
- [ ] `SETTINX_MODULE_1_1_DOWNLOAD_URL` = folder Drive aktif
- [ ] Fix `family: 4` ada di **kedua** file (index.js + notify.js)
- [ ] `node --check server/index.js && node --check server/lib/notify.js`
- [ ] `npx tsc --noEmit` bersih
- [ ] Commit & push ke git (deploy.sh melakukan `git pull`)
- [ ] Backup: `cp server/.env server/.env.bak-$(date +%Y%m%d)`

### 7.2 Langkah

```bash
ssh root@100.89.140.16
cd /project/website/padel/IpanStore/ipanstore
./deploy.sh                       # frontend (docker)
pm2 restart ipanstore-backend     # backend
pm2 logs ipanstore-backend --lines 30
```

### 7.3 Verifikasi pasca-deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5159/api/health           # 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5159/api/doku-status/TEST # 404 (order tak ada)
```
Lalu lakukan **1 transaksi uji nyata** (nominal kecil) dan pastikan:
- webhook log `✅ Webhook DOKU diterima … status=SUCCESS`
- log `📧 Email Module SettinX TERKIRIM`
- DB `orders.email_sent = true`, `settinx_type = 'module_1_1'`

### 7.4 Rollback

```bash
git log --oneline -5          # cari commit sebelumnya
git reset --hard <commit>
./deploy.sh && pm2 restart ipanstore-backend
```

---

## 8. Logo di Halaman Checkout DOKU

**Bukan bug kode.** Menurut dokumentasi DOKU (*Checkout Settings*), logo halaman checkout
**hanya** diatur via **DOKU Dashboard**, tidak ada parameter API untuk itu.

**Langkah:**
1. Login **[DOKU Dashboard](https://dashboard.doku.com)**.
2. Masuk **Settings → Checkout Page → Interface Settings**.
3. Upload logo.
4. Simpan, lalu buka checkout baru untuk memverifikasi.

**Aset logo yang disarankan:**
| File | Ukuran | Catatan |
|---|---|---|
| `src/assets/logo-transparent.png` | 288×114, 32 KB | ✅ paling cocok (transparan, ringan) |
| `src/assets/logo.png` | 600×230, 94 KB | alternatif resolusi lebih tinggi |
| `src/assets/logo.webp` | — | format webp, belum tentu didukung |

---

## 9. Data Uji & Kebersihan DB

### 9.1 Order uji yang tersisa (Supabase `zpjkroatjmegwnxzvwlw`)

| Invoice | Status | Catatan |
|---|---|---|
| `IPANMODULESETTINX111794996849719` | **PAID (uang asli Rp 1.000)** | 🟢 **SIMPAN** — bukti transaksi nyata |
| `E2EWH21794995975` | PAID | 🔴 hapus |
| `E2EWH1794995813` | — | 🔴 hapus |
| `E2EFIX1794995786` | — | 🔴 hapus |
| `PROBE41794993375` | — | 🔴 hapus |
| `PROBE51794993607` | — | 🔴 hapus |

### 9.2 Lisensi uji (Supabase Module SettinX, tabel `public.licenses`)

| Key | Akun | Catatan |
|---|---|---|
| `B4F4-5DE3-…` | `ipanasik123` | 🟢 **SIMPAN** — dari pembayaran asli |
| `FBA4-747C-…` | `ipanasik123-2` | ⚠️ duplikat akibat webhook ganda |
| `3204-0321-…` | dari uji webhook lokal | 🔴 hapus |

> **Replay/duplikat:** saat E2E, webhook DOKU masuk **dua kali** ke kode VPS **lama** (belum punya
> guard idempotensi), sehingga tercipta `ipanasik123-2`. Kode di repo **sudah** punya proteksi
> replay (§2.3) — aktif setelah deploy.

### 9.3 Sisa file lama di VPS (boleh dibersihkan nanti)

`server/orders.json`, `server/test-doku*.js`, `server/lib/myPg.js`, `server/lib/settinxLicense.js`,
dan ~8 folder `dist.bak-*`.

---

## 10. Jejak Perubahan Sesi Ini

### 10.1 File yang diubah

| File | Perubahan |
|---|---|
| `server/index.js` | Fix `family:4` SMTP; link Drive aktif; grup WA baru; template kredensial + salin sekali-klik |
| `server/lib/notify.js` | Fix `family:4` SMTP |
| `server/.env.example` | Dokumentasi dua variabel Drive |
| `src/lib/doku.ts` | (sesi sebelumnya) helper DOKU |
| `src/pages/Order.tsx` | (sesi sebelumnya) UI order DOKU |
| `src/lib/klikqris.ts` | **dihapus** |
| `server/lib/myPg.js` | **dihapus** |
| `server/test/my-pg.test.js` | **dihapus** |

### 10.2 ⚠️ Perubahan yang dilakukan LANGSUNG di VPS (belum tercermin di repo)

Ini penting — jangan sampai hilang saat audit:
1. **Password akun `ipanasik123@settinx.app` di-reset** menjadi `IpanPreview2026!`
   (agar preview email bisa dipakai login). Dilakukan lewat Supabase Admin REST API.
2. **File bantuan dikirim ke VPS lalu dihapus lagi** (`/tmp/setpw.cjs`, `/tmp/resend-preview.cjs`,
   `/tmp/notify-fixed-test.js`) — sudah bersih, tidak ada sisa.
3. **Email uji dikirim** dari SMTP VPS: `[TEST FIX IPv4]`, lisensi asli, dan preview template.

> **Tidak ada** perubahan kode di VPS. Repo VPS masih di commit `3657e52` (versi lama).

---

## 11. Audit Keamanan — Titik yang WAJIB Diperiksa

Daftar ini dari hasil pengamatan selama sesi; **belum diaudit menyeluruh**.

1. **`DOKU_ALLOW_TEST_AMOUNT`** — pastikan tidak pernah aktif di produksi (§1.4).
2. **Kredensial di `.env`** — pastikan tidak ter-commit. Cek `.gitignore` mencakup `server/.env`.
3. **`ADMIN_API_SECRET`** — dipakai header `x-admin-secret`. Cek kuat/tidak dan tidak bocor ke frontend.
4. **CORS** — `ALLOWED_ORIGINS` harus eksplisit, tanpa `*`.
5. **Rate limiting** — `orderLimiter`, `apiLimiter` aktif; cek batas wajar.
6. **Webhook signature** — verifikasi wajib; tolak request tanpa signature valid (§2.3).
7. **Replay protection** — cek tabel `webhook_replays` benar-benar dipakai setelah deploy.
8. **Header injection di email** — `sanitizeForHeader()` + `isValidEmail()` sudah menolak CR/LF/`<>`.
9. **Password tersimpan?** — password SettinX **tidak** disimpan (§5). Pastikan ini memang disengaja.
10. **Endpoint admin** — `/api/settinx/resend` pakai `requireAdminSecret`; pastikan tidak ada endpoint admin lain tanpa proteksi.
11. **`orders.json` di VPS** — file fallback lama, cek tidak berisi data sensitif.
12. **Port terekspos** — `docker ps` menunjukkan `0.0.0.0:5007`. Pastikan hanya port yang perlu terbuka.
13. **Dependency** — jalankan `npm audit` (backend & frontend).
14. **VPS Node versi 20** — `@supabase/supabase-js` memberi peringatan deprecated & butuh WebSocket
    native (Node 22+). Saat ini diakali dengan REST API langsung; pertimbangkan upgrade Node.

---

## 12. Referensi

- Dokumentasi DOKU Checkout: <https://developers.doku.com/accept-payments/doku-checkout>
- Checkout Settings (logo/expiry): <https://developers.doku.com/accept-payments/doku-checkout/configuration/checkout-settings>
- Google App Password: <https://myaccount.google.com/apppasswords>
- Supabase Admin API: <https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid>
