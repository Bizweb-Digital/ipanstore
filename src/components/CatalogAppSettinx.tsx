import { ArrowRight, MousePointer2, Crosshair, Activity, Rocket, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "./FloatingWhatsApp";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SettinxGallery from "./SettinxGallery";

const SETTINX_WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "Halo Ipan Store, saya tertarik dengan IPAN APP SettinX dan ingin melihat katalog lengkapnya."
)}`;

const features = [
  { icon: MousePointer2, name: "DragShot Velocity X", desc: "Tarikan mouse saat jump shot SG2 jadi lebih ringan & responsif." },
  { icon: Crosshair, name: "OneTap Vector X", desc: "Crosshair lock stabil saat duel jarak dekat, hit pertama lebih presisi." },
  { icon: Activity, name: "Neural AimSync X", desc: "Delay pointer hilang, flick shot mengikuti refleks tangan real-time." },
  { icon: Rocket, name: "Emulator Overdrive X", desc: "Frame pacing BlueStacks/MSI terkunci — bebas stuttering saat war." },
];

const CatalogAppSettinx = () => {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-[#060A14]">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gaming-accent/30 to-transparent" />

      {/* Glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-gaming-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gaming-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="gaming-badge-accent mb-4 inline-flex items-center gap-1.5">
            KATALOG PRODUK
          </span>
          <h2 className="h2-clamp font-display font-bold text-white mb-5">
            IPAN APP <span className="text-gaming-accent">SettinX V1</span>
          </h2>
          <p className="text-muted-foreground body-clamp max-w-2xl mx-auto">
            Aplikasi tweak premium untuk emulator Free Fire. Menggabungkan semua keunggulan paket optimasi, tweak menu, dan advanced tweak dalam satu aplikasi otomatis dengan lisensi lifetime.
          </p>
        </div>

        <div
          ref={ref}
          className={`max-w-5xl mx-auto gaming-card p-6 lg:p-10 relative scroll-reveal-stagger ${revealed ? "revealed" : ""}`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-gaming-accent to-transparent" />
          <span className="absolute top-0 right-6 bg-gaming-accent text-[#060A14] text-[10px] font-bold px-3 py-1 rounded-b-lg tracking-wider uppercase">
            GRAND LAUNCHING
          </span>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: features */}
            <div>
              <h3 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-wide mb-5">
                Fitur <span className="text-gaming-accent">Unggulan</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((f) => (
                  <div
                    key={f.name}
                    className="group rounded-xl bg-[#0B1120] border border-white/10 p-4 hover:border-gaming-accent/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gaming-accent/10 border border-gaming-accent/30 flex items-center justify-center mb-3 group-hover:bg-gaming-accent/20 transition-all">
                      <f.icon className="h-4 w-4 text-gaming-accent" strokeWidth={2} />
                    </div>
                    <h4 className="font-display font-bold text-white uppercase tracking-wide text-sm mb-1.5">{f.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pricing + benefits */}
            <div className="rounded-2xl bg-gradient-to-br from-gaming-accent/[0.07] via-transparent to-gaming-primary/[0.07] border border-gaming-accent/20 p-6 lg:p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gaming-accent/10 blur-3xl rounded-full pointer-events-none" />

              <div className="inline-flex items-center gap-2 rounded-full bg-gaming-accent/10 border border-gaming-accent/30 px-3 py-1 text-[10px] font-black tracking-widest uppercase text-gaming-accent mb-4">
                PALING UNGGUL
              </div>

              <div className="flex flex-col items-center mb-4">
                <span className="text-base text-muted-foreground/60 line-through font-semibold mb-1">Rp 100.000</span>
                <span className="font-display text-5xl md:text-6xl font-black text-gaming-accent leading-none drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                  Rp 75.000
                </span>
              </div>

              <div className="space-y-2.5 mb-6 text-left">
                {[
                  "Bayar sekali, pakai selamanya (lifetime)",
                  "Lebih unggul dari semua paket optimasi",
                  "Aman dengan System Restore bawaan",
                ].map((b) => (
                  <div key={b} className="flex items-start gap-2 text-xs md:text-sm text-white/85">
                    <BadgeCheck className="h-4 w-4 text-gaming-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gaming-accent/10 border border-gaming-accent/30 px-3 py-1 text-[10px] font-bold text-gaming-accent uppercase tracking-wider">
                  Lifetime
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gaming-accent/10 border border-gaming-accent/30 px-3 py-1 text-[10px] font-bold text-gaming-accent uppercase tracking-wider">
                  1 Akun = 1 PC
                </span>
              </div>

              <Button asChild variant="gaming-glow" size="lg" className="w-full rounded-xl animate-pulse-glow">
                <a href={SETTINX_WA_LINK} target="_blank" rel="noopener noreferrer">
                  Beli Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Gallery */}
        <div className="max-w-5xl mx-auto mt-10">
          <div className="text-center mb-6">
            <span className="gaming-badge-accent inline-flex items-center">
              PREVIEW TAMPILAN APLIKASI
            </span>
            <h3 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-wide mt-3 mb-2">
              Tampilan <span className="text-gaming-accent">APP SettinX</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Klik foto untuk melihat lebih detail. Tampilan menu & halaman login IPAN APP SettinX V1.
            </p>
          </div>
          <SettinxGallery />
        </div>
      </div>
    </section>
  );
};

export default CatalogAppSettinx;