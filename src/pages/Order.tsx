import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  BadgeCheck,
  QrCode,
  Wallet,
  CreditCard,
  ChevronLeft,
  Loader2,
  BadgePercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/effects/PageBackground";
import Reveal from "@/components/effects/Reveal";
import { AuroraText } from "@/components/ui/aurora-text";
import { createKlikQrisPayment, checkKlikQrisStatus, isPaidStatus } from "@/lib/klikqris";
import { useActiveServices } from "@/hooks/useActiveServices";
import { ActiveService } from "@/lib/services";
import { lookupPromoCode } from "@/lib/admin/promo";

/* ─── Data Paket (sinkron dengan halaman Paket) ─────────────────────────── */
type Pkg = {
  id: string;
  category: "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";
  name: string;
  price: number; // angka rupiah murni
  priceLabel: string;
  highlight?: string;
  features: string[];
};

const STATIC_PACKAGES: Pkg[] = [
  {
    id: "set-pc",
    category: "SET PC",
    name: "SET PC",
    price: 50000,
    priceLabel: "Rp 50.000",
    features: [
      "Setting Regedit Tweak",
      "Settingan RAM & CPU ideal",
      "Sensi & DPI config",
      "Free Fire V7A Terbaru",
      "Tweaks Smoothness",
      "Model Phone Unlock 144 Fps",
    ],
  },
  {
    id: "custom-ff",
    category: "SET PC",
    name: "Custom FF & Emulator",
    price: 20000,
    priceLabel: "Rp 20.000",
    highlight: "REKOMENDASI",
    features: ["FPS Boost", "Mengurangi Input Lag", "Mengurangi Recoil Senjata", "Anti Force Close Emulator"],
  },
  {
    id: "standart",
    category: "Optimize",
    name: "STANDART",
    price: 50000,
    priceLabel: "Rp 50.000",
    features: ["Regedit & Tweaks", "Optimize CPU/RAM/GPU", "Boost FPS semua game", "Tanpa install ulang", "Windows Mod by Ipan", "Lebih ringan & responsif"],
  },
  {
    id: "elite",
    category: "Optimize",
    name: "ELITE",
    price: 100000,
    priceLabel: "Rp 100.000",
    highlight: "PALING LARIS",
    features: ["Optimize CPU/RAM/GPU", "Boost FPS semua game", "Reduce latency", "Windows Mod by Ipan", "Lebih ringan & responsif", "Cocok daily use"],
  },
  {
    id: "extreme",
    category: "Optimize",
    name: "EXTREME",
    price: 150000,
    priceLabel: "Rp 150.000",
    highlight: "PRO CHOICE",
    features: ["Emulator & Keybind", "Sensi X & Y", "Boost FPS maksimal", "Semua fitur lengkap", "Performance maksimal", "Windows Mod by Ipan"],
  },
  {
    id: "anti-cheat-laga",
    category: "Anti Cheat",
    name: "ANTICHEAT LAGA",
    price: 100000,
    priceLabel: "Rp 100.000",
    highlight: "TOURNAMENT SECURE",
    features: ["External & Internal Cheat", "Streamer Cheat & Hidden Panel", "Kernel Driver Cheat", "Bypass & Manipulasi Emulator"],
  },
  {
    id: "app-settinx",
    category: "APP SETTINX",
    name: "IPAN APP SettinX V1",
    price: 75000,
    priceLabel: "Rp 75.000",
    highlight: "LISENSI LIFETIME",
    features: ["Lisensi lifetime (1 akun = 1 PC)", "DragShot Velocity X", "OneTap Vector X", "Neural AimSync X", "Emulator Overdrive X", "Snapshot & Rollback"],
  },
];

const formatRupiah = (n: number) =>
  "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const paymentMethods = [
  { icon: QrCode, name: "QRIS", desc: "Scan sekali dari e-wallet / m-banking apa pun" },
  { icon: Wallet, name: "E-Wallet", desc: "DANA, OVO, GoPay, ShopeePay, dll." },
  { icon: CreditCard, name: "Virtual Account", desc: "BCA, BRI, BNI, Mandiri, Permata, dll." },
];

const Order = () => {
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get("paket");

  // Paket dari tabel services Supabase (dikelola admin) dengan fallback statis.
  const { services: dbServices, fromDb } = useActiveServices(STATIC_PACKAGES as ActiveService[]);
  const packages: Pkg[] = fromDb
    ? dbServices.map((s) => ({
        id: s.id,
        category: s.category,
        name: s.name,
        price: s.price,
        priceLabel: s.priceLabel,
        highlight: s.highlight,
        features: s.features,
      }))
    : STATIC_PACKAGES;

  const [selectedId, setSelectedId] = useState<string>(
    packages.some((p) => p.id === preselect) ? (preselect as string) : packages[0].id
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Kode Promo ────────────────────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; total: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  // ── QRIS KlikQris ───────────────────────────────────────────────────────────
  const [qr, setQr] = useState<{
    orderId: string;
    qrisUrl?: string;
    qrisImage?: string;
    totalAmount?: number;
    expiredAt?: string;
  } | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [paid, setPaid] = useState(false);
  const [countdown, setCountdown] = useState("");

  const selected = useMemo(
    () => packages.find((p) => p.id === selectedId) ?? packages[0],
    [selectedId, packages]
  );

  // Auto-isi kode promo dari URL (?kode=HEMAT5) — dipakai CTA popup launching.
  const promoParam = searchParams.get("kode");
  const promoAutoRef = useRef(false);

  const applyPromoByCode = useCallback(
    async (code: string) => {
      const c = code.trim().toUpperCase();
      if (!c) return;
      setPromoMsg(null);
      setPromoApplied(null);
      setCheckingPromo(true);
      try {
        // Validasi via backend (SECURITY FIX #1) — server menghitung diskon,
        // frontend tidak lagi query tabel promo_codes langsung.
        const result = await lookupPromoCode(c, selected.price);
        if (!result) {
          setPromoMsg("VITE_BACKEND_URL belum dikonfigurasi.");
          return;
        }
        if (!result.ok) {
          setPromoMsg(result.message || "Kode promo tidak valid.");
          return;
        }
        const discount = result.discount ?? 0;
        const total = result.total ?? selected.price;
        setPromoApplied({ code: c, discount, total });
        setPromoMsg(`Kode ${c} berlaku! Anda hemat Rp ${discount.toLocaleString("id-ID")}.`);
      } catch {
        setPromoMsg("Gagal memeriksa kode promo. Coba lagi.");
      } finally {
        setCheckingPromo(false);
      }
    },
    [selected.price]
  );

  useEffect(() => {
    if (promoParam && !promoAutoRef.current) {
      promoAutoRef.current = true;
      setPromoInput(promoParam.toUpperCase());
      void applyPromoByCode(promoParam);
    }
  }, [promoParam, applyPromoByCode]);

  const handleApplyPromo = () => {
    void applyPromoByCode(promoInput);
  };

  const handleCheckout = async () => {
    setError(null);
    if (qr && !qrExpired) return;
    if (paid) return;
    if (!name.trim() || !email.trim()) {
      setError("Mohon isi Nama dan Email terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const res = await createKlikQrisPayment({
        orderId: `IPAN-${selected.id.toUpperCase()}-${Date.now()}`,
        amount: promoApplied ? promoApplied.total : selected.price,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: wa.trim(),
        itemName: `IPAN STORE - ${selected.name}`,
        promoCode: promoApplied?.code,
      });

      if (res.error || !res.qrisUrl) {
        throw new Error(
          res.error || "Backend tidak mengembalikan QRIS. Hubungi kami via WhatsApp."
        );
      }

      setQr({
        orderId: res.orderId || "",
        qrisUrl: res.qrisUrl,
        qrisImage: res.qrisImage,
        totalAmount: res.totalAmount,
        expiredAt: res.expiredAt,
      });
      setPaid(false);
      setQrExpired(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  // ── Countdown QRIS (5 menit) + polling status ───────────────────────────────
  useEffect(() => {
    if (!qr) return;
    const expiresAt = qr.expiredAt ? new Date(qr.expiredAt).getTime() : Date.now() + 5 * 60 * 1000;

    const tick = () => {
      const remain = Math.max(0, expiresAt - Date.now());
      const mins = Math.floor(remain / 60000);
      const secs = Math.floor((remain % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      if (remain <= 0) {
        setQrExpired(true);
        setCountdown("00:00");
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [qr]);

  useEffect(() => {
    if (!qr || !qr.orderId || qrExpired) return;
    let stop = false;
    const poll = async () => {
      const r = await checkKlikQrisStatus(qr.orderId);
      if (stop) return;
      if (r.paid) {
        setPaid(true);
        return;
      }
      setTimeout(poll, 8000);
    };
    const t = setTimeout(poll, 8000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [qr, qrExpired]);

  return (
    <Layout>
      <SEOHead
        title="Order Paket Optimasi PC Gaming | IPAN STORE"
        description="Order paket optimasi PC gaming & IPAN APP SettinX secara online. Bayar mudah via QRIS, e-Wallet, dan Virtual Account."
      />

      {/* Header */}
      <section className="relative pt-28 pb-10 md:pt-32 md:pb-12 overflow-hidden">
        <PageBackground opacity={0.18} />
        <div className="container mx-auto px-4 relative z-10">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="section-subheading">Checkout Online</span>
            <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-4">
              Order <AuroraText>Paket Kamu</AuroraText>
            </h1>
            <p className="max-w-xl mx-auto text-zinc-400 leading-relaxed">
              Pilih paket, isi data, lalu bayar aman via QRIS / e-Wallet / Virtual Account.
              Setelah pembayaran berhasil, tim kami langsung menghubungi kamu.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-24">
        <PageBackground opacity={0.12} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
            {/* ── KOLOM KIRI: pilih paket ─────────────────────────────── */}
            <div className="lg:col-span-3">
              <h2 className="text-sm font-mono uppercase tracking-[0.18em] text-[#F4F4F5]/60 mb-4">
                1. Pilih Paket
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {packages.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`text-left gaming-card p-5 transition-all duration-200 relative ${
                        active
                          ? "border-[#94A3B8] ring-1 ring-[#94A3B8]/40"
                          : "hover:border-white/24"
                      }`}
                    >
                      {p.highlight && (
                        <span className="absolute top-3 right-3 inline-flex rounded-md bg-zinc-50 text-zinc-900 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5">
                          {p.highlight}
                        </span>
                      )}
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#F4F4F5]/50">
                        {p.category}
                      </span>
                      <h3 className="mt-1 font-semibold tracking-tight text-[#F4F4F5]">
                        {p.name}
                      </h3>
                      <div className="mt-1 font-mono text-xl font-bold text-[#F4F4F5]">
                        {p.priceLabel}
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {p.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                            <Check className="h-3.5 w-3.5 text-[#94A3B8] mt-0.5 shrink-0" strokeWidth={2.5} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <span
                        className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${
                          active ? "text-[#94A3B8]" : "text-zinc-500"
                        }`}
                      >
                        {active ? (
                          <>
                            <BadgeCheck className="h-3.5 w-3.5" /> Terpilih
                          </>
                        ) : (
                          "Pilih paket ini"
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── KOLOM KANAN: form + ringkasan ───────────────────────── */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-mono uppercase tracking-[0.18em] text-[#F4F4F5]/60 mb-4">
                2. Data & Pembayaran
              </h2>
              <div className="gaming-card p-6 lg:p-7 sticky top-24">
                {/* Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nama Lengkap *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama kamu"
                      className="w-full rounded-lg bg-[#131314] border border-white/16 px-4 py-2.5 text-sm text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@kamu.com"
                      className="w-full rounded-lg bg-[#131314] border border-white/16 px-4 py-2.5 text-sm text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">No. WhatsApp (opsional)</label>
                    <input
                      value={wa}
                      onChange={(e) => setWa(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-lg bg-[#131314] border border-white/16 px-4 py-2.5 text-sm text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/60"
                    />
                  </div>
                </div>

                {/* Kode Promo */}
                <div className="rounded-xl border border-white/16 bg-[#131314]/60 p-4 mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Kode Promo (opsional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoMsg(null);
                        setPromoApplied(null);
                      }}
                      placeholder="misal: HEMAT10"
                      className="flex-1 rounded-lg bg-[#131314] border border-white/16 px-3 py-2 text-sm text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/60"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyPromo}
                      disabled={checkingPromo || !promoInput.trim()}
                      className="shrink-0"
                    >
                      {checkingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgePercent className="h-4 w-4" />
                      )}
                      <span className="ml-1.5">Pakai</span>
                    </Button>
                  </div>
                  {promoMsg && (
                    <p
                      className={`mt-2 text-[11px] ${
                        promoApplied ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {promoMsg}
                    </p>
                  )}
                </div>

                {/* Ringkasan */}
                <div className="rounded-xl border border-white/16 bg-[#131314]/60 p-4 mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">Paket</span>
                    <span className="text-sm font-medium text-[#F4F4F5]">{selected.name}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-400">Diskon ({promoApplied.code})</span>
                      <span className="text-sm font-medium text-green-400">
                        -{formatRupiah(promoApplied.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Total Bayar</span>
                    <span className="font-mono text-xl font-bold text-[#F4F4F5]">
                      {formatRupiah(promoApplied ? promoApplied.total : selected.price)}
                    </span>
                  </div>
                </div>

                {/* Metode pembayaran */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {paymentMethods.map((m) => (
                    <div
                      key={m.name}
                      className="rounded-lg border border-white/16 bg-[#131314]/60 p-3 text-center"
                    >
                      <m.icon className="h-5 w-5 text-[#94A3B8] mx-auto mb-1.5" strokeWidth={1.75} />
                      <span className="block text-[11px] font-medium text-[#F4F4F5]">{m.name}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      Bayar Sekarang
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

        <p className="mt-4 flex items-start gap-2 text-[11px] text-zinc-500 leading-relaxed">
          <ShieldCheck className="h-3.5 w-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
          Pembayaran diproses aman melalui payment gateway. Data kamu terenkripsi.
        </p>

                {/* Panel QRIS KlikQris */}
                {paid ? (
                  <div className="mt-5 rounded-xl border border-green-500/40 bg-green-500/10 p-5 text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold text-green-400">
                      <Check className="h-5 w-5" /> Pembayaran Berhasil!
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Terima kasih! Produk/aktivasi sedang dikirim ke email kamu. Cek inbox/spam ya.
                    </p>
                    <Link
                      to="/paket"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#F4F4F5] hover:text-white transition-colors"
                    >
                      Kembali ke daftar paket <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : qr ? (
                  <div className="mt-5 rounded-xl border border-white/16 bg-[#131314]/80 p-5 text-center">
                    {qrExpired ? (
                      <>
                        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-red-400">
                          <QrCode className="h-5 w-5" /> QRIS Kedaluwarsa
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Waktu pembayaran habis. Klik tombol di bawah untuk membuat QR baru.
                        </p>
                        <Button onClick={handleCheckout} size="sm" className="mt-4">
                          <QrCode className="mr-2 h-4 w-4" /> Buat QRIS Baru
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[#F4F4F5]">
                          <QrCode className="h-5 w-5 text-emerald-400" /> Scan QRIS untuk Membayar
                        </p>
                        <div className="mt-4 mx-auto w-56 h-56 bg-white rounded-xl p-2">
                          {qr.qrisImage ? (
                            <img
                              src={qr.qrisImage}
                              alt="QRIS KlikQris"
                              className="w-full h-full object-contain"
                            />
                          ) : qr.qrisUrl ? (
                            <a href={qr.qrisUrl} target="_blank" rel="noreferrer">
                              <img
                                src={qr.qrisUrl}
                                alt="QRIS KlikQris"
                                className="w-full h-full object-contain"
                              />
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-4 text-xs text-zinc-400">
                          Total bayar:{" "}
                          <span className="font-mono font-semibold text-[#F4F4F5]">
                            {formatRupiah(qr.totalAmount ?? (promoApplied ? promoApplied.total : selected.price))}
                          </span>
                        </p>
                        <p className="mt-2 text-[11px] text-zinc-500">
                          Kode pesanan: <span className="font-mono">{qr.orderId}</span>
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-mono text-amber-300/90">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sisa waktu: {countdown}
                        </p>
                        <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                          Buka aplikasi e-wallet / m-banking (GoPay, OVO, DANA, ShopeePay, dll), pilih
                          QRIS, lalu scan QR di atas. Status ter-update otomatis.
                        </p>
                      </>
                    )}
                  </div>
                ) : null}

                <Link
                  to="/paket"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#F4F4F5] transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Kembali ke daftar paket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Order;
