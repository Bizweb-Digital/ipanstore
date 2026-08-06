import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_LINK } from "./FloatingWhatsApp";

const ClosingCTA = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[#060A14]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.15)_0%,transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="gaming-badge-accent mb-6 inline-block">PERSIAPKAN PC KAMU</span>
          <h2 className="h1-clamp font-display font-bold text-white mb-6 leading-tight">
            Siap Jadi Elite CS? <br />
            <span className="text-gradient-blue">Tanpa Frame Drop?</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Jangan biarkan lag mengganggu gameplay-mu. Optimasi PC kamu sekarang dan rasakan perbedaannya.
          </p>
          
          <Button asChild variant="whatsapp" size="xl" className="group rounded-2xl animate-pulse-glow w-full sm:w-auto">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              Order via WhatsApp
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
          
          <p className="mt-6 text-sm text-muted-foreground/60 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            Admin sedang online, balas dalam 5 menit.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
