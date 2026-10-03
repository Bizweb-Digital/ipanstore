// ─────────────────────────────────────────────────────────────────────────────
// MIGRASI SATU-KALI: Firebase project lama (mati) → project BARU ipan-app-settinx-v1
//
// Cakupan (keputusan user):
//   - ipanasik123@gmail.com        → customer app_v1 nyata (order PAID/COMPLETED)
//   - muhammadrizvandysukma@gmail.com → akun uji (verifikasi end-to-end)
//   - tes@gmail.com                → DISKIP (order uji)
// User lama lain yang tidak tercatat di orders → dibuatkan manual nanti.
//
// Yang dilakukan per email:
//   1) assignSettinxLicense() → buat akun Firebase Auth di project BARU + doc
//      Firestore settinx_licenses (license key = UID baru, password di-rotate).
//   2) Kirim email kredensial baru (subject menyebut migrasi) via SMTP Gmail.
//   3) Update orders IPANAPPSETTINX* milik email itu: settinx_type='app_v1',
//      settinx_license_uid=UID baru.
//
// Idempotent: aman diulang (assignSettinxLicense reuse + rotate password).
// Usage:
//   node scripts/migrate-settinx-firebase-v2.mjs --dry-run   (tanpa perubahan)
//   node scripts/migrate-settinx-firebase-v2.mjs             (eksekusi)
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import nodemailer from "nodemailer";
import { assignSettinxLicense } from "../lib/settinxLicense.js";

const DRY_RUN = process.argv.includes("--dry-run");

const TARGETS = [
  { email: "ipanasik123@gmail.com", name: "Ipan Asik" },
  { email: "muhammadrizvandysukma@gmail.com", name: "Muhammad Rizvan" },
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || `IPAN STORE <${SMTP_USER}>`;
const SETTINX_DOWNLOAD_URL =
  process.env.SETTINX_DOWNLOAD_URL ||
  "https://drive.google.com/drive/folders/1oB2BIILhM-xrgseTw7yYSYwxurLayTvq?usp=sharing";

function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!SMTP_USER) missing.push("SMTP_USER");
  if (!SMTP_PASS) missing.push("SMTP_PASS");
  if (!process.env.SETTINX_FIREBASE_PROJECT_ID) missing.push("SETTINX_FIREBASE_PROJECT_ID");
  if (!process.env.SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE)
    missing.push("SETTINX_FIREBASE_SERVICE_ACCOUNT_FILE");
  if (missing.length) {
    throw new Error(`Env belum lengkap: ${missing.join(", ")}`);
  }
}

async function fetchOrdersForEmail(email) {
  const url =
    `${SUPABASE_URL}/rest/v1/orders` +
    `?customer_email=eq.${encodeURIComponent(email)}` +
    `&invoice_number=ilike.IPANAPPSETTINX*` +
    `&status=in.(PAID,COMPLETED)` +
    `&select=invoice_number,customer_name,status,amount,paid_at,settinx_license_uid`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateOrdersLicense(email, uid) {
  const url =
    `${SUPABASE_URL}/rest/v1/orders` +
    `?customer_email=eq.${encodeURIComponent(email)}` +
    `&invoice_number=ilike.IPANAPPSETTINX*` +
    `&status=in.(PAID,COMPLETED)`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ settinx_type: "app_v1", settinx_license_uid: uid }),
  });
  if (!res.ok) throw new Error(`Supabase update ${res.status}: ${await res.text()}`);
  return res.json();
}

function migrationEmailHtml({ customerName, invoiceNumber, credentials }) {
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0f0f10;color:#e4e4e7;border-radius:12px;overflow:hidden;border:1px solid #27272a">
    <div style="background:linear-gradient(135deg,#18181b,#3f3f46);padding:28px 32px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">IPAN <span style="color:#a1a1aa">STORE</span></div>
      <div style="font-size:12px;color:#a1a1aa;margin-top:2px">Migrasi Sistem — Kredensial Baru SettinX V1</div>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:16px;font-weight:600;margin:0 0 4px">Halo, ${esc(customerName || "Pelanggan")} 👋</p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;line-height:1.6">
        Kami telah memigrasikan sistem lisensi <strong style="color:#e4e4e7">IPAN APP SettinX V1</strong>
        ke server baru. Kredensial lama Anda <strong style="color:#fca5a5">tidak berlaku lagi</strong>.
        Berikut kredensial <strong style="color:#4ade80">BARU</strong> Anda (invoice ${esc(invoiceNumber)}):
      </p>
      <div style="background:#18181b;border:1px solid #3f3f46;border-radius:10px;padding:18px 20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#a1a1aa">ID Akun</td>
              <td style="padding:6px 0;text-align:right;font-family:monospace;color:#4ade80">${esc(credentials.username)}</td></tr>
          <tr><td style="padding:6px 0;color:#a1a1aa">Password</td>
              <td style="padding:6px 0;text-align:right;font-family:monospace;color:#4ade80">${esc(credentials.password)}</td></tr>
          <tr><td style="padding:6px 0;color:#a1a1aa">License Key</td>
              <td style="padding:6px 0;text-align:right;font-family:monospace;color:#4ade80;word-break:break-all">${esc(credentials.licenseKey)}</td></tr>
        </table>
      </div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:18px 20px;margin:22px 0">
        <div style="font-weight:700;margin-bottom:6px">📦 Download IPAN APP SettinX V1 (versi baru)</div>
        <div style="font-size:13px;color:#a1a1aa;margin-bottom:12px">Wajib download ulang aplikasi versi terbaru — versi lama tidak bisa login ke server baru.</div>
        <a href="${SETTINX_DOWNLOAD_URL}" style="display:inline-block;background:#f4f4f5;color:#18181b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">⬇️ Download SettinX V1</a>
      </div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.7">
        <strong style="color:#e4e4e7">Cara pakai:</strong> login dengan ID Akun + Password di atas,
        lalu masukkan License Key untuk aktivasi (1 akun = 1 perangkat).
      </div>
      <div style="font-size:12px;color:#8b8b93;margin-top:16px;border-top:1px solid #2a2a30;padding-top:12px">
        ⚠️ Simpan kredensial ini baik-baik. Jangan bagikan ke siapa pun.
      </div>
    </div>
  </div>`;
}

async function sendMigrationEmail(transporter, { to, customerName, invoiceNumber, credentials }) {
  const html = migrationEmailHtml({ customerName, invoiceNumber, credentials });
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Kredensial SettinX V1 BARU Anda (Migrasi Sistem) — " + invoiceNumber,
    html,
  });
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (tanpa perubahan)" : "EKSEKUSI"}`);
  console.log(`Firebase project target: ${process.env.SETTINX_FIREBASE_PROJECT_ID}`);
  assertEnv();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const summary = [];
  for (const target of TARGETS) {
    const email = target.email.toLowerCase();
    console.log(`\n── ${email} ──`);
    const orders = await fetchOrdersForEmail(email);
    console.log(`  Order PAID/COMPLETED ditemukan: ${orders.length}`);
    if (orders.length === 0 && email === TARGETS[0].email) {
      console.warn("  ⚠️ Customer nyata tanpa order?! skip.");
      continue;
    }
    const name = orders[0]?.customer_name || target.name;
    const invoice = orders[orders.length - 1]?.invoice_number || "MIGRASI-MANUAL";

    if (DRY_RUN) {
      console.log(`  [dry-run] assignSettinxLicense(${email}), invoice ref ${invoice}`);
      console.log(`  [dry-run] kirim email kredensial → ${email}`);
      console.log(`  [dry-run] update ${orders.length} orders → settinx_type=app_v1 + uid baru`);
      summary.push({ email, orders: orders.length, action: "dry-run" });
      continue;
    }

    // 1) Buat/reuse akun di project BARU (password selalu segar)
    const credentials = await assignSettinxLicense({
      customerEmail: email,
      customerName: name,
      invoiceNumber: invoice,
    });
    console.log(`  ✅ Akun siap: uid/licenseKey=${credentials.licenseKey} (reused=${credentials.reused})`);

    // 2) Email kredensial baru
    await sendMigrationEmail(transporter, {
      to: email,
      customerName: name,
      invoiceNumber: invoice,
      credentials,
    });
    console.log(`  📧 Email kredensial baru terkirim → ${email}`);

    // 3) Update orders
    if (orders.length > 0) {
      const updated = await updateOrdersLicense(email, credentials.licenseKey);
      console.log(`  🗄️  Orders diupdate: ${updated.length} baris → uid ${credentials.licenseKey}`);
    }
    summary.push({ email, orders: orders.length, uid: credentials.licenseKey, reused: credentials.reused });
  }

  console.log("\n═══ RINGKASAN ═══");
  for (const s of summary) console.log(JSON.stringify(s));
  console.log("Selesai.");
}

main().catch((e) => {
  console.error("MIGRASI GAGAL:", e);
  process.exit(1);
});
