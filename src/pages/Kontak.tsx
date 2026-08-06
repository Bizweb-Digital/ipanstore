import { ArrowRight, MapPin, Clock, MessageCircle } from "lucide-react";
import { FaWhatsapp, FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_LINK, WA_NUMBER } from "@/components/FloatingWhatsApp";

const Kontak = () => {
  // Prevent form submission since there is no backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(WA_LINK, "_blank");
  };

  return (
    <Layout>
      <SEOHead
        title="Kontak IPAN STORE | Konsultasi Optimasi PC Gaming"
        description="Hubungi IPAN STORE melalui WhatsApp untuk konsultasi layanan tweaking PC gaming dan boost FPS Free Fire."
      />

      <section className="relative pt-32 pb-24 min-h-screen overflow-hidden bg-[#060A14]">
        {/* Abstract grids & glow */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gaming-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="gaming-badge-accent mb-4 inline-block">HUBUNGI KAMI</span>
            <h1 className="h1-clamp font-display font-bold text-white mb-6">
              Mari Bicara <span className="text-gaming-accent">Performa</span>
            </h1>
            <p className="text-muted-foreground body-clamp">
              Punya keluhan soal PC lag atau bingung pilih paket? Chat kami sekarang.
              Admin online 24 jam siap membantu menyelesaikan masalah device kamu.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="gaming-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                  <FaWhatsapp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">WhatsApp Fast Response</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Konsultasi langsung dengan admin (24 Jam Online)
                  </p>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] font-semibold hover:underline flex items-center text-sm"
                  >
                    +{WA_NUMBER} <ArrowRight className="ml-1 w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="gaming-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                  <FaWhatsapp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">WhatsApp Channel</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Update testimony & tips tweaking harian.
                  </p>
                  <a
                    href="https://www.whatsapp.com/channel/0029Vb54vP4JkK7CBBrxGf0r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] font-semibold hover:underline flex items-center text-sm"
                  >
                    Join Komunitas <ArrowRight className="ml-1 w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="gaming-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gaming-accent/20 border border-gaming-accent/30 flex items-center justify-center text-gaming-accent shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">Proses Pengerjaan</h3>
                  <p className="text-muted-foreground text-sm">
                    Kami melayani pengerjaan 100% <strong>Remote (Jarak Jauh)</strong> via UltraViewer ke seluruh Indonesia.
                  </p>
                </div>
              </div>

              <div className="gaming-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] shrink-0">
                  <FaDiscord className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">Discord Community</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Join mabar & diskusi sesama kustomer.
                  </p>
                  <a
                    href="https://discord.gg/FTQVJQEAtu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5865F2] font-semibold hover:underline flex items-center text-sm"
                  >
                    Join Server <ArrowRight className="ml-1 w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Form Trigger to WA */}
            <div className="gaming-card p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/20 blur-[50px] rounded-full" />
              
              <h2 className="font-display font-bold text-2xl text-white mb-2 relative z-10">Kirim Pesan</h2>
              <p className="text-muted-foreground mb-8 text-sm relative z-10">
                Isi form singkat ini, kamu akan langsung diarahkan ke WhatsApp admin kami.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide text-xs">
                    Nama / Nickname
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Gaming"
                    className="gaming-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide text-xs">
                    Kendala PC / Spesifikasi
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Contoh: Spek saya i3 RAM 8GB, main FF pas war sering drop FPS ke 20..."
                    className="w-full p-4 text-sm rounded-xl bg-[rgba(16,24,39,0.6)] border border-white/10 text-[#F8FAFC] outline-none transition-all focus:border-gaming-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.2)] focus:bg-[rgba(16,24,39,0.9)] resize-none"
                  ></textarea>
                </div>
                <Button type="submit" variant="whatsapp" className="w-full rounded-xl mt-4">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Lanjut ke WhatsApp
                </Button>
                <p className="text-center text-xs text-muted-foreground/50 mt-4">
                  Privasi data terjamin. Kami tidak menyimpan form ini di database publik.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Kontak;
