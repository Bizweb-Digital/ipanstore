# DESIGN.md — IPAN STORE

Dokumen desain & arsitektur website IPAN STORE, plus evaluasi jujur fitur-fitur baru.

---

## 1. GAMBARAN PROYEK

Website katalog & penjualan jasa optimasi PC gaming (IPAN STORE).
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + GSAP + Lenis.

**Bentuk:** Front-end **statis** (SPA) — tidak ada backend/server sendiri.

---

## 2. STRUKTUR HALAMAN

| Route | Halaman | Isi |
|---|---|---|
| `/` | Beranda | Hero, Layanan, Preview Paket, SettinX Catalog, Testimoni, FAQ, Closing CTA |
| `/layanan` | Layanan | Detail layanan + sub-halaman (Boost FPS FF, Tweaking PC) |
| `/paket` | Paket | Tab paket (Optimize/SET PC/Anti Cheat/APP SETTINX) + tabel perbandingan |
| `/testimoni` | Testimoni | Bukti & ulasan pelanggan |
| `/order` | **Order** | Checkout online: pilih paket → isi data → bayar (Cashi.id) |
| `/faq` | FAQ | Pertanyaan umum |
| `/kontak` | Kontak | Info kontak |

**Navigasi (StaggeredMenu + Footer):**
01 Beranda · 02 Layanan · 03 Paket · 04 Testimoni · 05 **Order** · 06 FAQ · 07 Kontak

---

## 3. SISTEM DESAIN

### Warna
- Background gelap: `#1a1a1a`, panel `#131314` / `#2d2d2d`
- Teks utama: `#F4F4F5`, teks sekunder: zinc (`#A1A1AA`)
- Aksen: slate `#94A3B8` (aurora, badge, highlight)
- Border halus: `white/16`, `white/8`

### Tipografi
- Heading: **Orbitron** (gaming, uppercase, tracking lebar)
- Body: **Inter / Plus Jakarta Sans**
- Angka/harga: **font-mono**

### Komponen kunci
- `gaming-card` — kartu panel gelap dengan border halus
- `gaming-table` + `.gaming-table-scroll` — tabel perbandingan (drag/swipe di mobile)
- `scroll-reveal` — animasi masuk saat elemen terlihat
- `StaggeredMenu` — menu overlay bernomor
- `AuroraText`, `ShineBorder`, `ElectricBorder` — aksen visual

### Motion
- **Lenis** — smooth scroll. Di **mobile dibuat native** (`syncTouch:false`, `smoothWheel:false`) agar scroll tidak kebut & halus.
- **ScrollStackCards** — kartu menumpuk yang mengecil; lerp dinaikkan saat touch (0.32) agar smooth.
- **Framer Motion / GSAP** — reveal & micro-interaction.

---

## 4. PERUBAHAN TERAKHIR (YANG BARU DIKERJAKAN)

| Fitur | File | Status |
|---|---|---|
| Mobile scroll terlalu cepat | `Layout.tsx` | ✅ |
| Animasi stack tidak smooth di HP | `ScrollStackCards.tsx` | ✅ |
| Tabel perbandingan susah digeser di HP | `Paket.tsx` + `index.css` | ✅ |
| Halaman **Order** baru | `pages/Order.tsx` + route | ✅ |
| Integrasi payment gateway **Cashi.id** | `lib/cashi.ts` | ✅ (kerangka, perlu API key) |
| Nav: Order=05, FAQ=06, Kontak=07 | `Navbar.tsx` + `Footer.tsx` | ✅ |
| Tombol Beli/Order → `/order` | Paket, AppSettinx, CatalogAppSettinx, PackagesPreview | ✅ |

---

## 5. EVALUASI JUJUR — APAKAH FITUR INI BERGUNA?

### ✅ Yang PASTI berguna (high value)

**Perbaikan mobile (scroll + tabel)** — **SANGAT berguna.**
Mayoritas pengunjung website jasa gaming seperti ini datang dari **HP** (link dari WA/TikTok/Discord). Kalau scroll patah-patah dan tabel susah digeser, pengunjung kabur sebelum beli. Ini perbaikan paling berdampak.

**Halaman Order + tombol yang konsisten ke /order** — **berguna.**
Menyatukan semua CTA ke satu alur checkout membuat funnel jelas dan terlihat profesional. Struktur datanya juga sudah sinkron dengan halaman Paket.

### ⚠️ Yang berguna TAPI dengan catatan penting

**Integrasi Cashi.id** — berguna, **TAPI ada batasan besar yang harus dipahami:**

1. **Website ini front-end statis (tanpa backend).** Payment gateway yang benar-benar aman & otomatis butuh backend:
   - API key tidak boleh terekspos di browser.
   - Konfirmasi pembayaran otomatis (webhook) butuh URL server.
2. **Tanpa backend**, yang realistis sekarang:
   - **Cara A (Payment Link per produk)** — tombol langsung redirect ke link pembayaran Cashi. Sederhana & aman, tapi konfirmasi order masih manual (cek di dashboard Cashi "Transaksi"/"Cek Order").
   - Fallback WhatsApp — pelanggan tetap bisa order manual.
3. **Cara B (API + serverless function)** baru membuka otomatisasi penuh — tapi itu artinya menambah backend, yang berarti proyek **belum "selesai"** seperti perkiraan.

### Kesimpulan evaluasi

- **Kalau target Anda "cepat selesai & bisa jualan":** pakai **Cara A (payment link)** atau fallback WhatsApp. Website bisa dianggap selesai. Ini rekomendasi saya.
- **Kalau target "otomatis penuh" (order tercatat, pembayaran terkonfirmasi sendiri):** perlu backend/serverless function + webhook → tambahan pekerjaan di luar front-end.

---

## 6. REKOMENDASI LANGKAH TERAKHIR SEBELUM "SELESAI"

1. **Deploy** front-end (Vercel/Netlify/Cloudflare Pages — gratis).
2. Daftar Cashi → aktifkan **QRIS** → buat **payment link per paket**.
3. Isi `CASHI_PAYMENT_LINKS` di `src/lib/cashi.ts`.
4. Test beli paket termurah → pastikan dana masuk.
5. (Opsional, nanti) tambah serverless function untuk otomatisasi webhook.

Setelah langkah 1–4, website sudah **production-ready** untuk menerima pembayaran.

---

## 7. CATATAN TEKNIS

- Build: `npm run build` → output `dist/` (SPA). Perlu konfigurasi **SPA fallback** di hosting (semua route → `index.html`) agar `/order`, `/paket`, dll. tidak 404 saat refresh.
- API key Cashi disimpan di `.env` (jangan di-commit). Template: `.env.example`.
- Panduan setup lengkap: lihat `SETUP-CASHI.md`.
