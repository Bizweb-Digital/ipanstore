// ─────────────────────────────────────────────────────────────────────────────
// Notifikasi pasca-pembayaran (LUNAS): WhatsApp (Fonnte) + Email konfirmasi.
// Dipanggil fire-and-forget setelah order status menjadi "PAID".
// ─────────────────────────────────────────────────────────────────────────────
import nodemailer from "nodemailer";

const WA_NOTIFY_ENABLED = String(process.env.WA_NOTIFY_ENABLED || "").toLowerCase() === "true";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || `IPAN STORE <${SMTP_USER}>`;

const paidEmailTransporter = SMTP_USER
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/**
 * Kirim notifikasi WhatsApp ke pembeli via Fonnte.
 * Hanya aktif jika WA_NOTIFY_ENABLED=true DAN FONNTE_TOKEN di-set.
 */
export async function sendWhatsAppNotify(order) {
  if (!WA_NOTIFY_ENABLED || !FONNTE_TOKEN) {
    console.log("ℹ️  WA notify dilewati (WA_NOTIFY_ENABLED/FONNTE_TOKEN belum diset).");
    return { ok: false, skipped: true };
  }
  const target = String(order?.customer_whatsapp || order?.customer_phone || "").trim();
  if (!target) {
    console.log("ℹ️  WA notify dilewati (nomor WhatsApp customer tidak ada).");
    return { ok: false, skipped: true };
  }

  const orderId = order.invoice_number || order.order_id || "-";
  const paket = order.package_name || order.item_name || order.service_name || "Paket IPAN STORE";
  const message =
    `Halo ${order.customer_name || "Kak"}! 👋\n\n` +
    `Pembayaran Anda di *IPAN STORE* telah kami terima ✅\n\n` +
    `📦 Paket: ${paket}\n` +
    `🧾 Order ID: ${orderId}\n` +
    `💰 Total: ${rupiah(order.amount)}\n` +
    `📌 Status: *LUNAS*\n\n` +
    `Detail pesanan & akses produk telah dikirim ke email Anda. Silakan cek inbox (atau folder spam).\n\n` +
    `Terima kasih sudah berbelanja di IPAN STORE! 🙏`;

  const r = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: FONNTE_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target, message }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.status === false) {
    throw new Error(`Fonnte gagal: HTTP ${r.status}`);
  }
  console.log(`📲 WA notify terkirim ke ${target} (order ${orderId})`);
  return { ok: true };
}

/**
 * Kirim email konfirmasi pembayaran (LUNAS) ke customer.
 */
export async function sendPaidEmail(order) {
  if (!paidEmailTransporter) {
    console.log("ℹ️  Email konfirmasi paid dilewati (SMTP belum dikonfigurasi).");
    return { ok: false, skipped: true };
  }
  const to = String(order?.customer_email || "").trim();
  if (!to || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(to)) {
    console.log("ℹ️  Email konfirmasi paid dilewati (email customer tidak valid).");
    return { ok: false, skipped: true };
  }

  const orderId = escapeHtml(order.invoice_number || order.order_id || "-");
  const paket = escapeHtml(order.package_name || order.item_name || order.service_name || "Paket IPAN STORE");
  const nama = escapeHtml(order.customer_name || "Pelanggan");
  const total = rupiah(order.amount);

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1f2937;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#111827;padding:24px 32px">
      <div style="font-size:20px;font-weight:800;color:#ffffff">IPAN STORE</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px">Konfirmasi Pembayaran</div>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:16px;font-weight:600;margin:0 0 6px">Halo, ${nama} 👋</p>
      <p style="color:#4b5563;font-size:14px;margin:0 0 20px">Pembayaran Anda telah kami terima. Terima kasih! ✅</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#6b7280">Order ID</td>
          <td style="padding:8px 0;text-align:right;font-family:monospace">${orderId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280">Paket</td>
          <td style="padding:8px 0;text-align:right">${paket}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280">Total Dibayar</td>
          <td style="padding:8px 0;text-align:right;font-weight:700">${total}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280">Status</td>
          <td style="padding:8px 0;text-align:right;color:#16a34a;font-weight:700">LUNAS</td>
        </tr>
      </table>
      <p style="font-size:12px;color:#6b7280;line-height:1.6;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px">
        Simpan email ini sebagai bukti pembayaran. Jika ada kendala, hubungi kami via WhatsApp di website IPAN STORE.<br/>
        © ${new Date().getFullYear()} IPAN STORE
      </p>
    </div>
  </div>`;

  await paidEmailTransporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `✅ Pembayaran Diterima — Order ${order.invoice_number || order.order_id || ""} LUNAS`,
    html,
  });
  console.log(`📧 Email konfirmasi paid terkirim ke ${to} (order ${orderId})`);
  return { ok: true };
}
