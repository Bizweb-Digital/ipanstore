import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import ScrollStackCards from "@/components/effects/ScrollStackCards";
import SplitText from "@/components/effects/SplitText";
import Reveal from "@/components/effects/Reveal";
import PageBackground from "@/components/effects/PageBackground";
import PackagesPreview from "@/components/sections/PackagesPreview";
import CatalogAppSettinx from "@/components/sections/CatalogAppSettinx";
import TestimoniPreview from "@/components/sections/TestimoniPreview";
import Community from "@/components/sections/Community";
import ClosingCTA from "@/components/sections/ClosingCTA";
import LaunchPopup from "@/components/LaunchPopup";
import { localBusinessJsonLd, websiteJsonLd } from "@/lib/seo";
import { Zap, Cpu, MousePointer2, Laptop2 } from "lucide-react";

const showcaseCards = [
  {
    icon: <Zap className="h-6 w-6" strokeWidth={1.75} />,
    title: "FPS Boost up to 240+",
    desc: "Tweak menyeluruh CPU, RAM, dan GPU agar frame rate maksimal dan stabil saat war.",
  },
  {
    icon: <Cpu className="h-6 w-6" strokeWidth={1.75} />,
    title: "Windows Lebih Ringan",
    desc: "Debloat bloatware & atur ulang power plan. Booting cepat, RAM idle lega.",
  },
  {
    icon: <MousePointer2 className="h-6 w-6" strokeWidth={1.75} />,
    title: "Zero Input Lag",
    desc: "Matikan mouse acceleration, turunkan latency input agar aiming presisi 1:1.",
  },
  {
    icon: <Laptop2 className="h-6 w-6" strokeWidth={1.75} />,
    title: "Emulator Anti Force Close",
    desc: "Setting emulator Free Fire yang stabil, ringan, dan headshot lebih mudah.",
  },
];

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Jasa Optimasi PC Gaming & Boost FPS Free Fire | IPAN STORE"
        description="PC gaming lag, FPS drop saat war, atau emulator berat? IPAN STORE melayani jasa optimasi PC gaming & boost FPS Free Fire via remote ke seluruh Indonesia. Aman, bergaransi, mulai Rp 20.000."
        jsonLd={[localBusinessJsonLd(), websiteJsonLd()]}
      />

      {/* Section mengalir normal — tanpa ScrollStack yang membungkus seluruh
          halaman (penyebab teks/foto tertutup). */}
      <Hero />

      <About />

      {/* Showcase: kartu MENUMPUK halus saat scroll (persis preview reactbits),
          sudah dioptimalkan agar TIDAK ada getaran/jitter. */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <PageBackground opacity={0.15} />
        <div className="container mx-auto px-4 relative z-10">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-subheading">Kenapa IPAN STORE</span>
            <SplitText
              tag="h2"
              text="Keunggulan Optimasi Kami"
              className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4"
            />
            <p className="text-zinc-400 body-clamp leading-relaxed">
              Scroll ke bawah untuk melihat setiap keunggulan menumpuk satu per satu.
            </p>
          </Reveal>

          <div className="max-w-3xl mx-auto">
            <ScrollStackCards itemDistance={56} itemStackDistance={22} baseScale={0.92} itemScale={0.03}>
              {showcaseCards.map((c) => (
                <div key={c.title} className="showcase-card relative w-full h-64 sm:h-72 p-8 sm:p-10 rounded-[24px] sm:rounded-[32px]">
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/16 bg-[#1d1d20] text-[#94A3B8]">
                      {c.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F4F5]">
                      {c.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-zinc-400">{c.desc}</p>
                  </div>
                </div>
              ))}
            </ScrollStackCards>
          </div>
        </div>
      </section>

      <PackagesPreview />
      <CatalogAppSettinx />
      <TestimoniPreview />
      <Community />
      <ClosingCTA />

      {/* Popup Grand Launching SettinX V1 — tampil saat website dibuka */}
      <LaunchPopup />
    </Layout>
  );
};

export default Index;
