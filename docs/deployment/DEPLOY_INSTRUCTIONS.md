# 🚀 Panduan Deploy Update Backend ke Production

## 📍 Kapan Harus Deploy Ini?

Deploy ketika Anda butuh fitur-fitur berikut:
- ✅ **QRIS Dinamis KlikQris** (scan QR langsung bayar)
- ✅ **Email otomatis terkirim** saat pembeli bayar SettinX V1
- ✅ **Kode promo/diskon HEMAT5** aktif & aman
- ✅ **Polling fallback**: Jika webhook KlikQris gagal datang, polling tetap kirim email

## 🔧 Cara Deploy (Pilih Satu Metode)

### OPSI A: Via SSH + PM2 (Server Sendiri)

1. **Login ke server** via Tailscale/SSH:
   ```bash
   ssh root@<server-ip>
   cd /home/ipanstore/backend
   ```

2. **Pull code terbaru**:
   ```bash
   git pull origin main
   ```

3. **Restart aplikasi dengan PM2**:
   ```bash
   pm2 restart ipanstore-backend
   ```

4. **Cek log apakah berhasil**:
   ```bash
   pm2 logs ipanstore-backend --lines 20
   ```
   
   Cari baris:
   - ✅ "Backend IPAN STORE jalan di http://localhost:5159"
   - ❌ Error → cek detail error

5. **Test endpoint baru**:
   ```bash
   curl https://api.ipanstore.id/api/klikqris-create-order \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"order_id":"TEST","amount":1000,"customer_name":"Test","customer_email":"test@test.com"}'
   ```
   
   Harusnya return JSON seperti:
   ```json
   {"success":true,"order_id":"...","qris_url":"..."}
   ```

---

### OPSI B: Via Docker Compose (Jika Pakai Container)

1. **SSH ke server**:
   ```bash
   ssh root@<server-ip>
   ```

2. **Pindah ke folder docker** (atau sesuai lokasi):
   ```bash
   cd /path/to/ipanstore/docker-compose.yml
   ```

3. **Pull code terbaru**:
   ```bash
   git pull origin main
   ```

4. **Rebuild & restart container**:
   ```bash
   docker compose up -d --no-cache ipanstore-backend
   ```

5. **Cek log**:
   ```bash
   docker compose logs -f ipanstore-backend --tail 20
   ```

6. **Verifikasi**:
   ```bash
   curl https://api.ipanstore.id/api/klikqris-create-order ...
   ```

---

### OPSI C: File Upload Manual (Via FTP/SFTP)

Jika tidak bisa SSH/Pull GitHub:

1. **Siapkan file dari komputer Anda**:
   - `D:\ipanstore\server\index.js` (latest version)
   - `D:\ipanstore\server\.env.example` (update template SMTP)
   - Folder `sql_patches/` (untuk patch database)

2. **Upload ke server**:
   - Buka FileZilla / WinSCP
   - Login ke server via SFTP
   - Navigasi ke `/path/to/ipanstore/server/`
   - **Backup dulu file lama** (`cp index.js index.js.backup`)
   - Upload `index.js` terbaru
   - Upload `.env` (jika belum ada kredensial)

3. **Restart aplikasi**:
   ```bash
   # Jika pakai PM2:
   pm2 restart ipanstore-backend
   
   # Jika pakai Nodemon:
   Ctrl+C  # stop old process
   npm run dev
   
   # Jika pakai systemd:
   sudo systemctl restart ipanstore-backend
   ```

---

## ⚠️ HAL PENTING SEBELUM DEPLOY!

### 1. Pastikan File `.env` Lengkap

Checklist wajib ada di `.env`:

```ini
# Email (Wajib untuk kirim produk SettinX setelah bayar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=muhammadrizvandysukma@gmail.com
SMTP_PASS=<app_password_16_char_tanpa_spasi>
MAIL_FROM="IPAN STORE <muhammadrizvandysukma@gmail.com>"

# KlikQris API (Payment Gateway QRIS)
KLIKQRIS_API_KEY=mg1nxeJQGBspXHBmTiPbC4DPsVaxScLwam9N95Ov
KLIKQRIS_ID_MERCHANT=178785053413
KLIKQRIS_BASE_URL=https://klikqris.com/api
KLIKQRIS_CALLBACK_URL=https://api.ipanstore.id/api/klikqris-webhook

# Supabase Database
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

🔴 **Jika SMTP kosong/email salah → TIDAK AKAN KIRIM EMAIL PRODUK SETELAH BAYAR!**

### 2. Patch Database Dulu (Opsional)

Untuk promo code sistem yang lebih aman, jalankan SQL patch ini di Supabase:

**File**: `sql_patches/supabase_patch_gabungan.sql`

Isi editor SQL di Supabase Dashboard dengan isi file tersebut, lalu Run. Verifikasi:
```sql
SELECT proname FROM pg_proc WHERE proname IN ('consume_promo_code','validate_promo_code');
```

Harusnya muncul:
```
consume_promo_code
validate_promo_code
```

Jika sudah ada → sudah ter-patch. Skip langkah ini.

---

## 📊 Setelah Deploy, Test Apa Saja?

### Test 1: Endpoint Baru Berfungsi?
```bash
curl https://api.ipanstore.id/api/klikqris-create-order \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "order_id":"DEPLOY-TEST",
    "amount":20000,
    "customer_name":"Tester",
    "customer_email":"tester@example.com",
    "item_name":"IPAN APP SettinX V1",
    "promo_code":"HEMAT5"
  }'
```

**Harus return**: HTTP 200 + JSON dengan `qris_url`, `signature`, dll

### Test 2: Webhook Masuk ke Server Prod?
Di server, cek log:
```bash
pm2 logs ipanstore-backend | grep -i webhook
```

Saat test pembayaran live (sebagai pembeli), log harus muncul:
```
Webhook KlikQris diterima: order_id=XXX status=PAID
Mengirim email SettinX ke tester@example.com
Email SettinX TERKIRIM: tester@example.com
```

### Test 3: Email Terkirim Sungguhan?

Buka inbox email test yang tadi digunakan → cek apakah email dari IPAN STORE masuk berisi:
- Link download Google Drive SettinX V1
- Invoice dengan diskon HEMAT5
- Instruksi aktivasi via WhatsApp

---

## 🔍 Troubleshooting

### Issue: "Error creating order with KlikQris"
**Penyebab**: 
- API key klikqris salah
- Merchant ID salah format
- Server IP tidak whitelisted di dashboard KlikQris

**Solusi**: Cek log error → verify `KLIKQRIS_API_KEY` dan `KLIKQRIS_ID_MERCHANT` di `.env`

### Issue: "Email tidak terkirim meskipun payment confirmed"
**Penyebab**:
- SMTP USER/Pass salah/expired
- Gmail app password kedaluwarsa
- Email customer kosong di database

**Solusi**:
1. Generate ulang app password di myaccount.google.com/security
2. Update `.env`, restart backend
3. Test dengan script test-email.js di repo

### Issue: Polling tidak detect PAID
**Penyebab**: Frontend terlalu lambat refresh polling interval

**Solusi**: Di halaman Order.tsx, interval default 8 detik cukup cepat. Bisa dipercepat jadi 3 detik jika perlu real-time banget.

---

## 📝 Checklist Final Sebelum Go Live

- [ ] Git pull successful
- [ ] File `.env` ada dan SMTP configured dengan benar
- [ ] Aplikasi restart tanpa error
- [ ] Log menunjukkan "Backend IPAN STORE jalan di port 5159"
- [ ] Endpoint `/api/klikqris-create-order` merespons 200 OK
- [ ] Test order dummy berhasil generate QRIS
- [ ] Simulasi webhook PAID → log email terkirim
- [ ] Email sungguhan masuk inbox pembeli
- [ ] Promo code HEMAT5 valid & discount dihitung benar

Jika semua ✓ → **PRODUCTION READY!** 🚀

---

## 🎯 Next Step

Setelah deploy sukses, Anda tinggal:
1. **Monitor webhook logs** di production
2. **Verify pembayaran live** berfungsi normal
3. **Track delivery rate** email (ada yang masuk spam?)
4. **Scale up server** jika traffic tinggi (add SSL/TLS, load balancer, dll)

Good luck!
