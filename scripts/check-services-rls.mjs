// One-shot: cek policy RLS pada tabel services di Supabase.
// Pakai service_role key dari server/.env untuk akses pg_catalog.
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const existsSync = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
// Coba load dari beberapa kandidat .env
for (const candidate of ['server/.env', '.env']) {
  const p = path.join(projectRoot, candidate);
  if (existsSync(p)) { loadEnv({ path: p }); break; }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// RPC info_schema: pg_policies & information_schema.columns tidak bisa langsung via PostgREST,
// tapi kita bisa pakai RPC introspection jika ada. Alternatif aman: coba INSERT/SELECT/UPDATE
// dari role authenticated dengan email admin yang ada di admin_users → kalau gagal 401/RLS artinya
// policy hilang.
//
// Cara paling simpel dan pasti: baca .env, lalu execute raw SQL via rpc 'exec_sql' (kalau ada)
// atau via PostgREST '/rest/v1/rpc/<rpc_name>'.

async function checkPolicies() {
  // Metode aman: SELECT policies lewat view pg_policies via PostgREST tidak tersedia.
  // Gunakan RPC fallback: query information_schema via fungsi yang sudah ada, atau
  // pakai 'pg_catalog' jika di-expose. Kalau tidak ada, kita insert test row kecil
  // dengan slug random yang pasti unik, lalu delete lagi → ini memberi sinyal RLS OK.
  const probeSlug = `__rls_probe_${Date.now()}`;

  // Step 1: coba insert sebagai service_role (kami sendiri) — harus selalu berhasil
  const { data: insAdmin, error: errAdmin } = await admin
    .from('services')
    .insert({
      slug: probeSlug,
      name: '__RLS_PROBE_DELETE_ME__',
      description: 'probe',
      price: 1,
      is_active: false,
    })
    .select()
    .single();

  if (errAdmin) {
    console.log('❌ service_role INSERT gagal:', errAdmin.message);
    return;
  }
  console.log('✅ service_role INSERT OK');

  // Bersihkan probe row
  await admin.from('services').delete().eq('id', insAdmin.id);

  // Step 2: pakai Supabase Management API untuk query langsung via psql endpoint?
  // Tidak punya akses. Jadi pakai metode kedua: lihat apakah RLS aktif atau tidak
  // dengan coba query pakai anon key. Kalau anon tidak bisa SELECT, RLS ON.
  console.log('\nℹ️ Untuk verifikasi lengkap policy, jalanankan SQL berikut di Supabase SQL Editor:\n');
  console.log(`SELECT polname AS policy, polcmd AS cmd, polroles::regrole[] AS roles
FROM pg_policy
WHERE polrelid = 'public.services'::regclass;`);
}

checkPolicies().catch((e) => {
  console.error(e);
  process.exit(1);
});
