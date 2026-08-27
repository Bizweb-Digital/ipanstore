/**
 * Integrasi Payment Gateway KlikQris — QRIS Dinamis
 * (https://klikqris.com/dokumentasi)
 */

import { BACKEND_URL } from "@/lib/doku";

export interface KlikQrisPaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  promoCode?: string;
}

export interface KlikQrisPaymentResponse {
  qrisUrl?: string;
  qrisImage?: string;
  totalAmount?: number;
  expiredAt?: string;
  orderId?: string;
  raw?: unknown;
  error?: string;
}

export interface KlikQrisStatusResult {
  status: string | null;
  paid: boolean;
  error?: string;
  raw?: unknown;
}

export const KLIKQRIS_CREATE_ORDER_PATH = "/api/klikqris-create-order";
export const KLIKQRIS_STATUS_PATH = "/api/klikqris-status";

export function isPaidStatus(status: string | null | undefined): boolean {
  const s = String(status || "").toUpperCase();
  return s === "PAID" || s === "SUCCESS";
}

/**
 * Buat transaksi QRIS dinamis via backend. Mengembalikan data QRIS
 * (bukan redirect) supaya QR tampil langsung di halaman order.
 */
export async function createKlikQrisPayment(
  req: KlikQrisPaymentRequest
): Promise<KlikQrisPaymentResponse> {
  if (!BACKEND_URL) {
    return { error: "Backend belum dikonfigurasi (VITE_BACKEND_URL kosong)." };
  }
  try {
    const res = await fetch(`${BACKEND_URL}${KLIKQRIS_CREATE_ORDER_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: req.amount,
        order_id: req.orderId,
        customer_name: req.customerName,
        customer_email: req.customerEmail,
        customer_phone: req.customerPhone,
        item_name: req.itemName,
        promo_code: req.promoCode,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.success === false) {
      return {
        error:
          (data.message as string) ||
          (data.error as string) ||
          `Backend error (HTTP ${res.status})`,
        raw: data,
      };
    }
    return {
      qrisUrl: (data.qris_url as string) || undefined,
      qrisImage: (data.qris_image as string) || undefined,
      totalAmount: Number(data.total_amount) || undefined,
      expiredAt: (data.expired_at as string) || undefined,
      orderId: (data.order_id as string) || undefined,
      raw: data.raw ?? data,
    };
  } catch (e) {
    console.warn("createKlikQrisPayment error:", e);
    return { error: e instanceof Error ? e.message : "Gagal menghubungi backend." };
  }
}

/**
 * Polling status dari backend (proxy ke API KlikQris).
 * Dipakai frontend untuk mendeteksi pembayaran lunas tanpa refresh.
 */
export async function checkKlikQrisStatus(orderId: string): Promise<KlikQrisStatusResult> {
  if (!BACKEND_URL) {
    return { status: null, paid: false, error: "Backend belum dikonfigurasi." };
  }
  try {
    const res = await fetch(`${BACKEND_URL}${KLIKQRIS_STATUS_PATH}/${encodeURIComponent(orderId)}`);
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.status === false) {
      return {
        status: null,
        paid: false,
        error: (data.message as string) || `Backend error (HTTP ${res.status})`,
        raw: data,
      };
    }
    const inner = data.data as Record<string, unknown> | undefined;
    const status = (inner?.status as string) || (data.status as string) || null;
    return { status, paid: isPaidStatus(status), raw: data };
  } catch (e) {
    console.warn("checkKlikQrisStatus error:", e);
    return { status: null, paid: false, error: e instanceof Error ? e.message : "Gagal cek status." };
  }
}