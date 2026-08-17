# LASTACTIVITY.md — Log Aktivitas & Status Project IPAN STORE

> **⚠️ ATURAN AUTO-UPDATE**: File ini WAJIB otomatis diperbarui oleh AI/developer
> di **akhir setiap sesi kerja** yang mengubah file/kode/repo/server. Jangan tunggu
> diminta user. Perbarui bagian yang relevan (Status, Riwayat, Masalah, Checklist,
> Langkah Berikutnya) setiap kali ada perubahan. Lihat bab "Cara Merawat" di bawah.

- **Repo**: `git@github.com-bizwebdigital:Bizweb-Digital/ipanstore.git` (branch `main`)
- **Domain live**: `https://ipanstore.id` (Cloudflare Tunnel → container Docker port 5007)
- **Update terakhir**: 17 Agustus 2026 — deploy perbaikan OG image dan `llms.txt` ke live (commit `bf9f7e4`, bundle `index-DfWwNhiH.js`); endpoint SEO terverifikasi

---

## 📌 STATUS DEPLOY TERKINI

| Item | Status |
|---|---|
| Website live `https://ipanstore.id/` | ✅ Live |
| Migrasi ke domain baru `.id` | ✅ Selesai 17 Agt; domain lama redirect 301 |
| Konfigurasi source target `https://ipanstore.id` | ✅ Selesai dan ter-deploy |
| Website baru `https://ipanstore.id/` | ✅ Live; bundle baru dan SEO baru terverifikasi |
| Halaman `/order` | ✅ Live & berfungsi |
| Integrasi DOKU Checkout (payment gateway) | ✅ **Live end-to-end** (bundle live + backend + kredensial production terverifikasi 13 Agt) |
| Backend `server/` di VPS (PM2 `ipanstore-backend`, port 5159) | ✅ Jalan & publik via **Cloudflare Tunnel** `https://api.ipanstore.id` (health OK, CORS OK) |
| Target API baru `https://api.ipanstore.id` | ✅ Source, route, environment, dan deploy selesai |
| API baru `https://api.ipanstore.id` | ✅ Live; health dan CORS terverifikasi |
| Route API lama `api.ipanstore.my.id` | ✅ Dihapus dari Cloudflare setelah API baru terverifikasi |
| Kredensial DOKU **production** (`BRN-0221-...`, api.doku.com) | ✅ Terisi di `server/.env` & valid (test create order → checkout URL asli) |
| **Email otomatis SettinX** (link Drive + invoice setelah SUCCESS) | ✅ **Live & terverifikasi** — email test terkirim, webhook→email berhasil |
| GitHub remote (via `github.com-bizwebdigital`) | ✅ Terhubung & authenticated |
| Server `sever-h81m-s2ph` (`100.89.140.16`) | ✅ Akses SSH root OK, path `/project/website/padel/IpanStore/ipanstore` |
| Deploy pipeline | ✅ `deploy.sh` = `git pull` → `docker compose down` → `docker compose up --build -d` |
| Commit/status git lokal | ✅ `bf9f7e4` (perbaikan OG image dan penambahan `llms.txt`) |
| Push terakhir | ✅ `bf9f7e4` → GitHub (key `github.com-bizwebdigital`) |
| Pull+deploy server | ✅ `git pull` di server fast-forward `bf9f7e4`; `dist` di-scp + `docker cp` bersih (hapus file lama), container `ipanstore` up |
| Backend PM2 auto-start | ✅ `pm2 save` + systemd `pm2-root.service` enabled (auto-start saat reboot) |
| Verifikasi live | ✅ `/` `/layanan` `/paket` `/order` `/testimoni` `/faq` `/kontak` `/sitemap.xml` `/img/logo.png` `/llms.txt` → 200; `index-DfWwNhiH.js` live; `debug-backend.html` → 404 (terhapus) |
| Audit performance terakhir | ⚠️ Lighthouse desktop Performance 56; FCP 0,8 s, LCP 1,3 s, TBT 22.910 ms, CLS 0 |
| Audit SEO terakhir | ✅ SEO dasar 100; OG image valid dan `llms.txt` sudah live |
| Audit accessibility terakhir | ⚠️ Skor 88; duplicate menu ID dan focusable element di dalam `aria-hidden` |

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

### Sesi: Deploy Live Fix Flicker SettinX + Optimasi (17 Agustus 2026)

- Commit `0645acc` di-push ke `origin/main` (key `github.com-bizwebdigital`): `3dd3498..0645acc`.
- `git pull` di server `sever-h81m-s2ph` fast-forward tanpa konflik; `.env`/backend PM2 aman.
- Karena `dist` di-gitignore, deploy frontend memakai alur dokumentasi: `scp dist/*` → `/tmp/ipanstore-dist`, lalu bersihkan `/usr/share/nginx/html/*` di container `ipanstore` dan `docker cp` isi baru (agar file lama & `debug-backend.html` benar-benar terhapus).
- Verifikasi live `https://ipanstore.id`: `/` HTTP 200 dengan bundle `index-D4F5KOaI.js`; `/layanan`, `/paket`, `/sitemap.xml` 200; `/debug-backend.html` → **404** (risiko keamanan terhapus dari produksi); `https://api.ipanstore.id/api/health` 200.
- `LASTACTIVITY.md` diperbarui dengan status commit/push/deploy terbaru.

### Sesi: Deploy Perbaikan OG Image dan `llms.txt` (17 Agustus 2026)

- Commit `bf9f7e4` dipush ke `origin/main`.
- Server melakukan `git pull --ff-only`; karena `dist/` memang dikecualikan dari Docker build context, deploy frontend memakai alur resmi: upload `dist` ke `/tmp/ipanstore-dist`, start image frontend yang ada, bersihkan document root, lalu `docker cp` hasil build baru ke container `ipanstore`.
- Container `ipanstore` aktif setelah restart.
- Verifikasi live: `/` `200`, `/img/logo.png` `200`, `/llms.txt` `200`, `/sitemap.xml` `200`, metadata OG/Twitter menunjuk `/img/logo.png`, `/debug-backend.html` `404`, dan API health `200`.

### Sesi: Verifikasi Indexing Google Domain Baru (17 Agustus 2026)

- Screenshot user menunjukkan query `site:ipanstore.id` belum mengembalikan hasil. Ini normal untuk domain baru setelah cutover dan bukan indikasi website down.
- Verifikasi publik: halaman utama, `robots.txt`, dan `sitemap.xml` mengembalikan HTTP `200`; request dengan User-Agent Googlebot juga `200`.
- `robots.txt` mengizinkan Googlebot dan menunjuk ke `https://ipanstore.id/sitemap.xml`; domain lama mengembalikan `301` ke domain baru.
- Google Search Console perlu dipakai untuk menambahkan properti `ipanstore.id`, mengirim sitemap, dan meminta indexing URL utama. Waktu tampil di hasil `site:` tidak instan dan dapat memerlukan beberapa hari.
- Temuan SEO yang masih terbuka: `/logo.png` masih `404` untuk OG image dan `/llms.txt` belum tersedia. Tidak ada perubahan source, build, test, deploy, atau commit pada sesi ini.

### Sesi: Perbaikan OG Image dan `llms.txt` (17 Agustus 2026)

- Referensi OG/Twitter pada `index.html` dan `DEFAULT_OG_IMAGE` di `src/lib/seo.ts` diubah dari `/logo.png` (404) ke aset valid `/img/logo.png`.
- `public/llms.txt` ditambahkan dengan ringkasan IPAN STORE, daftar halaman penting, dan tautan sitemap untuk agentic browsing.
- Verifikasi lokal: `npx tsc --noEmit` lulus, `npm run build` sukses, dan `npm run test` lulus (1 test).
- Build hanya menampilkan peringatan Browserslist data lama; tidak ada error.
- Belum push, deploy, atau verifikasi endpoint live. Setelah deploy, cek `/img/logo.png`, `/llms.txt`, dan metadata OG pada halaman utama.

### Sesi: Konfirmasi Google Search Console (17 Agustus 2026)

- User mengirim screenshot Search Console untuk properti `ipanstore.id`.
- Inspeksi URL `https://ipanstore.id/` menunjukkan **URL ada di Google** dan status **Halaman diindeks**.
- Sitemap `https://ipanstore.id/sitemap.xml` menunjukkan status **Sukses** dan **8 halaman ditemukan**.
- Kesimpulan: konfigurasi indexing sudah berhasil. Query umum `ipanstore` belum menjamin website tampil di posisi teratas karena dipengaruhi ranking, relevansi kata kunci, dan waktu pemrosesan Google.
- Klarifikasi: “deploy” berarti mempublikasikan perubahan kode lokal ke server live; itu terpisah dari setup Search Console dan tidak diperlukan agar sitemap yang sudah sukses tetap diproses.

### Sesi: Fix Definitif Flicker Preview SettinX + Kartu Menimpa Section Berikut (17 Agustus 2026)

- **Latar:** User melaporkan flicker nyata saat preview "PAGE MENU APP SETTINX" /
  "LOGIN PAGE IPAN APP SETTINX" diklik lalu user scroll ke atas, dan konten (foto)
  menumpuk di atas teks lain. Animasi live (stacking kartu, tab, dsb.) harus utuh.
- **3 akar masalah & fix (tanpa menghapus animasi apa pun):**
  1. **Lenis tidak di-stop saat lightbox terbuka.** Body sudah `overflow:hidden`,
     tapi `lenis.scroll` (nilai internal) terus berubah saat wheel → `ScrollStackCards`
     membaca nilai itu dan menggerakkan kartu di belakang overlay (flicker), lalu
     halaman meloncat saat lightbox ditutup karena posisi internal Lenis drift.
     Fix: `lenis.stop()` saat open, `lenis.start()` saat close
     (`SettinxGallery.tsx`), plus kompensasi `paddingRight` scrollbar.
  2. **Lightbox `z-[100]` terjebak stacking context ancestor** (`container relative
     z-10`) → Navbar `z-[3000]` dan konten halaman melukis DI ATAS overlay
     (sumber "tumpukan menimpa teks"). Fix: render overlay via **React Portal ke
     `document.body`** dengan `z-[9000]` (di atas navbar 3000 & WA z-50, di bawah
     LoadingScreen 9999).
  3. **Section pengikut masih `z-auto`** sementara container kartu stacking
     `relative z-10` → kartu pinned menimpa section berikutnya.
     Fix: `z-10` eksplisit pada section `AppSettinxSection` (root) &
     `PackagesPreview` — urutan painting kini benar.
- **Verifikasi (Playwright, viewport 1568×902):** hit-test 4 titik semuanya jatuh
  ke dialog portal (navbar/footer tak menembus); 10x wheel-up saat lightbox
  terbuka → 0/10 kartu bergerak, `scrollY` & `lenis.scroll` beku identik; klik
  overlay & tombol X menutup; Lenis resume normal (4831→4531); navigasi prev/next
  OK; `/layanan` & `/paket` 0 console/page error; transform stacking saat scroll
  normal tetap hidup (393px/0.937 dsb. — animasi utuh).
- **Verifikasi build:** `npx tsc --noEmit` bersih, `npm run build` sukses,
  `npx vitest run` lulus. **Belum commit/deploy.**
- **File diubah:** `src/components/sections/SettinxGallery.tsx` (portal + lenis
  stop/start + scrollbar compensation), `src/components/sections/AppSettinxSection.tsx`
  (z-10), `src/components/sections/PackagesPreview.tsx` (z-10).

### Sesi: Perbaikan DEFINITIF Flicker & Tembus Kartu Layanan/Paket — 17 Agustus 2026

- **Latar:** User melaporkan kartu di `/layanan` dan `/paket` masih berkedip dan
  konten kartu bertumpuk "tembus" (teks kartu belakang terlihat menembus kartu
  depan). Video user menunjukkan masalah dengan jelas.
- **Akar masalah yang ditemukan & diperbaiki (4 fix):**
  1. **AnimatedTabs dual-layer conflict.** Komponen menggunakan dua layer terpisah
     (outer untuk reveal + inner untuk parallax) yang menyebabkan transform
     berlipat ganda dan kedipan. Fix: gabungkan jadi satu elemen dengan satu
     timeline GSAP (reveal + parallax dalam satu tween).
  2. **Kartu bertumpuk tembus (opacity).** Kartu yang sudah "pinned" di belakang
     tumpukan tetap opacity 1, sehingga teks dari kartu belakang terlihat menembus
     kartu depan. Fix: tambahkan opacity fade halus (0.85) untuk kartu yang sudah
     tertumpuk di belakang, sehingga tidak tembus tapi tetap terlihat bentuknya.
  3. **Background kartu tidak solid.** `.gaming-card` menggunakan background
     #2d2d2d yang terlalu terang dan `.scroll-stack-card` menggunakan background
     transparent, menyebabkan konten bertumpuk saling tembus. Fix: perkuat
     background `.gaming-card` ke #232325 + tambahkan shadow, dan set
     `.scroll-stack-card` background ke #1a1a1a (sama dengan body).
  4. **Z-index tidak diatur.** Kartu-kartu yang bertumpuk tidak memiliki z-index
     eksplisit, sehingga urutan stacking mengikuti DOM order yang bisa menyebabkan
     kartu belakang menutupi kartu depan. Fix: tambahkan z-index descending
     (n, n-1, ..., 1) sehingga kartu pertama selalu di atas.
- **Hasil terukur (Playwright, viewport 1568×902):**
  - Screenshot perbandingan menunjukkan kartu "Optimasi PC Low-End" kini solid
    dan tidak tembus — teks "Konsultasi Performa" di bawahnya tidak lagi
    terlihat menembus.
  - Transform animasi tetap sama seperti live (translateY: 824, 557, 290, 21).
  - `npx tsc --noEmit` bersih, `npm run build` sukses, `npm run test` lulus.
- **File diubah:** `src/components/effects/AnimatedTabs.tsx` (single-layer),
  `src/components/effects/ScrollStackCards.tsx` (opacity fade + z-index),
  `src/index.css` (background solid + isolation). **Belum commit/deploy.**

### Sesi: Perbaikan Akar Flicker Kartu Layanan/Paket (17 Agustus 2026)

- **Akar masalah terkonfirmasi lewat pengukuran frame-by-frame (Playwright):**
  `ScrollStackCards.getOffset()` membaca posisi kartu via
  `getBoundingClientRect().top + window.scrollY`. Kartu yang sama sedang diberi
  `transform` (translateY + scale) oleh loop ini sendiri tiap frame, sehingga posisi
  yang dibaca sudah "terkontaminasi" output frame sebelumnya → target menjadi
  self-referential (feedback loop). Akibatnya kartu TIDAK pernah benar-benar pin di
  posisi tumpuk: measured `translateY` hanya ~1/2 nilai ideal dan kartu "meloncat"
  menjauh (viewportTop -249px, seharusnya +116px) → terlihat sebagai kedipan/jump
  saat scroll di `/layanan` dan `/paket`. Bug ini ada di bundle live (`HEAD` 3dd3498).
- **Fix (tanpa menghilangkan animasi apa pun):** `getOffset()` kini menghitung posisi
  dari koordinat layout murni (rantai `offsetTop`) yang tidak terpengaruh transform,
  sehingga rumus pin/scale/lerp menjadi stabil dan deterministik. Efek menumpuk,
  scale, lerp, dan release tetap persis seperti desain.
- **Fix kedua:** `AnimatedTabs` punya dua tween GSAP (reveal `fromTo` + parallax `scrub`)
  menulis `transform` elemen yang sama → saling menimpa tiap frame (kedipan tab).
  Layer dipisah: reveal di wrapper luar, parallax di inner div. Kedua efek dipertahankan.
- **Verifikasi:** uji pin menunjukkan `appliedTY` kini = `expectedTY` (diff -0.5 s/d -3px,
  murni lerp-lag), konvergensi mulus tanpa osilasi (180 frame), `viewportTop` terkunci
  di 116px sesuai desain. Smoke test `/layanan` & `/paket`: HTTP 200, 0 console/page error,
  tab switching OK. `npx tsc --noEmit`, `npm run build`, `npm run test` semua lulus.
  Belum commit/deploy.

### Sesi: Sinkronisasi Kartu Layanan/Paket dengan Website Live (17 Agustus 2026)

- Bundle live saat ini teridentifikasi memakai `index-CCirrq1U.js`, `Layanan-iXv4gIsV.js`,
  `Paket-C-Ro9o8I.js`, dan `AnimatedTabs-C8xIlld8.js`; implementasinya sama dengan `HEAD`
  `3dd3498`, bukan dengan eksperimen lokal sebelumnya.
- Riset mendalam menemukan perbedaan lokal pada `ScrollStackCards.tsx` (`offsetTop` serta
  `isolate overflow-hidden`), `AnimatedTabs.tsx` (inner parallax wrapper), dan class fade di
  `Layanan.tsx`/`Paket.tsx`. Keempat perbedaan tersebut membuat perilaku lokal tidak identik
  dengan live, sehingga semuanya dikembalikan ke implementasi live.
- Smoke test perbandingan lokal vs live untuk `/layanan` dan `/paket`: HTTP 200, tidak ada
  page/console error, class wrapper kartu identik (`scroll-stack-cards relative w-full`), jumlah
  kartu identik, dan transform setelah scroll berada pada nilai yang sama secara visual.
- Verifikasi: `npx tsc --noEmit`, `npm run build`, dan `npm run test` berhasil. Belum commit
  atau deploy.

### Sesi: Perbaikan Kedipan Tab Layanan dan Paket (17 Agustus 2026)

- `AnimatedTabs.tsx`: layer reveal dan parallax dipisah. Sebelumnya dua GSAP tween menulis
  `transform` pada elemen yang sama secara bersamaan, sehingga tab dapat berkedip/jump saat
  scroll di halaman `/layanan` dan `/paket`.
- `Layanan.tsx` dan `Paket.tsx`: animasi `animate-fade-up` pada konten yang di-remount saat
  pergantian kategori dihapus agar isi tidak berkedip setiap tab diklik.
- Verifikasi: `npx tsc --noEmit`, `npm run build`, `npm run test`, dan smoke browser `/layanan`
  serta `/paket` (HTTP 200, tidak ada page/console error) berhasil. Belum commit atau deploy.

### Sesi: Perbaikan Flicker Preview SettinX dan Copy Beranda (17 Agustus 2026)

- `SettinxGallery.tsx`: saat lightbox preview page menu/login terbuka, scroll background
  dikunci dengan `overflow: hidden` dan `overscrollBehavior: none`; overlay memakai `touch-none`
  dan `overscroll-none` agar gesture tidak menggerakkan halaman di belakang fixed preview.
- `ScrollStackCards.tsx`: posisi kartu saat stacking dihitung dari koordinat layout `offsetTop`,
  bukan `getBoundingClientRect()` yang sudah terpengaruh `transform`; ini mencegah feedback loop
  desktop yang membuat kartu berkedip/menembus preview SettinX. Container stacking juga dibuat
  isolated dan clipped agar layer kartu tidak mengecat section berikutnya.
- `Index.tsx`: teks showcase `Windows Lebih Enteng` diubah menjadi `Windows Lebih Ringan`.
- Verifikasi: `npx tsc --noEmit`, `npm run build`, `npm run test`, dan smoke test `/paket`,
  `/layanan`, scroll cards desktop setelah clipping, serta Beranda berhasil; tidak ada commit
  atau deploy.

### Sesi: Rollback Optimasi Runtime Poin 1-6 (17 Agustus 2026)

- Atas permintaan user, perubahan runtime pada `SplashCursor`, `Scanner`,
  `VariableProximity`, `ElectricBorder`, `DepthCarousel`, `Layout`, dan lazy-load lightbox/
  carousel dikembalikan ke kondisi sebelum sesi optimasi runtime.
- Optimasi sesi sebelumnya tetap dipertahankan: `LoadingScreen` 200 ms, thumbnail WebP,
  optimasi logo/favicon, penghapusan QueryClientProvider, pemuatan font, serta animasi
  `ShineBorder`/dot carousel.
- Verifikasi rollback: `npx tsc --noEmit`, `npm run build`, `npm run test`, dan smoke test tujuh
  route lokal berhasil. `npm run lint` tetap gagal pada 59 error pre-existing dan 9 warning.
  Tidak ada commit atau deploy.

### Sesi: Implementasi Optimasi Runtime Efek ReactBits (17 Agustus 2026)

**Batasan user**: efek animasi, font, cursor, dan komponen ReactBits tetap dipertahankan.

#### Riset panduan
- Mengikuti prinsip web.dev/MDN: `requestAnimationFrame` untuk sinkronisasi frame,
  `IntersectionObserver` untuk pause offscreen, `ResizeObserver` untuk cache geometry,
  passive listener untuk input yang tidak memerlukan `preventDefault`, serta
  `transform`/`opacity` untuk jalur compositor.

#### Perubahan
- `SplashCursor.tsx`: kualitas simulasi, DPR, pressure iteration, dan frame rate adaptif untuk
  coarse/low-power/reduced-motion; pause saat tab/page tersembunyi; input mouse/touch
  dikoaleskan per frame; fallback aman ketika WebGL tidak tersedia.
- `Scanner.tsx`: DPR/frame rate adaptif, waktu animasi di-reset saat resume, dan posisi canvas
  dicache sehingga mouse move tidak membaca `getBoundingClientRect()` setiap event.
- `VariableProximity.tsx`: posisi huruf dicache, geometry diperbarui lewat `ResizeObserver`,
  input diproses satu kali per frame, loop berhenti offscreen/hidden, dan kalkulasi jarak
  menggunakan squared distance sebelum `sqrt` yang diperlukan.
- `ElectricBorder.tsx`: sample geometry dicache, DPR/octave/frame rate adaptif, dan loop
  berhenti ketika offscreen atau page hidden; efek canvas tetap berjalan saat terlihat.
- `DepthCarousel.tsx` dan `Layout.tsx`: autoplay/Lenis pause saat hidden/offscreen; drag
  carousel dikoaleskan ke `requestAnimationFrame`.
- `TestimoniPreview.tsx` dan `TestimoniPage.tsx`: carousel/lightbox tetap tersedia tetapi
  `DepthCarousel` dan library lightbox dimuat sesuai kebutuhan.

#### Verifikasi
- `npx tsc --noEmit`, `npm run build`, dan `npm run test` berhasil.
- Smoke test Playwright desktop, mobile, dan reduced-motion: `/` serta `/testimoni` HTTP 200,
  tidak ada page error/console error.
- Lazy-load terverifikasi: carousel baru dimuat setelah mendekati viewport dan lightbox baru
  dimuat setelah foto diklik.
- `npm run lint` masih gagal pada error pre-existing di ReactBits/UI dan `Layout.tsx`; tidak
  ada commit atau deploy.

### Sesi: Optimasi Performance Terpilih Tanpa Menghapus Efek (17 Agustus 2026)

**Batasan user**: seluruh efek animasi, font, cursor, dan komponen ReactBits yang sudah ada
harus tetap dipertahankan.

- `LoadingScreen.tsx` tetap digunakan, tetapi selesai dalam `200 ms` tanpa progress acak satu
  detik.
- `QueryClientProvider` dan dependency query yang tidak digunakan dihapus; `animation-vendor`
  tetap ada tetapi tidak lagi dipreload sebelum entry kritis.
- `Roboto Flex` tetap digunakan oleh `VariableProximity`; pemuatannya dipindah dari CSS
  `@import` ke satu link Google Fonts dengan range variable yang lebih sempit.
- `TestimoniPreview.tsx` memakai thumbnail WebP untuk carousel dan JPG penuh hanya untuk
  lightbox. Logo diperkecil; favicon diganti PNG 64px yang ringan.
- `ShineBorder` tetap bergerak, tetapi animasinya memakai `transform`; dot carousel tetap
  memiliki animasi dan touch target 20px tanpa transisi `width`/`background-color`.
- Verifikasi lokal: `npx tsc --noEmit`, `npm run build`, dan `npm run test` berhasil. Lint tetap
  memiliki error pre-existing pada komponen ReactBits/UI; tidak ada deploy atau commit.

### Sesi: Menyalakan Local Preview Sebelum Commit (17 Agustus 2026)

- Dev server Vite dijalankan pada `http://localhost:8080/` untuk membandingkan perubahan lokal
  sebelum commit/deploy.
- Verifikasi URL lokal mengembalikan HTTP `200`.

### Sesi: Penjabaran Hasil Audit Performance dan SEO (17 Agustus 2026)

- Hasil audit sebelumnya dijabarkan kembali kepada user berdasarkan metrik Lighthouse,
  pemeriksaan production, dan source React/Vite.
- Tidak ada perubahan source website, build, test, deploy, atau commit pada sesi ini.
- Prioritas implementasi tetap: kurangi beban main thread/WebGL dan perbaiki OG image,
  `llms.txt`, serta penghapusan `debug-backend.html` dari production.

### Sesi: Audit Mendalam SEO, Performance, Accessibility, dan Agentic Browsing (17 Agustus 2026)

**Permintaan user**: audit dan riset mendalam project serta analisis hasil PageSpeed Insights desktop/mobile; tidak mengubah source website.

#### Scope audit
- Audit read-only source React/Vite, konfigurasi Vite/Tailwind/Nginx/Docker, route, komponen efek, aset gambar, font, test, dan dokumentasi.
- Audit live read-only ke `https://ipanstore.id`, response header asset, `robots.txt`, `sitemap.xml`, `llms.txt`, OG image, dan `debug-backend.html`.
- Tidak menjalankan perubahan kode, build, test, deploy, commit, atau push pada sesi audit ini.

#### Temuan performance utama
- Lighthouse desktop: Performance `56`, FCP `0,8 s`, LCP `1,3 s`, TBT `22.910 ms`, CLS `0`, Speed Index `4,7 s`.
- TBT adalah masalah terbesar: main-thread work `34,9 s`, sekitar 20 long task, dan unused JavaScript sekitar `112 KiB`.
- `LoadingScreen.tsx` menutup viewport, memakai progress acak, dan menunda completion sekitar 1 detik; screenshot Lighthouse masih menangkap splash screen. Ini berpotensi menyebabkan LCP/render delay tidak merepresentasikan hero sebenarnya.
- `Layout.tsx` selalu mengaktifkan `SplashCursor` WebGL fluid dan `GlobalScannerBackground` WebGL. `SplashCursor.tsx` menjalankan rAF terus-menerus dengan `DYE_RESOLUTION=1440` dan `PRESSURE_ITERATIONS=20`, termasuk di mobile.
- Homepage memuat beberapa animation loop sekaligus: Lenis, WebGL scanner, WebGL fluid, VariableProximity, ScrollStack, GSAP, ElectricBorder, carousel, counter, marquee, shine, dan shimmer.
- `vite.config.ts` memaksa `react-vendor`, `query-vendor`, dan `animation-vendor` masuk modulepreload. `@tanstack/react-query` tidak memiliki pemakaian query aktual selain provider yang tidak diperlukan.
- Google Fonts masih critical path: Plus Jakarta Sans, JetBrains Mono, dan Roboto Flex dari `VariableProximity.css`; total third-party font sekitar `145 KiB` pada report.
- `TestimoniPreview.tsx` memakai JPG asli untuk carousel homepage. Gambar pertama `1080x1875`, ditampilkan sekitar `230x511`, transfer sekitar `159,7 KiB`; estimasi penghematan Lighthouse `150,4 KiB`.
- Logo sekitar `68,4 KiB` tetapi ditampilkan sekitar `107x80`; favicon live sekitar `183 KiB` dan perlu diperkecil.
- Forced reflow berpotensi berasal dari pembacaan `getBoundingClientRect()` dan penulisan style berulang pada `VariableProximity`, `ScrollStackCards`, `Scanner`, `Paket`, dan `ElectricBorder`.
- Animasi shine menggunakan `background-position`, sedangkan dot carousel mengubah `width` dan `background-color`; Lighthouse menandainya sebagai non-composited animation.

#### Temuan SEO dan live production
- `https://ipanstore.id/logo.png` mengembalikan `404`, sementara `index.html` dan `src/lib/seo.ts` menggunakannya sebagai OG/Twitter/JSON-LD image. URL perlu diarahkan ke aset yang benar, misalnya `/img/logo.png`, atau dibuatkan asset root yang valid.
- `https://ipanstore.id/llms.txt` mengembalikan SPA `index.html`, bukan Markdown. Agentic Browsing gagal karena tidak ada H1 dan link.
- `https://ipanstore.id/debug-backend.html` publik dengan HTTP `200`, masih menunjuk backend Tailnet lama, dan memiliki POST test create order production. Ini harus dikeluarkan dari production karena risiko abuse dan operasional.
- Cache asset hashed sudah baik: `Cache-Control: public, max-age=2592000, immutable`; Cloudflare juga melayani Brotli/gzip dan HTTP/3.
- Cloudflare Insights beacon sekitar `11 KiB` dan request RUM memiliki latency sekitar `3,161 ms`; dampak main-thread kecil, tetapi dapat ditunda atau dihapus bila tidak dibutuhkan.
- SEO Lighthouse dasar `100`, sitemap/robots live tersedia, tetapi metadata OG image rusak dan SPA route metadata tetap bergantung pada eksekusi JavaScript.

#### Temuan accessibility
- `Navbar.tsx` merender dua `StaggeredMenu` sekaligus untuk desktop/mobile. Keduanya memakai ID `staggered-menu-panel`, sehingga ID duplikat.
- Panel menu tertutup memakai `aria-hidden=true` tetapi masih berisi button focusable. Lighthouse memberikan Accessibility `88` dan Agentic Browsing `1/3`.
- Teks `zinc-500`, `zinc-600`, dan opacity rendah gagal contrast di beberapa area.
- Dot carousel berukuran visual `7x7px` dan area touch tidak memenuhi target minimum.
- Footer memakai heading `h4` yang melompati struktur heading halaman.

#### Rekomendasi urutan perbaikan
1. Hilangkan atau pendekkan LoadingScreen dan pastikan hero tampil segera.
2. Nonaktifkan SplashCursor di mobile/reduced-motion; pause atau sederhanakan Scanner global.
3. Kurangi animation loop dan perbaiki forced reflow.
4. Hapus QueryClientProvider yang tidak dipakai dan pecah/lazy-load animation serta lightbox.
5. Hapus Roboto Flex/VariableProximity atau self-host font yang benar-benar diperlukan.
6. Ubah carousel homepage ke thumbnail WebP dengan `srcset`/`sizes`; full image hanya saat lightbox.
7. Perbaiki OG image, buat `llms.txt`, dan hapus `debug-backend.html` dari production.
8. Perbaiki duplicate menu, `aria-hidden`/`inert`, contrast, touch target, dan heading hierarchy.

#### Target verifikasi setelah implementasi
- FCP `< 1,5 s`, LCP `≤ 2,5 s`, TBT `< 200–300 ms`, CLS `< 0,1`.
- Jalankan `npx tsc --noEmit`, `npm run build`, `npm run test`, dan `npm run lint`.
- Ulangi Lighthouse mobile dan desktop minimal tiga kali, lalu cek Chrome DevTools Performance trace dan Coverage.
- Tidak ada perubahan file source atau deployment pada sesi audit ini.

### Sesi: Audit Migrasi Domain Baru `.id` (17 Agustus 2026)

**Permintaan user**: mengganti domain utama website live dari `ipanstore.my.id` ke domain `.id`
baru dan meminta tutorial berdasarkan audit seluruh folder project.

#### Hasil audit
- Frontend adalah SPA React/Vite yang disajikan Nginx dalam container Docker `ipanstore`,
  dipublikasikan melalui Cloudflare Tunnel ke port host `5007`.
- Domain utama tertanam di `src/lib/seo.ts`, `index.html`, `public/sitemap.xml`, dan
  `public/robots.txt`; semua perlu diganti ke domain baru agar canonical, OG, JSON-LD, dan
  sitemap tidak tetap menunjuk domain lama.
- `server/.env` memakai domain frontend pada `ALLOWED_ORIGINS` dan `DOKU_CALLBACK_URL`; keduanya
  harus diperbarui. `DOKU_NOTIFICATION_URL` harus tetap menunjuk URL backend publik yang benar,
  bukan domain frontend secara otomatis.
- Konfigurasi Cloudflare Tunnel berada di luar repo. Public Hostname baru harus diarahkan ke
  service frontend yang sama; redirect 301 domain lama perlu dibuat di Cloudflare.
- Backend publik saat audit tetap merespons `https://api.ipanstore.my.id/api/health` dengan HTTP
  200. Backend tidak perlu diganti domainnya kecuali user memang ingin memakai subdomain API baru.
- Tidak ada perubahan source aplikasi pada sesi ini. Perubahan worktree yang sudah ada pada
  `Dockerfile` dan `public/debug-backend.html` tidak disentuh.

#### Verifikasi audit
- Audit referensi domain dan environment selesai.
- Website lama, health backend, `robots.txt`, dan `sitemap.xml` live berhasil diakses.

### Sesi: Riset Akses VPS, Cloudflare Tunnel, dan Domain `.id` (17 Agustus 2026)

**Permintaan user**: riset lanjutan dan otomatisasi migrasi domain sejauh mungkin, dengan akses
server melalui SSH Tailscale.

#### Hasil riset read-only
- SSH Tailscale ke `root@100.89.140.16` berhasil.
- Container `ipanstore` aktif dan memetakan `5007:80`; container `cloudflared` aktif; PM2
  `ipanstore-backend` online.
- Route Cloudflare yang aktif: `ipanstore.my.id` → `http://172.17.0.1:5007` dan
  `api.ipanstore.my.id` → `http://172.17.0.1:5159`.
- `https://ipanstore.my.id/` dan `https://api.ipanstore.my.id/api/health` merespons HTTP 200.
- Environment backend di VPS sudah memakai `ALLOWED_ORIGINS=https://ipanstore.my.id`, callback
  frontend domain lama, dan webhook publik `https://api.ipanstore.my.id/api/doku-webhook`.
- Cloudflared berjalan dengan konfigurasi remote-managed dari Cloudflare Dashboard; tidak ada
  file konfigurasi tunnel yang ter-mount dan tidak tersedia API token Cloudflare di environment
  container yang dapat dipakai untuk otomatisasi.
- Repo server memiliki artefak untracked (`deploy.sh`, folder `ipanstore/`, backup Nginx, dan
  `server/orders.json`). Tidak ada operasi Git/destruktif dilakukan.
- Pengecekan DNS komputer lokal untuk kandidat `ipanstore.id` timeout dan `ipanstore.co.id`
  tidak terdaftar; status ketersediaan final harus dicek di registrar PANDI saat domain target
  sudah ditentukan.

#### Blocker otomatisasi
- Nama domain target belum diberikan.
- Pembelian domain, perubahan nameserver, dan konfigurasi Cloudflare Dashboard memerlukan aksi
  pemilik akun atau kredensial/API token Cloudflare yang belum tersedia.

### Sesi: Implementasi Konfigurasi Target `ipanstore.id` (17 Agustus 2026)

- Domain aktif frontend diganti di `src/lib/seo.ts`, `index.html`, `public/sitemap.xml`, dan
  `public/robots.txt` menjadi `https://ipanstore.id`.
- `server/.env.example`, environment lokal backend, CORS, dan DOKU callback disiapkan untuk
  `ipanstore.id`; API target dipindahkan ke `https://api.ipanstore.id`.
- Dokumentasi aktif `AGENTS.md` dan `SETUP-DOKU.md` diperbarui. Riwayat lama di file ini
  dipertahankan sebagai catatan historis.
- Verifikasi lokal: `npx tsc --noEmit`, `npm run build`, dan `npm run test` berhasil.
- Belum deploy ke VPS karena `ipanstore.id` belum diarahkan ke Cloudflare Tunnel. Domain lama
  tetap live dan belum diubah menjadi redirect.

### Sesi: Keputusan Migrasi API ke Domain Baru (17 Agustus 2026)

- Diputuskan API ikut memakai `https://api.ipanstore.id` agar frontend dan backend memiliki domain
  brand baru yang konsisten serta tidak menyisakan ketergantungan produksi pada `my.id`.
- CORS transisi disiapkan agar origin `ipanstore.id` dan `ipanstore.my.id` sama-sama diizinkan
  sampai redirect 301 selesai.
- Root `.env`, `server/.env`, `server/.env.example`, `SETUP-DOKU.md`, dan `AGENTS.md` disiapkan
  untuk API baru. API lama dipertahankan sementara untuk rollback dan verifikasi.
- Route Cloudflare yang harus ditambahkan: frontend `ipanstore.id` → port `5007`, API
  `api.ipanstore.id` → port `5159`, dan opsional `www.ipanstore.id` → port `5007`.
- Verifikasi setelah perubahan: `npx tsc --noEmit`, `npm run build`, dan `npm run test` berhasil.

### Sesi: Cutover Live ke `ipanstore.id` dan `api.ipanstore.id` (17 Agustus 2026)

- Nameserver `ipanstore.id` berhasil diarahkan ke Cloudflare (`amber.ns.cloudflare.com` dan
  `julian.ns.cloudflare.com`).
- Route Tunnel aktif: `ipanstore.id` → `http://172.17.0.1:5007` dan `api.ipanstore.id` →
  `http://172.17.0.1:5159`.
- Backend VPS `server/.env` diperbarui: CORS hanya domain frontend baru, DOKU callback ke
  `https://ipanstore.id/order`, dan webhook ke `https://api.ipanstore.id/api/doku-webhook`.
- PM2 `ipanstore-backend` direstart dan tetap online.
- Build `dist` terbaru disalin ke container `ipanstore` melalui SSH Tailscale.
- Verifikasi publik berhasil: frontend baru, API health JSON, sitemap/robots baru, dan CORS
  preflight `204`.
- Cutover Cloudflare selesai; API lama sudah dihapus dan domain lama sudah redirect `301` ke
  `ipanstore.id`.

### Sesi: Penyelesaian Migrasi dan Verifikasi Final (17 Agustus 2026)

- Redirect Cloudflare aktif: `https://ipanstore.my.id/` dan `/order` mengembalikan HTTP `301` ke
  path yang sama di `https://ipanstore.id`.
- Route/domain API lama `api.ipanstore.my.id` sudah dihapus dan hostname tidak lagi resolve.
- `https://api.ipanstore.id/api/health` mengembalikan HTTP `200` JSON service backend.
- `https://ipanstore.id/` mengembalikan HTTP `200`; canonical, sitemap, dan robots memakai domain
  baru.
- CORS preflight frontend baru mengembalikan HTTP `204` dengan origin yang benar.
- Tidak dilakukan transaksi DOKU production tambahan pada sesi ini untuk menghindari charge; API,
  callback, webhook URL, dan CORS sudah terverifikasi secara konfigurasi/health.

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

- Domain dan API baru sudah live; `ipanstore.my.id` sudah redirect 301 dan route API lama sudah dihapus.
- Performance blocker utama tetap: dua WebGL effect global, banyak animation loop, dan forced reflow. `LoadingScreen`, preload animation, query provider, font waterfall, aset carousel, logo, favicon, dan animasi non-composited sudah dioptimasi secara lokal; belum dideploy.
- Lighthouse desktop terakhir: Performance 56 dengan TBT 22.910 ms. FCP/LCP/CLS sudah baik sehingga fokus pertama harus main-thread dan efek visual.
- Homepage secara lokal sudah memakai thumbnail WebP untuk carousel; gambar JPG penuh tetap dipakai saat lightbox.
- Font Roboto Flex tetap dipertahankan untuk VariableProximity, tetapi `@import` CSS sudah dipindah ke link font utama dan range variable dipersempit.
- Logo diperkecil dari sekitar 68 KiB menjadi sekitar 6,7 KiB; favicon baru PNG sekitar 1,3 KiB. Perubahan logo/favikon sudah ada di live.
- OG/Twitter/JSON-LD image sudah live dan menunjuk ke `/img/logo.png`.
- `public/llms.txt` sudah live dan mengembalikan HTTP `200`.
- `public/debug-backend.html` sudah tidak tersedia di production; endpoint live mengembalikan HTTP `404`.
- Accessibility: dua StaggeredMenu aktif di DOM, duplicate ID, focusable descendant dalam `aria-hidden`, contrast rendah, dot carousel terlalu kecil, dan heading footer tidak berurutan.
- Laporan mobile lengkap belum tersimpan di konteks sesi; rekomendasi mobile didasarkan pada source audit dan temuan desktop yang relevan lintas device.
- Flicker preview/stacking SettinX di desktop sudah diperbaiki secara lokal dengan scroll lock dan koordinat layout statis; belum dideploy.
- **Akar flicker kartu `/layanan` & `/paket` sudah ditemukan & diperbaiki lokal (sesi 17 Agt):**
  feedback loop `getBoundingClientRect()` pada elemen yang ditransform oleh loopnya sendiri.
  Fix: `getOffset()` memakai rantai `offsetTop` (koordinat layout murni). Bundle live masih
  memakai implementasi lama yang buggy → flicker di produksi akan hilang setelah deploy.
- **Kartu bertumpuk tembus & AnimatedTabs kedipan sudah diperbaiki lokal (sesi 17 Agt):**
  (1) AnimatedTabs digabung jadi single-layer (satu timeline GSAP, bukan dua tween berebut
  transform); (2) opacity fade 0.85 untuk kartu pinned di belakang agar teks tidak tembus;
  (3) background `.gaming-card` diperkuat ke #232325 + shadow; (4) z-index descending untuk
  urutan stack yang benar. Transform animasi tetap sama seperti live (translateY: 824, 557, 290, 21).
- Layer reveal & parallax `AnimatedTabs` dipisah (inner wrapper) agar dua tween GSAP tidak
  berebut `transform`; kedua animasi dipertahankan. Class `animate-fade-up` konten tab tetap ada.
- Cloudflare Tunnel dikelola dari Dashboard dan tidak dapat ditambahkan hostname baru hanya lewat
  SSH VPS tanpa akses Cloudflare/API.
- Environment backend VPS tetap perlu diperbarui pada `ALLOWED_ORIGINS` dan `DOKU_CALLBACK_URL`
  sebelum deploy. `DOKU_NOTIFICATION_URL` tetap memakai endpoint API publik yang aktif. Jangan
  pernah menyalin secret DOKU ke Git atau frontend.
- **SSH akun sekunder** (`github.com-ipanappsettinx`, key `id_ed25519`) belum terdaftar di GitHub
  → `Permission denied`. Ini hanya perlu jika push dari akun sekunder.
- **Lint**: ada ±59 error pre-existing di `src/components/ui/*` (file shadcn/ui), bukan dari perubahan terakhir.
- **`.gitignore`** mengecualikan: `.env`, log, `dist`, `opencode.json`, screenshot lokal.
- Info server: `sever-h81m-s2ph` Tailscale `100.89.140.16`; project `/project/website/padel/IpanStore/ipanstore`
  (SSH root). Server kedua `server` `100.70.48.103` (port 22 tidak merespons).

---

## ✅ CHECKLIST LANJUTAN
- [ ] (Jika perlu) daftarkan key `id_ed25519` ke GitHub untuk akun `ipanappsettinx`.
- [x] Daftarkan domain target `ipanstore.id` dan tambahkan domain ke Cloudflare.
- [x] Ubah nameserver registrar dan tambahkan Public Hostname Cloudflare untuk frontend/API.
- [x] Tambahkan route `api.ipanstore.id` ke `http://172.17.0.1:5159`, deploy, dan health check
  API baru berhasil.
- [x] Nameserver, route frontend, route API baru, update backend, restart PM2, dan deploy frontend.
- [x] Hapus route `api.ipanstore.my.id` dari Cloudflare.
- [x] Buat redirect 301 `ipanstore.my.id` → `ipanstore.id` dan verifikasi semua route.
- [x] Ganti referensi domain di source/SEO/sitemap/robots, update template CORS + DOKU callback,
  dan build/test lokal.
- [x] Update CORS + DOKU callback di VPS, restart PM2, deploy, dan verifikasi setelah DNS/Tunnel
  domain target aktif.
- [ ] (Opsional) Optimasi lebih lanjut: preload kritis, `fetchpriority` hero image.
- [x] Daftarkan properti `ipanstore.id` di Google Search Console, kirim `/sitemap.xml`, lalu request indexing URL utama; Search Console mengonfirmasi URL diindeks dan 8 URL ditemukan.
- [x] Pendekkan `LoadingScreen` menjadi 200 ms; validasi LCP live masih perlu dilakukan setelah deploy.
- [ ] (Ditunda) Optimasi runtime WebGL, offscreen loop, forced-reflow, canvas, dan input tanpa menghapus efek.
- [x] Hentikan preload `animation-vendor` dan hapus QueryClientProvider/query-vendor yang tidak digunakan.
- [x] Pertahankan Roboto Flex/VariableProximity dan pindahkan pemuatannya dari CSS `@import` ke link utama dengan range lebih sempit.
- [x] Migrasikan `TestimoniPreview` ke thumbnail WebP; gambar penuh tetap untuk lightbox.
- [x] Optimalkan logo dan favicon; perbaiki OG image dari `/logo.png` ke `/img/logo.png` (sudah live).
- [x] Tambahkan `public/llms.txt` untuk agentic browsing (sudah live).
- [x] Push dan deploy perbaikan SEO; `/img/logo.png`, `/llms.txt`, dan metadata OG live sudah diverifikasi.
- [x] Ubah shine dan dot carousel ke animasi berbasis transform/opacity tanpa menghilangkan efek visual.
- [x] Kunci scroll background saat preview SettinX terbuka untuk mencegah flicker fixed lightbox.
- [x] Perbaiki feedback loop `ScrollStackCards` yang menyebabkan flicker desktop di sekitar preview SettinX.
- [x] Samakan `ScrollStackCards`, `AnimatedTabs`, dan class animasi Layanan/Paket dengan bundle live.
- [x] Perbaiki akar flicker kartu: ganti `getOffset()` `ScrollStackCards` dari `getBoundingClientRect()` ke rantai `offsetTop` (hilangkan feedback-loop transform).
- [x] Perbaiki DEFINITIF flicker kartu: kompensasi penyusutan scale pada pin + interpolasi adaptif (snap gerakan kecil) + sinkron `curY` saat IO start — terverifikasi via uji scroll-reversal Playwright (reversals 15→2, kartu pinned stabil 97-99px).
- [x] Perbaiki tembus kartu & AnimatedTabs: opacity fade 0.85 untuk kartu pinned + z-index descending + background solid `.gaming-card` + `.scroll-stack-card` + single-layer AnimatedTabs — terverifikasi via screenshot perbandingan.
- [x] Pisahkan layer reveal & parallax `AnimatedTabs` agar dua tween GSAP tidak berebut `transform` (kedua efek dipertahankan).
- [x] Ubah copy Beranda `Windows Lebih Enteng` menjadi `Windows Lebih Ringan`.
- [x] Fix flicker preview SettinX: `lenis.stop()/start()` + portal lightbox ke body `z-[9000]` + kompensasi scrollbar — terverifikasi Playwright (kartu beku 0/10, scroll & Lenis terkunci, overlay di atas navbar).
- [x] Fix kartu menimpa section berikut: `z-10` eksplisit di section `AppSettinxSection` & `PackagesPreview`.
- [ ] Buat `public/llms.txt` dengan H1 dan link halaman penting.
- [x] Hapus `public/debug-backend.html` dari production — terhapus dari repo & terverifikasi live 404 pada deploy `0645acc`.
- [ ] Perbaiki accessibility menu (`inert`, focus management, unique ID), contrast, touch target, dan heading hierarchy.
- [ ] Tambahkan test nyata untuk route, SEOHead, checkout, menu accessibility, dan performance smoke test.
- [x] Deploy backend `server/` ke VPS `sever-h81m-s2ph` — **via Cloudflare Tunnel** `https://api.ipanstore.id` (PM2 `ipanstore-backend` port 5159) — terverifikasi live 17 Agt.
- [x] Set `VITE_BACKEND_URL=https://api.ipanstore.id` — sudah terbake di bundle live.
- [x] Notification URL — backend kirim `override_notification_url` (`https://api.ipanstore.id/api/doku-webhook`) per-transaksi.
- [x] Frontend baru → API baru health dan CORS terverifikasi; transaksi DOKU production tambahan belum dilakukan.
- [x] Email otomatis SettinX (link Drive + invoice) setelah pembayaran SUCCESS — **terverifikasi terkirim** 13 Agt.
- [ ] (Opsional) Test bayar SettinX sungguhan (Rp 75.000) dari browser → cek email diterima pembeli.
- [x] Hapus `public/debug-backend.html` dari production — sudah dihapus dari repo & terverifikasi live 404 pada deploy `0645acc`.
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
