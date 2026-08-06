import { useState } from "react";
import { ArrowRight, Settings, Cpu, Gauge, Monitor, PenTool, Flame, Laptop2, ShieldCheck, MousePointer2, Crosshair, Activity, Rocket, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SETTINX_WA_LINK = `https://wa.me/6281910123632?text=${encodeURIComponent(
  "Halo Ipan Store, saya ingin membeli dan mendaftarkan akun Ipan App SettinX."
)}`;

const appSettinxFeatures = [
  {
    name: "DragShot Velocity X",
    icon: MousePointer2,
    desc: "Tarikan mouse saat jump shot SG2 jadi lebih ringan & licin. Drag lebih responsif tanpa hentakan keras, shot di udara terasa natural & akurat.",
  },
  {
    name: "OneTap Vector X",
    icon: Crosshair,
    desc: "Alur gerakan mouse terkunci stabil sehingga placement crosshair di duel jarak dekat lebih presisi sejak hit pertama.",
  },
  {
    name: "Neural AimSync X",
    icon: Activity,
    desc: "Delay & akselerasi acak pada pointer dihilangkan. Flick shot merespons refleks tangan secara real-time tanpa jeda.",
  },
  {
    name: "Emulator Overdrive X",
    icon: Rocket,
    desc: "Engine BlueStacks/MSI didorong ke performa maksimal dengan frame pacing terkunci — bebas stuttering saat pasang gloo wall cepat.",
  },
];

const appSettinxBenefits = [
  "Performa PC jauh lebih ringan — background service & cache sampah dibersihkan otomatis.",
  "FPS naik signifikan & frame time lebih stabil saat war ramai.",
  "Setiap tweak aman & teraudit, lengkap dengan fitur snapshot & rollback.",
];

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
  const [activeTab, setActiveTab] = useState<"Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX">("Optimize");

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
            <div className="inline-flex flex-wrap justify-center gap-1.5 p-1.5 bg-[#101827] border border-white/10 rounded-3xl shadow-glow-sm">
              <button
                onClick={() => setActiveTab("Optimize")}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "Optimize"
                    ? "text-white bg-gaming-primary/80 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                OPTIMIZE
              </button>
              <button
                onClick={() => setActiveTab("SET PC")}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "SET PC"
                    ? "text-white bg-gaming-primary/80 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                SET PC
              </button>
              <button
                onClick={() => setActiveTab("Anti Cheat")}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "Anti Cheat"
                    ? "text-white bg-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                ANTI CHEAT
              </button>
              <button
                onClick={() => setActiveTab("APP SETTINX")}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
                  activeTab === "APP SETTINX"
                    ? "text-white bg-gaming-accent/80 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                APP SETTINX
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative pb-24 min-h-[50vh]">
        <div className="container mx-auto px-4">
          {activeTab === "APP SETTINX" ? (
            <div key={activeTab} className="max-w-5xl mx-auto animate-fade-right">
              <div className="relative gaming-card p-6 lg:p-12 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-gaming-accent to-transparent" />
                <span className="absolute top-0 right-6 bg-gaming-accent text-[#060A14] text-[10px] font-bold px-3 py-1 rounded-b-lg tracking-wider uppercase">
                  GRAND LAUNCHING
                </span>

                <div className="text-center mb-10">
                  <span className="gaming-badge-accent mb-4 inline-block">IPAN APP SETTINX V1</span>
                  <h3 className="font-display text-2xl md:text-4xl font-black text-white uppercase tracking-wide mt-4 mb-4">
                    Ipan App <span className="text-gaming-accent">SettinX V1</span>
                  </h3>
                  <p className="max-w-2xl mx-auto text-muted-foreground">
                    Aplikasi tweak premium untuk emulator Free Fire. Optimalkan kontrol, raih FPS tinggi, dan rasakan aiming yang presisi di setiap duel.
                  </p>
                </div>

                {/* Features */}
                <div className="grid sm:grid-cols-2 gap-5 mb-10">
                  {appSettinxFeatures.map((f, i) => (
                    <div
                      key={f.name}
                      className="group rounded-2xl bg-[#0B1120] border border-white/10 p-6 hover:border-gaming-accent/50 transition-all duration-300 hover:-translate-y-1"
                      style={{ animationFillMode: "both", animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gaming-accent/10 border border-gaming-accent/30 flex items-center justify-center group-hover:bg-gaming-accent/20 transition-all">
                          <f.icon className="h-5 w-5 text-gaming-accent" strokeWidth={2} />
                        </div>
                        <h4 className="font-display font-bold text-white uppercase tracking-wide">{f.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <div className="rounded-2xl bg-[#0B1120]/60 border border-white/10 p-6 mb-10">
                  <h4 className="font-display font-bold text-white uppercase tracking-wider mb-5 text-center">
                    Benefit Tweak Menu & Advanced Tweak
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {appSettinxBenefits.map((b) => (
                      <div key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <ShieldCheck className="h-5 w-5 text-gaming-accent mt-0.5 shrink-0" strokeWidth={2} />
                        <span className="leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex flex-col items-center mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-baseline items-center gap-1 sm:gap-3 mb-2">
                    <span className="text-base sm:text-xl text-muted-foreground/50 line-through">Rp 100.000</span>
                    <span className="font-display text-4xl md:text-5xl font-black text-gaming-accent">Rp 75.000</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-6">
                    Bayar sekali, pakai selamanya. Lisensi lifetime (1 akun = 1 PC).
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gaming-accent/10 border border-gaming-accent/30 px-4 py-1.5 text-xs font-bold text-gaming-accent">
                      <BadgeCheck className="h-4 w-4" /> Lisensi Lifetime
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gaming-accent/10 border border-gaming-accent/30 px-4 py-1.5 text-xs font-bold text-gaming-accent">
                      <ShieldCheck className="h-4 w-4" /> Aman dari Error Windows
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Dilengkapi fitur pemulihan System Restore untuk keamanan ekstra.
                  </p>
                </div>

                <div className="text-center">
                  <Button asChild variant="gaming-glow" size="xl" className="w-full sm:w-auto rounded-2xl animate-pulse-glow shadow-glow-sm">
                    <a href={SETTINX_WA_LINK} target="_blank" rel="noopener noreferrer">
                      Beli & Daftarkan Akun Sekarang
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Layanan;
