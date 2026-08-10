import { useState } from "react";
import { Star, Images, CheckCircle2, Quote } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import AnimatedCounter from "@/components/AnimatedCounter";
import DepthCarousel from "@/components/DepthCarousel";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ShineBorder } from "@/components/ui/shine-border";
import PageBackground from "@/components/PageBackground";
import Reveal from "@/components/Reveal";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

      {/* Section mengalir normal (tanpa ScrollStack pembungkus seluruh halaman). */}
      {/* Hero */}
      <section className="relative pt-28 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <PageBackground opacity={0.2} />
        <Reveal className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge mb-5 inline-block">GALERI TESTIMONI</span>
          <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-5">
            Bukti Nyata dari Pelanggan Kami
          </h1>
          <p className="max-w-2xl mx-auto text-zinc-400">
            Lebih dari 500+ gamer telah mempercayakan performa PC mereka kepada IPAN STORE. Geser untuk melihat dokumentasi asli hasil optimasi dari setiap pelanggan.
          </p>

          {/* Stats strip — mono */}
          <div className="mt-10 gaming-card max-w-4xl mx-auto p-6 sm:p-8 flex flex-col md:flex-row justify-around gap-6 md:gap-8 items-center">
            <div className="text-center w-full md:w-auto">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#F4F4F5]">
                <AnimatedCounter end={500} duration={1500} suffix="+" />
              </p>
              <p className="font-mono text-[11px] text-[#F4F4F5]/50 uppercase tracking-[0.18em] mt-2">Klien Puas</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-zinc-800" />
            <div className="md:hidden w-full h-px bg-zinc-800" />
            <div className="text-center w-full md:w-auto">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#F4F4F5] flex justify-center items-center gap-2">
                4.9 <Star className="w-5 h-5 fill-zinc-300 text-[#94A3B8]" />
              </p>
              <p className="font-mono text-[11px] text-[#F4F4F5]/50 uppercase tracking-[0.18em] mt-2">Rata-rata Rating</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-zinc-800" />
            <div className="md:hidden w-full h-px bg-zinc-800" />
            <div className="text-center flex flex-col items-center justify-center w-full md:w-auto">
              <CheckCircle2 className="w-9 h-9 text-[#94A3B8] mb-2" strokeWidth={1.75} />
              <p className="font-mono text-[11px] text-[#F4F4F5]/50 uppercase tracking-[0.18em]">Garansi 100%</p>
            </div>
          </div>
        </Reveal>
      </section>

        {/* FEATURED TESTIMONI — Raxzy MJ ELITE CS */}
          <section className="relative pt-10 pb-12 md:pt-12 md:pb-16">
            <PageBackground opacity={0.15} />
            <div className="container mx-auto px-4 relative z-0">
              <div className="max-w-7xl mx-auto mb-14 mt-4 md:mt-6">
                <div className="relative">
                  <div
                    className="absolute -inset-2 rounded-3xl pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(148,163,184,0.14), transparent 70%)",
                      filter: "blur(24px)",
                    }}
                  />
                  <div
                    className="relative card-spotlight p-6 md:p-10 animate-fade-up"
                    role="figure"
                    aria-label="Testimoni unggulan dari Raxzy MJ ELITE CUSTOMER"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                      e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                    }}
                  >
                    <ShineBorder
                      borderWidth={1}
                      duration={12}
                      shineColor={["rgba(148,163,184,0)", "rgba(203,213,225,0.85)", "rgba(148,163,184,0)"]}
                    />
                    <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-8 items-center">
                    {/* Photo */}
                    <button
                      type="button"
                      onClick={() => {
                        const idx = testiPhotos.findIndex((p) => p.src === featuredPhoto.src);
                        setLightboxIndex(idx >= 0 ? idx : 0);
                        setLightboxOpen(true);
                      }}
                      className="group relative block rounded-lg overflow-hidden border border-white/16 hover:border-zinc-600 transition-colors duration-200"
                      aria-label={`Buka foto testimoni unggulan ${featuredPhoto.customer ?? "Raxzy MJ"}`}
                    >
                      <div className="aspect-[9/16] bg-[#131314] relative">
                        <img
                          src={featuredPhoto.src}
                          alt={`Testimoni unggulan ${featuredPhoto.customer ?? "Raxzy MJ"} - hasil optimasi IPAN STORE`}
                          loading="eager"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute top-3 left-3 inline-flex items-center rounded-md bg-zinc-50 text-zinc-900 font-mono text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.18em]">
                        FEATURED
                      </div>
                    </button>

                    {/* Text Content */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="gaming-badge-accent">{featuredPhoto.badge ?? "ELITE CUSTOMER"}</span>
                        <div className="inline-flex items-center gap-0.5 ml-1">
                          <Star className="h-3.5 w-3.5 fill-zinc-300 text-[#94A3B8]" />
                          <Star className="h-3.5 w-3.5 fill-zinc-300 text-[#94A3B8]" />
                          <Star className="h-3.5 w-3.5 fill-zinc-300 text-[#94A3B8]" />
                          <Star className="h-3.5 w-3.5 fill-zinc-300 text-[#94A3B8]" />
                          <Star className="h-3.5 w-3.5 fill-zinc-300 text-[#94A3B8]" />
                        </div>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F4F4F5] leading-tight mb-5">
                        {featuredPhoto.customer ?? "Raxzy MJ"}{" "}
                        <span className="text-[#94A3B8]">ELITE CS aja optimize di sini</span>
                      </h3>

                      <div className="relative mb-6 pl-5 border-l border-white/24">
                        <Quote className="absolute -left-[13px] -top-1.5 h-6 w-6 text-[#F4F4F5]/50 bg-[#0C0C0C] rounded-full p-1" />
                        <p className="text-base md:text-lg text-zinc-400 leading-relaxed italic">
                          Pelanggan Elite kami yang sudah mempercayakan PC gaming-nya di IPAN STORE. Hasilnya? FPS naik drastis, aiming makin presisi, dan gameplay jadi lebih nyaman tanpa lag.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="gaming-badge">Verified WhatsApp</span>
                        <span className="gaming-badge">Top Customer</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Heading strip */}
              <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto mb-8">
                <Images className="h-5 w-5 text-[#F4F4F5]/50" />
                <h2 className="font-semibold tracking-tight text-[#F4F4F5] text-base md:text-lg">
                  Testimoni Customer
                </h2>
              </div>

              {/* Depth Carousel */}
              <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] max-w-7xl mx-auto" aria-label="Galeri foto testimoni pelanggan IPAN STORE">
                <DepthCarousel
                  items={testiPhotos.map((p) => ({ image: p.src, alt: `Testimoni ${p.customer ?? 'pelanggan'}` }))}
                  cardWidth={240}
                  cardHeight={420}
                  radius={16}
                  tint="#0C0C0C"
                  depth={220}
                  spread={85}
                  tilt={20}
                  perspective={1300}
                  visibleCards={4}
                  falloff={0.2}
                  blur={5}
                  duration={650}
                  autoplay={false}
                  loop={true}
                  showControls={true}
                  showIndicators={true}
                  onCardClick={(idx) => openLightbox(idx)}
                />
              </div>

              <div className="mt-14 max-w-3xl mx-auto text-center px-4">
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
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
          container: { backgroundColor: "rgba(9,9,11,0.96)" },
        }}
      />
    </Layout>
  );
};

export default TestimoniPage;

