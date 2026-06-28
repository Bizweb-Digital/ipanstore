import { useState } from "react";
import { ArrowRight, Settings, Cpu, Gauge, Monitor, PenTool, Flame, Laptop2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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

const Layanan = () => {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<"Optimize" | "SET PC" | "Anti Cheat">("Optimize");

  const filteredServices = services.filter((s) => s.category === activeTab);

  return (
    <Layout>
      <SEOHead
        title="Layanan IPAN STORE | Tweaking PC, Boost FPS & Optimasi Gaming"
        description="Lihat layanan IPAN STORE mulai dari boost FPS Free Fire, tweaking PC gaming, optimasi Windows, hingga konsultasi performa device."
      />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-[#060A14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_50%)]" />
        
        {/* Glow Effects (Animated) */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-gaming-primary/20 blur-[120px] rounded-full animate-float-fast pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gaming-accent/20 blur-[140px] rounded-full animate-float-fast delay-300 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-visible pointer-events-none">
              <div className="absolute w-[150%] h-[120%] bg-gradient-to-r from-transparent via-gaming-primary/10 to-transparent blur-[80px] animate-pulse-glow-fast" />
              <div className="absolute w-[200%] h-32 bg-gradient-to-r from-transparent via-gaming-accent/20 to-transparent blur-[40px] animate-sweep" />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="gaming-badge-accent inline-block">OUR SERVICES</span>
              <h1 className="h1-clamp font-display font-bold text-white">
                Layanan <span className="text-gaming-accent">Optimasi</span>
              </h1>
            </div>
          </div>
          
          <p className="max-w-2xl mx-auto text-muted-foreground body-clamp">
            Solusi lengkap untuk segala permasalahan performa PC dan laptop kamu.
            Pilih layanan yang paling sesuai dengan kebutuhanmu.
          </p>

          {/* Tabs */}
          <div className="mt-12 flex justify-center">
            <div className="inline-flex p-1.5 bg-[#101827] border border-white/10 rounded-full shadow-glow-sm">
              <button
                onClick={() => setActiveTab("Optimize")}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "Optimize"
                    ? "text-white bg-gaming-primary/80 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                OPTIMIZE
              </button>
              <button
                onClick={() => setActiveTab("SET PC")}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "SET PC"
                    ? "text-white bg-gaming-primary/80 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                SET PC
              </button>
              <button
                onClick={() => setActiveTab("Anti Cheat")}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "Anti Cheat"
                    ? "text-white bg-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                ANTI CHEAT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative pb-24 min-h-[50vh]">
        <div className="container mx-auto px-4">
          <div
            ref={ref}
            key={activeTab} // re-trigger animation on tab change
            className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto ${revealed ? "revealed" : ""}`}
          >
            {filteredServices.map((s, index) => (
              <div 
                key={s.id} 
                className="gaming-card p-6 md:p-8 flex flex-col group animate-fade-right"
                style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gaming-primary/20 group-hover:border-gaming-primary/50 transition-all duration-500 shadow-glow-sm group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-110">
                    <s.icon className={`h-7 w-7 ${s.accent} transition-transform duration-500 group-hover:scale-110`} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl text-white group-hover:text-gaming-cyan transition-colors duration-300">
                    {s.title}
                  </h3>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 group-hover:text-white/90 transition-colors duration-300">
                  {s.desc}
                </p>

                <div className="mb-8">
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Benefit Utama:</p>
                  <ul className="space-y-2">
                    {s.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white/80 transition-colors duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-gaming-accent group-hover:shadow-[0_0_8px_#38BDF8] transition-shadow duration-300" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-[#060A14] border border-white/5 group-hover:border-gaming-primary/30 transition-colors duration-300">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Cocok Untuk</p>
                  <p className="text-sm font-medium text-white">{s.target}</p>
                </div>

                {s.link ? (
                  <Button asChild variant="gaming-outline" className="w-full mt-auto group-hover:bg-gaming-primary group-hover:text-white group-hover:border-gaming-primary transition-all duration-300">
                    <Link to={s.link}>
                      Detail Layanan
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="gaming-outline" className="w-full mt-auto group-hover:bg-gaming-primary group-hover:text-white group-hover:border-gaming-primary transition-all duration-300">
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(s.wa_text || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tanya Layanan Ini
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Layanan;
