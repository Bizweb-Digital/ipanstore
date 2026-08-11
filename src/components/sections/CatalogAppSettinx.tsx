import { ArrowRight, MousePointer2, Crosshair, Activity, Rocket, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";
import ElectricBorder from "../effects/ElectricBorder";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SettinxGallery from "./SettinxGallery";
import Reveal from "../effects/Reveal";
import SplitText from "../effects/SplitText";

const features = [
  { icon: MousePointer2, name: "DragShot Velocity X", desc: "Tarikan mouse saat jump shot SG2 jadi lebih ringan & responsif." },
  { icon: Crosshair, name: "OneTap Vector X", desc: "Crosshair lock stabil saat duel jarak dekat, hit pertama lebih presisi." },
  { icon: Activity, name: "Neural AimSync X", desc: "Delay pointer hilang, flick shot mengikuti refleks tangan real-time." },
  { icon: Rocket, name: "Emulator Overdrive X", desc: "Frame pacing BlueStacks/MSI terkunci — bebas stuttering saat war." },
];

const CatalogAppSettinx = () => {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-16 md:py-20 overflow-hidden border-t border-white/16">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-subheading">KATALOG PRODUK</span>
          <SplitText
            tag="h2"
            text="IPAN APP SettinX V1"
            className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4"
            splitType="words"
            threshold={0.2}
          />
          <p className="text-zinc-400 body-clamp leading-relaxed">
            Aplikasi tweak premium untuk emulator Free Fire. Menggabungkan semua keunggulan paket optimasi, tweak menu, dan advanced tweak dalam satu aplikasi otomatis dengan lisensi lifetime.
          </p>
        </Reveal>

        <div
          ref={ref}
          className={`max-w-5xl mx-auto scroll-reveal-stagger ${revealed ? "revealed" : ""}`}
        >
          <div className="relative">
            <div
              className="absolute -inset-2 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(148,163,184,0.12), transparent 70%)",
                filter: "blur(24px)",
              }}
            />
            <ElectricBorder
              color="#94A3B8"
              speed={0.8}
              chaos={0.08}
              borderRadius={16}
              className="relative"
            >
            <div className="relative gaming-card p-6 lg:p-10">
              <div className="flex justify-end mb-6">
                <span className="gaming-badge-accent bg-[#0C0C0C]">
                  GRAND LAUNCHING
                </span>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left: features */}
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-[#F4F4F5] mb-5">
                Fitur Unggulan
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((f) => (
                  <div
                    key={f.name}
                    className="rounded-lg bg-[#131314]/50 border border-white/16 p-4 transition-colors duration-200 hover:border-white/24"
                  >
                    <f.icon className="h-5 w-5 text-[#94A3B8] mb-3" strokeWidth={1.75} />
                    <h4 className="text-sm font-semibold tracking-tight text-[#F4F4F5] mb-1.5">
                      {f.name}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pricing + benefits */}
            <div className="rounded-lg bg-[#131314] border border-white/16 p-6 lg:p-8 text-center">
              <span className="gaming-badge-accent mb-5 inline-block">PALING UNGGUL</span>

              <div className="flex flex-col items-center mb-5">
                <span className="font-mono text-base text-zinc-600 line-through mb-1">
                  Rp 100.000
                </span>
                <span className="font-mono text-4xl md:text-5xl font-bold text-[#F4F4F5] tracking-tight leading-none">
                  Rp 75.000
                </span>
              </div>

              <div className="space-y-2.5 mb-6 text-left">
                {[
                  "Bayar sekali, pakai selamanya (lifetime)",
                  "Lebih unggul dari semua paket optimasi",
                  "Aman dengan System Restore bawaan",
                ].map((b) => (
                  <div key={b} className="flex items-start gap-2.5 text-sm text-[#F4F4F5]">
                    <BadgeCheck className="h-4 w-4 text-[#94A3B8] shrink-0 mt-0.5" strokeWidth={2} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="gaming-tag">Lifetime</span>
                <span className="gaming-tag">1 Akun = 1 PC</span>
              </div>

              <Button asChild size="lg" className="w-full bg-[#111111] text-white hover:bg-[#333333]">
                <a href="/order?paket=app-settinx">
                  Beli Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            </div>
            </div>
            </ElectricBorder>
          </div>
        </div>

        {/* Preview Gallery */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="text-center mb-8 md:max-w-4xl md:mx-auto">
            <span className="section-subheading">PREVIEW TAMPILAN APLIKASI</span>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F4F4F5] mb-2">
              Tampilan APP SettinX
            </h3>
            <p className="gallery-hint font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F4F5]/50">
              Klik foto untuk melihat lebih detail
            </p>
          </div>
          <SettinxGallery />
        </div>
      </div>
    </section>
  );
};

export default CatalogAppSettinx;

