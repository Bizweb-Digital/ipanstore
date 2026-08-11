import { ArrowLeft, ArrowRight, Zap, Target, Crosshair, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/effects/PageBackground";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

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
        title="Jasa Boost FPS Free Fire di Emulator PC (Bluestacks/MSI) | IPAN STORE"
        description="Jasa boost FPS Free Fire di emulator Bluestacks & MSI App Player. Atasi frame drop saat war, mouse delay, dan sensi tidak konsisten. Support PC low-end, pengerjaan remote 30-90 menit, bergaransi."
        jsonLd={[
          serviceJsonLd({
            name: "Boost FPS Free Fire",
            description:
              "Optimasi emulator Free Fire (Bluestacks/MSI App Player) agar FPS lebih tinggi dan stabil, mengurangi input lag & mouse delay, serta setting sensi dan keybind optimal. Pengerjaan remote, cocok untuk PC low-end.",
            path: "/layanan/boost-fps-free-fire",
            price: "20000",
          }),
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Layanan", path: "/layanan" },
            { name: "Boost FPS Free Fire", path: "/layanan/boost-fps-free-fire" },
          ]),
        ]}
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

                {/* Supported hardware & hasil realistis */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mb-8 mt-16">
                  Hasil Realistis & Hardware yang Didukung
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="gaming-card p-5">
                    <h4 className="font-semibold tracking-tight text-zinc-50 mb-3">Hasil Realistis</h4>
                    <ul className="space-y-2 text-sm text-zinc-400 leading-relaxed list-disc pl-4">
                      <li>FPS naik 30–100% tergantung hardware (mis. 30→60 FPS, 60→90+ FPS)</li>
                      <li>Frame drop saat war berkurang signifikan</li>
                      <li>Mouse delay hilang, sensi konsisten 1:1</li>
                      <li>Estimasi pengerjaan: 30–90 menit via remote</li>
                    </ul>
                  </div>
                  <div className="gaming-card p-5">
                    <h4 className="font-semibold tracking-tight text-zinc-50 mb-3">Hardware & Emulator Didukung</h4>
                    <ul className="space-y-2 text-sm text-zinc-400 leading-relaxed list-disc pl-4">
                      <li>Bluestacks 5/Nougat & MSI App Player (V7A terbaru)</li>
                      <li>PC/laptop RAM 4GB–16GB (Celeron, Core i3/i5/i7, Ryzen)</li>
                      <li>VGA integrated maupun dedicated (NVIDIA/AMD)</li>
                      <li>Windows 10 & Windows 11</li>
                    </ul>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-12 p-5 sm:p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-50 font-semibold">Catatan Penting:</strong> Hasil maksimal (seperti FPS tembus 90+) akan sangat bergantung pada hardware PC kamu (terutama Processor dan VGA). Kami membantu mengoptimalkan *potensi maksimal* dari hardware yang ada.
                </div>

                {/* CTA + internal links */}
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
                  <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto text-zinc-400">
                    <Link to="/testimoni">Lihat Bukti Testimoni</Link>
                  </Button>
                </div>
              </article>
            </div>
          </section>
    </Layout>
  );
};

export default BoostFpsFreeFire;
