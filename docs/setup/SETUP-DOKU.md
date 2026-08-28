# Setup DOKU Checkout — Page "Order" IPAN STORE

Panduan lengkap agar payment gateway **DOKU** (DOKU Checkout) dapat menerima
pembayaran di IPAN STORE.

Berdasarkan dokumentasi resmi DOKU:
https://developers.doku.com/accept-payments/doku-checkout.md

---

## 📋 Ringkasan Alur DOKU Checkout

```
User isi form di /order (nama, email, paket)
        │
        ▼
Browser panggil backend Anda  POST /api/doku-create-order
        │                            (tanpa credential apa pun — semua rahasia ada di server)
        ▼
Backend generate Signature HMAC-SHA256 pakai Secret Key
        │
        ▼
Backend → DOKU   POST https://api.doku.com/checkout/v1/payment
        │              (header Client-Id, Request-Id, Request-Timestamp, Signature)
        ▼
DOKU balas  { response: { payment: { url: "https://checkout.doku.com/..." } } }
        │
        ▼
Browser redirect ke payment.url  (halaman checkout DOKU)
        │
        ▼
User pilih metode bayar (QRIS / VA / e-Wallet / dll) & bayar
        │
        ▼
DOKU kirim POST webhook ke /api/doku-webhook  → verifikasi signature → update order
```

### Kenapa backend wajib?
`SECRET_KEY` DOKU dipakai untuk menandatangani (sign) request API. Jika ada di
browser, orang lain bisa meniru / mencurangi transaksi Anda. Karena itu
**semua pemanggilan ke DOKU dilakukan lewat backend** (`server/index.js`).

---

## 🔑 Langkah 1 — Dapatkan Kredensial DOKU (Client ID & Secret Key)

> Akun Anda sudah terdaftar dan KYC sudah disetujui ✔

1. Login ke **Dashboard DOKU**
   - Sandbox (testing)    : https://sandbox.doku.com
   - Production (live)    : https://dashboard.doku.com
2. Buka halaman **API Keys** (bisa lewat sidebar kiri atau langsung URL):
   - Production : `https://dashboard.doku.com/bo/developer/api-keys`
   - Sandbox    : `https://sandbox.doku.com/bo/developer/api-keys`
3. Halaman menampilkan:
   - **Client ID** (contoh: `BRN-0221-1786002504877`)
   - **Active Secret Key** — klik **Copy Secret Key** untuk salin (nilai penuh, bukan 18 karakter yang di-mask).
   - **API Key** & **DOKU Public Key** (RSA) — dipakai untuk SNAP/asymmetric, **TIDAK dipakai** untuk DOKU Checkout kita.
4. Simpan aman:
   - **Client-Id** → masuk `server/.env` → `DOKU_CLIENT_ID`
   - **Secret Key** → masuk `server/.env` → `DOKU_SECRET_KEY` *(RAHASIA — jangan pernah di-commit atau ditaruh di front-end)*

---

## 🔔 Langkah 2 — Atur Notification URL (Webhook)

1. Di Dashboard DOKU → **Integrations → Notifications**
2. **Notification URL** = `https://<host-backend-anda>/api/doku-webhook`
   - Contoh lokal/testing   : `https://ipan-vps.tailxxxx.ts.net/api/doku-webhook`
     - Contoh production live : `https://api.ipanstore.id/api/doku-webhook`
     (atau lewat eksposur Tailscale Funnel / reverse proxy)
3. Klik **Save**.
4. Klik **Resend Sample Notification** untuk test (lihat di server log).

> Semua notifikasi pembayaran (SUCCESS / FAILED) akan POST ke URL ini.

---

## 🔧 Langkah 3 — Konfigurasi Environment

### 3a. Backend (`server/.env`)

```bash
# DOKU
DOKU_CLIENT_ID=MCH-0001-xxxxxxxxxxxxxxxx          # dari langkah 1
DOKU_SECRET_KEY=your_secret_key_here              # dari langkah 1 (RAHASIA)
DOKU_BASE_URL=https://api.doku.com                # https://api-sandbox.doku.com (sandbox)
DOKU_CHECKOUT_PATH=/checkout/v1/payment           # jangan ganti
DOKU_CALLBACK_URL=https://ipanstore.id/order   # "Back to merchant" setelah bayar

# CORS — domain front-end Anda
ALLOWED_ORIGINS=https://ipanstore.id,https://www.ipanstore.id,http://localhost:8080

# Port backend (bebas, mis. 3001)
PORT=3001
```

### 3b. Front-end (`.env` di root project)

```bash
# URL backend Anda (Tailscale / publik). Wajib, agar front-end tahu ke mana
# mengirim create-order (tanpa credential DOKU di browser).
VITE_BACKEND_URL=http://ipan-vps.tailxxxx.ts.net:3001
```

---

## ▶️ Langkah 4 — Jalankan Backend

```bash
cd server
npm install        # sekali saja (dependencias: express, cors, dotenv)
node index.js
# atau mode development (auto-restart):
node --watch index.js
```

Pastikan tampil:
```
🚀 Backend IPAN STORE jalan di http://localhost:3001
   CORS diizinkan untuk: ...
```

---

## 🚀 Langkah 5 — Deploy Backend ke VPS (Tailscale Funnel)

DOKU harus bisa panggil webhook dari internet publik. VPS `sever-h81m-s2ph`
sudah online via Tailscale — kita expose backend lewat **Tailscale Funnel** (HTTPS publik otomatis, gratis).

### 5a. Setup PM2 (process manager) di VPS

Login ke VPS via Tailscale SSH, lalu:

```bash
# Tarik kode terbaru (pastikan folder server/ ada di VPS)
cd /project/website/padel/IpanStore/ipanstore
git pull origin main

# Install dependencies backend
cd server
npm install

# Install PM2 globally (kalau belum)
npm install -g pm2

# Copy .env.example ke .env (atau pakai env yang sudah ada di repo)
cp .env.example .env
nano .env   # isi DOKU_CLIENT_ID, DOKU_SECRET_KEY (dari Dashboard)
# Simpan: Ctrl+O, Enter, Ctrl+X

# Start backend dengan PM2
pm2 start index.js --name ipanstore-backend
pm2 save
pm2 startup   # jalankan perintah yang muncul agar auto-start saat reboot
```

### 5b. Expose via Tailscale Funnel

```bash
# Izinkan backend jalan persistent di port 3001
sudo tailscale set --accept-routes

# Enable Funnel untuk expose backend ke internet publik
# (ganti 3001 jika Anda ganti PORT)
sudo tailscale funnel 3001 on

# Verify
tailscale funnel status
```

Setelah di-enable, Anda akan dapat URL publik seperti:
```
https://sever-h81m-s2ph.<tailnet-name>.ts.net
```

Verifikasi:
```bash
# Dari mesin mana saja (cek HTTPS-nya hidup):
curl https://sever-h81m-s2ph.<tailnet-name>.ts.net/api/health
# Output: {"ok":true,"service":"ipanstore-backend",...}
```

### 5c. Set Notification URL di Dashboard DOKU

1. Login https://dashboard.doku.com
2. **Settings → Developer → Notifications**
3. Isi **Notification URL**:
   ```
   https://sever-h81m-s2ph.<tailnet-name>.ts.net/api/doku-webhook
   ```
4. Klik **Save** → klik **Resend Sample Notification**.
5. Cek log PM2:
   ```bash
   pm2 logs ipanstore-backend --lines 50
   ```
   Harus muncul: `✅ Webhook DOKU diterima: ...`

---

## 🎨 Langkah 6 — Sambungkan Front-end dengan Backend Production

### 6a. Set `VITE_BACKEND_URL` di `.env` (root project)

Setelah Tailscale Funnel aktif, edit file `.env` di root project (bukan `server/.env`):

```bash
VITE_BACKEND_URL=https://sever-h81m-s2ph.<tailnet-name>.ts.net
```

### 6b. (Opsional) Update `server/.env` CORS

Pastikan domain front-end ada di `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://ipanstore.id,https://www.ipanstore.id,http://localhost:8080
```

Lalu restart backend:
```bash
pm2 restart ipanstore-backend
```

### 6c. Build & Deploy Front-end

```bash
cd /project/website/padel/IpanStore/ipanstore
npm run build
docker compose down
docker compose up --build -d
```

Verifikasi live: buka https://ipanstore.id/order, lakukan order test kecil (paket paling murah).

---

## ⚠️ PENTING — Mode PRODUCTION

Karena ini DOKU **PRODUCTION** (bukan sandbox), transaksi yang berhasil akan
menggunakan **uang sungguhan**. Sebelum go-live:

- [ ] Test dulu dengan order sangat kecil (mis. Rp 1.000) — pastikan webhook diterima
- [ ] Cek di Dashboard DOKU → **Transactions** bahwa transaksi muncul
- [ ] Cek di PM2 logs bahwa webhook sukses diterima
- [ ] Setelah yakin, baru izinkan transaksi besar

Untuk testing tanpa uang sungguhan, gunakan sandbox:
1. Di Dashboard DOKU, login ke https://sandbox.doku.com
2. Buat Client ID & Secret Key baru di sana
3. Set di `server/.env`:
   ```
   DOKU_BASE_URL=https://api-sandbox.doku.com
   DOKU_CLIENT_ID=<sandbox-client-id>
   DOKU_SECRET_KEY=<sandbox-secret-key>
   ```
4. Test dengan kartu uji: `4111 1111 1111 1111`, CVV `123`, expiry bebas.

---

## 🧪 Langkah 5 — Testing (Sandbox)

1. Set `DOKU_BASE_URL=https://api-sandbox.doku.com` di `server/.env`.
2. Pakai **sandbox** Client-Id & Secret Key (bukan production).
3. Buka https://ipanstore.localhost:8080 dan lakukan order.
4. Di halaman checkout DOKU sandbox, pilih **"Credit Cards"** → pakai kartu
   test: `4111 1111 1111 1111`, CVV `123`, expiry bebas.
5. Cek server log — muncul: `✅ DOKU order dibuat: ...` dan `✅ Webhook DOKU diterima: ... SUCCESS`.

### Kartu uji coba DOKU (sandbox)
| Card Number       | Exp     | CVV |
|-------------------|---------|-----|
| 4111 1111 1111 1111 (Visa) | 12/29 | 123 |
| 5104 0000 0000 0008 (Mastercard) | 12/29 | 123 |

---

## 🛠️ Deployment Backend (Tailscale / VPS)

Backend perlu **online / terjangkau oleh internet** agar DOKU bisa kirim webhook.
Dua cara:

### Opsi A — Tailscale Funnel (direkomendasikan, gratis)
```bash
# Di server Anda (langsung online via Tailscale)
tailscale funnel web --https 3001  # mengekspor http://localhost:3001 ke internet
tailscale funnel reply  # dapatkan URL https://ipan-vps.tailxxxx.ts.net
```
Notification URL = `https://ipan-vps.tailxxxx.ts.net/api/doku-webhook`.

### Opsi B — Nginx reverse proxy (di Docker/VPS)
```nginx
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Opsi C — Ekspor via Tailscale serve langsung
`tailscale serve https /api http://localhost:3001`

---

## 🔐 Keamanan

- **Secret Key** hanya ada di `server/.env`, **tidak pernah** di front-end.
- `server/.env` ada di `.gitignore` — jangan commit.
- Webhook diverifikasi dengan HMAC-SHA256; request palsu akan dapat `401`.
- Gunakan **Sandbox** dulu sampai yakin, baru beralih ke Production.

---

## 📋 Checklist Verifikasi Post-Setup

- [ ] `DOKU_CLIENT_ID` & `DOKU_SECRET_KEY` diisi di `server/.env`
- [ ] `DOKU_BASE_URL` = sandbox (`https://api-sandbox.doku.com`) untuk testing
- [ ] `VITE_BACKEND_URL` diisi di `.env` front-end
- [ ] `ALLOWED_ORIGINS` mencakup domain front-end Anda
- [ ] Notification URL terpasang & `Resend Sample Notification` sukses di log
- [ ] Order test sukses di sandbox (kartu uji 4111...)
- [ ] Ganti `DOKU_BASE_URL` ke `https://api.doku.com` → Production
- [ ] Gunakan Production Client-Id & Secret Key → live

---

## 🐞 Troubleshooting

| Gejala | Solusi |
|---|---|
| `401 / Invalid signature` di webhook | `DOKU_SECRET_KEY` tidak cocok dengan dashboard |
| `401 / Client authentication failed` di API | `DOKU_CLIENT_ID` salah |
| Order gagal (`error_messages`) | Cek log server: field `invoice_number` melebihi 64 karakter / pakai simbol |
| `GET /api/health` error — server mati | Pastikan `node index.js` berjalan & PORT terbuka |
| Front-end "Belum dikonfigurasi" | `VITE_BACKEND_URL` belum diset / server belum jalan |
| `CORS` error | Tambahkan domain front-end ke `ALLOWED_ORIGINS` |
