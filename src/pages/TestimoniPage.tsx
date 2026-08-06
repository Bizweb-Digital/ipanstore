import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, ChevronLeft, ChevronRight, Images, CheckCircle2, Quote } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import AnimatedCounter from "@/components/AnimatedCounter";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

type TestiPhoto = {
  src: string;
  featured?: boolean;
  customer?: string;
  badge?: string;
};

const testiPhotos: TestiPhoto[] = [
  {
    src: "/img/testimoni/Screenshot_2025-12-23-23-15-30-787_com.whatsapp.w4b.jpg",
    featured: true,
    customer: "Raxzy MJ",
    badge: "ELITE CUSTOMER",
  },
  { src: "/img/testimoni/Screenshot_2025-12-25-13-18-55-378_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2025-12-28-20-32-03-375_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-01-04-11-44-26-458_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-01-04-20-43-26-760_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-01-10-22-17-33-377_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-01-15-17-58-16-040_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-01-18-14-57-35-501_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-02-08-13-41-09-236_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-02-11-15-09-07-600_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-02-17-15-20-07-341_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-02-17-15-21-40-166_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-03-17-17-15-10-591_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-04-05-17-55-37-278_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-04-07-00-00-27-950_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_2026-05-18-14-37-56-057_com.whatsapp.w4b.jpg" },
  { src: "/img/testimoni/Screenshot_20260502_141435.jpg" },
];

const lightboxSlides = testiPhotos.map((p) => ({ src: p.src }));
const featuredPhoto = testiPhotos.find((p) => p.featured) ?? testiPhotos[0];

const TestimoniPage = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Layout>
      <SEOHead
        title="Galeri Testimoni Pelanggan | IPAN STORE - Jasa Optimasi PC Gaming"
        description="Dokumentasi asli testimoni 500+ gamer yang telah merasakan peningkatan FPS, optimasi emulator, dan performa PC setelah menggunakan jasa IPAN STORE. Lihat bukti langsung dari pelanggan kami."
        keywords="testimoni optimasi PC, review jasa boost FPS, galeri pelanggan IPAN STORE, before after optimasi PC gaming"
      />

      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden bg-[#060A14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge-accent mb-4 inline-block">GALERI TESTIMONI</span>
          <h1 className="h1-clamp font-display font-bold text-white mb-6">
            Bukti Nyata dari <span className="text-gaming-accent">Pelanggan Kami</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground body-clamp">
            Lebih dari 500+ gamer telah mempercayakan performa PC mereka kepada IPAN STORE. Geser untuk melihat dokumentasi asli hasil optimasi dari setiap pelanggan.
          </p>

          <div className="mt-10 mb-6 p-5 sm:p-6 gaming-card max-w-4xl mx-auto flex flex-col md:flex-row justify-around gap-5 md:gap-6 items-center border-gaming-primary/20">
            <div className="text-center w-full md:w-auto">
              <p className="font-display text-3xl sm:text-4xl font-black text-white">
                <AnimatedCounter end={500} duration={1500} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Klien Puas</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10" />
            <div className="md:hidden w-full h-px bg-white/10" />
            <div className="text-center w-full md:w-auto">
              <p className="font-display text-3xl sm:text-4xl font-black text-gaming-accent flex justify-center items-center gap-2">
                4.9 <Star className="w-6 h-6 fill-gaming-accent text-gaming-accent" />
              </p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Rata-rata Rating</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10" />
            <div className="md:hidden w-full h-px bg-white/10" />
            <div className="text-center flex flex-col items-center justify-center w-full md:w-auto">
              <CheckCircle2 className="w-10 h-10 text-[#25D366] mb-1" />
              <p className="text-sm text-[#25D366] font-bold uppercase tracking-wider">Garansi 100%</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED TESTIMONI — Raxzy MJ ELITE CS */}
      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-12 px-2">
            <div
              className="relative rounded-3xl overflow-hidden border-2 border-gaming-accent/60 bg-gradient-to-br from-gaming-accent/15 via-[#0B1120] to-gaming-primary/15 shadow-[0_0_40px_rgba(56,189,248,0.35)] animate-fade-up"
              role="figure"
              aria-label="Testimoni unggulan dari Raxzy MJ ELITE CUSTOMER"
            >
              {/* Glow background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-12 -left-12 w-56 h-56 bg-gaming-accent/25 blur-[90px] rounded-full" />
                <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-gaming-primary/25 blur-[100px] rounded-full" />
              </div>

              {/* Top Crown Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                <div className="inline-flex items-center bg-gradient-to-r from-gaming-accent via-yellow-400 to-gaming-accent text-[#060A14] text-[11px] md:text-xs font-black px-5 py-2 rounded-b-2xl tracking-[0.25em] uppercase shadow-[0_8px_24px_rgba(56,189,248,0.45)]">
                  {featuredPhoto.badge ?? "ELITE CUSTOMER"}
                </div>
              </div>

              <div className="relative z-10 grid md:grid-cols-[260px_1fr] gap-6 p-6 md:p-10 pt-12 md:pt-14 items-center">
                {/* Photo */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = testiPhotos.findIndex((p) => p.src === featuredPhoto.src);
                    setLightboxIndex(idx >= 0 ? idx : 0);
                    setLightboxOpen(true);
                  }}
                  className="group relative block rounded-2xl overflow-hidden border-2 border-gaming-accent/60 hover:border-gaming-accent transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]"
                  aria-label={`Buka foto testimoni unggulan ${featuredPhoto.customer ?? "Raxzy MJ"}`}
                >
                  <div className="aspect-[9/16] bg-[#060A14] relative">
                    <img
                      src={featuredPhoto.src}
                      alt={`Testimoni unggulan ${featuredPhoto.customer ?? "Raxzy MJ"} - hasil optimasi IPAN STORE`}
                      loading="eager"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060A14]/70 via-transparent to-transparent" />
                  </div>
                  <div className="absolute top-3 left-3 inline-flex items-center bg-gaming-accent text-[#060A14] text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.6)]">
                    FEATURED
                  </div>
                </button>

                {/* Text Content */}
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-gaming-accent text-gaming-accent" />
                    <Star className="h-4 w-4 fill-gaming-accent text-gaming-accent" />
                    <Star className="h-4 w-4 fill-gaming-accent text-gaming-accent" />
                    <Star className="h-4 w-4 fill-gaming-accent text-gaming-accent" />
                    <Star className="h-4 w-4 fill-gaming-accent text-gaming-accent" />
                  </div>

                  <h3 className="font-display text-2xl md:text-4xl font-black text-white leading-tight mb-4">
                    <span className="text-gaming-accent">{featuredPhoto.customer ?? "Raxzy MJ"}</span>{" "}
                    <span className="text-white/85 font-bold">ELITE CS aja optimize di sini</span>
                  </h3>

                  <div className="relative mb-4 md:mb-6 pl-5 border-l-2 border-gaming-accent/60">
                    <Quote className="absolute -left-[14px] -top-2 h-6 w-6 text-gaming-accent bg-[#060A14] rounded-full p-1" />
                    <p className="text-base md:text-lg text-white/90 leading-relaxed italic">
                      Pelanggan Elite kami yang sudah mempercayakan PC gaming-nya di IPAN STORE. Hasilnya? FPS naik drastis, aiming makin presisi, dan gameplay jadi lebih nyaman tanpa lag.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#25D366]/10 border border-[#25D366]/40 px-3 py-1.5 text-[11px] font-bold text-[#25D366] uppercase tracking-wider">
                      Verified WhatsApp
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gaming-accent/10 border border-gaming-accent/40 px-3 py-1.5 text-[11px] font-bold text-gaming-accent uppercase tracking-wider">
                      Top Customer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heading strip */}
          <div className="flex items-center justify-between max-w-7xl mx-auto mb-8 px-2">
            <div className="flex items-center gap-3">
              <Images className="h-5 w-5 text-gaming-accent" />
              <h2 className="font-display font-bold text-white text-base md:text-lg uppercase tracking-wider">
                Dokumentasi Pelanggan
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Geser / klik untuk browse</span>
              <span className="font-bold text-gaming-accent">
                {selectedIndex + 1} / {testiPhotos.length}
              </span>
            </div>
          </div>

          {/* Carousel */}
          <div className="relative max-w-7xl mx-auto" aria-label="Galeri foto testimoni pelanggan IPAN STORE">
            {/* Prev / Next Buttons - seperti mycarsell */}
            <button
              onClick={scrollPrev}
              aria-label="Foto sebelumnya"
              className="absolute left-0 sm:-left-5 top-1/2 -translate-y-1/2 z-20 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#101827]/90 border border-gaming-accent/40 backdrop-blur-md flex items-center justify-center text-gaming-accent hover:bg-gaming-accent hover:text-[#060A14] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>

            <button
              onClick={scrollNext}
              aria-label="Foto berikutnya"
              className="absolute right-0 sm:-right-5 top-1/2 -translate-y-1/2 z-20 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#101827]/90 border border-gaming-accent/40 backdrop-blur-md flex items-center justify-center text-gaming-accent hover:bg-gaming-accent hover:text-[#060A14] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>

            <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
              <div className="flex gap-4 md:gap-6">
                {testiPhotos.map((p, idx) => (
                  <div
                    key={p.src}
                    className="flex-[0_0_70%] sm:flex-[0_0_45%] md:flex-[0_0_32%] lg:flex-[0_0_25%] min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() => openLightbox(idx)}
                      className="group relative w-full block rounded-2xl overflow-hidden border border-gaming-accent/20 hover:border-gaming-accent/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]"
                      aria-label={`Buka foto testimoni ${idx + 1} dari ${testiPhotos.length} dengan ukuran penuh`}
                    >
                      <div className="aspect-[9/16] bg-[#0B1120] relative">
                        <img
                          src={p.src}
                          alt={`Testimoni pelanggan IPAN STORE ${idx + 1} - hasil optimasi PC gaming`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#060A14]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="font-display text-xs font-bold text-gaming-accent tracking-widest uppercase">
                          Klik untuk perbesar
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="mt-10 flex justify-center items-center gap-2 max-w-7xl mx-auto flex-wrap px-4" role="tablist" aria-label="Navigasi foto">
            {testiPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                role="tab"
                aria-selected={idx === selectedIndex}
                aria-label={`Pergi ke foto ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === selectedIndex
                    ? "w-8 bg-gaming-accent shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                    : "w-2 bg-white/15 hover:bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="mt-14 max-w-3xl mx-auto text-center px-4">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Setiap foto di atas adalah dokumentasi asli yang dikirim langsung oleh pelanggan kami via WhatsApp setelah proses optimasi PC gaming, tweak emulator Free Fire, atau aktivasi IPAN APP SettinX selesai dilakukan.
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox - klik foto untuk buka full-size */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        carousel={{ finite: false, preload: 2 }}
        animation={{ fade: 350, swipe: 500 }}
        styles={{
          container: { backgroundColor: "rgba(6,10,20,0.96)" },
        }}
      />
    </Layout>
  );
};

export default TestimoniPage;