import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gauge, Cpu, Users, ShieldCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { WA_LINK } from "./FloatingWhatsApp";
import AnimatedCounter from "./AnimatedCounter";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden pt-24 pb-16 lg:pt-32">
      {/* Background & Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-15 mix-blend-luminosity animate-pan-image origin-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060A14]/80 via-[#060A14]/60 to-[#060A14]" />
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-gaming-primary/20 blur-[120px] rounded-full animate-float-fast pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gaming-accent/20 blur-[140px] rounded-full animate-float-fast delay-300 pointer-events-none" />
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-6xl flex flex-col items-center">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-up">
          <span className="gaming-badge-accent flex items-center gap-1">
            FAST RESPONSE
          </span>
          <span className="gaming-badge text-white">#1 JASA OPTIMASI PC</span>
          <span className="gaming-badge text-white">BOOST FPS FREE FIRE</span>
        </div>

        {/* Main heading */}
        <div className="text-center max-w-5xl mx-auto mb-6 relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-visible pointer-events-none">
            <div className="absolute w-[150%] h-[120%] bg-gradient-to-r from-transparent via-gaming-primary/10 to-transparent blur-[80px] animate-pulse-glow-fast" />
            <div className="absolute w-[200%] h-32 bg-gradient-to-r from-transparent via-gaming-accent/20 to-transparent blur-[40px] animate-sweep" />
          </div>

          <h1 className="h1-clamp font-display font-bold text-white tracking-tight animate-fade-up delay-100">
            Optimasi PC Gaming & <br className="hidden sm:block" />
            <span className="text-gradient-blue">Boost FPS Free Fire</span>
          </h1>
        </div>

        <p className="max-w-2xl mx-auto text-center text-muted-foreground body-clamp animate-fade-up delay-200 mb-10">
          IPAN STORE membantu optimasi PC/laptop gaming agar terasa lebih ringan, responsif, dan nyaman digunakan bermain, terutama untuk kebutuhan Free Fire.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-300 w-full sm:w-auto px-4 sm:px-0">
          <Button asChild variant="gaming-glow" size="xl" className="w-full sm:w-auto">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Optimasi Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button asChild variant="gaming-outline" size="xl" className="w-full sm:w-auto rounded-xl">
            <Link to="/layanan">Lihat Layanan</Link>
          </Button>
        </div>

        {/* Performance Dashboard / Stats Visual */}
        <div className="mt-16 w-full max-w-4xl mx-auto animate-fade-up delay-500">
          <div className="gaming-card p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 relative overflow-visible">
            {/* Top accent glow line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-gaming-accent to-transparent" />
            
            <div className="flex-1 flex items-center gap-3 sm:gap-4 text-left w-full">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-gaming-primary/20 border border-gaming-primary/30 flex items-center justify-center text-gaming-accent shrink-0 shadow-glow-sm">
                <Gauge className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">FPS Boost</p>
                <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">UP TO <span className="text-gaming-cyan"><AnimatedCounter end={240} duration={1500} suffix="+" /></span></p>
              </div>
            </div>

            <div className="hidden md:block w-[1px] h-16 bg-white/10" />
            <div className="md:hidden w-full h-[1px] bg-white/5" />

            <div className="flex-1 flex items-center gap-3 sm:gap-4 text-left w-full">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-gaming-primary/20 border border-gaming-primary/30 flex items-center justify-center text-gaming-accent shrink-0 shadow-glow-sm">
                <Cpu className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Performance</p>
                <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white"><AnimatedCounter end={100} duration={1500} suffix="%" /> <span className="text-gaming-cyan">STABLE</span></p>
              </div>
            </div>

            <div className="hidden md:block w-[1px] h-16 bg-white/10" />
            <div className="md:hidden w-full h-[1px] bg-white/5" />

            <div className="flex-1 flex items-center gap-3 sm:gap-4 text-left w-full">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0 shadow-[0_0_15px_rgba(37,211,102,0.2)]">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Klien Puas</p>
                <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white"><AnimatedCounter end={500} duration={2000} suffix="+" /> <span className="text-[#25D366]">USER</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
