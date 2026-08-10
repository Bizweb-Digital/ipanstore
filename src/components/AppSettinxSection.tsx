import {
  ArrowRight,
  MousePointer2,
  Crosshair,
  Activity,
  Rocket,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ElectricBorder from "@/components/ElectricBorder";
import SettinxGallery from "./SettinxGallery";
import ScrollStackCards from "./ScrollStackCards";
import Reveal from "./Reveal";

const appSettinxFeatures = [
  {
    name: "DragShot Velocity X",
    icon: MousePointer2,
    desc: "Tarikan mouse saat jump shot SG2 jadi lebih ringan & licin. Drag lebih responsif tanpa hentakan keras, shot di udara terasa natural & akurat.",
  },
  {
    name: "OneTap Vector X",
    icon: Crosshair,
    desc: "Alur gerakan mouse terkunci stabil sehingga placement crosshair di duel jarak dekat lebih presisi sejak hit pertama.",
  },
  {
    name: "Neural AimSync X",
    icon: Activity,
    desc: "Delay & akselerasi acak pada pointer dihilangkan. Flick shot merespons refleks tangan secara real-time tanpa jeda.",
  },
  {
    name: "Emulator Overdrive X",
    icon: Rocket,
    desc: "Engine BlueStacks/MSI didorong ke performa maksimal dengan frame pacing terkunci — bebas stuttering saat pasang gloo wall cepat.",
  },
];

const appSettinxBenefits = [
  "Performa PC jauh lebih ringan — background service & cache sampah dibersihkan otomatis.",
  "FPS naik signifikan & frame time lebih stabil saat war ramai.",
  "Setiap tweak aman & teraudit, lengkap dengan fitur snapshot & rollback.",
];

const AppSettinxSection = ({ compact = false }: { compact?: boolean }) => {
  const content = (
    <>
      {!compact && (
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-subheading">PRODUK UNGGULAN</span>
          <h2 className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4">
            IPAN APP SettinX V1
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Aplikasi tweak premium untuk emulator Free Fire. Optimalkan kontrol, raih FPS tinggi,
            dan rasakan aiming yang presisi di setiap duel.
          </p>
        </Reveal>
      )}

      <div className="max-w-5xl mx-auto">
        {/* ── FITUR (dipisah, dianimasikan menumpuk saat scroll) ───────────── */}
        <Reveal className="mb-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <span className="gaming-badge">GRAND LAUNCHING</span>
            <span className="gaming-badge-accent">RECOMMENDED</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F4F4F5] mb-3">
            Ipan App SettinX V1
          </h3>
          <p className="max-w-2xl mx-auto text-zinc-400">
            Aplikasi tweak premium untuk emulator Free Fire. Optimalkan kontrol, raih FPS
            tinggi, dan rasakan aiming yang presisi di setiap duel.
          </p>
        </Reveal>

        {/* Kartu fitur — MENUMPUK halus saat scroll ke bawah (tanpa getaran). */}
        <div className="max-w-3xl mx-auto">
          <ScrollStackCards itemDistance={48} itemStackDistance={18} baseScale={0.94} itemScale={0.024}>
            {appSettinxFeatures.map((f) => (
              <div key={f.name} className="gaming-card p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-md bg-[#0C0C0C] border border-white/16 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-[#94A3B8]" strokeWidth={2} />
                  </div>
                  <h4 className="font-semibold tracking-tight text-[#F4F4F5] text-lg">{f.name}</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}

            {/* Benefits */}
            <div className="gaming-card p-6 lg:p-8">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mb-5">
                Benefit Tweak Menu &amp; Advanced Tweak
              </h4>
              <div className="grid sm:grid-cols-3 gap-4">
                {appSettinxBenefits.map((b) => (
                  <div key={b} className="flex items-start gap-3 text-sm text-zinc-400">
                    <ShieldCheck className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollStackCards>
        </div>

        {/* ── HARGA + PREVIEW (SATU kesatuan, Electric Border dipertahankan) ── */}
        <div className="relative mt-16">
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
              {/* Pricing panel */}
              <div className="max-w-2xl mx-auto rounded-xl border border-white/24 bg-[#131314]/60 p-6 sm:p-8 mb-10 text-center">
                <div className="flex flex-col sm:flex-row sm:items-baseline items-center justify-center gap-1 sm:gap-3 mb-3">
                  <span className="font-mono text-base text-zinc-600 line-through">Rp 100.000</span>
                  <span className="font-mono text-4xl font-bold text-[#F4F4F5]">Rp 75.000</span>
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-5">
                  Bayar sekali, pakai selamanya. Lisensi lifetime (1 akun = 1 PC).
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 mb-5">
                  <span className="gaming-badge">
                    <BadgeCheck className="h-3 w-3 text-[#94A3B8]" /> Lisensi Lifetime
                  </span>
                  <span className="gaming-badge">
                    <ShieldCheck className="h-3 w-3 text-[#94A3B8]" /> Aman dari Error Windows
                  </span>
                </div>
                <p className="text-xs text-[#F4F4F5]/50 mb-6">
                  Dilengkapi fitur pemulihan System Restore untuk keamanan ekstra.
                </p>
                <Button
                  asChild
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-[300px]"
                >
                  <a href="/order?paket=app-settinx">
                    Beli &amp; Daftarkan Akun Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* Preview Gallery */}
              <div>
                <div className="text-center mb-7">
                  <h4 className="font-semibold tracking-tight text-[#F4F4F5] text-lg">
                    Preview Tampilan Aplikasi
                  </h4>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mt-2">
                    Klik foto untuk melihat lebih detail
                  </p>
                </div>
                <SettinxGallery />
              </div>
            </div>
          </ElectricBorder>
        </div>
      </div>
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <section className="relative py-24 overflow-hidden border-t border-white/16">
      <div className="container mx-auto px-4">
        {content}
      </div>
    </section>
  );
};

export default AppSettinxSection;
