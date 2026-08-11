import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ShineBorder } from "@/components/ui/shine-border";
import Reveal from "@/components/effects/Reveal";
import SplitText from "@/components/effects/SplitText";

type Pkg = {
  name: string;
  price: string;
  highlight?: string;
  features: string[];
  popular?: boolean;
};

/* Map nama paket (preview) → id paket di halaman Order */
const ORDER_ID: Record<string, string> = {
  "SET PC": "set-pc",
  "STANDART": "standart",
  "ELITE": "elite",
  "EXTREME": "extreme",
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
    <section className="relative py-16 md:py-20 scroll-mt-20 overflow-hidden border-t border-zinc-800/60">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-subheading">Produk & Layanan</span>
          <SplitText
            tag="h2"
            text="Pilih Paket Optimasi Terbaik"
            className="h2-clamp font-bold tracking-tight text-zinc-50 mb-4"
            splitType="words"
            threshold={0.2}
          />
          <p className="text-zinc-400 body-clamp">
            Harga ramah pelajar, hasil maksimal. Konsultasi dulu via WhatsApp gratis untuk menentukan paket yang pas.
          </p>
        </Reveal>

        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto pt-3 scroll-reveal-stagger ${revealed ? "revealed" : ""}`}
        >
          {packages.map((p) => {
            const highlighted = Boolean(p.highlight);
            return (
              <div key={p.name} className="gaming-card p-6 lg:p-8 flex flex-col">
                {p.popular && (
                  <ShineBorder
                    borderWidth={1}
                    duration={8}
                    shineColor={["rgba(148,163,184,0)", "rgba(203,213,225,0.9)", "rgba(148,163,184,0)"]}
                  />
                )}

                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
                    {p.name}
                  </h3>
                  {p.highlight && (
                    <span className="gaming-tag shrink-0 whitespace-nowrap text-[#F4F4F5] bg-[#131314] border-white/16">
                      {p.highlight}
                    </span>
                  )}
                </div>

                <div className="mb-6 mt-2">
                  <span className="font-mono text-2xl md:text-[1.7rem] font-bold text-[#F4F4F5] tracking-tight">
                    {p.price}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          p.popular ? "text-[#94A3B8]" : "text-zinc-500"
                        }`}
                        strokeWidth={2.5}
                      />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild variant={p.popular ? "default" : "outline"} className="w-full mt-auto">
                  <Link to={`/order?paket=${ORDER_ID[p.name] ?? ""}`}>
                    Pesan Sekarang
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button asChild variant="link" size="lg" className="text-zinc-400 hover:text-zinc-50">
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
