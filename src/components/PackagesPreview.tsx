import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { WA_NUMBER } from "./FloatingWhatsApp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type Pkg = {
  name: string;
  price: string;
  highlight?: string;
  features: string[];
  popular?: boolean;
};

const packages: Pkg[] = [
  {
    name: "Standart Optimizer PC",
    price: "50K",
    features: [
      "Semua spek PC/Laptop",
      "Tanpa install ulang",
      "Boost FPS semua game",
      "Optimize CPU, RAM, GPU",
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

const PackagesPreview = () => {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <section id="layanan" className="relative py-24 md:py-32 scroll-mt-20">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
            Produk & Layanan
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-6">
            Pilih Paket <span className="text-gradient">Optimasi Terbaik</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Harga ramah pelajar, hasil maksimal. Konsultasi dulu via WhatsApp gratis.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto scroll-reveal-stagger ${revealed ? "revealed" : ""}`}
        >
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

        <div className="text-center mt-12">
          <Button asChild variant="neon" size="lg">
            <Link to="/layanan">
              Lihat Semua Paket & Perbandingan
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackagesPreview;
