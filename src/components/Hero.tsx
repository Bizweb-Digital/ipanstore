import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { WA_LINK } from "./FloatingWhatsApp";

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
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* Floating glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/30 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[hsl(217_91%_60%)]/30 blur-[140px] animate-float delay-300" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 animate-fade-up">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            #1 Jasa Optimasi PC Gaming Indonesia
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] animate-fade-up delay-100">
          BOOST FPS <br />
          <span className="text-gradient">TANPA BATAS,</span>
          <br />
          <span className="text-neon">PC JADI GACOR!</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-fade-up delay-200">
          Jasa optimasi PC & emulator profesional khusus gamer Free Fire.
          Tingkatkan FPS, kurangi lag, gameplay jadi <span className="text-primary font-semibold">smooth maksimal</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-300">
          <Button asChild variant="hero" size="xl" className="animate-glow-pulse">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Chat WhatsApp Sekarang
              <ArrowRight className="ml-1" />
            </a>
          </Button>
          <Button asChild variant="neon" size="xl">
            <Link to="/layanan">Lihat Paket</Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-fade-up delay-500">
          {[
            { v: "500+", l: "Klien Puas" },
            { v: "24/7", l: "Online Support" },
            { v: "100%", l: "Garansi Gacor" },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl p-4 md:p-6">
              <div className="font-display text-2xl md:text-4xl font-black text-gradient">{s.v}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
