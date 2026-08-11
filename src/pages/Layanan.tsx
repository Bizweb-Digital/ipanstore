import { useState } from "react";
import { ArrowRight, Settings, Cpu, Monitor, PenTool, Flame, Laptop2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import AppSettinxSection from "@/components/sections/AppSettinxSection";
import PageBackground from "@/components/effects/PageBackground";
import Reveal from "@/components/effects/Reveal";
import ScrollStackCards from "@/components/effects/ScrollStackCards";
import AnimatedTabs from "@/components/effects/AnimatedTabs";
import { AuroraText } from "@/components/ui/aurora-text";
import { breadcrumbJsonLd } from "@/lib/seo";

const services = [
  {
    id: "boost-fps-free-fire",
    category: "Optimize",
    icon: Flame,
    title: "Boost FPS Free Fire",
    desc: "Optimasi spesifik untuk emulator FF agar FPS lebih tinggi, stabil, dan minim frame drop saat war.",
    benefits: ["FPS lebih stabil", "Mouse delay berkurang", "No lag saat war"],
    target: "Pemain kompetitif / Streamer FF",
    link: "/layanan/boost-fps-free-fire",
    accent: "text-orange-500",
  },
  {
    id: "tweaking-pc-gaming",
    category: "Optimize",
    icon: Settings,
    title: "Tweaking PC Gaming",
    desc: "Tweak registry, debloat Windows, dan optimasi system agar PC fokus 100% untuk performa gaming.",
    benefits: ["Windows lebih enteng", "Ping lebih stabil", "Input latency turun"],
    target: "Semua Gamer PC",
    link: "/layanan/tweaking-pc-gaming",
    accent: "text-gaming-accent",
  },
  {
    id: "optimasi-windows",
    category: "Optimize",
    icon: Monitor,
    title: "Optimasi Windows",
    desc: "Pembersihan sistem menyeluruh dari bloatware dan setting ulang power plan untuk daily use & gaming.",
    benefits: ["Booting lebih cepat", "RAM usage lega", "Bebas bloatware"],
    target: "Pengguna PC / Laptop Umum",
    wa_text: "Halo min, saya mau tanya layanan Optimasi Windows",
    accent: "text-gaming-primary",
  },
  {
    id: "optimasi-low-end",
    category: "Optimize",
    icon: Cpu,
    title: "Optimasi PC Low-End",
    desc: "Solusi khusus untuk PC atau laptop dengan spesifikasi pas-pasan (RAM 4GB/8GB) agar tetap playable.",
    benefits: ["Game berat jadi bisa jalan", "Tidak gampang panas", "Multitasking lebih baik"],
    target: "Laptop Kentang / PC Low-End",
    wa_text: "Halo min, saya mau tanya layanan Optimasi PC Low-End",
    accent: "text-[#25D366]",
  },
  {
    id: "konsultasi",
    category: "Optimize",
    icon: PenTool,
    title: "Konsultasi Performa",
    desc: "Bingung mau upgrade apa? Kami bantu analisa bottleneck pada PC kamu dan berikan rekomendasi terbaik.",
    benefits: ["Analisa akurat", "Rekomendasi hemat", "Solusi tepat sasaran"],
    target: "Gamer yang mau upgrade PC",
    wa_text: "Halo min, saya mau Konsultasi Performa PC saya",
    accent: "text-purple-400",
  },
  {
    id: "setup-emulator",
    category: "SET PC",
    icon: Laptop2,
    title: "Setup Emulator Bluestacks/MSI App Player",
    desc: "Settingan VIP khusus emulator Bluestacks atau MSI agar ringan, anti force close, dan headshot lebih mudah.",
    benefits: [
      "Setting Regedit Tweak",
      "Settingan RAM & CPU ideal",
      "Sensi & DPI config",
      "Free Fire V7A Terbaru",
      "Tweaks Smoothness",
      "Model Phone Emulator Unlock 144 Fps"
    ],
    target: "Pemain Free Fire Emulator",
    wa_text: "Halo min, saya mau tanya layanan Setup Emulator Bluestacks/MSI App Player",
    accent: "text-gaming-cyan",
  },
  {
    id: "ff-emulator-custom",
    category: "SET PC",
    icon: Flame,
    title: "Free Fire & Emulator Custom",
    desc: "Optimasi penuh custom untuk memaksimalkan gameplay FF di PC kamu tanpa lag dan lebih responsif.",
    benefits: [
      "FPS Boost",
      "Mengurangi Input Lag",
      "Mengurangi Recoil Senjata",
      "Anti Force Close Emulator"
    ],
    target: "Gamer Kompetitif",
    wa_text: "Halo min, saya mau tanya layanan Free Fire & Emulator Custom",
    accent: "text-orange-500",
  },
  {
    id: "anti-cheat-laga",
    category: "Anti Cheat",
    icon: ShieldCheck,
    title: "ANTICHEAT LAGA IPAN v1.4.6",
    desc: "Solusi Anticheat untuk Turnamen Free Fire yang Lebih Aman, Fair, dan Profesional. Jangan biarkan laga rusak karena cheat, bypass, atau manipulasi emulator.",
    benefits: [
      "External Cheat & Internal Cheat",
      "Streamer Cheat & Hidden Panel",
      "Kernel Driver Cheat",
      "Metode bypass terbaru",
      "Manipulasi emulator tidak wajar",
      "Modifikasi emulator mencurigakan"
    ],
    target: "Turnamen, Scrim Kompetitif, Event Online",
    wa_text: "Halo min, saya tertarik dengan layanan ANTICHEAT LAGA IPAN v1.4.6",
    accent: "text-red-500",
  },
];

type TabKey = "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";

const TABS: { key: TabKey; label: string }[] = [
  { key: "Optimize", label: "OPTIMIZE" },
  { key: "SET PC", label: "SET PC" },
  { key: "Anti Cheat", label: "ANTI CHEAT" },
  { key: "APP SETTINX", label: "APP SETTINX" },
];

const Layanan = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("Optimize");

  const filteredServices = services.filter((s) => s.category === activeTab);

  return (
    <Layout>
      <SEOHead
        title="Layanan Optimasi PC Gaming, Tweaking Windows & Emulator | IPAN STORE"
        description="Jasa tweaking Windows gaming, optimasi emulator Free Fire, dan optimasi PC low-end via remote. Cocok untuk PC/laptop spek pas-pasan. Proses transparan, bergaransi, konsultasi gratis."
        jsonLd={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: "Layanan", path: "/layanan" },
        ])}
      />

      {/* Section mengalir normal (tanpa ScrollStack pembungkus seluruh halaman). */}
      {/* Hero */}
      <section className="relative pt-24 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        <PageBackground opacity={0.2} />
        {/* Soft glow accents — tema slate, selaras hero live */}
        <div className="absolute top-1/4 -left-24 w-72 h-72 bg-[#94A3B8]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-[#94A3B8]/8 blur-[140px] rounded-full pointer-events-none" />
        <Reveal className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge-accent mb-5 inline-block">OUR SERVICES</span>
          <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-5">
            Layanan{" "}
            <AuroraText
              colors={["#E2E8F0", "#94A3B8", "#CBD5E1", "#E2E8F0"]}
              speed={1.2}
            >
              Optimasi
            </AuroraText>
          </h1>
          <p className="max-w-2xl mx-auto text-zinc-400 leading-relaxed">
            Untuk gamer yang PC/laptop-nya lag, FPS drop saat war, atau emulator berat —
            termasuk spek low-end (RAM 4GB/8GB). Semua pengerjaan dilakukan 100% remote
            via UltraViewer: kamu kirim spesifikasi, kami analisa dan optimasi live,
            kamu tinggal lihat hasilnya. Bergaransi & konsultasi gratis.
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

      {/* Services — kartu MENUMPUK halus saat scroll (tanpa getaran) */}
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
                    {filteredServices.map((s) => (
                      <div key={s.id} className="gaming-card p-6 md:p-8 group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-11 w-11 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center group-hover:border-white/24 transition-colors duration-200">
                        <s.icon className="h-5 w-5 text-[#94A3B8]" strokeWidth={1.75} />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F4F4F5]/50">
                        {s.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold tracking-tight text-[#F4F4F5] mb-2">
                      {s.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      {s.desc}
                    </p>

                    <div className="mb-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mb-3">Benefit Utama:</p>
                      <ul className="space-y-2">
                        {s.benefits.map((b) => (
                          <li key={b} className="flex items-center gap-2.5 text-sm text-zinc-400">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#F4F4F5]/50 shrink-0" strokeWidth={2.5} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6 p-4 rounded-lg bg-[#131314]/60 border border-white/16">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mb-1">Cocok Untuk</p>
                      <p className="text-sm font-medium text-[#F4F4F5]">{s.target}</p>
                    </div>

                    {s.link ? (
                      <Button asChild variant="outline" className="w-full mt-auto">
                        <Link to={s.link}>
                          Detail Layanan
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="w-full mt-auto">
                        <a
                          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(s.wa_text || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Tanya Layanan Ini
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </a>
                      </Button>
                    )}
                      </div>
                    ))}
                  </ScrollStackCards>
                </div>
              )}
            </div>
          </section>

        {/* IPAN APP SettinX — Section Terpisah */}
        {activeTab !== "APP SETTINX" && (
          <AppSettinxSection />
        )}
    </Layout>
  );
};

export default Layanan;
