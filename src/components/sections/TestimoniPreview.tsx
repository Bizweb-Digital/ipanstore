import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Images, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Reveal from "../effects/Reveal";
import SplitText from "../effects/SplitText";
import { supabase } from "@/lib/admin/supabase";

// Foto statis yang sudah ada (dari folder public)
const staticPhotos = [
  { image: "/img/testimoni/thumbs/Screenshot_2025-12-23-23-15-30-787_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2025-12-23-23-15-30-787_com.whatsapp.w4b.jpg", alt: "Testimoni 1" },
  { image: "/img/testimoni/thumbs/Screenshot_2025-12-25-13-18-55-378_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2025-12-25-13-18-55-378_com.whatsapp.w4b.jpg", alt: "Testimoni 2" },
  { image: "/img/testimoni/thumbs/Screenshot_2025-12-28-20-32-03-375_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2025-12-28-20-32-03-375_com.whatsapp.w4b.jpg", alt: "Testimoni 3" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-01-04-11-44-26-458_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-01-04-11-44-26-458_com.whatsapp.w4b.jpg", alt: "Testimoni 4" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-01-04-20-43-26-760_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-01-04-20-43-26-760_com.whatsapp.w4b.jpg", alt: "Testimoni 5" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-01-10-22-17-33-377_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-01-10-22-17-33-377_com.whatsapp.w4b.jpg", alt: "Testimoni 6" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-01-15-17-58-16-040_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-01-15-17-58-16-040_com.whatsapp.w4b.jpg", alt: "Testimoni 7" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-01-18-14-57-35-501_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-01-18-14-57-35-501_com.whatsapp.w4b.jpg", alt: "Testimoni 8" },
  { image: "/img/testimoni/thumbs/Screenshot_2026-02-08-13-41-09-236_com.whatsapp.w4b.webp", full: "/img/testimoni/Screenshot_2026-02-08-13-41-09-236_com.whatsapp.w4b.jpg", alt: "Testimoni 9" },
];

const DepthCarousel = lazy(() => import("../carousel/DepthCarousel"));

const DeferredDepthCarousel = (props: React.ComponentProps<typeof DepthCarousel>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "500px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full">
      {ready ? <Suspense fallback={null}><DepthCarousel {...props} /></Suspense> : null}
    </div>
  );
};

const TestimoniPreview = () => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [dbPhotos, setDbPhotos] = useState<Array<{ image: string; full: string; alt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, image_url")
          .eq("is_approved", true)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && mounted && data) {
          const items = data.map((t) => ({
            image: t.image_url!,
            full: t.image_url!,
            alt: `Testimoni ${t.name || "customer"} IPAN STORE`,
          }));
          setDbPhotos(items);
        }
      } catch {
        // Senyap — fallback ke foto statis saja
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Gabungkan foto statis + dari database
  const allPhotos = [
    ...staticPhotos,
    ...dbPhotos,
  ];

  const lightboxSlides = allPhotos.map((p) => ({ src: p.full }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section className="relative py-16 md:py-20 overflow-hidden border-t border-zinc-800/60">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-subheading">Galeri Testimoni</span>
          <SplitText
            tag="h2"
            text="Dipercaya 500+ Gamer Indonesia"
            className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4"
            splitType="words"
            threshold={0.2}
          />
          <p className="text-zinc-400 body-clamp leading-relaxed">
            Dokumentasi asli dari pelanggan yang telah merasakan peningkatan FPS, optimasi emulator, dan performa PC setelah menggunakan jasa IPAN STORE.
          </p>
        </Reveal>
      </div>

      {/* Depth Carousel Gallery */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] mb-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#94A3B8]" />
          </div>
        ) : (
          <DeferredDepthCarousel
            items={allPhotos}
            cardWidth={230}
            cardHeight={400}
            radius={16}
            tint="#0C0C0C"
            depth={200}
            spread={80}
            tilt={18}
            perspective={1200}
            visibleCards={4}
            falloff={0.2}
            blur={isMobile ? 2 : 4}
            duration={600}
            autoplay={!lightboxOpen}
            autoplayDelay={3500}
            loop={true}
            showControls={false}
            showIndicators={true}
            onCardClick={(idx) => openLightbox(idx)}
          />
        )}
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/testimoni">
              <Images className="h-4 w-4" />
              Lihat Semua Galeri
            </Link>
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        carousel={{ finite: false, preload: 2 }}
        animation={{ fade: 350, swipe: 500 }}
        styles={{
          container: { backgroundColor: "rgba(9,9,11,0.96)" },
        }}
      />
    </section>
  );
};

export default TestimoniPreview;
