import { Images } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const testiPhotos = [
  "/img/testimoni/Screenshot_2025-12-23-23-15-30-787_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2025-12-25-13-18-55-378_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2025-12-28-20-32-03-375_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-01-04-11-44-26-458_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-01-04-20-43-26-760_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-01-10-22-17-33-377_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-01-15-17-58-16-040_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-01-18-14-57-35-501_com.whatsapp.w4b.jpg",
  "/img/testimoni/Screenshot_2026-02-08-13-41-09-236_com.whatsapp.w4b.jpg",
];

const marqueePhotos = [...testiPhotos, ...testiPhotos];

const TestimoniPreview = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-[#060A14]">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="section-subheading">Galeri Testimoni</span>
          <h2 className="h2-clamp font-display font-bold text-white mb-6">
            Dipercaya <span className="text-gaming-accent">500+ Gamer</span> Indonesia
          </h2>
          <p className="text-muted-foreground body-clamp max-w-2xl mx-auto">
            Dokumentasi asli dari pelanggan yang telah merasakan peningkatan FPS, optimasi emulator, dan performa PC setelah menggunakan jasa IPAN STORE.
          </p>
        </div>
      </div>

      {/* Infinite Marquee Gallery */}
      <div className="w-full overflow-hidden relative mb-12 group">
        <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[#060A14] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[#060A14] to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-marquee gap-4 md:gap-6 py-4 px-4 group-hover:[animation-play-state:paused]">
          {marqueePhotos.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="w-[180px] sm:w-[200px] md:w-[230px] aspect-[9/16] shrink-0 rounded-2xl overflow-hidden border border-gaming-accent/20 hover:border-gaming-accent/60 transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={src}
                alt={`Testimoni pelanggan IPAN STORE ${(idx % testiPhotos.length) + 1} - hasil optimasi PC gaming`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/testimoni">
              <Images className="h-4 w-4" />
              Lihat Semua Galeri
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimoniPreview;