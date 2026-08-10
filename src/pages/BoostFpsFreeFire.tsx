import { ArrowLeft, ArrowRight, Zap, Target, Crosshair, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/PageBackground";

const features = [
  {
    icon: Target,
    title: "Sensi Nempel Kepala",
    desc: "Tweaking DPI dan regedit khusus agar aiming lebih presisi dan konsisten.",
  },
  {
    icon: Zap,
    title: "Anti Frame Drop",
    desc: "Optimasi resource alokasi emulator agar FPS stabil meski sedang war ramai.",
  },
  {
    icon: MousePointer2,
    title: "No Mouse Delay",
    desc: "Mematikan mouse acceleration dari sistem Windows agar pergerakan 1:1.",
  },
  {
    icon: Crosshair,
    title: "Keybind Optimal",
    desc: "Settingan keybind emulator yang responsif untuk pergerakan lincah.",
  },
];

const steps = [
  {
    title: "Pengecekan Spesifikasi",
    desc: "Analisa spek PC untuk menentukan emulator dan versi Android yang paling ringan.",
  },
  {
    title: "Instalasi & Tweaking Emulator",
    desc: "Setting resolusi, DPI, dan engine emulator (OpenGL/DirectX) sesuai hardware.",
  },
  {
    title: "Regedit & Mouse Optimization",
    desc: "Injeksi regedit VIP dan setting Windows pointer precision.",
  },
  {
    title: "In-game Setting",
    desc: "Setting sensitivitas X/Y dan penyesuaian custom HUD di dalam game.",
  },
];

const BoostFpsFreeFire = () => {
  return (
    <Layout>
      <SEOHead
        title="Boost FPS Free Fire | IPAN STORE"
        description="Jasa boost FPS Free Fire di emulator PC. Atasi lag, frame drop, dan mouse delay untuk pengalaman bermain FF yang lebih kompetitif."
      />

      {/* Section mengalir normal (tanpa ScrollStack pembungkus). */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
            <PageBackground opacity={0.2} />
            <div className="container mx-auto px-4 relative z-10">
              <article className="max-w-4xl mx-auto">
                {/* Back link */}
                <Button asChild variant="ghost" size="sm" className="-ml-3 mb-8 text-zinc-400">
                  <Link to="/layanan">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Layanan
                  </Link>
                </Button>

                {/* Header */}
                <span className="gaming-badge mb-5 inline-flex">EMULATOR OPTIMIZATION</span>
                <h1 className="h1-clamp font-bold tracking-tight text-zinc-50 mb-6">
                  Boost FPS Free Fire
                </h1>
                <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                  Bermain Free Fire di emulator PC seringkali terkendala oleh frame drop saat bertemu musuh (war),
                  sensitivitas mouse yang tidak konsisten (mouse delay/acceleration), dan resource emulator yang berat.
                  Layanan ini dirancang khusus untuk mengatasi masalah tersebut.
                </p>

                {/* Feature cards */}
                <div className="mt-12 grid sm:grid-cols-2 gap-4">
                  {features.map((f) => (
                    <div key={f.title} className="gaming-card p-5">
                      <f.icon className="h-5 w-5 text-zinc-300 mb-4" strokeWidth={1.75} />
                      <h3 className="font-semibold tracking-tight text-zinc-50 mb-2">{f.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Process steps */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mb-8 mt-16">
                  Proses Pengerjaan
                </h3>
                <ol className="space-y-6">
                  {steps.map((s, i) => (
                    <li key={s.title} className="flex gap-4 sm:gap-5">
                      <span className="flex-shrink-0 w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 flex items-center justify-center font-mono text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-1.5">
                        <strong className="block font-semibold tracking-tight text-zinc-50 mb-1">{s.title}</strong>
                        <span className="text-sm text-zinc-400 leading-relaxed">{s.desc}</span>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Note */}
                <div className="mt-12 p-5 sm:p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-50 font-semibold">Catatan Penting:</strong> Hasil maksimal (seperti FPS tembus 90+) akan sangat bergantung pada hardware PC kamu (terutama Processor dan VGA). Kami membantu mengoptimalkan *potensi maksimal* dari hardware yang ada.
                </div>

                {/* CTA */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-zinc-800 pt-8">
                  <Button asChild variant="whatsapp" size="lg" className="w-full sm:w-auto">
                    <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau tanya layanan Boost FPS Free Fire")}`} target="_blank" rel="noopener noreferrer">
                      Konsultasi via WhatsApp
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link to="/paket">Lihat Harga Paket</Link>
                  </Button>
                </div>
              </article>
            </div>
          </section>
    </Layout>
  );
};

export default BoostFpsFreeFire;
