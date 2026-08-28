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
 * Ambil record kredensial yang sudah pernah dibuat untuk email pembeli.
 * @returns {Promise<object|null>} { username, password, licenseKey, uid, ... } atau null
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
      password: data.password,
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
 * 1) Cek duplikat by customer email di Firestore → reuse bila ada.
 * 2) Buat user Firebase Auth (email + password acak).
 * 3) Simpan record ke Firestore `settinx_licenses`.
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

  // Reuse kredensial bila pembeli yang sama pernah membeli.
  const existing = await findExistingLicense(email);
  if (existing) {
    console.log(
      `♻️  SettinX license ditemukan untuk ${email} — reuse license ${existing.licenseKey}`
    );
    return {
      username: existing.username,
      password: existing.password,
      licenseKey: existing.licenseKey,
      reused: true,
    };
  }

  const password = generatePassword();
  let userRecord;
  try {
    userRecord = await getAuth(_app).createUser({
      email,
      password,
      displayName: customerName ? String(customerName).slice(0, 100) : undefined,
    });
  } catch (e) {
    // User mungkin sudah ada di Firebase Auth tapi belum tercatat di Firestore.
    if (e.code === "auth/email-already-exists") {
      const user = await getAuth(_app).getUserByEmail(email);
      userRecord = user;
      console.warn(`⚠️  auth/email-already-exists utk ${email} — pakai user ${user.uid} yg sudah ada.`);
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
      password,
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