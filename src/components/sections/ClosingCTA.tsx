import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_LINK } from "../FloatingWhatsApp";
import Reveal from "../effects/Reveal";

const ClosingCTA = () => {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden border-y border-white/16">
      {/* Ultra-subtle ambient depth */}
      <div className="absolute inset-0 hero-ambient pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="gaming-badge-accent mb-4 inline-block">PERSIAPKAN PC KAMU</span>
            <Reveal>
              <h2 className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4 leading-tight">
                Siap Jadi Elite CS? <br />
                Tanpa Frame Drop?
              </h2>
            </Reveal>
            <p className="text-zinc-400 body-clamp mb-8 max-w-xl mx-auto leading-relaxed">
            Jangan biarkan lag mengganggu gameplay-mu. Optimasi PC kamu sekarang dan rasakan perbedaannya.
          </p>

            <div className="flex flex-col items-center gap-5">
            <Button asChild variant="whatsapp" size="xl" className="group w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] shadow-soft-sm">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                Order via WhatsApp
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </Button>

            <p className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs sm:text-sm text-zinc-300">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Admin sedang online, balas dalam 5 menit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
