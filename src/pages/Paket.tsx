import { useState } from "react";
import {
  Check,
  X as XIcon,
  ArrowRight,
  MousePointer2,
  Crosshair,
  Activity,
  Rocket,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SettinxGallery from "@/components/SettinxGallery";

/* ─── Paket Data ─── */
type Pkg = {
  id: string;
  category: "Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX";
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
};

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

const packages: Pkg[] = [
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
};

const FeatureCheck = ({ ok, highlight = false }: { ok: boolean; highlight?: boolean }) =>
  ok ? (
    <div className="flex justify-center items-center">
      <Check
        className={`h-5 w-5 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] ${
          highlight
            ? "h-6 w-6 text-gaming-accent drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            : "text-gaming-cyan"
        }`}
        strokeWidth={3}
      />
    </div>
  ) : (
    <div className="flex justify-center items-center">
      <XIcon className="h-4 w-4 text-muted-foreground/30" strokeWidth={2} />
    </div>
  );

const Paket = () => {
  const { ref: tableRef, revealed: tableRevealed } = useScrollReveal<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<"Optimize" | "SET PC" | "Anti Cheat" | "APP SETTINX">("Optimize");

  const filteredPackages = packages.filter((p) => p.category === activeTab);
  const filteredComparison = comparisonFeatures.filter((f) => f.category === activeTab);

  return (
    <Layout>
      <SEOHead
        title="Paket Optimasi Gaming & IPAN APP SettinX | IPAN STORE"
        description="Pilih paket optimasi PC gaming IPAN STORE mulai dari Rp 20.000: SET PC, Standart, Elite, Extreme, AntiCheat Laga, dan IPAN APP SettinX (hemat Rp 25.000 dari Rp 100.000). Konsultasi gratis via WhatsApp."
        keywords="paket optimasi PC, harga boost FPS Free Fire, IPAN APP SettinX, tweak emulator, jasa optimasi gaming murah"
      />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-[#060A14]">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge-accent mb-4 inline-block">PRICING</span>
          <h1 className="h1-clamp font-display font-bold text-white mt-4 mb-6 leading-tight animate-fade-up">
            Pilih Paket <span className="text-gaming-accent">Optimasi</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-up delay-100 body-clamp">
            Pilih paket yang sesuai kebutuhan kamu. Semua paket include garansi dan konsultasi gratis via WhatsApp.
          </p>

          {/* Tabs */}
          <div className="mt-12 flex justify-center animate-fade-up delay-200">
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

      {/* Package Cards */}
      <section className="relative py-16 md:py-24 min-h-[50vh]">
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

                {/* Preview Gallery */}
                <div className="mt-12">
                  <div className="text-center mb-6">
                    <h4 className="font-display text-lg md:text-xl font-black text-white uppercase tracking-wider">
                      Preview <span className="text-gaming-accent">Tampilan Aplikasi</span>
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Klik foto untuk melihat lebih detail.
                    </p>
                  </div>
                  <SettinxGallery />
                </div>
              </div>
            </div>
          ) : (
            <div key={activeTab} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredPackages.map((p, index) => {
                const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                  `Halo min, saya mau pesan paket ${p.name} (${p.price})`
                )}`;
                return (
                  <div
                    key={p.name}
                    className={`relative p-6 lg:p-8 flex flex-col gaming-card animate-fade-right ${
                      p.popular
                        ? "border-gaming-accent shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                        : ""
                    }`}
                    style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}
                  >
                    {p.highlight && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-gaming-accent text-[#060A14] text-[10px] font-bold px-3 py-1 rounded-b-lg tracking-wider uppercase">
                        {p.highlight}
                      </span>
                    )}

                    <h3 className="font-display text-lg lg:text-xl font-bold uppercase tracking-wide text-white mt-4 mb-2">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-4xl font-black text-gaming-accent">
                        {p.price}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-gaming-accent mt-0.5 shrink-0" strokeWidth={2.5} />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button asChild variant={p.popular ? "gaming-glow" : "outline"} className="w-full">
                      <a href={wa} target="_blank" rel="noopener noreferrer">
                        Pesan via WhatsApp
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

{/* Comparison Table */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="section-subheading">Perbandingan</span>
            <h2 className="h2-clamp font-display font-bold text-white mt-4 mb-4">
              {activeTab === "APP SETTINX"
                ? <>Kenapa <span className="text-gaming-accent">IPAN APP SETTINX</span> Paling Unggul?</>
                : <>Banding kan <span className="text-gaming-accent">Paket {activeTab}</span></>}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === "APP SETTINX"
                ? "Satu paket ini sudah mencakup semua fitur dari paket Optimize, SET PC, dan Anti Cheat dengan lisensi lifetime."
                : "Cek fitur yang tersedia secara mendetail di setiap paket. IPAN APP SettinX tetap ditampilkan sebagai acuan paket terlengkap."}
            </p>
          </div>

          <div
            ref={tableRef}
            className={`max-w-6xl mx-auto scroll-reveal ${tableRevealed ? "revealed" : ""}`}
          >
            <p className="text-xs text-muted-foreground/60 text-center mb-3 lg:hidden">
              Geser tabel ke samping untuk melihat semua fitur
            </p>
            <div key={activeTab} className="gaming-table-wrapper overflow-x-auto shadow-glow-sm animate-fade-right" style={{ animationDelay: '300ms' }}>
              <table className="w-full min-w-[900px] gaming-table">
                <thead>
                  <tr>
                    <th className="text-left font-display tracking-widest uppercase text-gaming-accent min-w-[220px]">
                      Fitur
                    </th>
                    {filteredPackages.map((p) => (
                      <th key={p.name} className="min-w-[120px] pb-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-white text-sm font-bold uppercase">{p.name}</span>
                          <span className="text-gaming-accent text-lg font-black bg-gaming-primary/10 px-3 py-0.5 rounded-full border border-gaming-primary/20">{p.price}</span>
                        </div>
                      </th>
                    ))}
                    {/* Kolom IPAN APP SETTINX — selalu tampil */}
                    <th className="min-w-[170px] pb-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-gaming-accent/15 via-gaming-accent/5 to-transparent pointer-events-none" />
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <span className="inline-block bg-gaming-accent text-[#060A14] text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-widest uppercase shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                          {SETTINX_COL.badge}
                        </span>
                        <span className="text-white text-sm font-bold uppercase">{SETTINX_COL.name}</span>
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-muted-foreground/60 text-xs line-through font-semibold">{SETTINX_COL.priceOld}</span>
                          <span className="text-gaming-accent text-lg font-black bg-gaming-accent/15 px-3 py-0.5 rounded-full border border-gaming-accent/40 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                            {SETTINX_COL.priceNew}
                          </span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComparison.map((f) => (
                    <tr key={f.name}>
                      <td className="text-left font-medium text-white/90">{f.name}</td>
                      {filteredPackages.map((p) => (
                        <td key={p.name}><FeatureCheck ok={f[p.name]} /></td>
                      ))}
                      <td className="relative bg-gaming-accent/[0.04] border-l border-r border-gaming-accent/20">
                        <FeatureCheck ok={f[SETTINX_COL.name]} highlight />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <p className="text-xs text-muted-foreground italic max-w-md">
                Kolom IPAN APP SettinX ditampilkan sebagai pembanding. Semua paket memiliki centang penuh dibanding paket lain di kategori ini.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild variant="whatsapp" size="xl" className="animate-pulse-glow shadow-glow-sm rounded-2xl w-full sm:w-auto">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau pilih paket setelah melihat tabel perbandingan")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  Pilih Paket via WhatsApp
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="gaming-glow" size="xl" className="rounded-2xl w-full sm:w-auto">
                <a href={SETTINX_WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  Beli IPAN APP SETTINX
                  <BadgeCheck className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Paket;
