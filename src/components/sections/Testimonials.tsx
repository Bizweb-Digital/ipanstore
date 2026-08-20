import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/lib/admin/supabase";

interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  message: string;
  image_url: string | null;
  created_at: string;
}

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  { id: "1", name: "Raxzy", rating: 5, message: "Gacor banget optimize-nya, FPS naik drastis pas main FF. Recommended!", image_url: null, created_at: "" },
  { id: "2", name: "Cakka", rating: 5, message: "Windows oprekan by Ipan beneran beda, ringan & responsif. Mantap!", image_url: null, created_at: "" },
  { id: "3", name: "Evan", rating: 5, message: "Baru 3 hari pake, langsung jago dan smooth tanpa lag. Worth banget.", image_url: null, created_at: "" },
  { id: "4", name: "Kepin", rating: 5, message: "Semua produk memuaskan, admin fast respon. Dijamin puas.", image_url: null, created_at: "" },
  { id: "5", name: "Gilang", rating: 5, message: "Admin ramah, sabar jelasin. Hasilnya juga top, PC jadi enteng.", image_url: null, created_at: "" },
  { id: "6", name: "Jojo", rating: 5, message: "FPS jadi boost parah, gameplay smooth. Pelayanan bintang lima!", image_url: null, created_at: "" },
];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(FALLBACK_TESTIMONIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, rating, message, image_url, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setTestimonials(data as TestimonialItem[]);
        }
      } catch (err) {
        console.error("Error fetching testimonials:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  // Use fallback if no data from database
  const displayItems = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

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
            {displayItems.map((t) => (
              <CarouselItem key={t.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="glass rounded-2xl p-7 h-full hover:border-primary/40 hover:shadow-elevated transition-[var(--transition-smooth)]">
                  {/* Photo from database or fallback */}
                  {t.image_url ? (
                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={t.image_url}
                        alt={`Testimoni ${t.name}`}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-white/5 h-40 flex items-center justify-center">
                      <span className="text-4xl font-display font-black text-primary/20">
                        {t.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6">"{t.message}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                    <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center font-display font-black text-primary-foreground shadow-glow">
                      {t.name.charAt(0).toUpperCase()}
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
