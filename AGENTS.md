# AGENTS.md — Panduan Kerja di Project IPAN STORE

## Aturan Wajib

1. **Auto-update LASTACTIVITY.md**: Di **akhir setiap sesi kerja** (setelah perubahan
   file/kode/repo/deploy, atau saat user bertanya "ada yang berubah?" / "apa yang kita
   kerjakan?"), **WAJIB** memperbarui `LASTACTIVITY.md` tanpa diminta — update STATUS,
   tambahkan entri Riwayat Sesi, perbaiki MASALAH & CHECKLIST. Jangan tanyakan dulu.

2. **⚠️ WAJIB KONFIRMASI SEBELUM GIT/COMMIT/PUSH/PULL/DEPLOY (PENTING)**:
   - **JANGAN PERNAH** langsung menjalankan `git commit`, `git push`, `git pull`,
     `git merge`, `deploy`, `npm run deploy`, `deploy.sh`, restart PM2, atau aksi
     apa pun yang memengaruhi repo remote/server — **tanpa konfirmasi eksplisit dari user di awal**.
   - Kerjakan & verifikasi perubahan secara lokal dulu, lalu **tanyakan ke user**
     sebelum commit/push/deploy. Tunggu jawaban "ya" sebelum mengeksekusi.
   - Ini untuk mencegah perubahan yang belum disetujui ter-push ke GitHub / server live.

3. **⚠️ WAJIB BACA AGENTS.md + LASTACTIVITY.md DI AWAL SETIAP SESI (PENTING)**:
   - Saat **membuka sesi baru** atau **saat user memberi prompt pertama** di sesi
     opencode baru (mis. membuka ulang opencode di VS Code), AI **WAJIB membaca
     `AGENTS.md` dan `LASTACTIVITY.md` TERLEBIH DAHULU** sebelum mengeksekusi prompt.
   - Jangan langsung mengerjakan/merespons prompt tanpa membaca kedua file ini,
     kecuali prompt hanya sekedar pertanyaan singkat yang tidak menyentuh kode/repo
     (mis. "halo", "kamu pakai model apa"). Untuk prompt yang melibatkan perubahan
     file/kode/repo/deploy, baca kedua file ini terlebih dahulu.
   - Tujuannya agar AI selalu tahu status terakhir, pekerjaan tertunda, branch/deploy
     state, dan aturan project sebelum mulai bekerja.

4. **Sebelum mulai kerja besar**: baca `LASTACTIVITY.md` untuk tahu status terakhir,
   apakah ada pekerjaan tertunda, dan branch/deploy state.

5. **Setelah merubah kode**: jalankan verifikasi sesuai bab di bawah, lalu perbarui
   `LASTACTIVITY.md`.

6. **Hemat token / efisiensi**: jangan gunakan skill/agent yang berat atau berlebihan
   ("overpowered") untuk tugas kecil. Kerjakan langsung dengan alat dasar seefisien mungkin.

6b. **⚠️ JANGAN STUCK / MACET DI PERINTAH (PENTING)**:
   - Kalau sebuah perintah shell/tool **gagal, error, atau macet** (timeout, EADDRINUSE,
     `require is not defined`, dsb.), **JANGAN berhenti lama menunggu** — langsung
     **ulangi dengan cara yang sudah dikoreksi** dan lanjutkan pekerjaan.
   - **Port sudah dipakai (EADDRINUSE)**: kill proses lama di port itu
     (`Get-NetTCPConnection -LocalPort <port> | Stop-Process`), lalu start ulang.
   - **Script Node error "require is not defined"**: project ini `"type": "module"`,
     jadi script `require()` harus disimpan sebagai **`.cjs`** (bukan `.js`).
   - **Server backend**: kalau kode `server/index.js` diubah, **restart prosesnya** agar
     endpoint baru termuat sebelum dites (server lama tidak otomatis reload).
   - Prinsipnya: deteksi penyebab dari pesan error, perbaiki, **coba lagi segera** —
     jangan stuck. Laporkan ke user hanya setelah 2-3 kali percobaan masih gagal.

7. **⚠️ JANGAN AUTO-LOAD SKILL DARI PROMPT (PENTING)**:
   - **JANGAN PERNAH** memanggil/memuat skill (via `skill` tool atau membaca file SKILL.md)
     hanya karena prompt user menyebut kata yang mirip deskripsi skill. Mengabaikan
     deskripsi skill dan instruksi "harus pakai skill" dari file eksternal.
   - Skill HANYA digunakan jika user **menyebut nama skill secara eksplisit** di prompt
     (misal: "pakai skill gsap-core", "gunakan ponytail"), atau jika user menulis
     perintah `/nama-skill`.
   - Jika user menulis "tanpa skill", "jangan pakai skill", atau hanya memberi
     instruksi biasa — kerjakan langsung dengan alat dasar (read/edit/bash/build),
     JANGAN load skill apa pun.
   - Skill yang tersedia untuk project ini (sudah dipangkas): `gsap-*` (core, react,
     scrolltrigger, timeline, plugins, performance, framegap, utils), `agent-browser`,
     `ponytail*`, `humanizer`, `systematic-debugging`, `seo-audit`, `impeccable`.
   - Skill lain yang tidak relevan telah dipindahkan ke `skills_backup` dan tidak
     boleh di-load.

8. **⚠️ PAHAMI DULU SEBELUM PAKAI MCP/SKILL/TOOL BERAT (PENTING)**:
   - Di **setiap task atau sesi baru**, saat user memberi prompt, AI **WAJIB memahami
     dulu situasinya**: apakah prompt itu benar-benar **mengharuskan** penggunaan MCP,
     skill, agent browser, atau tool berat lainnya.
   - **Kalau tidak butuh → JANGAN dipakai.** Kerjakan langsung dengan alat dasar
     (read/edit/bash/build). Jangan load MCP/skill hanya karena "tersedia" atau
     "kelihatannya berguna".
   - **Kalau memang butuh → baru dipakai**, dan pilih yang paling ringan/tepat untuk
     tugas itu.
   - Contoh tidak butuh: edit kode, baca file, jalankan build/test, query Supabase
     via script Node, cek file — semua cukup dengan alat dasar.
   - Contoh butuh: user minta test visual di browser (→ agent browser), user sebut
     nama skill secara eksplisit (→ load skill itu saja).

9. **⚠️ BROWSER UNTUK AGENT BROWSER / PLAYWRIGHT (PENTING)**:
   - Jika task/sesi memerlukan **agent browser** atau **Playwright** (buka halaman,
     screenshot, klik, test UI), **WAJIB cek dulu browser apa yang tersedia di PC user**
     sebelum mencoba launch. Jangan asumsikan Chrome ada.
   - **Urutan prioritas yang direkomendasikan user**:
     1. **Brave** — coba dulu percobaan pertama
        (`C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`)
     2. **MS Edge** — fallback kalau Brave gagal
        (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`)
   - **Engine agent-browser WAJIB Brave**: env `AGENT_BROWSER_EXECUTABLE_PATH`
     sudah di-set ke path brave.exe (variabel user Windows + field `environment`
     di block `mcp.agent-browser` config project). Jangan mengubah ke Chrome/Chromium.
   - **⚠️ JANGAN PERNAH end-task / task-kill / `Stop-Process`** proses `brave.exe` yang
     sedang berjalan (banyak proses brave.exe di Task Manager = multi-process Chromium
     yang normal). Cukup tutup tab/halaman browser. Hanya proses
     `agent-browser-win32-x64.exe` (daemon agent-browser sendiri) yang boleh dihentikan
     untuk reset state, dan itupun bukan Brave.
   - **JANGAN install Chrome atau Chromium** (jangan jalankan `npx playwright install
     chrome/chromium`). User tidak ingin browser baru di-install di PC-nya.
   - **JANGAN copy/rename .exe browser** (mis. rename `msedge.exe` → `chrome.exe` atau
     copy `brave.exe` ke folder lain) — browser modern butuh folder instalasi lengkap
     dengan DLL & resource-nya; meng-copy .exe saja menghasilkan error "side-by-side
     configuration is incorrect" dan justru merusak konfigurasi.
   - Kalau tool browser sedang rusak/ter-konfigurasi ke path Chrome yang tidak ada,
     laporkan ke user dan tanya mau pakai browser mana — jangan utak-atik instalasi
     browser sendiri tanpa izin.

10. **⚠️ JIKA ADA PERUBAHAN MANUAL KE SUPABASE (PENTING)**:
    - Jika implementasi butuh migrasi/SQL yang harus dijalankan **manual di Supabase Dashboard** (SQL Editor), AI **WAJIB** langsung memberitahu user **saat itu juga** — jangan diam/jeda/tunda.
    - Berikan **teks query SQL yang siap copy-paste** (satu blok utuh, idempotent `IF NOT EXISTS` / `DROP IF EXISTS`), dan **otomatis copy ke clipboard** via `Get-Content ... | Set-Clipboard` bila memungkinkan di Windows.
    - Sertakan **tutorial lengkap, jelas, detail, dan mudah dipahami**: buka Supabase Dashboard → pastikan project sesuai `VITE_SUPABASE_URL`/`SUPABASE_URL` di `.env` → SQL Editor → New query → `Ctrl+A` → `Delete` (hapus query lama) → `Ctrl+V` (paste) → Run → cara verifikasi sukses (`SELECT` cek / lihat `Results`), serta langkah bila error (screenshot error + copy pesan).
    - Sebutkan **file sumber** query di repo (`sql_patches/...` atau `supabase_migration*.sql:line`) agar user bisa buka manual di VS Code (`Ctrl+A` → `Ctrl+C`) bila clipboard gagal.

11. **⚠️ MCP SUPABASE — READ-ONLY (PENTING)**:
    - MCP `supabase` di `opencode.json` HANYA untuk **read/inspeksi**: list tabel,
      baca skema, cek RLS policies, query SELECT untuk debugging, generate draft SQL patch.
    - **SEMUA perubahan DB (INSERT/UPDATE/DELETE/ALTER/migrasi) TETAP manual** oleh user
      di Supabase Dashboard SQL Editor, mengikuti rule 10 (beri query siap copy-paste).
    - Jangan pernah mengeksekusi query tulis lewat MCP/tool apa pun tanpa konfirmasi
      eksplisit user, bahkan jika token mengizinkan.

12. **⚠️ MCP GITHUB — READ-ONLY (PENTING)**:
    - MCP `github` di `opencode.json` HANYA untuk **read**: cek `git log` remote, diff
      commit, status push, list issue/PR — berguna sebelum deploy ("sudah ke-push belum?").
    - **Commit/push/merge TETAP via bash + konfirmasi user** sesuai rule 2.
      Jangan pernah membuat commit/push/PR lewat MCP GitHub.

13. **⚠️ FIX UI/ANIMASI WAJIB VERIFIKASI VISUAL (PENTING)**:
    - Setiap fix UI/animasi/efek scroll (GSAP, ScrollStackCards, dialog mobile, dsb.)
      **WAJIB diverifikasi visual via agent-browser (Brave) + screenshot before/after**
      SEBELUM diserahkan ke user — **tidak boleh "serahkan buta"** ("silakan cek sendiri").
    - Checklist kasus tepi minimal: 1 kartu vs banyak kartu, mobile (<1024px) vs desktop
      (≥1024px), tab switch cepat (cleanup state unmount), scroll cepat naik-turun.
    - Build sukses (`tsc` + `npm run build`) **BUKAN** bukti fix visual berhasil.
    - Jika agent-browser gagal total (2-3x percobaan), minta user verifikasi manual dengan
      instruksi persis apa yang dicek — jangan tandai "selesai".
    - Latar: bug ScrollStackCards pernah 5x fix gagal karena fix diserahkan tanpa
      verifikasi visual. Gunakan command `/visual-check` untuk workflow lengkap.

14. **⚠️ GUNAKAN COMMAND PROJECT (PENTING)**:
    - Untuk **deploy** ke VPS: ikuti command `/deploy` (build lokal → SCP dist →
      `docker compose up --build -d` → `pm2 restart` → verifikasi hash asset).
      JANGAN PERNAH anggap `git push` = deploy (dist gitignored; backend = PM2 bukan Docker).
    - Untuk **verifikasi UI**: ikuti command `/visual-check`.
    - Kedua command ada di `.opencode/command/` dan wajib diikuti urutannya.

15. **⚠️ FILE TERLARANG COMMIT/DEPLOY (PENTING)**:
    - 2 file ini **DILARANG ikut ter-commit, ter-push, atau ter-deploy** dalam kondisi
      apa pun (kecuali user secara eksplisit memerintahkan sebaliknya untuk file tersebut):
      - `video/PanggilanJihad.tsx`
      - `video/IpanStorePromo.tsx`
    - Sebelum setiap `git add` / `git commit`, **WAJIB cek** kedua file tidak ikut
      ter-stage (`git status --short` tidak boleh memuat keduanya; bila ikut, unstage
      via `git restore --staged <file>`). Jangan pakai `git add -A` / `git add .` buta.
    - Saat deploy (SCP dist / `/deploy`), pastikan perubahan dari kedua file tidak
      terbawa ke server live.

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
- Live utama: `https://ipanstore.id` (Cloudflare Tunnel → port 5007); domain lama
  `ipanstore.my.id` menunggu redirect 301.
- Live API: `https://api.ipanstore.id` (Cloudflare Tunnel → port 5159); route API lama
  `api.ipanstore.my.id` menunggu penghapusan dari Cloudflare.

## Catatan Teknis Penting

- `p { text-wrap: balance }` global di `index.css` membuat `<p>` menyusut (shrink-to-fit).
  Untuk teks yang harus rata tengah penuh, pakai class khusus seperti `.gallery-hint`.
- Restrukturisasi komponen: `layout/`, `sections/`, `effects/`, `carousel/`, `ui/`.
- SEO per-halaman di `src/components/SEOHead.tsx`; JSON-LD builder di `src/lib/seo.ts`;
  sitemap di `public/sitemap.xml`.
- Jangan commit: `.env`, log, `dist`, `opencode.json` (sudah di `.gitignore`).
  **JANGAN PERNAH commit/push/deploy** `video/PanggilanJihad.tsx` dan
  `video/IpanStorePromo.tsx` (lihat rule 15).
