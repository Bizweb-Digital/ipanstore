# AGENTS.md — Panduan Kerja di Project IPAN STORE

## Aturan Wajib

1. **Auto-update LASTACTIVITY.md**: Di **akhir setiap sesi kerja** (setelah perubahan
   file/kode/repo/deploy, atau saat user bertanya "ada yang berubah?" / "apa yang kita
   kerjakan?"), **WAJIB** memperbarui `LASTACTIVITY.md` tanpa diminta — update STATUS,
   tambahkan entri Riwayat Sesi, perbaiki MASALAH & CHECKLIST. Jangan tanyakan dulu.

2. **Sebelum mulai kerja besar**: baca `LASTACTIVITY.md` untuk tahu status terakhir,
   apakah ada pekerjaan tertunda, dan branch/deploy state.

3. **Setelah merubah kode**: jalankan verifikasi sesuai bab di bawah, lalu perbarui
   `LASTACTIVITY.md`.

## Perintah Penting

| Perintah | Arti |
|---|---|
| `npm run build` | Build produksi (wajib lolos sebelum dianggap selesai) |
| `npx tsc --noEmit` | Typecheck |
| `npm run test` / `npx vitest run` | Unit test |
| `npm run lint` | Lint (ada error pre-existing di `src/components/ui/*` — jangan dikaitkan ke perubahan kita) |
| `npx vite --port 8080 --host` | Dev server lokal |
| `npm run deploy` / `deploy.sh` | Deploy (server: `git pull` → docker compose) |

## Deploy ke Server

- Server: `sever-h81m-s2ph`, Tailscale `100.89.140.16`, SSH `root@100.89.140.16`.
- Path: `/project/website/padel/IpanStore/ipanstore`.
- Flow deploy manual dari PC:
  1. `git push origin main` (dari PC, key `github.com-bizwebdigital`).
  2. `ssh root@100.89.140.16 "cd /project/website/padel/IpanStore/ipanstore && git pull && docker compose down && docker compose up --build -d"`.
- Live di `https://ipanstore.my.id` (Cloudflare Tunnel → port 5007).

## Catatan Teknis Penting

- `p { text-wrap: balance }` global di `index.css` membuat `<p>` menyusut (shrink-to-fit).
  Untuk teks yang harus rata tengah penuh, pakai class khusus seperti `.gallery-hint`.
- Restrukturisasi komponen: `layout/`, `sections/`, `effects/`, `carousel/`, `ui/`.
- SEO per-halaman di `src/components/SEOHead.tsx`; JSON-LD builder di `src/lib/seo.ts`;
  sitemap di `public/sitemap.xml`.
- Jangan commit: `.env`, log, `dist`, `opencode.json` (sudah di `.gitignore`).
