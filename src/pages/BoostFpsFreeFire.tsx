import { ArrowLeft, ArrowRight, Zap, Target, Crosshair, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";

const BoostFpsFreeFire = () => {
  return (
    <Layout>
      <SEOHead
        title="Boost FPS Free Fire | IPAN STORE"
        description="Jasa boost FPS Free Fire di emulator PC. Atasi lag, frame drop, dan mouse delay untuk pengalaman bermain FF yang lebih kompetitif."
      />

      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-[#060A14]">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link to="/layanan" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors mb-8 text-sm font-semibold uppercase tracking-wider">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Layanan
            </Link>

            <div className="gaming-card p-6 md:p-12 border-orange-500/30">
              <span className="gaming-badge text-orange-500 border-orange-500/30 bg-orange-500/10 mb-4 inline-block">
                EMULATOR OPTIMIZATION
              </span>
              <h1 className="h2-clamp font-display font-bold text-white mb-6">
                Boost FPS <span className="text-orange-500">Free Fire</span>
              </h1>
              
              <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p className="text-base sm:text-lg">
                  Bermain Free Fire di emulator PC seringkali terkendala oleh frame drop saat bertemu musuh (war), 
                  sensitivitas mouse yang tidak konsisten (mouse delay/acceleration), dan resource emulator yang berat. 
                  Layanan ini dirancang khusus untuk mengatasi masalah tersebut.
                </p>

                <div className="my-10 grid sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <Target className="h-6 w-6 text-orange-500 mb-3" />
                    <h3 className="font-bold text-white mb-2">Sensi Nempel Kepala</h3>
                    <p className="text-sm">Tweaking DPI dan regedit khusus agar aiming lebih presisi dan konsisten.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <Zap className="h-6 w-6 text-orange-500 mb-3" />
                    <h3 className="font-bold text-white mb-2">Anti Frame Drop</h3>
                    <p className="text-sm">Optimasi resource alokasi emulator agar FPS stabil meski sedang war ramai.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <MousePointer2 className="h-6 w-6 text-orange-500 mb-3" />
                    <h3 className="font-bold text-white mb-2">No Mouse Delay</h3>
                    <p className="text-sm">Mematikan mouse acceleration dari sistem Windows agar pergerakan 1:1.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <Crosshair className="h-6 w-6 text-orange-500 mb-3" />
                    <h3 className="font-bold text-white mb-2">Keybind Optimal</h3>
                    <p className="text-sm">Settingan keybind emulator yang responsif untuk pergerakan lincah.</p>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-4 mt-8">Proses Pengerjaan</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold font-display text-sm">1</span>
                    <div>
                      <strong className="block text-white">Pengecekan Spesifikasi</strong>
                      <span className="text-sm">Analisa spek PC untuk menentukan emulator dan versi Android yang paling ringan.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold font-display text-sm">2</span>
                    <div>
                      <strong className="block text-white">Instalasi & Tweaking Emulator</strong>
                      <span className="text-sm">Setting resolusi, DPI, dan engine emulator (OpenGL/DirectX) sesuai hardware.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold font-display text-sm">3</span>
                    <div>
                      <strong className="block text-white">Regedit & Mouse Optimization</strong>
                      <span className="text-sm">Injeksi regedit VIP dan setting Windows pointer precision.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold font-display text-sm">4</span>
                    <div>
                      <strong className="block text-white">In-game Setting</strong>
                      <span className="text-sm">Setting sensitivitas X/Y dan penyesuaian custom HUD di dalam game.</span>
                    </div>
                  </li>
                </ol>

                <div className="mt-10 p-4 sm:p-5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm">
                  <strong className="text-orange-500">Catatan Penting:</strong> Hasil maksimal (seperti FPS tembus 90+) akan sangat bergantung pada hardware PC kamu (terutama Processor dan VGA). Kami membantu mengoptimalkan *potensi maksimal* dari hardware yang ada.
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-8">
                <Button asChild variant="gaming-glow" size="lg" className="w-full sm:w-auto">
                  <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau tanya layanan Boost FPS Free Fire")}`} target="_blank" rel="noopener noreferrer">
                    Konsultasi via WhatsApp
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="gaming-outline" size="lg" className="w-full sm:w-auto">
                  <Link to="/paket">Lihat Harga Paket</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BoostFpsFreeFire;
