import { Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { testimonials } from "@/pages/TestimoniPage";

const TestimoniPreview = () => {
  // Double the array to create a seamless infinite marquee effect
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-[#060A14]">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="section-subheading">Testimoni Klien</span>
          <h2 className="h2-clamp font-display font-bold text-white mb-6">
            Dipercaya 500+ <span className="text-gaming-accent">Gamer</span>
          </h2>
          <p className="text-muted-foreground body-clamp max-w-2xl mx-auto">
            Review jujur dari klien yang sudah merasakan perbedaan performa setelah di-optimasi oleh IPAN STORE.
          </p>
        </div>
      </div>

      {/* Infinite Marquee Container */}
      <div className="w-full overflow-hidden relative mb-12 group">
        {/* Gradient Overlays for smooth fade out at edges */}
        <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[#060A14] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[#060A14] to-transparent z-10 pointer-events-none" />
        
        <div className="flex w-max animate-marquee gap-6 py-4 px-4 group-hover:[animation-play-state:paused]">
          {marqueeItems.map((t, idx) => (
            <div key={idx} className="w-[280px] md:w-[350px] shrink-0 gaming-card p-6 flex flex-col relative">
              <Quote className="absolute top-6 right-6 text-white/5 w-10 h-10 rotate-180" />
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-gaming-accent text-gaming-accent" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 italic relative z-10">
                "{t.body}"
              </p>
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gaming-primary/20 flex items-center justify-center font-display font-bold text-gaming-accent shrink-0">
                  {t.initial}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.paket} &middot; Verified</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          <Button asChild variant="outline">
            <Link to="/testimoni">Lihat Semua Review</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimoniPreview;
