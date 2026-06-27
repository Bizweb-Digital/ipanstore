import { Check, X as XIcon, Gamepad2, Laptop, Zap, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── Data ─── */
type Pkg = {
  name: string;
  shortName: string;
  price: string;
  highlight?: string;
  features: string[];
  popular?: boolean;
};

const packages: Pkg[] = [
  {
    name: "SET PC",
    shortName: "SET PC",
    price: "50K",
    features: [
      "Emulator ringan",
      "Keybind emulator",
      "Sensi X & Y",
      "Free Fire V7A Boost FPS",
      "DPI Mouse",
      "Regedit & Tweaks",
    ],
  },
  {
    name: "Standart Optimizer PC",
    shortName: "Standart",
    price: "50K",
    features: [
      "Semua spek PC/Laptop",
      "Tanpa install ulang",
      "Boost FPS semua game",
      "Optimize CPU, RAM, GPU",
      "Reduce latency",
    ],
  },
  {
    name: "Elite Optimizer",
    shortName: "Elite",
    price: "100K",
    popular: true,
    highlight: "Paling Laris",
    features: [
      "Windows Mod by Ipan",
      "Boost FPS",
      "Lebih ringan & responsif",
      "Cocok untuk daily use",
    ],
  },
  {
    name: "Extreme Optimizer",
    shortName: "Extreme",
    price: "150K",
    highlight: "Pro Choice",
    features: [
      "Semua fitur lengkap",
      "Windows Mod",
      "Performance maksimal",
      "Optimize total PC",
    ],
  },
];

/* Comparison features */
const comparisonFeatures = [
  { name: "Emulator ringan", setpc: true, standart: false, elite: false, extreme: true },
  { name: "Keybind emulator", setpc: true, standart: false, elite: false, extreme: true },
  { name: "Sensi X & Y", setpc: true, standart: false, elite: false, extreme: true },
  { name: "FF V7A Boost FPS", setpc: true, standart: false, elite: false, extreme: true },
  { name: "DPI Mouse setting", setpc: true, standart: false, elite: false, extreme: true },
  { name: "Regedit & Tweaks", setpc: true, standart: true, elite: false, extreme: true },
  { name: "Optimize CPU/RAM/GPU", setpc: false, standart: true, elite: true, extreme: true },
  { name: "Boost FPS semua game", setpc: false, standart: true, elite: true, extreme: true },
  { name: "Tanpa install ulang", setpc: false, standart: true, elite: false, extreme: false },
  { name: "Reduce latency", setpc: false, standart: true, elite: false, extreme: true },
  { name: "Windows Mod by Ipan", setpc: false, standart: false, elite: true, extreme: true },
  { name: "Lebih ringan & responsif", setpc: false, standart: false, elite: true, extreme: true },
  { name: "Cocok daily use", setpc: false, standart: false, elite: true, extreme: true },
  { name: "Semua fitur lengkap", setpc: false, standart: false, elite: false, extreme: true },
  { name: "Performance maksimal", setpc: false, standart: false, elite: false, extreme: true },
];

const recommendations = [
  {
    icon: Gamepad2,
    title: "Main FF di Emulator",
    desc: "Kamu fokus main Free Fire via emulator dan butuh keybind, sensi, dan boost FPS khusus FF.",
    paket: "SET PC",
    harga: "50K",
    reason: "Fokus emulator & keybind FF — spesifik untuk player emulator",
    color: "from-emerald-500 to-cyan-500",
  },
  {
    icon: Laptop,
    title: "PC Lemot, Budget Tipis",
    desc: "PC/Laptop lama mulai lag tapi belum mau install ulang. Butuh boost performa tanpa ribet.",
    paket: "Standart Optimizer",
    harga: "50K",
    reason: "Optimasi tanpa install ulang — cocok untuk budget terbatas",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Zap,
    title: "Daily Use + Gaming Smooth",
    desc: "Butuh PC yang ringan buat kerja/sekolah sekaligus smooth buat gaming harian.",
    paket: "Elite Optimizer",
    harga: "100K",
    reason: "Windows Mod + optimasi — balance antara daily use dan gaming",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: Trophy,
    title: "Pro Player / Streamer",
    desc: "Butuh performa paling maksimal untuk competitive gaming atau streaming.",
    paket: "Extreme Optimizer",
    harga: "150K",
    reason: "Semua fitur lengkap — performa MAX tanpa kompromi",
    color: "from-violet-500 to-purple-600",
  },
];

/* ─── CheckIcon / XIcon helper ─── */
const FeatureCheck = ({ ok }: { ok: boolean }) =>
  ok ? (
    <Check className="h-5 w-5 text-primary mx-auto" strokeWidth={3} />
  ) : (
    <XIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" strokeWidth={2} />
  );

/* ─── Page ─── */
const Layanan = () => {
  const { ref: tableRef, revealed: tableRevealed } = useScrollReveal<HTMLDivElement>();
  const { ref: recoRef, revealed: recoRevealed } = useScrollReveal<HTMLDivElement>();

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <PageTransition>
        {/* Hero section */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[hsl(217_91%_60%)]/20 blur-[140px]" />

          <div className="container mx-auto px-4 relative text-center">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
              Produk & Layanan
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mt-4 mb-6 leading-tight animate-fade-up">
              Paket <span className="text-gradient">Optimasi PC</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-up delay-100">
              Pilih paket yang sesuai kebutuhan kamu. Semua paket include garansi
              dan konsultasi gratis via WhatsApp.
            </p>
          </div>
        </section>

        {/* ─── Package Cards ─── */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((p) => {
                const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                  `Halo min, saya mau pesan paket ${p.name} (${p.price})`
                )}`;
                return (
                  <div
                    key={p.name}
                    className={`relative rounded-2xl p-7 flex flex-col transition-all duration-400 hover:-translate-y-2 border-glow ${
                      p.popular
                        ? "glass-panel border-primary/40 shadow-elevated"
                        : "glass-panel border-primary/10 hover:border-primary/40 hover:shadow-elevated"
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-glow">
                        {p.highlight}
                      </span>
                    )}

                    <h3 className="font-display text-xl font-bold mb-1">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="font-display text-4xl font-black text-gradient">
                        {p.price}
                      </span>
                    </div>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button asChild variant={p.popular ? "hero" : "neon"} className="w-full">
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

        {/* ─── Comparison Table ─── */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
                Perbandingan
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-4">
                Bandingkan <span className="text-gradient">Semua Paket</span>
              </h2>
              <p className="text-muted-foreground">
                Cek fitur yang tersedia di setiap paket dan pilih yang paling sesuai.
              </p>
            </div>

            <div
              ref={tableRef}
              className={`max-w-5xl mx-auto scroll-reveal ${tableRevealed ? "revealed" : ""}`}
            >
              <div className="comparison-table overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="text-left min-w-[200px]">Fitur</th>
                      {packages.map((p) => (
                        <th key={p.shortName} className="min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span>{p.shortName}</span>
                            <span className="text-gradient text-base font-black">{p.price}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((f) => (
                      <tr key={f.name}>
                        <td className="feature-name">{f.name}</td>
                        <td><FeatureCheck ok={f.setpc} /></td>
                        <td><FeatureCheck ok={f.standart} /></td>
                        <td><FeatureCheck ok={f.elite} /></td>
                        <td><FeatureCheck ok={f.extreme} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Recommendations ─── */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
                Rekomendasi
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-4">
                Paket Mana yang <span className="text-gradient">Cocok untuk Kamu?</span>
              </h2>
              <p className="text-muted-foreground">
                Sesuaikan dengan kebutuhan kamu biar nggak salah pilih.
              </p>
            </div>

            <div
              ref={recoRef}
              className={`grid md:grid-cols-2 gap-6 max-w-5xl mx-auto scroll-reveal-stagger ${recoRevealed ? "revealed" : ""}`}
            >
              {recommendations.map((r) => {
                const Icon = r.icon;
                const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                  `Halo min, saya tertarik paket ${r.paket} (${r.harga}). Kebutuhan saya: ${r.title}`
                )}`;
                return (
                  <div key={r.title} className="recommendation-card">
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shadow-lg`}
                      >
                        <Icon className="h-7 w-7" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-bold mb-1">{r.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {r.desc}
                        </p>
                        <div className="glass-panel border-glow rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Rekomendasi:</div>
                              <div className="font-display font-bold text-foreground">
                                {r.paket}{" "}
                                <span className="text-gradient">({r.harga})</span>
                              </div>
                            </div>
                            <Button asChild variant="hero" size="sm">
                              <a href={wa} target="_blank" rel="noopener noreferrer">
                                Pesan
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {r.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[140px]" />

          <div className="container mx-auto px-4 relative text-center">
            <h2 className="font-display text-3xl md:text-5xl font-black mb-6">
              Masih <span className="text-gradient">Bingung?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Konsultasi gratis via WhatsApp. Admin siap bantu pilihkan paket terbaik untuk PC kamu.
            </p>
            <Button asChild variant="hero" size="xl" className="animate-glow-pulse">
              <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau konsultasi pilih paket optimasi yang cocok untuk PC saya")}`} target="_blank" rel="noopener noreferrer">
                Konsultasi Gratis Sekarang
                <ArrowRight className="ml-1" />
              </a>
            </Button>
          </div>
        </section>
      </PageTransition>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Layanan;
