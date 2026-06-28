import { useState } from "react";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── Paket Data ─── */
type Pkg = {
  id: string;
  category: "Optimize" | "SET PC";
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
};

const packages: Pkg[] = [
  {
    id: "set-pc",
    category: "SET PC",
    name: "SET PC",
    price: "50K",
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
    price: "20K",
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
    price: "50K",
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
    price: "100K",
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
    price: "150K",
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
];

/* Comparison Data */
const comparisonFeatures = [
  // SET PC Features
  { name: "Setting Regedit Tweak", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false },
  { name: "Settingan RAM & CPU ideal", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false },
  { name: "Sensi & DPI config", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false },
  { name: "Free Fire V7A Terbaru", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true },
  { name: "Tweaks Smoothness", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false },
  { name: "Model Phone Unlock 144 Fps", category: "SET PC", "SET PC": true, "Custom FF & Emulator": false },
  { name: "FPS Boost", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true },
  { name: "Mengurangi Input Lag", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true },
  { name: "Mengurangi Recoil Senjata", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true },
  { name: "Anti Force Close Emulator", category: "SET PC", "SET PC": true, "Custom FF & Emulator": true },

  // Optimize Features
  { name: "Regedit & Tweaks", category: "Optimize", STANDART: true, ELITE: false, EXTREME: true },
  { name: "Optimize CPU/RAM/GPU", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Boost FPS semua game", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Tanpa install ulang", category: "Optimize", STANDART: true, ELITE: false, EXTREME: false },
  { name: "Reduce latency", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Windows Mod by Ipan", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Lebih ringan & responsif", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Cocok daily use", category: "Optimize", STANDART: true, ELITE: true, EXTREME: true },
  { name: "Semua fitur lengkap", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true },
  { name: "Performance maksimal", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true },
  { name: "Emulator & Keybind", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true },
  { name: "Sensi X & Y", category: "Optimize", STANDART: false, ELITE: false, EXTREME: true },
];

const FeatureCheck = ({ ok }: { ok: boolean }) =>
  ok ? (
    <div className="flex justify-center items-center">
      <Check className="h-5 w-5 text-gaming-cyan drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" strokeWidth={3} />
    </div>
  ) : (
    <div className="flex justify-center items-center">
      <XIcon className="h-4 w-4 text-muted-foreground/30" strokeWidth={2} />
    </div>
  );

const Paket = () => {
  const { ref: tableRef, revealed: tableRevealed } = useScrollReveal<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<"Optimize" | "SET PC">("Optimize");

  const filteredPackages = packages.filter((p) => p.category === activeTab);
  const filteredComparison = comparisonFeatures.filter((f) => f.category === activeTab);

  return (
    <Layout>
      <SEOHead
        title="Paket Optimasi Gaming | IPAN STORE"
        description="Pilih paket optimasi PC gaming IPAN STORE sesuai kebutuhan device, mulai dari basic tuning hingga full optimization."
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
            </div>
          </div>
        </div>
      </section>

      {/* Package Cards */}
      <section className="relative py-16 md:py-24 min-h-[50vh]">
        <div className="container mx-auto px-4">
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
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="section-subheading">Perbandingan</span>
            <h2 className="h2-clamp font-display font-bold text-white mt-4 mb-4">
              Bandingkan <span className="text-gaming-accent">Paket {activeTab}</span>
            </h2>
            <p className="text-muted-foreground">
              Cek fitur yang tersedia secara mendetail di setiap paket.
            </p>
          </div>

          <div
            ref={tableRef}
            className={`max-w-5xl mx-auto scroll-reveal ${tableRevealed ? "revealed" : ""}`}
          >
            <div key={activeTab} className="gaming-table-wrapper overflow-x-auto shadow-glow-sm animate-fade-right" style={{ animationDelay: '300ms' }}>
              <table className="w-full min-w-[768px] gaming-table">
                <thead>
                  <tr>
                    <th className="text-left font-display tracking-widest uppercase text-gaming-accent min-w-[220px]">
                      Fitur Optimasi
                    </th>
                    {filteredPackages.map((p) => (
                      <th key={p.name} className="min-w-[120px] pb-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-white text-sm font-bold uppercase">{p.name}</span>
                          <span className="text-gaming-accent text-lg font-black bg-gaming-primary/10 px-3 py-0.5 rounded-full border border-gaming-primary/20">{p.price}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredComparison.map((f: any) => (
                    <tr key={f.name}>
                      <td className="text-left font-medium text-white/90">{f.name}</td>
                      {filteredPackages.map((p) => (
                        <td key={p.name}><FeatureCheck ok={f[p.name]} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 text-center">
              <Button asChild variant="whatsapp" size="xl" className="animate-pulse-glow shadow-glow-sm rounded-2xl">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau pilih paket setelah melihat tabel perbandingan")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pilih Paket via WhatsApp
                  <ArrowRight className="ml-2 h-5 w-5" />
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
