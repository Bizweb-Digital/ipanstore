import { ArrowLeft, ArrowRight, Settings, Zap, HardDrive, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";

const TweakingPcGaming = () => {
  return (
    <Layout>
      <SEOHead
        title="Tweaking PC Gaming | IPAN STORE"
        description="Layanan tweaking PC gaming untuk performa maksimal. Debloat Windows, optimasi registry, dan turunkan input lag untuk semua game."
      />

      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-[#060A14]">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gaming-accent/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link to="/layanan" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors mb-8 text-sm font-semibold uppercase tracking-wider">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Layanan
            </Link>

            <div className="gaming-card p-6 md:p-12 border-gaming-accent/30">
              <span className="gaming-badge text-gaming-accent border-gaming-accent/30 bg-gaming-accent/10 mb-4 inline-block">
                SYSTEM OPTIMIZATION
              </span>
              <h1 className="h2-clamp font-display font-bold text-white mb-6">
                Tweaking <span className="text-gaming-accent">PC Gaming</span>
              </h1>
              
              <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p className="text-base sm:text-lg">
                  Windows bawaan pabrik (default) dipenuhi dengan bloatware, background services yang tidak perlu, 
                  dan settingan power yang membatasi performa hardware. Layanan Tweaking PC Gaming kami 
                  akan membongkar batasan tersebut dan memaksa PC kamu fokus 100% untuk menjalankan game.
                </p>

                <div className="my-10 grid sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <Settings className="h-6 w-6 text-gaming-accent mb-3" />
                    <h3 className="font-bold text-white mb-2">Registry Tweaks</h3>
                    <p className="text-sm">Modifikasi registry Windows tingkat lanjut untuk responsivitas sistem.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <Zap className="h-6 w-6 text-gaming-accent mb-3" />
                    <h3 className="font-bold text-white mb-2">Input Lag Reduction</h3>
                    <p className="text-sm">Meminimalkan delay antara klik keyboard/mouse dengan aksi di monitor.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <HardDrive className="h-6 w-6 text-gaming-accent mb-3" />
                    <h3 className="font-bold text-white mb-2">Debloat Windows</h3>
                    <p className="text-sm">Menghapus aplikasi bawaan Windows yang memakan RAM dan CPU secara diam-diam.</p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <RefreshCw className="h-6 w-6 text-gaming-accent mb-3" />
                    <h3 className="font-bold text-white mb-2">Network Tweak</h3>
                    <p className="text-sm">Optimasi network adapter untuk ping yang lebih stabil saat main game online.</p>
                  </div>
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-4 mt-8">Keuntungan Tweaking</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gaming-accent shrink-0" />
                    <span><strong>FPS Meningkat:</strong> Game berat seperti Valorant, CS2, Dota 2, atau GTA V akan terasa lebih mulus karena CPU tidak lagi terbebani background process.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gaming-accent shrink-0" />
                    <span><strong>Alt-Tab Instan:</strong> Berpindah aplikasi dari game ke Discord/Chrome menjadi jauh lebih cepat tanpa freeze.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gaming-accent shrink-0" />
                    <span><strong>Windows Enteng:</strong> Penggunaan RAM saat idle (standby) akan turun drastis (sangat terasa untuk PC dengan RAM 8GB).</span>
                  </li>
                </ul>

                <div className="mt-10 p-5 rounded-xl bg-gaming-accent/10 border border-gaming-accent/20 text-sm">
                  <strong className="text-gaming-accent">Sistem Operasi yang Didukung:</strong> Windows 10 & Windows 11. 
                  Sangat direkomendasikan untuk PC Rakitan atau Laptop Gaming segala merk (ASUS ROG/TUF, Lenovo Legion, Acer Nitro, HP Omen/Victus, MSI).
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-8">
                <Button asChild variant="gaming-glow" size="lg" className="w-full sm:w-auto">
                  <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau tanya layanan Tweaking PC Gaming")}`} target="_blank" rel="noopener noreferrer">
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

export default TweakingPcGaming;
