# Setup Cashi.id — Page "Order" IPAN STORE

Panduan dari nol sampai pembayaran QRIS / VA / e-Wallet aktif.
Berdasarkan menu asli dashboard Cashi.id.

---

## RINGKASAN ALUR

```
Pengunjung pilih paket → isi Nama/Email → klik "Bayar Sekarang"
        ↓
Website memanggil API Cashi (/api/create-order) pakai API Key Anda
        ↓
Cashi membalas link pembayaran (QRIS / VA / e-Wallet)
        ↓
Pengunjung diarahkan ke link itu → bayar → selesai
```

> ❗ **TIDAK PERLU KYC / upload KTP.** Cashi.id tidak punya menu identitas.
> Cukup daftar → verifikasi OTP → ambil API key → aktifkan QRIS → langsung bisa terima pembayaran.

---

## LANGKAH 1 — Daftar & Verifikasi Akun

1. Buka **https://cashi.id** → **Daftar / Register**.
2. Isi **email + password**.
3. **Verifikasi OTP** (via email / WhatsApp).
4. Login → masuk **Dashboard**.

---

## LANGKAH 2 — Aktifkan Metode Pembayaran

Di sidebar dashboard:

1. Buka **"Metode Pembayaran"**.
2. Aktifkan:
   - **QRIS** (paling mudah — 1 QR untuk semua e-wallet & m-banking).
   - **Virtual Account** (BCA, BRI, BNI, Mandiri, dll.) — opsional.
   - **E-Wallet** (DANA, OVO, GoPay, ShopeePay) — opsional.
3. (Opsional) Cek **"Terminal QRIS"** untuk melihat QR yang dihasilkan.

---

## LANGKAH 3 — Ambil API Key & Secret Key

> 📍 **Di dashboard Anda (lihat screenshot), API Key ada di menu "Pengaturan"**
> (item paling bawah, ada tanda panah `>` = punya submenu).
> Buka **Pengaturan → Developer / API Keys** untuk melihat & menyalin key.

1. Buka **Pengaturan** → cari bagian **API Key** dan **Secret Key**.
2. Salin keduanya:
   - **API Key** → untuk membuat order pembayaran.
   - **Secret Key** → untuk verifikasi webhook (konfirmasi pembayaran).
3. Untuk melihat **cara pakai endpoint-nya**, buka menu **"Dokumentasi API"**.

> Simpan key ini baik-baik. **Jangan** taruh di file yang di-upload ke git publik.

---

## LANGKAH 4 — (Opsional) Set Webhook

Agar website tahu otomatis saat pembayaran BERHASIL:

1. Buka menu **"Webhooks"** di sidebar.
2. Isi URL webhook Anda, mis. `https://domain-anda.com/api/cashi-webhook`.
3. Simpan. Cashi mengirim **signature HMAC-SHA256** — verifikasi pakai **Secret Key**.

**Contoh verifikasi (PHP):**
```php
$secret_key = "YOUR_SECRET_KEY";
$payload = file_get_contents("php://input");
$signature = $_SERVER["HTTP_X_SIGNATURE"];
$expected = hash_hmac("sha256", $payload, $secret_key);
if (hash_equals($expected, $signature)) {
    // Pembayaran VALID → proses order
}
```

> Webhook butuh URL publik (backend). Untuk front-end statis tanpa backend,
> Anda bisa cek status order manual di menu **"Cek Order"** / **"Transaksi"**.

---

## LANGKAH 5 — Hubungkan ke Website

### 🔵 CARA A — Paling Cepat (Payment Link / Produk, tanpa backend)

Cocok kalau tombol "Bayar" cukup mengarah ke halaman pembayaran.

1. Di dashboard, buka **"Buat Produk"** → buat produk untuk tiap paket:
   - SET PC — Rp 50.000
   - Custom FF & Emulator — Rp 20.000
   - STANDART — Rp 50.000
   - ELITE — Rp 100.000
   - EXTREME — Rp 150.000
   - ANTICHEAT LAGA — Rp 100.000
   - IPAN APP SettinX — Rp 75.000
2. Salin link pembayaran masing-masing produk.
3. Buka **`src/lib/cashi.ts`** dan isi:

```ts
export const CASHI_PAYMENT_LINKS: Record<string, string> = {
  "set-pc":          "https://cashi.id/pay/xxxx-set-pc",
  "custom-ff":       "https://cashi.id/pay/xxxx-custom-ff",
  "standart":        "https://cashi.id/pay/xxxx-standart",
  "elite":           "https://cashi.id/pay/xxxx-elite",
  "extreme":         "https://cashi.id/pay/xxxx-extreme",
  "anti-cheat-laga": "https://cashi.id/pay/xxxx-anticheat",
  "app-settinx":     "https://cashi.id/pay/xxxx-settinx",
};
```

4. Selesai. Tombol "Bayar Sekarang" langsung redirect ke pembayaran. **Tanpa API key, tanpa backend.**

---

### 🟢 CARA B — Aman & Profesional (API + backend ringan)

API Key tidak boleh terekspos di browser, jadi pemanggilan `create-order` idealnya lewat backend kecil (serverless function Vercel/Netlify — gratis).

#### B1. Buat file `.env` di root project:
```env
VITE_CASHI_API_KEY=sk_live_xxxxxxxxxxxxxxxx
VITE_CASHI_BASE_URL=https://cashi.id
```
> Catatan: variabel `VITE_*` ikut ter-bundle ke browser. Untuk keamanan penuh,
> panggil API lewat serverless function dan simpan key di env server (tanpa `VITE_`).

#### B2. Endpoint yang dipakai (sudah terpasang di `src/lib/cashi.ts`):
```
POST https://cashi.id/api/create-order
Headers:
  x-api-key: YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "amount": 75000,
    "order_id": "IPAN-APP-SETTINX-1699999999",
    "customer_name": "Nama Pembeli",
    "customer_email": "email@pembeli.com",
    "customer_phone": "08xxxxxxxxxx",
    "item_name": "IPAN STORE - IPAN APP SettinX V1"
  }
```
Cashi membalas JSON berisi **URL pembayaran** → website me-redirect otomatis.

#### B3. Contoh Serverless Function (Vercel) — `api/create-order.ts`:
```ts
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const r = await fetch("https://cashi.id/api/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CASHI_API_KEY, // simpan di env server, BUKAN VITE_
    },
    body: JSON.stringify(req.body),
  });
  const data = await r.json();
  res.status(r.status).json(data);
}
```
Lalu arahkan `CASHI_BASE_URL` di `src/lib/cashi.ts` ke function ini dan **hapus** pengiriman API key dari browser.

---

## LANGKAH 6 — Testing

1. Jalankan: `npm run dev` → buka `http://localhost:8080/order`.
2. Pilih paket → isi Nama & Email → **Bayar Sekarang**.
3. Sudah dikonfigurasi → diarahkan ke halaman pembayaran Cashi.
4. Belum dikonfigurasi → otomatis **fallback ke WhatsApp** (order tetap jalan).
5. Uji transaksi kecil dulu sebelum dipakai publik.

---

## CHECKLIST SEBELUM LIVE

- [ ] Akun Cashi terdaftar & OTP terverifikasi
- [ ] QRIS aktif (menu "Metode Pembayaran")
- [ ] API Key & Secret Key disalin (menu "Pengaturan → Developer")
- [ ] Produk / Payment link dibuat (Cara A) ATAU backend API jalan (Cara B)
- [ ] Webhook diset (opsional)
- [ ] Rekening penarikan diisi (menu "Penarikan" → saat mau withdraw)
- [ ] Test transaksi kecil → dana masuk

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| Tombol Bayar selalu ke WhatsApp | API key / payment link belum diisi di `src/lib/cashi.ts` |
| HTTP 401/403 | API key salah → cek di Pengaturan → Developer |
| "tidak berisi URL pembayaran" | Nama field respons beda → lihat `raw` di console, sesuaikan di `createCashiPayment()` |
| Pembayaran sukses tapi order tak tercatat | Webhook belum diset / signature tidak cocok → cek Secret Key |
| CORS error di browser | API dipanggil langsung dari browser → wajib lewat backend (Cara B) |

---

## FILE TERKAIT
- `src/lib/cashi.ts` → logika integrasi (endpoint, API key, payment link)
- `src/pages/Order.tsx` → halaman checkout
- `.env` (buat sendiri dari `.env.example`) → menyimpan API key
