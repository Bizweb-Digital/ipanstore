# LASTACTIVITY.md — Log Aktivitas & Status Project IPAN STORE

> **⚠️ ATURAN AUTO-UPDATE**: File ini WAJIB otomatis diperbarui oleh AI/developer
> di **akhir setiap sesi kerja** yang mengubah file/kode/repo/server. Jangan tunggu
> diminta user. Perbarui bagian yang relevan (Status, Riwayat, Masalah, Checklist,
> Langkah Berikutnya) setiap kali ada perubahan. Lihat bab "Cara Merawat" di bawah.

- **Repo**: `git@github.com-bizwebdigital:Bizweb-Digital/ipanstore.git` (branch `main`)
- **Domain live**: `https://ipanstore.my.id` (Cloudflare Tunnel → container Docker port 5007)
- **Update terakhir**: 13 Agustus 2026

---

## 📌 STATUS DEPLOY TERKINI

| Item | Status |
|---|---|
| Website live `https://ipanstore.my.id/` | ✅ Live |
| Halaman `/order` | ✅ Live & berfungsi |
| Integrasi DOKU Checkout (payment gateway) | ✅ **Live end-to-end** (bundle live + backend + kredensial production terverifikasi 13 Agt) |
| Backend `server/` di VPS (PM2 `ipanstore-backend`, port 5159) | ✅ Jalan & publik via **Cloudflare Tunnel** `https://api.ipanstore.my.id` (health OK, CORS OK) |
| Kredensial DOKU **production** (`BRN-0221-...`, api.doku.com) | ✅ Terisi di `server/.env` & valid (test create order → checkout URL asli) |
| **Email otomatis SettinX** (link Drive + invoice setelah SUCCESS) | ✅ **Live & terverifikasi** — email test terkirim, webhook→email berhasil |
| GitHub remote (via `github.com-bizwebdigital`) | ✅ Terhubung & authenticated |
| Server `sever-h81m-s2ph` (`100.89.140.16`) | ✅ Akses SSH root OK, path `/project/website/padel/IpanStore/ipanstore` |
| Deploy pipeline | ✅ `deploy.sh` = `git pull` → `docker compose down` → `docker compose up --build -d` |
| Commit/status git lokal | ✅ `64e771f` (fitur email otomatis SettinX) |
| Push terakhir | ✅ `64e771f` → GitHub (key `github.com-bizwebdigital`) |
| Pull+deploy server | ✅ `git pull` di server sukses → backend PM2 aktif, `.env` aman |
| Backend PM2 auto-start | ✅ `pm2 save` + systemd `pm2-root.service` enabled (auto-start saat reboot) |
| Verifikasi live | ✅ `/` `/layanan` `/paket` `/order` `/testimoni` `/faq` `/kontak` `/sitemap.xml` → 200 |

> **Catatan server**: SSH config `~/.ssh/config` dibuat di server agar `git pull` memakai
> key `id_ed25519_bizweb` (Host `github.com` → IdentityFile). Jika `docker compose` error
> "container name in use", jalankan `docker rm -f ipanstore` lalu `docker compose up -d`.

---

## 🗂️ ARSITEKTUR FILE WEBSITE (setelah restrukturisasi)

```
src/
├── components/
│   ├── layout/     → Layout, Navbar, Footer, LineSidebar
│   ├── sections/   → Hero, About, Community, ClosingCTA, PackagesPreview,
│   │                  CatalogAppSettinx, TestimoniPreview, Testimonials,
│   │                  AppSettinxSection, SettinxGallery
│   ├── effects/    → SplashCursor, CustomCursor, GlobalScannerBackground, Scanner,
│   │                  PageBackground, PageTransition, Reveal, SplitText, BlurText,
│   │                  ElectricBorder, SpotlightCard, VariableProximity(+css),
│   │                  AnimatedTabs, ScrollStackCards, AnimatedCounter
│   ├── carousel/   → DepthCarousel
│   ├── ui/         → komponen shadcn/ui
│   └── (root)      → FloatingWhatsApp, FlowingMenu, LoadingScreen, PageSkeleton,
│                      SEOHead, StaggeredMenu
├── pages/          → Index, Layanan, Paket, Order, TestimoniPage, Faq, Kontak,
│                      BoostFpsFreeFire, TweakingPcGaming
├── lib/            → seo.ts (JSON-LD builder), data pendukung lain
└── hooks/          → useScrollReveal, dll.
```

---

## 📚 RIWAYAT SESI & PERUBAHAN

### Sesi: Fitur Email Otomatis — Kirim Link SettinX + Invoice Setelah Pembayaran Lunas (13 Agustus 2026)

**Permintaan user**: jika ada order **IPAN APP SettinX V1** yang sudah lunas, website otomatis
mengirim email berisi link Google Drive aplikasi (.exe + tutorial) + invoice kepada pembeli.
Keputusan: kirim **setelah pembayaran SUCCESS (webhook)**, lewat **email saja**, **hanya SettinX**.

#### Perubahan `server/index.js`
- **Penyimpanan order** (`orders.json`, JSON file ringan): store `ordersStore` (load/save/get/set)
  menyimpan tiap order saat `POST /api/doku-create-order` (invoice_number, amount, item_name,
  customer_name/email/phone, status PENDING, email_sent=false).
- **Email otomatis** (`nodemailer`): transporter SMTP dari env (`SMTP_HOST/PORT/USER/PASS`,
  `MAIL_FROM`); `sendSettinXEmail()` mengirim email HTML berisi link `SETTINX_DOWNLOAD_URL`
  + invoice (invoice number, produk, status LUNAS, total, waktu). Escape HTML untuk input user.
- **Webhook** `POST /api/doku-webhook` → jadi `async`; saat `transaction.status === "SUCCESS"`:
  tandai order `PAID`, dan jika item/invoice mengandung `settinx` + ada email + belum `email_sent`
  → kirim email; sukses → `email_sent=true` (anti-duplikat). Gagal → log error, webhook tetap
  `{success:true}` (tidak crash), retry DOKU akan mencoba lagi.
- **Env baru** (`server/.env` & `.env.example`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS`, `SETTINX_DOWNLOAD_URL` (link Drive folder SettinX).
- `server/package.json`: tambah `nodemailer` (dan lockfile).

#### Verifikasi (test end-to-end di server)
- `node --check` syntax OK.
- Test lokal: webhook SUCCESS simulasi → order `PENDING→PAID`, terdeteksi SettinX, email gagal
  graceful saat SMTP kosong (tidak crash), `email_sent` tetap false (siap retry).
- Test sungguhan di server: `node test-email-send.cjs` → **EMAIL TERKIRIM** ke
  `muhammadrizvandysukma@gmail.com` (messageId `50eb8598-d1ce...`).
- Test alur penuh: seed order SettinX → webhook SUCCESS bersignature → log:
  `📧 Email SettinX TERKIRIM: muhammadrizvandysukma@gmail.com` ; `orders.json` jadi
  `status: PAID`, `email_sent: true`.

#### Catatan penting
- **Gmail 2-Step Verification WAJIB aktif** agar App Password berfungsi untuk SMTP. App Password
  (16 karakter) disimpan di `server/.env` (`SMTP_PASS`), tidak pernah di-commit.
- Backend menyimpan data di `server/orders.json` (file, bukan DB) — mudah dimigrasikan nanti.
- **PM2**: `pm2 save` + startup systemd `pm2-root.service` enabled (auto-start saat reboot).

### Sesi: Migrasi Backend ke `api.ipanstore.my.id` via Cloudflare Tunnel (13 Agustus 2026)

**Masalah**: tombol "Bayar Sekarang" di PC user masih fallback ke WhatsApp, padahal di HP berhasil
redirect ke DOKU. Diagnosis: PC user resolve `*.ts.net` ke IP Tailscale privat (`100.89.140.16`)
yang gagal dijangkau → fetch backend gagal → fallback WA. Backend lama bergantung Tailscale Funnel
(DNS `ts.net`), rawan masalah IPv6/DNS di perangkat pengunjung.

**Solusi**: pindahkan backend ke domain sendiri `api.ipanstore.my.id` via Cloudflare Tunnel
(IPv4+IPv6 ditangani Cloudflare dengan benar).

#### Perubahan
- **Cloudflare Tunnel** (dashboard, tunnel "Projcet Website Ipan"): tambah Public Hostname
  `api.ipanstore.my.id` → service `http://172.17.0.1:5159` (Docker bridge host; cloudflared
  berjalan sebagai container `cloudflare/cloudflared:latest`, jadi `localhost` tidak bisa dipakai —
  error awal `dial tcp [::1]:5159 connection refused`). DNS CNAME otomatis dibuat Cloudflare.
- **Frontend** `.env` lokal + server: `VITE_BACKEND_URL=https://api.ipanstore.my.id` (dulu `ts.net`).
  Rebuild → chunk `Order-CL2W6hcf.js` (hash baru), deploy via `docker cp dist/.` ke container `ipanstore`.
- **Backend** `server/.env`: `DOKU_NOTIFICATION_URL=https://api.ipanstore.my.id/api/doku-webhook`.
  CORS sudah benar mengizinkan origin `https://ipanstore.my.id`.

#### Verifikasi (semua dari jaringan luar)
- `https://api.ipanstore.my.id/api/health` → HTTP 200 `{"ok":true,"service":"ipanstore-backend"}`
- `POST /api/doku-create-order` Rp 75.000 → DOKU balas `checkout_url` asli (`checkout.doku.com/...`)
- CORS preflight origin `https://ipanstore.my.id` → 204, `access-control-allow-origin` benar
- Website utama `https://ipanstore.my.id/` tetap HTTP 200 selama proses

#### Catatan teknis penting
- **cloudflared di server = container Docker** (bukan binary host). Origin di tunnel ini harus pakai
  `http://172.17.0.1:<port>` (Docker bridge), BUKAN `localhost`.
- `Dockerfile` frontend hanya `COPY dist` (pre-built) dan `dist` ada di `.dockerignore` → deploy
  perubahan frontend = build lokal → `scp dist` → `docker cp dist/. ipanstore:/usr/share/nginx/html/`.

### Sesi: Diagnosis "Bayar masih ke WhatsApp" + Verifikasi End-to-End DOKU (13 Agustus 2026)

**Pertanyaan user**: apakah belum setup katalog di dashboard DOKU penyebab tombol Bayar masih
redirect ke WhatsApp? → **Jawaban: BUKAN.** DOKU Checkout tidak butuh katalog produk di
dashboard; produk/harga dikirim dinamis per-transaksi (`line_items` + `amount`) dari backend.

**Hasil diagnosis (semua dicek langsung, tanpa ubah kode)**:
- Bundle live `Order-DyJI_k0G.js` di `https://ipanstore.my.id` **sudah versi DOKU** — identik
  dengan `dist` lokal, mengandung `VITE_BACKEND_URL=https://sever-h81m-s2ph.tail23dc7f.ts.net`
  dan endpoint `/api/doku-create-order`.
- Backend **hidup & publik**: `GET /api/health` → 200 `{"ok":true,"service":"ipanstore-backend"}`.
- **Test create order asli** `POST /api/doku-create-order` Rp 20.000 → DOKU balas `SUCCESS`
  dengan checkout URL `https://checkout.doku.com/checkout-link-v2/...` (kredensial production valid).
- CORS preflight dari origin `https://ipanstore.my.id` → 204, `Access-Control-Allow-Origin` benar.
- Webhook: `override_notification_url` dikirim per-transaksi → **tidak perlu** set Notification URL
  manual di dashboard DOKU.

**Kesimpulan**: rantai lengkap sudah berfungsi. Test user yang masih ke WhatsApp kemungkinan
karena browser memakai bundle cache lama (fallback WA memang by-design di `Order.tsx` bila
`checkoutUrl` kosong) atau backend/funnel belum aktif saat itu. Solusi: hard refresh & test ulang.

### Sesi: Setup Git/GitHub, Dual Account, Optimasi SEO/Performa/Struktur (11 Agustus 2026)

#### A. Setup GitHub & Dual Key
- Remote tetap `git@github.com-bizwebdigital:Bizweb-Digital/ipanstore.git` (branch `main`).
- **Solusi masalah SSH lama**: dibuat key baru `~/.ssh/id_ed25519_bizweb`
  (komentar `bizwebdigital@gmail.com`), terdaftar di akun GitHub yang punya akses ke org.
- **Dual account** di `~/.ssh/config`:
  - `github.com-bizwebdigital` → `id_ed25519_bizweb` (produksi, untuk repo ini) ✅ verified:
    `Hi bizwebdigital! You've successfully authenticated...`
  - `github.com-ipanappsettinx` → `id_ed25519` (akun sekunder; key lama belum terdaftar → jika perlu, daftarkan di GitHub).
- `git fetch origin` sukses → perbaikan push selanjutnya.

#### B. Visual & UX
- **Testimoni (lightbox)**: sudah ada via `yet-another-react-lightbox` di `TestimoniPage.tsx`.
- **Tab warna** (OPTIMIZE/SET PC/ANTI CHEAT/APP SETTINX) di `Layanan.tsx` & `Paket.tsx`:
  aktif = `bg-[#1a1a1a] / border-[#94A3B8]/30 / text-[#F4F4F5] / shadow rgba(148,163,184,0.3)` agar nyatu tema.
- **Kontak**: icon resmi + warna brand —
  `FaWhatsapp` (#25D366), `FaDiscord` (#5865F2), tombol `#25D366`. Channel WA pakai icon `Radio`.
- **Hint galeri** ("Klik foto untuk melihat lebih detail") di `CatalogAppSettinx.tsx` &
  `AppSettinxSection.tsx`: sekarang rata tengah persis dengan galeri di desktop
  (class `gallery-hint` di `index.css`, `@media min-width:768px`; nurunin `text-wrap:balance` global).

#### C. SEO
- `src/lib/seo.ts`: builder JSON-LD (LocalBusiness/WebSite/Service/FAQ/Breadcrumb).
- `src/components/SEOHead.tsx`: canonical absolut per-route, `og:url`/`og:image`, `twitter:image`,
  inject & cleanup JSON-LD, **hapus meta keywords**.
- `index.html`: canonical absolut `https://ipanstore.my.id/`, **font dipangkas** jadi 2 family
  (Plus Jakarta Sans + JetBrains Mono), OG image, meta keywords dihapus.
- `public/sitemap.xml` (8 route + image) & `public/robots.txt` (+ `Sitemap:` line).
- Title/description unik per halaman; halaman detail layanan ditambah:
  hasil realistis, hardware/emulator didukung, estimasi durasi, link internal ke `/testimoni`.

#### D. Performa
- **Code splitting**: `React.lazy` semua route kecuali Home + fallback `PageSkeleton`.
  `vite.config.ts` `manualChunks`: `react-vendor`, `query-vendor`, `animation-vendor`.
  Build tanpa warning chunk >500KB.
- **Gambar**: `sharp` (devDep) → webp thumbnail 480px (`public/img/testimoni/thumbs/`, ±826KB total)
  + full webp 1080px. `width`/`height` + `loading`/`decoding` ditambah di DepthCarousel,
  TestimoniPage, Navbar/Footer/LoadingScreen logo, SettinxGallery.
- Folder gambar galeri SettinX: `public/img/settinx/*.png` (2 foto, dari server).

#### E. Restrukturisasi folder components
- `git mv` semua komponen ke `layout/`, `sections/`, `effects/`, `carousel/`, `ui/`.
- Import diperbarui; `main.tsx` path CSS `VariableProximity` diperbaiki.
- **Verifikasi**: `tsc --noEmit` bersih, `npm run build` sukses, `vitest` lulus,
  Playwright: edit 8 route tanpa error console, canonical unik, JSON-LD ter-inject.

#### F. Perubahan dari server (branch remote, digabung via merge)
- Gallery foto SettinX di halaman `Layanan.tsx` & `Paket.tsx` (+ `CatalogAppSettinx.tsx`).
- Badge & ikon di `TestimoniPage.tsx` (Crown/Sparkles, featured card "Raxzy MJ ELITE CS").
- Format harga `Rp XX.000` (bukan K).

### Sesi: Git merge + Commit/Push/Deploy + Auto-update LASTACTIVITY (11 Agustus 2026)
- Branch lokal (`996a3f6`) digabung dengan branch remote (`be6b8b0`, `c6c563a` dari server) via merge → `168e4b6`.
- Konflik resolved: file yang di-restrukturisasi (CatalogAppSettinx, PackagesPreview, Packages, SettinxGallery
  lama) dihapus karena versi lebih baru sudah ada di `src/components/sections/`; Layanan/Paket/TestimoniPage
  memakai versi lokal (lebih lengkap; galeri SettinX sudah ada via `AppSettinxSection`).
- `tsc --noEmit` bersih · `npm run build` sukses (chunk per-route, tanpa >500KB) · `vitest` lulus.
- **Push** `168e4b6` ke GitHub sukses (`c6c563a..168e4b6 main -> main`).
- **Deploy server**: dibuat `~/.ssh/config` di server (key `id_ed25519_bizweb`) → `git pull` sukses →
  `docker compose down` → `up --build -d` (container lama `docker rm -f ipanstore`) → live
  `https://ipanstore.my.id` HTTP 200, bundle `index-K4Oq3TSC.js`.
- **Auto-update LASTACTIVITY.md diaktifkan** (aturan di buka file ini bagian "Cara Merawat" + `AGENTS.md`),
  jangkauan diperluas: status deploy, arsitektur file, riwayat per-sesi, masalah, checklist, cara merawat.

### Sesi: Migrasi Cashi.id → DOKU Checkout (13 Agustus 2026)

#### A. Riset & Implementasi Backend
- Riset DOKU Checkout API (https://developers.doku.com/accept-payments/doku-checkout.md):
  `POST https://api.doku.com/checkout/v1/payment`, signature HMAC-SHA256 di request header
  (`Client-Id`, `Request-Id`, `Request-Timestamp`, `Request-Target`, `Digest`).
- **`server/index.js`** tambah endpoint:
  - `POST /api/doku-create-order` — generate signature, call DOKU, kembalikan `response.payment.url`.
  - `POST /api/doku-webhook` — terima notifikasi DOKU, verifikasi signature, parse `transaction.status`.
  - Helper: `generateDokuDigest()`, `generateDokuSignature()`, `dokuTimestamp()`. (Cashi endpoint legacy tetap ada.)
- **`server/.env.example`** update: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_BASE_URL`,
  `DOKU_CHECKOUT_PATH`, `DOKU_CALLBACK_URL`.

#### B. Front-end
- **`src/lib/doku.ts`** (baru) — modul integrasi DOKU: interface request/response, 3-prioritas
  (backend → payment link statis → fallback error → WhatsApp), ekstrak `response.payment.url`.
- **`src/pages/Order.tsx`** — ganti import `cashi.ts` → `doku.ts`, pakai `createDokuPayment()`,
  teks footer "payment gateway Cashi.id" → "DOKU".
- **`.env.example`** front-end — dokumentasi `VITE_BACKEND_URL` untuk DOKU (Cashi → legacy).

#### C. Dokumentasi
- **`SETUP-DOKU.md`** (baru) — panduan lengkap: dapat kredensial (Dashboard → Integrations → API Keys),
  atur Notification URL, env backend/frontend, testing sandbox (kartu 4111...), deploy (Tailscale Funnel),
  troubleshooting.
- `src/lib/cashi.ts` ditinggalkan sebagai legacy reference (tidak lagi di-impor).

#### D. Verifikasi
- `npx tsc --noEmit` bersih (no errors).
- `npx vite build` sukses (2195 modules transformed, `Order-BI8ifyMv.js` terbuild).
- `node --check server/index.js` — syntax OK.

---


| Area | Teknologi |
|---|---|
| Front-end | **TypeScript + React 18 + Vite 5 + Tailwind CSS** (SPA) |
| Lain | shadcn/ui + Radix, React Router v6, React Hook Form + Zod, TanStack Query |
| Animasi | Framer Motion, GSAP, Lenis, Embla, OGL (SplashCursor) |
| Ikon | Lucide React, React Icons |
| Testing | Vitest + Testing Library, ESLint, Playwright |
| Deploy | Docker + Nginx (container `ipanstore`, port 5007) + Cloudflare Tunnel |

> Catatan kunci: `p { text-wrap: balance }` global membuat `<p>` menyusut ke lebar konten —
> untuk merata-tengah-kan elemen seperti hint galeri, pakai class khusus (contoh `.gallery-hint`) bukan sekadar `text-center`.

---

## 🔴 MASALAH & CATATAN

- **SSH akun sekunder** (`github.com-ipanappsettinx`, key `id_ed25519`) belum terdaftar di GitHub
  → `Permission denied`. Ini hanya perlu jika push dari akun sekunder.
- **Lint**: ada ±59 error pre-existing di `src/components/ui/*` (file shadcn/ui), bukan dari perubahan terakhir.
- **`.gitignore`** mengecualikan: `.env`, log, `dist`, `opencode.json`, screenshot lokal.
- Info server: `sever-h81m-s2ph` Tailscale `100.89.140.16`; project `/project/website/padel/IpanStore/ipanstore`
  (SSH root). Server kedua `server` `100.70.48.103` (port 22 tidak merespons).

---

## ✅ CHECKLIST LANJUTAN
- [ ] (Jika perlu) daftarkan key `id_ed25519` ke GitHub untuk akun `ipanappsettinx`.
- [ ] (Opsional) Optimasi lebih lanjut: preload kritis, `fetchpriority` hero image.
- [x] Deploy backend `server/` ke VPS `sever-h81m-s2ph` — **via Cloudflare Tunnel** `https://api.ipanstore.my.id` (PM2 `ipanstore-backend` port 5159) — terverifikasi live 13 Agt.
- [x] Set `VITE_BACKEND_URL=https://api.ipanstore.my.id` — sudah terbake di bundle live (`Order-CL2W6hcf.js`).
- [x] Notification URL — **tidak perlu set manual** di Dashboard DOKU; backend kirim `override_notification_url` (`https://api.ipanstore.my.id/api/doku-webhook`) per-transaksi.
- [x] **Test order live dari PC user** → redirect DOKU → bayar QRIS → cek `pm2 logs ipanstore-backend` untuk webhook `SUCCESS`. (Frontend sudah mengarah ke api.ipanstore.my.id)
- [x] Email otomatis SettinX (link Drive + invoice) setelah pembayaran SUCCESS — **terverifikasi terkirim** 13 Agt.
- [ ] (Opsional) Test bayar SettinX sungguhan (Rp 75.000) dari browser → cek email diterima pembeli.
- [x] Endpoint `/api/doku-cancel-order` — sudah diimplementasi di `server/index.js`.

---

## 🔄 CARA MERAWAT AUTO-UPDATE (WAJIB)

1. **Kapan update**: di akhir sesi, setelah commit/push/deploy selesai (atau saat diminta user).
2. **Yang selalu diperbarui**:
   - `📌 STATUS DEPLOY TERKINI` — hash commit terakhir, status push/deploy, verifikasi live.
   - `📚 RIWAYAT SESI` — tambahkan entri sesi (tanggal, A/B/C/D kategori, file, verifikasi).
   - `🔴 MASALAH & CATATAN` — masalah baru, solusi, dan info kunci yang ditemukan.
   - `✅ CHECKLIST LANJUTAN` — tandai selesai, tambah item baru.
3. **Format entri sesi baru**: satu blok `### Sesi` dengan sub-bagian ringkas; referensikan `file:line` bila perlu.
4. **Jangan** menghapus riwayat lama; tambahkan blok `### Sesi` baru di atas riwayat lain yang lebih lama.
5. Auto-update harus tetap berjalan jika user hanya bertanya "ada yang berubah?" tanpa menyuruh menulis file ini.