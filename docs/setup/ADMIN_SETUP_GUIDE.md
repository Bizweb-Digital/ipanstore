# IPAN STORE - Admin Panel Setup Guide (Supabase)

## 📌 Quick Overview

Admin panel IPAN Store dibangun dengan:
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Supabase Auth
- **Database**: Supabase (PostgreSQL + Realtime)
- **Backend**: Express.js (migrasi dari orders.json ke Supabase)
- **Theme**: Warm dark minimal gaming (tema website utama)

## 🚀 Setup Steps

### 1. Buat Project Supabase (Jika belum punya)

1. Buka [supabase.com](https://supabase.com/dashboard) dan login/sign up
2. Klik **"New Project"**
3. Pilih region: **Singapore** (terdekat dengan Indonesia)
4. Set project name: `ipanstore-prod`
5. Set database password: Simpan dengan baik!
6. Tunggu sampai project siap (~2 menit)

### 2. Dapatkan API Credentials

Setelah project dibuat:
1. Klik **Settings** (gear icon) → **API**
2. Salin **Project URL** → simpan di `.env` sebagai `VITE_SUPABASE_URL` (frontend) dan `SUPABASE_URL` (backend)
3. Salur **anon public key** → simpan di `.env` sebagai `VITE_SUPABASE_ANON_KEY` (frontend)
4. Salur **service role key** → simpan di `server/.env` sebagai `SUPABASE_SERVICE_ROLE_KEY` (BACKEND ONLY!)

⚠️ **JANGAN PERNAH expose service role key ke frontend!**

### 3. Jalankan SQL Migration

Di Supabase dashboard:
1. Klik **SQL Editor** (sidebar kiri)
2. Copy-paste isi file `supabase_migration.sql`
3. Klik **Run**
4. Tunggu hingga selesai (sekitar 10-15 query)

✅ Jika sukses, Anda akan melihat tabel berikut di **Table Editor**:
- `admin_users`
- `admin_audit_log`
- `services`
- `orders`
- `testimonials`
- `faqs`

### 4. Setup Admin User Pertama

Di **Table Editor** → pilih tabel `admin_users`:
1. Klik **"Add Row"**
2. Isi email admin Anda, contoh: `admin@ipanstore.id`
3. Klik **"Save"**
4. Sekarang buka Supabase Auth → **Users** → tambah user baru dengan email & password yang sama

Atau via SQL Editor:
```sql
-- Tambahkan email admin whitelist
INSERT INTO admin_users (email) VALUES ('admin@ipanstore.id');
```

Lalu di **Auth** → **Users** → **Invite User** atau **Sign up flow**.

### 5. Update Environment Variables

#### Frontend (.env):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend (server/.env):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ JANGAN commit kedua file ini ke git!

### 6. Migrasi Data Existing (Optional)

Jika sudah ada data di `server/orders.json`, migrasikan ke Supabase:

```bash
cd server
node migrations/migrate-json-to-supabase.js
```

Script ini akan:
- Baca semua order dari `orders.json`
- Import ke Supabase (dengan mapping status)
- Buat backup otomatis dari `orders.json`
- Skip duplicate invoice numbers

### 7. Start Development Server

```bash
# Frontend
npm run dev

# Backend (optional, kalau mau test migration)
cd server
npm run dev
```

### 8. Test Login Admin

1. Buka `http://localhost:5173/admin/login`
2. Masukkan email & password admin user yang sudah dibuat
3. Seharusnya redirect ke `/admin` dashboard

## 🔧 Troubleshooting

### "RLS policy denied" error
Ini berarti RLS belum aktif atau policy salah. Pastikan:
- Semua tabel sudah enable RLS (`ENABLE ROW LEVEL SECURITY`)
- Policy `admin_can_view_orders` dll sudah created
- Email admin ada di tabel `admin_users`

### "CORS error" saat call Supabase dari browser
Pastikan di Supabase Dashboard → **Settings** → **API** → **Allowed Origins**:
Tambahkan domain frontend Anda (misal: `http://localhost:5173`, `https://ipanstore.id`)

### Order tidak muncul di dashboard
1. Cek apakah webhook DOKU masih menulis ke `orders.json` instead of Supabase
2. Anda perlu update `server/index.js` untuk write ke Supabase (Phase 2)
3. Atau jalankan script migrate untuk import existing orders

### Admin tidak bisa login
1. Pastikan email ada di tabel `admin_users`
2. Pastikan user auth sudah dibuat di **Supabase Auth**
3. Coba reset password via Supabase dashboard

## 📁 File Structure Baru

```
src/
├── components/admin/
│   ├── AdminLayout.tsx          # Sidebar + navigation
│   └── ProtectedRoute.tsx       # Auth guard
├── pages/admin/
│   ├── Login.tsx                # /admin/login
│   ├── Dashboard.tsx            # /admin (revenue stats)
│   ├── Orders.tsx               # /admin/orders
│   ├── Services.tsx             # /admin/services
│   ├── Testimonials.tsx         # /admin/testimonials
│   ├── Faqs.tsx                 # /admin/faqs
│   └── Reports.tsx              # /admin/reports
├── lib/admin/
│   └── supabase.ts              # Supabase client (frontend)
├── hooks/
│   └── useAdminAuth.tsx         # Auth context
└── App.tsx                      # Route definitions

server/
├── lib/
│   └── supabaseAdmin.ts         # Supabase client (backend, service role)
├── migrations/
│   └── migrate-json-to-supabase.js
└── index.js                     # TODO: Migrate to Supabase in Phase 2
```

## 🎯 Next Steps (Phase 2-4)

See detailed roadmap in `PHASE_ROADMAP.md` or follow the sequential execution plan.

### Phase 2: Core Features
- Complete Orders management (list, filter, update status, email notifications)
- Connect real DOKU webhook to Supabase (stop writing orders.json)
- Revenue charts with Recharts

### Phase 3: Content Management
- Services CRUD (edit services dari dashboard)
- Testimonials approval workflow
- FAQ drag-drop management

### Phase 4: Reports & Polish
- Export CSV/Excel reports
- Audit logging
- Deploy & production testing

---

**Questions?** Check `LASTACTIVITY.md` for latest updates or open an issue.
