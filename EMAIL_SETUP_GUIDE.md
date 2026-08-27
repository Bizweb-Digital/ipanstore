# 📧 PANDUAN LENGKAP SETUP EMAIL OTOMATIS IPAN STORE

## ✅ Status Saat Ini
- [x] Template email SettinX siap (di `server/index.js` baris 366+)
- [x] Fungsi `sendSettinXEmail()` ada dan terintegrasi
- [x] Webhook & polling fallback trigger email otomatis
- [ ] SMTP credentials belum diisi (perlu App Password Gmail)

---

## 🔑 LANGKAH 1: Buat Gmail App Password (WAJIB!)

### A. Buka Halaman Security Google
1. Klik link ini: https://myaccount.google.com/security
2. Scroll ke bagian "Login to Google"
3. Klik **"2-Step Verification"** → pastikan aktif
4. Scroll lagi ke bawah → klik **"App passwords"**

### B. Generate Password Baru
1. Di kolom "App", pilih custom name → ketik: `IPAN STORE Backend`
2. Klik **Create**
3. Popup muncul dengan password 16 karakter seperti ini:
   ```
   abcd efgh ijkl mnop
   ```
4. **COPY SEGERA** password ini (Ctrl+C) sebelum menutup popup!
   ⚠️ Password hanya sekali terlihat — jika tertutup tidak bisa dibuka lagi

---

## ✏️ LANGKAH 2: Edit File `.env` Server

### A. Buka File
1. Buka Windows Explorer → ke folder: `D:\ipanstore\server`
2. Double-click file `**.env**` (bukan `.env.example`)
3. Klik kanan → Open with → Notepad atau VS Code

### B. Cari & Ganti Password
Scroll ke bawah hingga menemukan blok ini:
```ini
# -- Email otomatis (kirim link produk SettinX + invoice setelah lunas) --
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=muhammadrizvandysukma@gmail.com
SMTP_PASS=PASTE_APP_PASSWORD_16_CHAR_DISINI    ← BARIS INI YANG DIUBAH
MAIL_FROM=IPAN STORE <muhammadrizvandysukma@gmail.com>
```

Ganti baris `SMTP_PASS=` menjadi:
```ini
SMTP_PASS=abcdefghijklmnop                  ← paste tanpa spasi!
```

**Contoh benar:**
```ini
SMTP_PASS=jdkl abc12 xyzpqrs                 # ❌ SALAH (ada spasi)
SMTP_PASS=jdklabc12xyzpqrs                   # ✅ BENAR (tanpa spasi)
```

### C. Save & Close
1. Tekan Ctrl+S → Save
2. Tutup editor

---

## ▶️ LANGKAH 3: Restart Backend

### Opsi 1: Manual (Paling Mudah)
1. Tekan Alt+Tab untuk buka Task Manager
2. Tab Details → cari `node.exe` dengan command line `index.js`
3. Klik kanan → End Task
4. Buka VS Code → terminal → ketik:
   ```powershell
   cd D:\ipanstore\server
   npm run dev
   ```

### Opsi 2: Otomatis via Script (Rekomendasi)
Tutup semua terminal PowerShell yang membuka command, lalu ketik:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force }
Start-Sleep -Seconds 1
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd D:\ipanstore\server && npm run dev > ..\backend-local.log 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Output "Backend restarted!"
```

---

## 🧪 LANGKAH 4: Test Email Berfungsi

### A. Cek Log Backend
Buka file: `D:\ipanstore\backend-local.log`  
Cari baris yang berisi salah satu:
- ✅ `📧 Email SettinX TERKIRIM: your@email.com` → BERHASIL!
- ❌ `📧 Email SettinX GAGAL: invalid login` → password salah
- ❌ `SMTP belum dikonfigurasi` → SMTP_USER kosong

### B. Trigger Email Manual (Test Order)
Pastikan backend jalan di `http://localhost:5159`, buka browser → ketik:
```
http://localhost:8080/order
```

Isi form order:
- Nama: `Test Email User`
- Email: `test@example.com` (atau email asli Anda sendiri untuk test)
- Paket: Pilih apa saja
- Kode Promo: **HEMAT5** (opsional)

Klik **Bayar Sekarang** → QR muncul.

Karena ini localhost, webhook KlikQris tidak akan datang — tapi **polling otomatis tiap 8 detik akan mendeteksi pembayaran** dan trigger email.

Untuk mempercepat testing, kita bisa fake status PAID langsung via API call. TAPI... karena email butuh customer真实 email untuk dicek validitasnya, lebih baik test dengan order nyata yang baru dibuat di database.

### Alternatif: Test Via Direct Function Call
Jika ingin tes cepat tanpa order, jalankan script ini di VS Code terminal (pastikan backend jalan):
```javascript
// Paste di console Node.js REPL atau buat file test-email.js:
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'muhammadrizvandysukma@gmail.com',
    pass: 'YOUR_16_CHAR_PASSWORD_HERE'  // Ganti dengan app password
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.log('❌ ERROR:', err.message);
  } else {
    console.log('✅ SMTP CONNECTED!');
  }
});
```

---

## 📥 Kapan Email Terkirim Otomatis?

Email otomatis terkirim saat ** salah satu dari 2 kondisi ini**:

| Kondisi | Kapan Terjadi | Contoh |
|---------|---------------|--------|
| **Webhook masuk** | KlikQris server POST ke `https://api.ipanstore.id/api/klikqris-webhook` saat pembeli bayar | Live production only |
| **Polling detect PAID** | Frontend poll `/api/klikqris-status/:orderId` setiap 8 detik → backend detect status PAID → trigger fulfillment | Bisa lokal testing juga |

Email **TIDAK** terkirim saat:
- Order masih PENDING/belum dibayar
- Customer_email kosong/null
- Service bukan SettinX V1 (misal paket "Standart PC")
- SMTP belum diset atau password salah

---

## 🔍 Troubleshooting

### Issue 1: "SMTP_USER kosong"
**Penyebab**: Baris `SMTP_USER=` di `.env` tidak diisi  
**Fix**: Pastikan `SMTP_USER=muhammadrizvandysukma@gmail.com` ada & tidak null

### Issue 2: "Invalid login / BadCredentials"
**Penyebab**: App password salah/expired  
**Fix**: 
1. Buka kembali https://myaccount.google.com/security → App passwords
2. Hapus entry lama yang nama "IPAN STORE Backend"
3. Buat baru dari awal
4. Copy ulang password 16 char (tanpa spasi)
5. Replace di `.env`, restart backend

### Issue 3: Email masuk spam
**Penyebab**: SPF/DKIM record tidak set, atau email terlalu sering terkirim  
**Fix**: Gunakan domain sendiri untuk sender (bukan @gmail.com) — butuh konfigurasi DNS TXT record

### Issue 4: Link Download tidak muncul
**Penyebab**: Environment variable `SETTINX_DOWNLOAD_URL` tidak set  
**Default saat ini**: `https://drive.google.com/drive/folders/1oB2BIILhM-xrgseTw7yYSYwxurLayTvq?usp=sharing`  
**Ubah**: Tambah baris baru di `.env`:
```ini
SETTINX_DOWNLOAD_URL=https://drive.google.com/drive/folders/YOUR_FOLDER_ID
```

---

## 📋 Checklist Setelah Setup Selesai

- [ ] App password Gmail sudah dibuat di myaccount.google.com
- [ ] Password 16 char sudah di-copy ke clipboard
- [ ] File `.env` diedit dengan password yang benar
- [ ] Backend restarted
- [ ] Log backend menampilkan "Backend jalan" tanpa error SMTP
- [ ] Email test berhasil masuk inbox (cek spam folder juga)

Jika semua checklist ✓ → Siap untuk produksi!

---

## 🎓 Catatan Tambahan

1. **SMTP hanya untuk Gmail**? Tidak — bisa diganti provider lain:
   - Outlook: `smtp.office365.com:587` (TLS)
   - SendGrid: `smtp.sendgrid.net:587`
   - Mailgun: `smtp.mailgun.org:587`
   
   Cukup ganti 3 baris SMTP_* di `.env` sesuai provider.

2. **Rate limit Gmail**: Max ~100 emails/hari dengan akun gratis. Jika volume besar, upgrade ke Google Workspace atau gunakan dedicated email service (SendGrid, Mailgun).

3. **Email template** ada di `server/index.js` fungsi `sendSettinXEmail()` (baris 366-480). Bisa edit teks HTML/CSS sesuai branding.

4. **Security note**: Jangan pernah commit file `.env` ke Git! File ini sudah di-gitignore.

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah, kirim screenshot:
1. Console log backend (`D:\ipanstore\backend-local.log`)
2. Error message Gmail (jika ada)
3. Screenshot halaman myaccount.google.com/security saat setup App passwords

Good luck! 🚀
