# Deploy Backend ke Server Sendiri (SSH via Tailscale)

Backend Node.js kecil ini memegang **API Key Cashi** dengan aman (tidak terekspos di browser).
Folder: `server/`

---

## ARSITEKTUR

```
Browser (front-end IPAN STORE)
      │  POST /api/create-order  (tanpa API key)
      ▼
SERVER ANDA  ── backend ini memegang CASHI_API_KEY
      │  POST https://cashi.id/api/create-order  (header x-api-key)
      ▼
   CASHI.ID  → membalas URL pembayaran → dikirim balik ke browser
```

Front-end → server Anda → Cashi. API key tidak pernah menyentuh browser.

---

## LANGKAH 1 — Masuk ke Server via SSH (Tailscale)

```bash
ssh user@<hostname-tailscale-anda>
# contoh: ssh ipan@ipan-vps   (hostname dari `tailscale status`)
```

> Tailscale membuat IP privat (100.x.x.x) antar perangkat Anda — jadi Anda bisa
> SSH & akses backend lewat jaringan privat tanpa buka port publik.

---

## LANGKAH 2 — Install Node.js di Server (sekali saja)

```bash
# Ubuntu/Debian — install Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # pastikan v20.x
```

---

## LANGKAH 3 — Upload Folder `server/` ke Server

Dari PC Anda (Windows PowerShell), kirim folder backend:

```bash
scp -r D:\ipanstore\server user@<hostname-tailscale>:~/ipanstore-backend
```

Atau kalau pakai git: `git clone` repo Anda di server, lalu `cd server`.

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
ALLOWED_ORIGINS=https://domain-frontend-anda.com,http://localhost:8080
CASHI_API_KEY=<API_KEY_ANDA>
CASHI_WEBHOOK_SECRET=<WEBHOOK_SECRET_ANDA>
CASHI_BASE_URL=https://cashi.id
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
VITE_CASHI_BASE_URL=http://<hostname-tailscale-anda>:3001
```

Lalu di `src/lib/cashi.ts`, arahkan pemanggilan ke endpoint backend `/api/create-order`
**tanpa mengirim API key** (server yang menambahkannya).

> Karena front-end & backend beda origin, pastikan `ALLOWED_ORIGINS` di backend
> sudah berisi domain front-end Anda (sudah diatur di Langkah 4).

---

## LANGKAH 7 — (Opsional) Set Webhook di Dashboard Cashi

1. Di dashboard Cashi → menu **Webhooks**.
2. Isi URL: `http://<hostname-tailscale-anda>:3001/api/cashi-webhook`
   (atau domain publik backend bila ada).
3. Simpan. Backend akan memverifikasi signature pakai `CASHI_WEBHOOK_SECRET`.

> Webhook butuh Cashi bisa menjangkau server Anda. Bila Cashi tidak bisa reach
> IP Tailscale privat, Anda perlu mengekspos endpoint ini ke internet
> (reverse proxy / Tailscale Funnel / nginx). Lihat catatan di bawah.

---

## MENGEKSPOS BACKEND KE INTERNET (untuk webhook Cashi)

Cashi (server luar) harus bisa memanggil webhook Anda. Opsi:

- **Tailscale Funnel** (paling mudah, HTTPS gratis):
  ```bash
  tailscale funnel --bg 3001
  # menghasilkan URL publik https://<host>.<tailnet>.ts.net
  ```
  Lalu set webhook Cashi ke `https://<host>.<tailnet>.ts.net/api/cashi-webhook`.

- **Nginx reverse proxy + domain** bila server Anda punya IP publik & domain.

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| `curl /api/health` gagal | Backend belum jalan → `pm2 status`, `pm2 logs` |
| CORS error di browser | Domain front-end belum ada di `ALLOWED_ORIGINS` |
| HTTP 401 dari Cashi | `CASHI_API_KEY` salah / kosong di `.env` |
| Webhook "Invalid signature" | `CASHI_WEBHOOK_SECRET` tidak cocok dengan dashboard |
| Cashi tak bisa panggil webhook | Endpoint belum diekspos → pakai Tailscale Funnel |

---

## PERINTAH PM2 BERGUNA

```bash
pm2 restart ipanstore-backend   # restart setelah ubah .env
pm2 logs ipanstore-backend      # lihat log realtime
pm2 stop ipanstore-backend      # stop
pm2 delete ipanstore-backend    # hapus dari pm2
```
