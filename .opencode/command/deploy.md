---
description: Deploy IPAN STORE ke VPS (build lokal + SCP + Docker/PM2)
---

Deploy IPAN STORE ke produksi. $ARGUMENTS

⚠️ WAJIB KONFIRMASI USER DULU sebelum eksekusi (AGENTS.md rule 2).
⚠️ JANGAN PERNAH anggap `git push` = deploy untuk project ini.

## Arsitektur Deploy (PENTING)

- **Frontend**: Docker container `ipanstore` (nginx, port 5007→80) — serve `dist/` yang di-COPY saat build image
- **Backend**: PM2 `ipanstore-backend` (fork, cwd `server/`, port 5159) — BUKAN Docker
- **VPS**: `sever-h81m-s2ph`, Tailscale `100.89.140.16`, SSH `root@100.89.140.16`
- **Path VPS**: `/project/website/padel/IpanStore/ipanstore`
- **Live**: `https://ipanstore.id` (Cloudflare Tunnel → 5007), API `https://api.ipanstore.id` (→ 5159)

## Flow Deploy (WAJIB urut)

### 0. Pre-check
- `npm run build` lokal SUKSES (catat hash asset `dist/assets/index-*.js`)
- Perubahan sudah di-commit + push `origin/main` (dengan konfirmasi user)
- Jika backend berubah: `node --check server/index.js` OK

### 1. Git pull di VPS
```powershell
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore && git pull --ff-only"
```
- Jika gagal karena untracked files menabrak: backup ke `.backup-untracked/` lalu pull ulang.

### 2. Frontend — SCP dist + rebuild Docker
`dist/` ada di `.gitignore` → git pull TIDAK mengubah file yang di-serve.
```powershell
# Build lokal dulu (jika belum)
npm run build

# Backup dist lama di VPS, lalu kirim dist baru
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore && mv dist dist.bak-$(Get-Date -Format yyyyMMdd)"
scp -r dist root@100.89.140.16:/project/website/padel/IpanStore/ipanstore/

# Rebuild container (COPY dist tidak boleh cached)
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore && docker compose up --build -d"
```

### 3. Backend — PM2 restart (HANYA jika server/ atau .env berubah)
```powershell
# Jika .env di VPS perlu diubah (file ini gitignored, update manual):
ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore/server && sed -i 's|KEY=old|KEY=new|' .env"

# Restart agar env/kode baru termuat
ssh root@100.89.140.16 "pm2 restart ipanstore-backend --update-env"
```

### 4. Verifikasi WAJIB
```powershell
# Hash asset di live HTML HARUS sama dengan dist lokal
curl -s https://ipanstore.id | Select-String "index-.*\.js"
curl -s -o NUL -w "%{http_code}" https://ipanstore.id          # 200
curl -s -o NUL -w "%{http_code}" https://ipanstore.id/order    # 200
curl -s https://api.ipanstore.id/api/health                    # 200
```
- `docker exec ipanstore grep ... index.html` → asset baru ✅
- Container `Up` ✅

### 5. Update LASTACTIVITY.md
Catat commit, hash asset, dan hasil verifikasi.

## Jebakan yang SUDAH pernah terjadi (jangan ulangi)
- `docker compose up --build -d` pakai layer CACHED `COPY dist` → dist lama tetap di-serve. Solusi: SCP dist baru DULU, baru rebuild.
- `docker compose restart` TIDAK memuat ulang backend — backend itu PM2, bukan Docker.
- `.env` di VPS TIDAK ikut git → update manual via `sed` + `pm2 restart --update-env`.
- User masih lihat versi lama → suruh hard-reload (Ctrl+Shift+R), lalu cek hash asset di live HTML vs dist lokal.
