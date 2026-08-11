import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  { name: "Raxzy", text: "Gacor banget optimize-nya, FPS naik drastis pas main FF. Recommended!" },
  { name: "Cakka", text: "Windows oprekan by Ipan beneran beda, ringan & responsif. Mantap!" },
  { name: "Evan", text: "Baru 3 hari pake, langsung jago dan smooth tanpa lag. Worth banget." },
  { name: "Kepin", text: "Semua produk memuaskan, admin fast respon. Dijamin puas." },
  { name: "Gilang", text: "Admin ramah, sabar jelasin. Hasilnya juga top, PC jadi enteng." },
  { name: "Jojo", text: "FPS jadi boost parah, gameplay smooth. Pelayanan bintang lima!" },
];

const Testimonials = () => {
  return (
    <section id="testimoni" className="relative py-24 md:py-32 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
            Testimoni
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-4">
            Kata Mereka Yang <span className="text-gradient">Sudah Di OPTIMIZE</span>
          </h2>
          <p className="text-muted-foreground">Ratusan klien sudah merasakan bedanya.</p>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          className="max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((t) => (
              <CarouselItem key={t.name} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="glass rounded-2xl p-7 h-full hover:border-primary/40 hover:shadow-elevated transition-[var(--transition-smooth)]">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                    <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center font-display font-black text-primary-foreground shadow-glow">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">Verified Customer</div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4 bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground" />
          <CarouselNext className="hidden md:flex -right-4 bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground" />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
