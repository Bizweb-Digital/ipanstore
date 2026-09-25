---
description: Verifikasi visual WAJIB untuk fix UI/animasi (agent-browser + Brave)
---

Verifikasi visual untuk fix UI/animasi. $ARGUMENTS

⚠️ Fix UI/animasi/efek scroll TIDAK BOLEH diserahkan ke user tanpa verifikasi visual.
Ini untuk memutus siklus fix berulang (contoh: ScrollStackCards pernah 5x fix gagal).

## Setup Browser (AGENTS.md rule 9)
- Engine: **Brave** via `AGENT_BROWSER_EXECUTABLE_PATH` (sudah dikonfigurasi)
- **JANGAN PERNAH** end-task/`Stop-Process` proses `brave.exe`
- Hanya daemon `agent-browser-win32-x64.exe` yang boleh di-stop untuk reset state
- **JANGAN** install Chrome/Chromium baru

## Langkah Wajib

### 1. Siapkan target
- Dev server: `npx vite --port 8080 --host` (jika test lokal)
- Atau live site: `https://ipanstore.id/...` (jika test pasca-deploy)

### 2. Reproduce & dokumentasikan BEFORE
- Buka halaman yang bermasalah dengan agent-browser
- `snapshot` untuk struktur elemen
- `screenshot` state bermasalah → simpan ke `screenshots/`
  dengan nama `fix-[deskripsi-singkat]-before.png`

### 3. Terapkan fix, lalu verifikasi AFTER
- Setelah fix + rebuild, buka ulang halaman yang sama
- Ulangi interaksi yang sama persis
- `screenshot` → `fix-[deskripsi-singkat]-after.png`

### 4. Checklist kasus tepi (WAJIB untuk komponen scroll/stack/GSAP)
- [ ] 1 kartu (konten minimal) — kasus yang membunuh tab ANTI CHEAT
- [ ] 2 kartu
- [ ] Banyak kartu (4+)
- [ ] Mobile (<1024px) — resize viewport atau device emulation
- [ ] Desktop (≥1024px)
- [ ] Tab switch cepat bolak-balik (uji cleanup state unmount —
      sisa `transform`/`zIndex` menempel = regresi seperti insiden 052f4f5)
- [ ] Scroll cepat ke bawah lalu ke atas (uji pin/release)

### 5. Protokol jika agent-browser gagal
- Dev server tidak merespons → cek port, kill EADDRINUSE, start ulang
- Tool timeout → `wait_ms` lebih lama, coba lagi (maks 2-3x)
- Tetap gagal → **MINTA user verifikasi manual**, sebutkan persis apa yang
  harus dicek. JANGAN pernah menandai fix "selesai" tanpa verifikasi.

### 6. Verifikasi bundle (untuk lazy chunk)
Konten halaman lazy-loaded (mis. `Paket.tsx`) tidak ada di index bundle.
Cek chunk yang benar:
```powershell
Select-String -Path "dist/assets/Paket-*.js" -Pattern "ATAU" # contoh marker fix
```

## Skill pendukung (load HANYA jika user sebut eksplisit — AGENTS.md rule 7)
- `gsap-scrolltrigger` — untuk bug pin/scrub/stack
- `gsap-core` — untuk bug timeline/tween dasar
- `systematic-debugging` — untuk akar masalah berlapis

## Anti-pattern yang DILARANG
- ❌ Fix lalu bilang "silakan cek di localhost:8080" tanpa bukti screenshot
- ❌ Verifikasi hanya desktop padahal bug dilaporkan di mobile (atau sebaliknya)
- ❌ Menganggap `tsc --noEmit` + `npm run build` sukses = fix berhasil
  (build sukses ≠ visual benar)
