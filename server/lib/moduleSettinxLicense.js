// ─────────────────────────────────────────────────────────────────────────────
// Auto-generate kredensial "IPAN Module SettinX 1.1" di Supabase saat pembeli lunas.
//
// Berbeda dengan SettinX V1 (Firebase), aplikasi Ipan Module SettinX (Android)
// memakai Supabase (project ydoubotecwoamuyacqhw):
//   - Login  : ID (bukan email) + password → Supabase GoTrue (<id>@settinx.app)
//   - Lisensi: key XXXX-XXXX-...-XXXX di tabel public.licenses (status 'unused'),
//              di-redeem di dalam aplikasi → terikat 1 key = 1 device.
//
// Modul ini membuat akun Supabase Auth + baris license di tabel licenses
// memakai SERVICE ROLE key (bypass RLS, setara aksi admin). Dipakai oleh backend
// website saat order "Ipan Module SettinX 1.1" LUNAS.
//
// ATURAN WAJIB (mengikuti admin_create_user() di project Android):
//   - ID       : 3-32 karakter, hanya huruf/angka/titik/garis bawah/strip.
//   - Password : minimal 12 karakter, WAJIB kombinasi huruf + angka,
//                tidak boleh ada di blocklist, tidak boleh memuat ID.
//
// REPEAT PURCHASE (keputusan user): email yang sama beli lagi → buat AKUN BARU
// dengan ID berbeda (suffix -2, -3, dst.) + license key BARU. Akun lama TIDAK
// diubah (password lama tetap hidup) sehingga kedua akun tetap bisa dipakai.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const ID_EMAIL_DOMAIN = "@settinx.app";
const ID_REGEX = /^[a-zA-Z0-9_.-]+$/;

let _client = null;

/**
 * Inisialisasi Supabase client (service role) untuk project Module SettinX.
 * Env: MODULE_SETTINX_SUPABASE_URL + MODULE_SETTINX_SUPABASE_SERVICE_ROLE_KEY.
 * Melempar error berkode SETTINX_MODULE_SUPABASE_NOT_CONFIGURED bila belum diisi.
 */
export function initModuleSettinxSupabase() {
  if (_client) return _client;
  const url = process.env.MODULE_SETTINX_SUPABASE_URL;
  const serviceKey = process.env.MODULE_SETTINX_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    const err = new Error(
      "Supabase Module SettinX belum dikonfigurasi. Set MODULE_SETTINX_SUPABASE_URL " +
        "dan MODULE_SETTINX_SUPABASE_SERVICE_ROLE_KEY di server/.env"
    );
    err.code = "SETTINX_MODULE_SUPABASE_NOT_CONFIGURED";
    throw err;
  }
  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/**
 * Password acak kuat: 14 karakter, huruf besar/kecil + angka, tanpa karakter
 * ambigu (0/O/1/l/I). Selalu memuat minimal 1 huruf & 1 angka → lolos aturan
 * admin_create_user (min 12 karakter, kombinasi huruf + angka).
 */
export function generateModulePassword(length = 14) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = letters + digits;

  // Jamin minimal 1 huruf + 1 angka, sisanya acak dari himpunan gabungan.
  const pick = (set, n) => {
    let out = "";
    for (let i = 0; i < n; i++) out += set[crypto.randomInt(0, set.length)];
    return out;
  };
  const chars = (pick(letters, 1) + pick(digits, 1) + pick(all, Math.max(0, length - 2))).split("");
  // Acak posisi agar huruf/angka tidak selalu di depan.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * License key format sama persis dengan admin_generate_keys():
 * 128-bit acak → hex uppercase → 8 blok 4 karakter dipisah '-'.
 * Contoh: A1B2-C3D4-E5F6-7890-ABCD-EF12-3456-7890
 */
export function generateLicenseKey() {
  const hex = crypto.randomBytes(16).toString("hex").toUpperCase(); // 32 char
  const blocks = [];
  for (let i = 0; i < 32; i += 4) blocks.push(hex.slice(i, i + 4));
  return blocks.join("-");
}

/** Blocklist lokal ringan (mirror is_password_blocked) untuk jaga-jaga. */
function isWeakPassword(pw) {
  const p = String(pw || "").toLowerCase();
  if (!p) return true;
  if (/^(.)\1+$/.test(p)) return true; // semua karakter sama
  if (/(0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl)/.test(p))
    return true;
  return false;
}

/**
 * Turunkan kandidat ID dari email pembeli (bagian sebelum '@').
 * Dibersihkan ke huruf kecil + [a-z0-9_.-]; dipotong maks 32; min 3 char.
 * @returns {string} ID dasar (belum dijamin unik).
 */
export function baseIdFromEmail(customerEmail) {
  const raw = String(customerEmail || "").split("@")[0] || "";
  let id = raw.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  id = id.replace(/^[._-]+|[._-]+$/g, ""); // trim pemisah di ujung
  if (id.length > 32) id = id.slice(0, 32);
  if (id.length < 3) id = "user" + crypto.randomInt(1000, 9999).toString();
  if (!ID_REGEX.test(id)) id = "user" + crypto.randomInt(1000, 9999).toString();
  return id;
}

/**
 * Buat akun + license untuk pembeli "Ipan Module SettinX 1.1".
 *
 * @param {object} params
 * @param {string} params.customerEmail
 * @param {string} [params.customerName]
 * @param {string} [params.invoiceNumber]
 * @returns {Promise<{ id: string, username: string, password: string, licenseKey: string, uid: string }>}
 * @throws Error bila Supabase belum dikonfigurasi atau pembuatan gagal.
 */
export async function assignModuleSettinxLicense({ customerEmail, customerName, invoiceNumber }) {
  const email = String(customerEmail || "").trim().toLowerCase();
  if (!email) throw new Error("customerEmail kosong untuk assignModuleSettinxLicense.");

  const supabase = initModuleSettinxSupabase();
  const baseId = baseIdFromEmail(email);

  // Cari ID yang belum terpakai: coba baseId, lalu baseId-2, baseId-3, ...
  // (mendukung repeat purchase → akun baru, akun lama tidak disentuh).
  let created = null;
  let lastErr = null;
  for (let n = 0; n < 50; n++) {
    const suffix = n === 0 ? "" : `-${n + 1}`;
    let candidate = `${baseId}${suffix}`;
    if (candidate.length > 32) candidate = candidate.slice(0, 32 - suffix.length) + suffix;
    if (!ID_REGEX.test(candidate) || candidate.length < 3) continue;

    const accountEmail = `${candidate}${ID_EMAIL_DOMAIN}`;

    // Pastikan password tidak memuat ID (aturan server) & tidak lemah.
    let password = generateModulePassword();
    let guard = 0;
    while ((password.toLowerCase().includes(candidate.toLowerCase()) || isWeakPassword(password)) && guard < 10) {
      password = generateModulePassword();
      guard++;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: accountEmail,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: customerName ? String(customerName).slice(0, 100) : undefined,
        from_invoice: String(invoiceNumber || "").slice(0, 64),
        customer_email: email,
      },
    });

    if (!error && data?.user?.id) {
      created = { id: candidate, username: accountEmail, password, uid: data.user.id };
      break;
    }

    lastErr = error;
    // Email/ID sudah dipakai → coba suffix berikutnya. Error lain → berhenti.
    const msg = String(error?.message || "").toLowerCase();
    const alreadyExists =
      msg.includes("already") || msg.includes("registered") || msg.includes("exists") || error?.status === 422;
    if (!alreadyExists) {
      throw new Error(`Gagal membuat akun Module SettinX (${candidate}): ${error?.message || "unknown"}`);
    }
  }

  if (!created) {
    throw new Error(
      `Tidak bisa menemukan ID unik untuk ${email} (50 percobaan). Error terakhir: ${lastErr?.message || "-"}`
    );
  }

  // Generate license key unik (retry bila tabrakan — praktis mustahil).
  let licenseKey = generateLicenseKey();
  let licenseSaved = false;
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase.from("licenses").insert({
      key: licenseKey,
      status: "unused",
      name: created.id,
    });
    if (!error) {
      licenseSaved = true;
      break;
    }
    // 23505 = unique_violation → coba key lain.
    if (error.code === "23505") {
      licenseKey = generateLicenseKey();
      continue;
    }
    throw new Error(`Gagal menyimpan license key: ${error.message}`);
  }
  if (!licenseSaved) {
    throw new Error("Gagal menyimpan license key: 5 kali tabrakan key (tidak normal).");
  }

  console.log(
    `✨ Module SettinX license DIBUAT untuk ${email} → ID ${created.id} (key ${licenseKey}, invoice ${invoiceNumber || "-"})`
  );

  return {
    id: created.id,
    username: created.username,
    password: created.password,
    licenseKey,
    uid: created.uid,
  };
}
