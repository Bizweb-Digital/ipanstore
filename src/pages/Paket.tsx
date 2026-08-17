import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Minus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import AppSettinxSection from "@/components/sections/AppSettinxSection";
import PageBackground from "@/components/effects/PageBackground";
import Reveal from "@/components/effects/Reveal";
import ScrollStackCards from "@/components/effects/ScrollStackCards";
import AnimatedTabs from "@/components/effects/AnimatedTabs";
import { AuroraText } from "@/components/ui/aurora-text";
import { breadcrumbJsonLd } from "@/lib/seo";
import { useActiveServices } from "@/hooks/useActiveServices";
import { ActiveService } from "@/lib/services";

/* ─── Paket Data (fallback statis — diganti data Supabase saat tersedia) ─── */
type Pkg = {
  id: string;
  category: "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
};

const STATIC_PACKAGES: Pkg[] = [
  {
    id: "set-pc",
    category: "SET PC",
    name: "SET PC",
    price: "Rp 50.000",
    features: [
      "Setting Regedit Tweak",
      "Settingan RAM & CPU ideal",
      "Sensi & DPI config",
      "Free Fire V7A Terbaru",
      "Tweaks Smoothness",
      "Model Phone Emulator Unlock 144 Fps"
    ],
  },
  {
    id: "custom-ff",
    category: "SET PC",
    name: "Custom FF & Emulator",
    price: "Rp 20.000",
    popular: true,
    highlight: "REKOMENDASI",
    features: [
      "FPS Boost",
      "Mengurangi Input Lag",
      "Mengurangi Recoil Senjata",
      "Anti Force Close Emulator",
    ],
  },
  {
    id: "standart",
    category: "Optimize",
    name: "STANDART",
    price: "Rp 50.000",
    features: [
      "Regedit & Tweaks",
      "Optimize CPU/RAM/GPU",
      "Boost FPS semua game",
      "Tanpa install ulang",
      "Windows Mod by Ipan",
      "Lebih ringan & responsif",
    ],
  },
  {
    id: "elite",
    category: "Optimize",
    name: "ELITE",
    price: "Rp 100.000",
    popular: true,
    highlight: "PALING LARIS",
    features: [
      "Optimize CPU/RAM/GPU",
      "Boost FPS semua game",
      "Reduce latency",
      "Windows Mod by Ipan",
      "Lebih ringan & responsif",
      "Cocok daily use",
    ],
  },
  {
    id: "extreme",
    category: "Optimize",
    name: "EXTREME",
    price: "Rp 150.000",
    highlight: "PRO CHOICE",
    features: [
      "Emulator & Keybind",
      "Sensi X & Y",
      "Boost FPS maksimal",
      "Semua fitur lengkap",
      "Performance maksimal",
      "Windows Mod by Ipan",
    ],
  },
  {
    id: "anti-cheat-laga",
    category: "Anti Cheat",
    name: "ANTICHEAT LAGA",
    price: "Rp 100.000",
    popular: true,
    highlight: "TOURNAMENT SECURE",
    features: [
      "External & Internal Cheat",
      "Streamer Cheat & Hidden Panel",
      "Kernel Driver Cheat",
      "Bypass & Manipulasi Emulator",
    ],
  },
];

/* Comparison Data — IPAN APP SETTINX mendapat semua centang */
const comparisonFeatures = [
  // SET PC Features
  { name: "Setting Regedit Tweak", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false, "IPAN APP SETTINX": true },
  { name: "Settingan RAM & CPU ideal", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false, "IPAN APP SETTINX": true },
  { name: "Sensi & DPI config", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false, "IPAN APP SETTINX": true },
  { name: "Free Fire V7A Terbaru", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true, "IPAN APP SETTINX": true },
  { name: "Tweaks Smoothness", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false, "IPAN APP SETTINX": true },
  { name: "Model Phone Unlock 144 Fps", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false, "IPAN APP SETTINX": true },
  { name: "FPS Boost", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true, "IPAN APP SETTINX": true },
  { name: "Mengurangi Input Lag", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true, "IPAN APP SETTINX": true },
  { name: "Mengurangi Recoil Senjata", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true, "IPAN APP SETTINX": true },
  { name: "Anti Force Close Emulator", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true, "IPAN APP SETTINX": true },

  // Optimize Features
  { name: "Regedit & Tweaks", category: "Optimize", STANDART: true, ELITE: false, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Optimize CPU/RAM/GPU", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Boost FPS semua game", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Tanpa install ulang", category: "Optimize", STANDART: true, ELITE: false, EXTREME: false, "IPAN APP SETTINX": true },
  { name: "Reduce latency", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Windows Mod by Ipan", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Lebih ringan & responsif", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Cocok daily use", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Semua fitur lengkap", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Performance maksimal", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Emulator & Keybind", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true, "IPAN APP SETTINX": true },
  { name: "Sensi X & Y", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true, "IPAN APP SETTINX": true },

  // Anti Cheat Features
  { name: "External Cheat & Internal Cheat", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
  { name: "Streamer Cheat & Hidden Panel", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
  { name: "Kernel Driver Cheat", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
  { name: "Metode bypass terbaru", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
  { name: "Manipulasi emulator tidak wajar", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
  { name: "Modifikasi emulator mencurigakan", category: "Anti Cheat", "ANTICHEAT LAGA": true, "IPAN APP SETTINX": true },
];

/* Column metadata untuk APP SETTINX (harga coret + harga baru) */
const SETTINX_COL = {
  name: "IPAN APP SETTINX",
  priceOld: "Rp 100.000",
  priceNew: "Rp 75.000",
  badge: "PALING UNGGUL",
  description:
    "Satu paket ini sudah mencakup semua fitur dari paket Optimize, SET PC, dan Anti Cheat dengan lisensi lifetime.",
};

type TabKey = "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";

const TABS: { key: TabKey; label: string }[] = [
  { key: "Optimize", label: "OPTIMIZE" },
  { key: "SET PC", label: "SET PC" },
  { key: "Anti Cheat", label: "ANTI CHEAT" },
  { key: "APP SETTINX", label: "APP SETTINX" },
];

const FeatureCheck = ({ ok, highlight = false }: { ok: boolean; highlight?: boolean }) =>
  ok ? (
    <div className="flex justify-center items-center">
      <Check
        className={`h-5 w-5 ${highlight ? "text-[#94A3B8]" : "text-[#F4F4F5]/50"}`}
        strokeWidth={2.5}
      />
    </div>
  ) : (
    <div className="flex justify-center items-center">
      <Minus className="h-4 w-4 text-zinc-600" strokeWidth={2} />
    </div>
  );

const Paket = () => {
  const { ref: tableRef, revealed: tableRevealed } = useScrollReveal<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<TabKey>("Optimize");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Paket dari tabel services Supabase (dikelola admin) dengan fallback statis.
  const { services: dbServices, fromDb } = useActiveServices(STATIC_PACKAGES as ActiveService[]);
  const packages: Pkg[] = fromDb
    ? dbServices.map((s) => ({
        id: s.id,
        category: s.category,
        name: s.name,
        price: s.priceLabel,
        features: s.features,
        popular: Boolean(s.highlight),
        highlight: s.highlight,
      }))
    : STATIC_PACKAGES;

  // Drag-to-scroll: tabel perbandingan bisa digeser kiri-kanan dengan
  // drag (mouse) & momentum swipe (touch) — jadi mudah digeser di HP.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Hanya drag dengan tombol kiri / sentuhan.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDown = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      el.scrollLeft = startScroll - dx;
    };
    const endDrag = () => {
      isDown = false;
      el.classList.remove("dragging");
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [activeTab]);

  const filteredPackages = packages.filter((p) => p.category === activeTab);
  const filteredComparison = comparisonFeatures.filter((f) => f.category === activeTab);

  return (
    <Layout>
      <SEOHead
        title="Harga Jasa Optimasi PC & Paket Boost FPS Free Fire | IPAN STORE"
        description="Daftar harga jasa optimasi PC mulai Rp 20.000: paket SET PC Rp 50.000, Standart Rp 50.000, Elite Rp 100.000, Extreme Rp 150.000, AntiCheat Laga, dan IPAN APP SettinX Rp 75.000 (lifetime). Konsultasi gratis via WhatsApp."
        jsonLd={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: "Paket & Harga", path: "/paket" },
        ])}
      />

      {/* Section mengalir normal (tanpa ScrollStack pembungkus seluruh halaman). */}
      {/* Hero */}
      <section className="relative pt-24 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        <PageBackground opacity={0.2} />
        <div className="absolute top-1/4 -left-24 w-72 h-72 bg-[#94A3B8]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-[#94A3B8]/8 blur-[140px] rounded-full pointer-events-none" />
        <Reveal className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge-accent mb-5 inline-block">PRICING</span>
          <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-5">
            Pilih Paket{" "}
            <AuroraText
              colors={["#E2E8F0", "#94A3B8", "#CBD5E1", "#E2E8F0"]}
              speed={1.2}
            >
              Optimasi
            </AuroraText>
          </h1>
          <p className="max-w-2xl mx-auto text-zinc-400 leading-relaxed">
            Pilih paket yang sesuai kebutuhan kamu. Semua paket include garansi dan konsultasi gratis via WhatsApp.
          </p>

          {/* Tabs — horizontal scroll di mobile agar tidak wrap & CTA tidak terdorong */}
          <AnimatedTabs className="mt-10">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex justify-start sm:justify-center gap-1.5 p-1.5 rounded-3xl border border-white/10 bg-[#101827] w-max min-w-full sm:min-w-0 sm:w-auto sm:inline-flex mx-auto">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wider whitespace-nowrap transition-all duration-300 ${
                      activeTab === t.key
                        ? "text-[#F4F4F5] bg-[#1a1a1a] border border-[#94A3B8]/30 shadow-[0_0_18px_rgba(148,163,184,0.3)]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </AnimatedTabs>
        </Reveal>
      </section>

          {/* Package Cards / Settinx Panel */}
          <section className="relative pb-24 min-h-[50vh]">
            <PageBackground opacity={0.15} />
            <div className="container mx-auto px-4 relative z-10">
              {activeTab === "APP SETTINX" ? (
                <div key={activeTab} className="max-w-5xl mx-auto animate-fade-up">
                  <AppSettinxSection compact />
                </div>
              ) : (
                <div key={activeTab} className="max-w-3xl mx-auto">
                  <ScrollStackCards itemDistance={70} itemStackDistance={20} baseScale={0.93} itemScale={0.028}>
                    {filteredPackages.map((p) => {
                      const highlighted = Boolean(p.highlight);
                      return (
                        <div
                          key={p.name}
                          className={`gaming-card relative p-6 lg:p-8 flex flex-col ${
                            highlighted ? "border-zinc-600" : ""
                          }`}
                        >
                      <div className="flex items-center justify-between mb-4 min-h-[24px]">
                        {p.highlight ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-50 text-zinc-900 font-mono text-[10px] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
                            {p.highlight}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F4F4F5]/50">
                          {p.category}
                        </span>
                      </div>

                      <h3 className="text-lg lg:text-xl font-semibold tracking-tight text-[#F4F4F5] mb-2">{p.name}</h3>
                      <div className="mb-8">
                        <span className="font-mono text-3xl font-bold text-[#F4F4F5]">
                          {p.price}
                        </span>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm text-zinc-400">
                            <Check className="h-4 w-4 text-[#F4F4F5]/50 mt-0.5 shrink-0" strokeWidth={2.5} />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Button asChild variant={highlighted ? "default" : "outline"} className="w-full">
                        <Link to={`/order?paket=${p.id}`}>
                          Order Sekarang
                        </Link>
                      </Button>
                        </div>
                      );
                    })}
                  </ScrollStackCards>
                </div>
              )}
            </div>
          </section>

          {/* Comparison Table */}
        {activeTab !== "APP SETTINX" && (
            <section className="relative py-16 md:py-20">
              <PageBackground opacity={0.12} />
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-14">
                  <span className="section-subheading">Perbandingan</span>
                  <h2 className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4">
                    Bandingkan Paket {activeTab}
                  </h2>
                  <p className="text-zinc-400">
                    Cek fitur yang tersedia secara mendetail di setiap paket. IPAN APP SettinX tetap ditampilkan sebagai acuan paket terlengkap.
                  </p>
                </div>

                <div
                  ref={tableRef}
                  className={`max-w-6xl mx-auto scroll-reveal ${tableRevealed ? "revealed" : ""}`}
                >
                  <p className="text-xs text-[#F4F4F5]/50 text-center mb-3 lg:hidden">
                    Geser tabel ke samping untuk melihat semua fitur
                  </p>
                  <div
                    key={activeTab}
                    ref={scrollRef}
                    className="gaming-table-wrapper gaming-table-scroll animate-fade-up"
                  >
                    <table className="min-w-[900px] mx-auto gaming-table">
                      <thead>
                        <tr>
                          <th className="text-left text-zinc-400 min-w-[220px] !px-3 !py-4">
                            Fitur
                          </th>
                          {filteredPackages.map((p) => (
                            <th key={p.name} className="min-w-[120px] !px-3 !py-4">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[#F4F4F5] text-xs md:text-sm font-semibold normal-case tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>{p.name}</span>
                                <span className="font-mono text-[#94A3B8] text-xs md:text-sm font-medium">{p.price}</span>
                              </div>
                            </th>
                          ))}
                          {/* Kolom IPAN APP SETTINX — compact, meluas saat hover */}
                          <th
                            className="group min-w-[110px] w-[110px] hover:w-[300px] hover:min-w-[300px] transition-all duration-300 !px-3 !py-4 align-top"
                            aria-label="Kolom IPAN APP SETTINX"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="gaming-badge !px-2 !py-0.5 !text-[9px]">
                                {SETTINX_COL.badge}
                              </span>
                              <span className="text-center text-[#F4F4F5] text-xs md:text-sm font-semibold normal-case tracking-tight leading-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>{SETTINX_COL.name}</span>
                              <span className="font-mono text-xs whitespace-nowrap">
                                <span className="text-zinc-600 line-through">{SETTINX_COL.priceOld}</span>
                                <span className="text-[#94A3B8] font-medium ml-1.5">{SETTINX_COL.priceNew}</span>
                              </span>
                              <span className="mt-2 hidden max-w-[270px] text-center text-[11px] leading-relaxed text-zinc-400 opacity-0 transition-opacity duration-300 group-hover:block group-hover:opacity-100">
                                {SETTINX_COL.description}
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComparison.map((f) => (
                          <tr key={f.name}>
                            <td className="text-left font-medium text-[#94A3B8]">{f.name}</td>
                            {filteredPackages.map((p) => (
                              <td key={p.name}><FeatureCheck ok={f[p.name]} /></td>
                            ))}
                            <td className="bg-[#131314]/40 border-l border-r border-white/16">
                              <FeatureCheck ok={f[SETTINX_COL.name]} highlight />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                    <p className="text-xs text-[#F4F4F5]/50 italic max-w-md">
                      Kolom IPAN APP SettinX ditampilkan sebagai pembanding. Semua paket memiliki centang penuh dibanding paket lain di kategori ini.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
                      <a
                        href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau pilih paket setelah melihat tabel perbandingan")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        Pilih Paket via WhatsApp
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                      <Link to="/order?paket=app-settinx" className="flex items-center justify-center">
                        Beli IPAN APP SETTINX
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
        )}

        {/* IPAN APP SettinX — Section Terpisah */}
        {activeTab !== "APP SETTINX" && (
            <AppSettinxSection />
        )}
    </Layout>
  );
};

export default Paket;
