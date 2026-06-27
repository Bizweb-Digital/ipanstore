import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "./FloatingWhatsApp";

type Pkg = {
  emoji: string;
  name: string;
  price: string;
  highlight?: string;
  features: string[];
  popular?: boolean;
};

const packages: Pkg[] = [
{
    name: "SET PC",
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

const Packages = () => {
  return (
    <section id="layanan" className="relative py-24 md:py-32 scroll-mt-20">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
            Produk & Layanan
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-6">
            Pilih Paket <span className="text-gradient">Yang Ingin Anda Coba</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Harga ramah pelajar, hasil maksimal. Konsultasi dulu via WhatsApp gratis.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((p) => {
            const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
              `Halo min, saya mau pesan paket ${p.name} (${p.price})`
            )}`;
            return (
              <div
                key={p.name}
                className={`relative rounded-2xl p-7 flex flex-col transition-[var(--transition-smooth)] hover:-translate-y-2 ${
                  p.popular
                    ? "glass-strong shadow-elevated border-primary/40"
                    : "glass hover:border-primary/40 hover:shadow-elevated"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-glow">
                    {p.highlight}
                  </span>
                )}

                <div className="text-4xl mb-3">{p.emoji}</div>
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
  );
};

export default Packages;
