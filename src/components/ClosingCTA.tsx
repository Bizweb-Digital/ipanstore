import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { WA_LINK } from "./FloatingWhatsApp";

const ClosingCTA = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center glass-strong rounded-3xl p-10 md:p-16 shadow-elevated">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">
              Limited Time Offer
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            SAATNYA PC LO <br />
            <span className="text-gradient">JADI KENCANG!</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Stop main lag. Upgrade performa PC kamu sekarang dan rasain
            bedanya gameplay <span className="text-primary font-semibold">smooth tanpa drop FPS</span>.
          </p>
          <Button asChild variant="hero" size="xl" className="animate-glow-pulse">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Chat WhatsApp Sekarang
            </a>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
             Online 24 Jam · Fast Respon · Aman & Bergaransi
          </p>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
