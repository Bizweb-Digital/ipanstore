# Deploy Backend ke Server Sendiri (SSH via Tailscale)

Backend Node.js kecil ini memegang **API Key & rahasia payment gateway (DOKU + KlikQris)** dengan aman (tidak terekspos di browser). Folder: `server/`

---

## ARSITEKTUR

```
Browser (front-end IPAN STORE)
      │  POST /api/klikqris-create-order   (tanpa API key)
      ▼
SERVER ANDA  ── backend ini memegang KLIKQRIS_API_KEY
      │  POST https://klikqris.com/api/qris/create  (header x-api-key + id_merchant)
      ▼
   KLIKQRIS  → membalas data QRIS → dikirim balik ke browser (QR tampil di halaman order)

Webhook: KLIKQRIS ──POST status (PAID/EXPIRED)──▶ SERVER /api/klikqris-webhook
         SERVER ──update Supabase + kirim email produk──▶ PEMBELI
```

Front-end → server Anda → KlikQris. API key tidak pernah menyentuh browser.

---

## LANGKAH 1 — Masuk ke Server via SSH (Tailscale)

```bash
ssh root@100.89.140.16
```

> Server live: `sever-h81m-s2ph` (Tailscale `100.89.140.16`), path deploy:
> `/project/website/padel/IpanStore/ipanstore` (docker compose).

---

## LANGKAH 2 — Pastikan Node.js Terpasang di Server (sekali saja)

```bash
# Ubuntu/Debian — install Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # pastikan v20.x
```

---

## LANGKAH 3 — Upload / Deploy Folder `server/`

Dari PC Anda (Windows PowerShell), kirim folder backend:

```bash
scp -r D:\ipanstore\server root@100.89.140.16:~/ipanstore-backend
```

Atau lewat git: `git push origin main` lalu di server
`git pull && docker compose up --build -d` (flow deploy resmi, lihat AGENTS.md).

---

## LANGKAH 4 — Install Dependensi & Isi `.env`

Di server:

```bash
cd ~/ipanstore-backend
npm install

# buat file .env dari template
cp .env.example .env
nano .env
```

Isi `.env`:

```env
PORT=3001
ALLOWED_ORIGINS=https://ipanstore.id,http://localhost:8080

# DOKU (payment gateway fallback / kanal lain)
DOKU_CLIENT_ID=<CLIENT_ID_DOKU>
DOKU_SECRET_KEY=<SECRET_KEY_DOKU>
DOKU_NOTIFICATION_URL=https://api.ipanstore.id/api/doku-webhook

# KlikQris (QRIS dinamis — metode utama)
KLIKQRIS_API_KEY=<API_KEY_KLIKQRIS>
KLIKQRIS_ID_MERCHANT=<ID_MERCHANT_KLIKQRIS>
KLIKQRIS_BASE_URL=https://klikqris.com/api
KLIKQRIS_CALLBACK_URL=https://api.ipanstore.id/api/klikqris-webhook

# Supabase (simpan order + promo)
SUPABASE_URL=<URL>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

# SMTP (kirim email produk SettinX otomatis setelah lunas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=videosettinx@gmail.com
SMTP_PASS=<APP_PASSWORD_GMAIL>
MAIL_FROM="IPAN STORE <videosettinx@gmail.com>"
```

> `ALLOWED_ORIGINS` = alamat website front-end Anda (agar hanya website Anda yang boleh memanggil).

---

## LANGKAH 5 — Jalankan Backend (tetap hidup dengan PM2)

```bash
# install PM2 (process manager) sekali saja
sudo npm install -g pm2

# jalankan backend
pm2 start index.js --name ipanstore-backend

# agar otomatis jalan saat server restart
pm2 save
pm2 startup    # ikuti perintah yang muncul (copy-paste 1 baris)

# cek status & log
pm2 status
pm2 logs ipanstore-backend
```

Tes dari server:

```bash
curl http://localhost:3001/api/health
# → {"ok":true,"service":"ipanstore-backend",...}
```

---

## LANGKAH 6 — Hubungkan Front-end ke Backend

Beri tahu front-end alamat backend Anda. Di project front-end, set env:

```env
# .env front-end (atau setting hosting)
VITE_BACKEND_URL=https://api.ipanstore.id
```

Front-end memanggil `POST /api/klikqris-create-order` **tanpa mengirim API key**
(server yang menambahkannya).

> Karena front-end & backend beda origin, pastikan `ALLOWED_ORIGINS` di backend
> sudah berisi domain front-end Anda (sudah diatur di Langkah 4).

---

## LANGKAH 7 — Set Webhook di Dashboard KlikQris

1. Siapkan URL publik backend (mis. `https://api.ipanstore.id` via Cloudflare Tunnel → port 5159 sesuai AGENTS.md).
2. Di dashboard KlikQris → menu **Pengaturan / Callback**, isi URL:
   `https://api.ipanstore.id/api/klikqris-webhook`
3. Simpan. Backend akan memproses notifikasi `PAID`/`EXPIRED`, update status order
   di Supabase, dan mengirim email produk SettinX otomatis.

> Backend juga mengirim `callback_url` per-transaksi saat create order
> (`KLIKQRIS_CALLBACK_URL` di `.env`), jadi webhook tetap jalan walau belum
> diset manual di dashboard.

---

## MENGEKSPOS BACKEND KE INTERNET (untuk webhook KlikQris)

KlikQris (server luar) harus bisa memanggil webhook Anda. Opsi:

- **Cloudflare Tunnel** (dipakai live — `api.ipanstore.id` → port 5159).
- **Tailscale Funnel** (paling mudah, HTTPS gratis):
  ```bash
  tailscale funnel --bg 3001
  # menghasilkan URL publik https://<host>.<tailnet>.ts.net
  ```
  Lalu set webhook KlikQris ke `https://<host>.<tailnet>.ts.net/api/klikqris-webhook`.

- **Nginx reverse proxy + domain** bila server Anda punya IP publik & domain.

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| `curl /api/health` gagal | Backend belum jalan → `pm2 status`, `pm2 logs` |
| CORS error di browser | Domain front-end belum ada di `ALLOWED_ORIGINS` |
| `Server belum dikonfigurasi` | `KLIKQRIS_API_KEY` / `KLIKQRIS_ID_MERCHANT` kosong di `.env` |
| Create order error `HTTP 4xx` dari KlikQris | `id_merchant` / API key salah, atau `amount` bukan integer positif |
| QRIS tidak tampil di frontend | `VITE_BACKEND_URL` salah di `.env` front-end / env hosting |
| Webhook KlikQris tidak masuk | Endpoint belum diekspos publik → pakai Cloudflare Tunnel / Tailscale Funnel |
| Order lunas tapi status tidak berubah | Cek log `pm2 logs ipanstore-backend` + pastikan `SUPABASE_SERVICE_ROLE_KEY` benar |

---

## PERINTAH PM2 BERGUNA

```bash
pm2 restart ipanstore-backend   # restart setelah ubah .env
pm2 logs ipanstore-backend      # lihat log realtime
pm2 stop ipanstore-backend      # stop
pm2 delete ipanstore-backend    # hapus dari pm2
```