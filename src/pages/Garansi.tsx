import { useState } from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/effects/PageBackground";
import Reveal from "@/components/effects/Reveal";
import { AuroraText } from "@/components/ui/aurora-text";
import { supabase } from "@/lib/admin/supabase";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

const WARRANTY_SERVICES = [
  { slug: "standart", name: "STANDART", days: 7, label: "STANDART — garansi 7 hari" },
  { slug: "elite", name: "ELITE", days: 14, label: "ELITE — garansi 14 hari" },
  { slug: "extreme", name: "EXTREME", days: 30, label: "EXTREME — garansi 30 hari" },
  { slug: "app-settinx", name: "IPAN APP SettinX V1", days: 14, label: "IPAN APP SettinX V1 — garansi 14 hari" },
] as const;

type ClaimResult = {
  ok: boolean;
  ticket_number?: string;
  invoice_number?: string;
  service_name?: string;
  customer_name?: string;
  complaint?: string;
  status?: string;
  warranty_days?: number;
  expires_at?: string;
  error?: string;
};

export default function Garansi() {
  const [customerName, setCustomerName] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Nama wajib diisi minimal 2 karakter.");
      return;
    }
    if (!serviceSlug) {
      setError("Pilih paket yang ingin diklaim garansi.");
      return;
    }
    if (!complaint.trim() || complaint.trim().length < 10) {
      setError("Ceritakan keluhan kamu minimal 10 karakter.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("submit_warranty_claim", {
        p_customer_name: customerName.trim(),
        p_service_slug: serviceSlug,
        p_complaint: complaint.trim(),
        p_order_date: orderDate ? orderDate : null,
      });
      if (rpcError) throw rpcError;
      const res = data as ClaimResult;
      if (!res.ok) {
        setError(res.error || "Gagal mengajukan klaim.");
        return;
      }
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Gagal mengajukan klaim. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaRedirect = () => {
    if (!result) return;
    const svc = WARRANTY_SERVICES.find((s) => s.slug === serviceSlug);
    const text = encodeURIComponent(
      `Halo min, saya mau claim garansi.\n` +
        `Tiket: ${result.ticket_number}\n` +
        `Nama: ${result.customer_name}\n` +
        `Produk: ${result.service_name || svc?.name || serviceSlug}\n` +
        (result.invoice_number ? `Invoice: ${result.invoice_number}\n` : "") +
        `Keluhan: ${complaint.trim()}`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setCustomerName("");
    setServiceSlug("");
    setOrderDate("");
    setComplaint("");
  };

  const faqItems = [
    { q: "Layanan apa saja yang bergaransi di IPAN STORE?", a: "STANDART garansi 7 hari, ELITE 14 hari, EXTREME 30 hari, dan IPAN APP SettinX V1 14 hari. Paket SET PC dan ANTICHEAT LAGA tidak termasuk garansi. Garansi dihitung sejak status order PAID/COMPLETED." },
    { q: "Apakah butuh invoice untuk klaim garansi?", a: "Tidak. Cukup isi nama sesuai saat order dan pilih paket. Sistem otomatis mencocokkan nama dan paket kamu dengan data order di IPAN STORE." },
    { q: "Bagaimana cara klaim garansi IPAN STORE?", a: "Isi form di halaman ini, dapatkan nomor tiket CLM, lalu lanjut ke WhatsApp dengan pesan otomatis yang sudah terisi tiket, produk, dan keluhan kamu. Admin akan verifikasi dan proses sesuai masa garansi." },
    { q: "Apa yang dicover garansi optimasi PC & Boost FPS?", a: "Garansi mengcover kendala performa setelah layanan — seperti FPS kembali drop, tweak tidak bekerja, atau Windows Mod bermasalah — selama masih dalam masa garansi dan bukan karena perubahan sistem oleh user (install ulang, update besar, ganti hardware)." },
    { q: "Lewat masa garansi masih bisa klaim?", a: "Bisa. Klaim tetap masuk dengan status KADALUARSA dan akan ditinjau admin. Untuk bantuan cepat hubungi WhatsApp resmi IPAN STORE." },
  ];

  return (
    <Layout>
      <SEOHead
        title="Garansi IPAN STORE — Klaim Optimasi PC & Boost FPS Free Fire"
        description="Klaim garansi IPAN STORE 7–30 hari untuk STANDART, ELITE, EXTREME & SettinX V1. Optimasi PC gaming & Boost FPS Free Fire via UltraViewer — tanpa invoice, cukup nama & paket."
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Garansi", path: "/garansi" },
          ]),
          faqJsonLd(faqItems),
        ]}
      />

      {/* Hero — ritme vertikal selaras Paket (pt-24 md:pt-28), text-balance + pretty untuk center */}
      <section className="relative pt-24 pb-10 md:pt-28 md:pb-14 overflow-hidden">
        <PageBackground opacity={0.18} />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Reveal className="text-center max-w-[720px] mx-auto">
            <span className="section-subheading tracking-[0.18em] md:tracking-[0.2em]">Garansi Resmi IPAN STORE</span>
            <h1 className="h1-clamp font-extrabold md:font-bold tracking-[-0.03em] md:tracking-tight leading-[0.98] md:leading-[1.05] text-balance text-[#F4F4F5] mb-4 md:mb-5">
              Klaim <AuroraText className="font-extrabold md:font-bold">Garansi</AuroraText> Optimasi PC & Boost FPS
            </h1>
            <p className="mx-auto max-w-[58ch] md:max-w-2xl text-pretty text-[14px] md:text-[15px] leading-7 text-zinc-400">
              Jasa <strong className="text-zinc-200 font-semibold">optimasi PC gaming & Boost FPS Free Fire</strong> bergaransi resmi. Kendala setelah tweaking Windows, setting Bluestacks, atau aktivasi SettinX V1? Cukup isi form — sistem otomatis mencocokkan <strong className="text-zinc-200 font-semibold">nama & paket</strong> dengan data order <strong className="text-zinc-200 font-semibold">tanpa perlu invoice</strong>.
            </p>
            <div className="mt-5 md:mt-6 flex flex-wrap justify-center gap-2">
              <span className="inline-flex rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1.5 font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-300">Garansi 7–30 hari</span>
              <span className="inline-flex rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1.5 font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-300">Tanpa invoice</span>
              <span className="inline-flex rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1.5 font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-300">Lanjut WhatsApp otomatis</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-16 md:pb-24">
        <PageBackground opacity={0.12} />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Info garansi — hierarki mono untuk label, grid responsif */}
            <div className="gaming-card p-5 md:p-6 mb-6 border-white/10">
              <h2 className="font-mono text-[11px] md:text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8] mb-3">Masa Garansi Resmi per Paket</h2>
              <p className="text-pretty text-xs md:text-[13px] leading-relaxed text-zinc-500 mb-3 md:mb-4">Garansi jasa <span className="text-zinc-300 font-medium">optimasi PC gaming & Boost FPS Free Fire</span>. Dihitung sejak order berstatus <span className="font-mono text-[11px] tracking-wide text-zinc-300">PAID / COMPLETED</span> via DOKU atau order manual admin.</p>
              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {WARRANTY_SERVICES.map((s) => (
                  <div key={s.slug} className="flex items-center justify-between gap-2 rounded-xl bg-[#131314] border border-white/10 px-3 md:px-3.5 py-2.5 md:py-3">
                    <span className="text-[11px] md:text-xs font-medium leading-none tracking-tight text-zinc-300 truncate pr-1">{s.name}</span>
                    <span className="shrink-0 font-mono text-xs md:text-sm font-bold tracking-tight text-[#F4F4F5]">{s.days} hari</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 md:mt-4 text-pretty text-[11px] md:text-xs leading-relaxed text-zinc-500">
                <strong className="font-semibold text-zinc-400">SET PC</strong> dan <strong className="font-semibold text-zinc-400">ANTICHEAT LAGA</strong> tidak termasuk garansi. Lewat masa garansi tetap bisa diajukan — status <span className="font-mono text-[11px] tracking-wide text-zinc-400">KADALUARSA</span> dan admin akan meninjau manual. Pengerjaan 100% remote via <span className="font-medium text-zinc-400">UltraViewer</span>.
              </p>
            </div>

            {/* Success card */}
            {result?.ok ? (
              <div className="gaming-card p-6 md:p-7 border-green-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-[17px] md:text-lg font-semibold tracking-tight leading-none text-[#F4F4F5]">Klaim Berhasil Diajukan</h2>
                    <p className="text-pretty text-sm leading-relaxed text-zinc-400 mt-2">
                      Data kamu sudah masuk ke admin. Silakan lanjut ke WhatsApp agar diproses lebih cepat.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#131314]/60 p-4 space-y-2.5 text-sm mb-5">
                  <div className="flex justify-between gap-4">
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">Tiket</span>
                    <span className="font-mono text-sm font-bold tracking-tight text-[#F4F4F5]">{result.ticket_number}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">Nama</span>
                    <span className="text-sm font-medium text-[#F4F4F5] text-right truncate">{result.customer_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">Produk</span>
                    <span className="text-sm font-medium text-[#F4F4F5] text-right">{result.service_name}</span>
                  </div>
                  {result.invoice_number && (
                    <div className="flex justify-between gap-4">
                      <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">Invoice</span>
                      <span className="font-mono text-xs font-medium text-[#F4F4F5]">{result.invoice_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 items-center">
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">Status</span>
                    <span className={`inline-flex items-center font-mono text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      result.status === "PENDING"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : result.status === "NEED_VERIFICATION"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : result.status === "EXPIRED"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}>
                      {result.status === "PENDING" ? "Menunggu Diproses" : result.status === "NEED_VERIFICATION" ? "Perlu Verifikasi" : result.status === "EXPIRED" ? "Kadaluwarsa" : result.status}
                    </span>
                  </div>
                </div>

                {result.status === "NEED_VERIFICATION" && (
                  <p className="mb-4 flex gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3.5 py-3 text-pretty text-xs leading-relaxed text-yellow-300/90">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Ditemukan lebih dari satu order yang mirip. Admin akan memverifikasi manual — kamu tetap lanjut ke WhatsApp ya.
                  </p>
                )}
                {result.status === "EXPIRED" && (
                  <p className="mb-4 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-pretty text-xs leading-relaxed text-red-300/90">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Masa garansi untuk klaim ini sudah lewat. Tetap lanjut ke WhatsApp — admin akan meninjau kebijakan.
                  </p>
                )}

                <Button onClick={handleWaRedirect} size="lg" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold">
                  Lanjut ke WhatsApp <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button onClick={resetForm} className="mt-3 w-full font-mono text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300 transition-colors">
                  Ajukan klaim lain
                </button>
              </div>
            ) : (
              <div className="gaming-card p-6 md:p-7">
                <div className="space-y-4 md:space-y-5">
                  <div>
                    <label className="block font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-2">Nama Lengkap — sesuai saat order *</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      autoComplete="name"
                      className="w-full rounded-xl bg-[#131314] border border-white/10 px-4 py-3 text-sm leading-none text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/50 focus:ring-1 focus:ring-[#94A3B8]/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-2">Paket yang diklaim *</label>
                    <select
                      value={serviceSlug}
                      onChange={(e) => setServiceSlug(e.target.value)}
                      className="w-full rounded-xl bg-[#131314] border border-white/10 px-4 py-3 text-sm leading-none text-[#F4F4F5] focus:outline-none focus:border-[#94A3B8]/50 focus:ring-1 focus:ring-[#94A3B8]/20 transition-colors"
                    >
                      <option value="">— Pilih paket —</option>
                      {WARRANTY_SERVICES.map((s) => (
                        <option key={s.slug} value={s.slug}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-2">Tanggal Order — opsional, kalau ingat</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full rounded-xl bg-[#131314] border border-white/10 px-4 py-3 text-sm leading-none text-[#F4F4F5] focus:outline-none focus:border-[#94A3B8]/50 focus:ring-1 focus:ring-[#94A3B8]/20 [color-scheme:dark] transition-colors"
                    />
                    <p className="mt-2 font-mono text-[11px] leading-none text-zinc-500">Membantu pencocokan jika ada nama yang sama.</p>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-2">Keluhan / Alasan Klaim *</label>
                    <textarea
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      rows={5}
                      placeholder="Ceritakan kendala setelah layanan — FPS drop lagi, tweak tidak bekerja, Windows Mod error, dll. Sedetail mungkin..."
                      className="w-full rounded-xl bg-[#131314] border border-white/10 px-4 py-3 text-sm leading-relaxed text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-[#94A3B8]/50 focus:ring-1 focus:ring-[#94A3B8]/20 resize-none transition-colors"
                    />
                    <p className="mt-2 font-mono text-[11px] leading-none text-zinc-500 tabular-nums">{complaint.trim().length}/10 karakter minimal</p>
                  </div>
                </div>

                {error && (
                  <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-pretty text-xs leading-relaxed text-red-400">
                    {error}
                  </p>
                )}

                <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full mt-6 font-semibold">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      Ajukan Klaim Garansi <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="mt-4 text-pretty text-center text-[11px] md:text-xs leading-relaxed text-zinc-500">
                  Setelah submit, kamu otomatis diarahkan ke WhatsApp dengan pesan berisi tiket, produk, dan keluhan.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
