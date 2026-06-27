import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { WA_LINK } from "./FloatingWhatsApp";
import AnimatedCounter from "./AnimatedCounter";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* BG */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-50 animate-pan-image origin-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* Floating glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/30 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[hsl(217_91%_60%)]/30 blur-[140px] animate-float delay-300" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-glow mb-8 animate-fade-up">
          <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            #1 Jasa Optimasi PC Gaming Indonesia
          </span>
        </div>

        <div className="relative">
          {/* Animated background elements behind text */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-visible pointer-events-none">
            <div className="absolute w-[150%] h-[120%] bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-[80px] animate-glow-pulse" />
            <div className="absolute w-[200%] h-32 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent blur-[40px] animate-sweep" />
            <div className="absolute w-[200%] h-16 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-[20px] animate-sweep-slow" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.05] animate-fade-up delay-100">
            BOOST FPS <br className="hidden sm:block" />
            <span className="text-gradient">TANPA BATAS,</span>
            <br />
            <span className="text-neon">PC JADI GACOR!</span>
          </h1>
        </div>

        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 animate-fade-up delay-200 px-2 sm:px-0">
          Jasa optimasi PC & emulator profesional khusus gamer Free Fire.
          Tingkatkan FPS, kurangi lag, gameplay jadi <span className="text-primary font-semibold">smooth maksimal</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-up delay-300 w-full sm:w-auto px-4 sm:px-0">
          <Button asChild variant="hero" size="xl" className="animate-glow-pulse w-full sm:w-auto">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Chat WhatsApp Sekarang
              <ArrowRight className="ml-1" />
            </a>
          </Button>
          <Button asChild variant="neon" size="xl" className="w-full sm:w-auto">
            <Link to="/layanan">Lihat Paket</Link>
          </Button>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto animate-fade-up delay-500 w-full">
          {[
            { v: <AnimatedCounter end={500} duration={2000} suffix="+" />, l: "Klien Puas" },
            { v: "24/7", l: "Online Support" },
            { v: "100%", l: "Garansi Gacor" },
          ].map((s) => (
            <div key={s.l} className="glass-panel border-glow rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-6 hover:border-primary/40 transition-colors flex flex-col justify-center">
              <div className="font-mono text-xl sm:text-2xl md:text-4xl font-black text-gradient">{s.v}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider leading-tight">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
