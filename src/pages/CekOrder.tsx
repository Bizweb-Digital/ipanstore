import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Loader2,
  Package,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import PageBackground from "@/components/effects/PageBackground";
import Reveal from "@/components/effects/Reveal";
import { AuroraText } from "@/components/ui/aurora-text";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

/* ─── Tipe data ─────────────────────────────────────────────────────────── */
interface OrderStatus {
  orderId: string;
  status: string;
  packageName: string;
  paymentMethod: string;
  createdAt: string;
}

type FetchState = "idle" | "loading" | "success" | "error";
type ErrorKind = "notfound" | "generic" | null;

/* ─── Warna badge berdasarkan status ────────────────────────────────────── */
const getStatusStyle = (status: string) => {
  const s = status.toLowerCase();
  if (["paid", "success", "settled"].includes(s)) {
    return {
      label: status.toUpperCase(),
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
      Icon: CheckCircle2,
    };
  }
  if (["failed", "expired", "cancel", "cancelled"].includes(s)) {
    return {
      label: status.toUpperCase(),
      classes: "bg-rose-500/15 text-rose-400 border-rose-500/40",
      Icon: XCircle,
    };
  }
  // default: pending / menunggu pembayaran
  return {
    label: status.toUpperCase(),
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    Icon: Clock,
  };
};

/* ─── Instruksi lanjutan per status ─────────────────────────────────────── */
const getStatusInstruction = (status: string) => {
  const s = status.toLowerCase();
  if (["paid", "success", "settled"].includes(s)) {
    return "Pembayaran kamu sudah berhasil. Cek email kamu (termasuk folder spam) untuk detail produk / lisensi.";
  }
  if (["failed", "expired", "cancel", "cancelled"].includes(s)) {
    return "Order ini tidak dapat dilanjutkan. Silakan buat order baru jika kamu masih ingin melanjutkan pembelian.";
  }
  return "Order kamu masih menunggu pembayaran. Selesaikan pembayaran kamu sebelum batas waktu berakhir.";
};

const formatTanggal = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CekOrder = () => {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("orderId");

  const [orderId, setOrderId] = useState("");
  const [state, setState] = useState<FetchState>("idle");
  const [result, setResult] = useState<OrderStatus | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const autoSubmitRef = useRef(false);

  const fetchStatus = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setInputError("Order ID tidak boleh kosong.");
      return;
    }
    setInputError(null);
    setState("loading");
    setErrorKind(null);
    setResult(null);

    if (!BACKEND_URL) {
      setState("error");
      setErrorKind("generic");
      return;
    }

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/order-status/${encodeURIComponent(trimmed)}`
      );
      if (res.status === 404) {
        setState("error");
        setErrorKind("notfound");
        return;
      }
      if (!res.ok) {
        setState("error");
        setErrorKind("generic");
        return;
      }
      const data = (await res.json()) as OrderStatus;
      setResult(data);
      setState("success");
    } catch {
      setState("error");
      setErrorKind("generic");
    }
  }, []);

  // Auto-fill + auto-submit dari query param ?orderId=...
  useEffect(() => {
    if (orderIdParam && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      setOrderId(orderIdParam);
      void fetchStatus(orderIdParam);
    }
  }, [orderIdParam, fetchStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    void fetchStatus(orderId);
  };

  const handleRetry = () => {
    void fetchStatus(orderId);
  };

  const statusStyle = result ? getStatusStyle(result.status) : null;

  return (
    <Layout>
      <SEOHead
        title="Lacak Order | IPAN STORE"
        description="Cek status order kamu di IPAN STORE dengan memasukkan Order ID. Lihat status pembayaran, paket, dan tanggal order."
      />

      {/* Header */}
      <section className="relative pt-28 pb-10 md:pt-32 md:pb-12 overflow-hidden">
        <PageBackground opacity={0.18} />
        <div className="container mx-auto px-4 relative z-10">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="section-subheading">Cek Status Pesanan</span>
            <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-4">
              Lacak <AuroraText>Order</AuroraText>
            </h1>
            <p className="max-w-xl mx-auto text-zinc-400 leading-relaxed">
              Masukkan Order ID yang kamu terima saat checkout untuk melihat
              status pembayaran dan detail pesanan kamu.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Form + Hasil */}
      <section className="relative pb-24">
        <PageBackground opacity={0.12} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl mx-auto">
            {/* Form pencarian */}
            <form onSubmit={handleSubmit} className="gaming-card p-6 md:p-7">
              <label
                htmlFor="cek-order-id"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Order ID
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="cek-order-id"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setInputError(null);
                  }}
                  placeholder="IPAN-XXXXXX"
                  autoComplete="off"
                  className="flex-1 rounded-lg bg-[#131314] border border-white/16 px-4 py-2.5 text-sm font-mono text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/60"
                />
                <Button
                  type="submit"
                  disabled={state === "loading"}
                  className="shrink-0"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Melacak...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Lacak Order
                    </>
                  )}
                </Button>
              </div>
              {inputError && (
                <p className="mt-2 text-[11px] text-red-400">{inputError}</p>
              )}
              <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                Order ID bisa kamu temukan di halaman pembayaran atau email
                konfirmasi setelah checkout.
              </p>
            </form>

            {/* Hasil sukses */}
            {state === "success" && result && statusStyle && (
              <div className="gaming-card p-6 md:p-7 mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <span className="font-mono text-sm text-zinc-400">
                    {result.orderId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${statusStyle.classes}`}
                  >
                    <statusStyle.Icon className="h-3.5 w-3.5" />
                    {statusStyle.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                        Paket
                      </p>
                      <p className="text-sm font-medium text-[#F4F4F5]">
                        {result.packageName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                        Metode Pembayaran
                      </p>
                      <p className="text-sm font-medium text-[#F4F4F5]">
                        {result.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                        Tanggal Order
                      </p>
                      <p className="text-sm font-medium text-[#F4F4F5]">
                        {formatTanggal(result.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-white/10 bg-[#131314]/60 px-4 py-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {getStatusInstruction(result.status)}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="gaming-card p-6 md:p-7 mt-6 text-center">
                {errorKind === "notfound" ? (
                  <>
                    <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#F4F4F5]">
                      Order tidak ditemukan.
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Periksa kembali Order ID kamu.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#F4F4F5]">
                      Gagal memuat status order. Coba lagi.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-4"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Coba Lagi
                    </Button>
                  </>
                )}
              </div>
            )}

            <Link
              to="/paket"
              className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#F4F4F5] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Kembali ke daftar paket
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CekOrder;
