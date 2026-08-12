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
| Integrasi DOKU Checkout (payment gateway) | ✅ Terpasang & siap backend |
| GitHub remote (via `github.com-bizwebdigital`) | ✅ Terhubung & authenticated |
| Server `sever-h81m-s2ph` (`100.89.140.16`) | ✅ Akses SSH root OK, path `/project/website/padel/IpanStore/ipanstore` |
| Deploy pipeline | ✅ `deploy.sh` = `git pull` → `docker compose down` → `docker compose up --build -d` |
| Commit/status git lokal | ✅ merge `168e4b6` (termasuk commit remote `c6c563a`/`be6b8b0` dari server) |
| Push terakhir | ✅ `168e4b6` → GitHub (key `github.com-bizwebdigital`) |
| Pull+deploy server | ✅ container `ipanstore` aktif, bundle `index-K4Oq3TSC.js` live |
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
- [ ] Deploy backend `server/` ke VPS `sever-h81m-s2ph` via **Tailscale Funnel** (PM2 + funnel).
- [ ] Setelah dapat URL Funnel, set `VITE_BACKEND_URL=https://<machine>.<tailnet>.ts.net` di `.env`.
- [ ] Set Notification URL di Dashboard DOKU → Settings → Developer → Notifications.
- [ ] Test order kecil (Rp 1.000) live → cek webhook diterima.
- [ ] (Opsional) Tambah endpoint `/api/doku-cancel-order` untuk cancel order unpaid.

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