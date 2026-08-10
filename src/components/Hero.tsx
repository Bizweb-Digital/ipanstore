import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { WA_LINK } from "./FloatingWhatsApp";
import AnimatedCounter from "./AnimatedCounter";
import VariableProximity from "./VariableProximity";

const Hero = () => {
  // Ref container untuk area pelacakan mouse VariableProximity — mencakup
  // seluruh hero section agar efek ketebalan font mengikuti kursor di area
  // heading. Aman untuk mobile (fallback: jika tidak ada pointer mouse,
  // efek tetap aktif via touchmove).
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={heroRef} className="relative flex flex-col justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
      {/* Lapisan dasar solid — efek Scanner global sudah dirender di Layout
          sebagai background fixed, jadi tidak perlu Scanner kedua di sini
          (menghemat satu WebGL context). */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#1a1a1a]/60" />
      {/* Gradient fade ke background di bawah hero untuk transisi halus */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1a1a1a] to-transparent z-[1]" />

      <div className="relative z-10 container mx-auto px-4 max-w-5xl flex flex-col items-center">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-6 animate-fade-up">
          <span className="gaming-badge-accent flex items-center gap-1">
            FAST RESPONSE
          </span>
          <span className="gaming-badge">#1 JASA OPTIMASI PC</span>
          <span className="gaming-badge">BOOST FPS FREE FIRE</span>
        </div>

        {/* Main heading — Variable Proximity (React Bits).
            Teks dipecah per-huruf; ketebalan font (wght) & optical size (opsz)
            diinterpolasi berdasarkan jarak kursor ke tiap huruf.
            fromFontVariationSettings = kondisi normal (ringan),
            toFontVariationSettings = kondisi dekat kursor (tebal & besar).
            radius 120 agar area pengaruh cukup luas (mobile-friendly: tidak
            perlu hover presisi tinggi). falloff gaussian untuk transisi
            mulus. */}
        <h1 className="h1-clamp text-center font-bold tracking-tight text-[#F4F4F5] mb-5 animate-fade-up delay-100">
          <VariableProximity
            label="Optimasi PC Gaming & Boost FPS Free Fire"
            fromFontVariationSettings="'wght' 400, 'opsz' 9"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={heroRef}
            radius={120}
            falloff="gaussian"
          />
        </h1>

        <p className="max-w-2xl mx-auto text-center text-zinc-400 body-clamp mb-8 leading-relaxed animate-fade-up delay-200">
          IPAN STORE membantu optimasi PC/laptop gaming agar terasa lebih ringan,
          responsif, dan nyaman digunakan bermain, terutama untuk kebutuhan Free Fire.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-300 w-full sm:w-auto px-4 sm:px-0">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="shimmer-cta w-full sm:w-auto"
          >
            Optimasi Sekarang
            <ArrowRight className="h-5 w-5" />
          </a>
          <Button asChild variant="gaming-outline" size="xl" className="w-full sm:w-auto">
            <Link to="/layanan">Lihat Layanan</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-12 w-full max-w-4xl mx-auto animate-fade-up delay-500">
           <div className="gaming-card grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/16">
            <div className="px-6 py-6 md:py-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                FPS Boost
              </p>
              <p className="font-mono text-2xl md:text-3xl font-semibold text-[#F4F4F5]">
                UP TO{" "}
                <span className="text-[#94A3B8]">
                  <AnimatedCounter end={240} duration={1500} suffix="+" />
                </span>
              </p>
            </div>

            <div className="px-6 py-6 md:py-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Performance
              </p>
              <p className="font-mono text-2xl md:text-3xl font-semibold text-[#F4F4F5]">
                <AnimatedCounter end={100} duration={1500} suffix="%" />{" "}
                <span className="text-zinc-400">STABLE</span>
              </p>
            </div>

            <div className="px-6 py-6 md:py-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Klien Puas
              </p>
              <p className="font-mono text-2xl md:text-3xl font-semibold text-[#F4F4F5]">
                <AnimatedCounter end={500} duration={2000} suffix="+" />{" "}
                <span className="text-zinc-400">USER</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
