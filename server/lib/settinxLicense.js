// ─────────────────────────────────────────────────────────────────────────────
// Auto-generate kredensial SettinX V1 di Firebase saat pembeli lunas.
//
// Aplikasi Ipan App SettinX V1 (D:\Ipan-AppSettinX-V1) login memakai:
//   username  = email akun Firebase Auth
//   password  = password akun Firebase Auth
//   license key = UID Firebase (`localId`) — diverifikasi oleh app saat login.
//
// Modul ini membuat akun Firebase Auth + menyimpan rekamannya di Firestore
// collection `settinx_licenses` (server-side via firebase-admin → melewati
// firestore.rules). Jika pembeli yang sama (email sama) membeli lagi, kredensial
// lama di-reuse agar tidak membuat akun ganda.
//
// SECURITY: password TIDAK pernah disimpan plaintext di Firestore — hanya
// passwordHash (SHA-256) untuk deteksi duplikat/audit. Password otoritatif tetap
// berada di Firebase Auth. Password hanya dihasilkan/dirotasi saat perlu,
// dikirim via email, lalu TIDAK disimpan.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import crypto from "crypto";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const COLLECTION = "settinx_licenses";

let _app = null;
let _db = null;
let _initialized = false;

/**
 * Inisialisasi firebase-admin satu kali dari env.
 * Mendukung: service-account JSON inline (SETTINX_FIREBASE_SERVICE_ACCOUNT)
 * atau path file (SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE), atau
 * GOOGLE_APPLICATION_CREDENTIALS (applicationDefault).
 */
export function initSettinxFirebase() {
  if (_initialized) return _app;
  const projectId = process.env.SETTINX_FIREBASE_PROJECT_ID || "ipan-app-settinx";

  const inlineJson = process.env.SETTINX_FIREBASE_SERVICE_ACCOUNT;
  const filePath = process.env.SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE;

  let credentials = null;
  if (inlineJson) {
    credentials = cert(JSON.parse(inlineJson));
  } else if (filePath && fs.existsSync(filePath)) {
    credentials = cert(filePath);
  }

  if (!credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credentials = applicationDefault();
  }

  if (!credentials) {
    _initialized = true;
    const err = new Error(
      "Firebase SettinX belum dikonfigurasi. Set SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE " +
        "atau SETTINX_FIREBASE_SERVICE_ACCOUNT di server/.env"
    );
    err.code = "SETTINX_FIREBASE_NOT_CONFIGURED";
    throw err;
  }

  _app =
    _app ||
    initializeApp({ credential: credentials, projectId }, "settinx-license");
  _db = getFirestore(_app);
  _initialized = true;
  return _app;
}

/**
 * Generate password acak kuat (huruf besar/kecil/angka, tanpa karakter ambigu).
 */
export function generatePassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

/**
 * Hash satu arah password (SHA-256) untuk deteksi duplikat / audit.
 * Bukan kredensial — tidak bisa di-balik untuk login. Hanya penanda.
 */
function hashPassword(pw) {
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

/**
 * Ambil record kredensial yang sudah pernah dibuat untuk email pembeli.
 * @returns {Promise<object|null>} { username, passwordHash, licenseKey, uid, docId, ... } atau null
 */
export async function findExistingLicense(customerEmail) {
  if (!customerEmail) return null;
  try {
    initSettinxFirebase();
    const email = String(customerEmail).trim().toLowerCase();
    const snap = await _db
      .collection(COLLECTION)
      .where("username", "==", email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      username: data.username,
      passwordHash: data.passwordHash || data.pid || null,
      licenseKey: data.uid || data.licenseKey || doc.id,
      uid: data.uid || doc.id,
      docId: doc.id,
    };
  } catch (e) {
    console.warn("settinxLicense.findExistingLicense error:", e.message);
    return null;
  }
}

/**
 * Buat akun kredensial SettinX untuk pembeli.
 * 1) Cek duplikat by customer email di Firestore → reuse bila ada (password di-rotate).
 * 2) Buat user Firebase Auth (email + password acak) / update password bila reuse.
 * 3) Simpan record ke Firestore `settinx_licenses` (tanpa password plaintext).
 *
 * @param {object} params
 * @param {string} params.customerEmail
 * @param {string} [params.customerName]
 * @param {string} [params.invoiceNumber]
 * @returns {Promise<{ username: string, password: string, licenseKey: string, reused: boolean }>}
 * @throws Error bila Firebase belum dikonfigurasi atau createUser gagal.
 */
export async function assignSettinxLicense({ customerEmail, customerName, invoiceNumber }) {
  const email = String(customerEmail || "").trim().toLowerCase();
  if (!email) throw new Error("customerEmail kosong untuk assignSettinxLicense.");

  initSettinxFirebase();
  const auth = getAuth(_app);

  // Reuse kredensial bila pembeli yang sama pernah membeli — password di-rotate
  // agar yang dikirim via email selalu segar (tidak mengirim ulang password lama
  // yang mungkin sudah tersimpan di inbox/log tangan ketiga).
  const existing = await findExistingLicense(email);
  if (existing) {
    const newPassword = generatePassword();
    await auth.updateUser(existing.uid, { password: newPassword });
    await _db
      .collection(COLLECTION)
      .doc(existing.docId)
      .update({
        passwordHash: hashPassword(newPassword),
        last_rotated_at: new Date().toISOString(),
        from_invoice: String(invoiceNumber || "").slice(0, 64),
      });
    console.log(
      `♻️  SettinX license ditemukan untuk ${email} — reuse license ${existing.licenseKey} (password di-rotate)`
    );
    return {
      username: existing.username,
      password: newPassword,
      licenseKey: existing.licenseKey,
      reused: true,
    };
  }

  const password = generatePassword();
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: customerName ? String(customerName).slice(0, 100) : undefined,
    });
  } catch (e) {
    // User mungkin sudah ada di Firebase Auth tapi belum tercatat di Firestore.
    if (e.code === "auth/email-already-exists") {
      const user = await auth.getUserByEmail(email);
      userRecord = user;
      await auth.updateUser(user.uid, { password });
      console.warn(`⚠️  auth/email-already-exists utk ${email} — pakai user ${user.uid} yg sudah ada (password di-rotate).`);
    } else {
      throw e;
    }
  }

  const uid = userRecord.uid; // license key = UID Firebase

  await _db.collection(COLLECTION).doc(uid).set(
    {
      uid,
      licenseKey: uid,
      username: email,
      passwordHash: hashPassword(password),
      customer_email: email,
      from_invoice: String(invoiceNumber || "").slice(0, 64),
      created_at: new Date().toISOString(),
      reused: false,
    },
    { merge: true }
  );

  console.log(
    `✨ SettinX license DIBUAT untuk ${email} → uid ${uid} (invoice ${invoiceNumber || "-"})`
  );
  return { username: email, password, licenseKey: uid, reused: false };
}

/**
 * Rotasi password akun SettinX yang SUDAH ADA (bukan membuat akun baru).
 * Dipakai endpoint /api/settinx/resend supaya email ulang selalu berisi
 * password segar, dan password lama tidak pernah dipakai lagi.
 *
 * @returns {Promise<{ username: string, password: string, licenseKey: string }>}
 */
export async function rotateSettinxPassword(customerEmail) {
  const email = String(customerEmail || "").trim().toLowerCase();
  if (!email) throw new Error("customerEmail kosong untuk rotateSettinxPassword.");
  initSettinxFirebase();

  const existing = await findExistingLicense(email);
  if (!existing) {
    const err = new Error(`License belum ada untuk ${email}`);
    err.code = "LICENSE_NOT_FOUND";
    throw err;
  }

  const newPassword = generatePassword();
  await getAuth(_app).updateUser(existing.uid, { password: newPassword });
  await _db
    .collection(COLLECTION)
    .doc(existing.docId)
    .update({
      passwordHash: hashPassword(newPassword),
      last_rotated_at: new Date().toISOString(),
    });

  console.log(`🔁 SettinX password di-rotate untuk ${email} (license ${existing.licenseKey})`);
  return { username: existing.username, password: newPassword, licenseKey: existing.licenseKey };
}