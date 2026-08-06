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

// Based on the new 4 packages requirement
const packages: Pkg[] = [
  {
    name: "SET PC",
    price: "Rp 50.000",
    features: [
      "Emulator ringan",
      "Keybind emulator",
      "Sensi X & Y",
      "FF V7A Boost FPS",
      "DPI Mouse setting",
      "Regedit & Tweaks",
    ],
  },
  {
    name: "STANDART",
    price: "Rp 50.000",
    features: [
      "Semua spek PC/Laptop",
      "Tanpa install ulang",
      "Boost FPS semua game",
      "Optimize CPU, RAM, GPU",
      "Windows Mod by Ipan",
      "Cocok daily use",
    ],
  },
  {
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
    name: "EXTREME",
    price: "Rp 150.000",
    highlight: "PRO CHOICE",
    features: [
      "Semua fitur lengkap",
      "Performance maksimal",
      "Windows Mod by Ipan",
      "Boost FPS maksimal",
      "Reduce latency",
      "Emulator optimization",
    ],
  },
];

const PackagesPreview = () => {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-20 md:py-28 scroll-mt-20 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="section-subheading">Produk & Layanan</span>
          <h2 className="h2-clamp font-display font-bold text-white mb-6">
            Pilih Paket <span className="text-gaming-accent">Optimasi Terbaik</span>
          </h2>
          <p className="text-muted-foreground body-clamp max-w-2xl mx-auto">
            Harga ramah pelajar, hasil maksimal. Konsultasi dulu via WhatsApp gratis untuk menentukan paket yang pas.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto scroll-reveal-stagger ${revealed ? "revealed" : ""}`}
        >
          {packages.map((p) => {
            const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
              `Halo min, saya mau pesan paket ${p.name} (${p.price})`
            )}`;
            return (
              <div
                key={p.name}
                className={`gaming-card p-6 lg:p-8 flex flex-col ${
                  p.popular ? "border-gaming-accent shadow-[0_0_20px_rgba(56,189,248,0.15)]" : ""
                }`}
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
                    Pesan Sekarang
                  </a>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button asChild variant="link" size="lg" className="text-muted-foreground hover:text-white">
            <Link to="/paket" className="flex items-center">
              Lihat Perbandingan Lengkap
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackagesPreview;
