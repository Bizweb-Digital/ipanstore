import { ArrowRight, MapPin, MessageCircle, Radio, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_LINK, WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/PageBackground";

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

      {/* Section mengalir normal (tanpa ScrollStack pembungkus). */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
            <PageBackground opacity={0.2} />
            <div className="container mx-auto px-4 relative z-10">
              {/* Hero */}
              <div className="max-w-3xl mx-auto text-center mb-16">
                <span className="gaming-badge mb-5 inline-block">HUBUNGI KAMI</span>
                <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-5">
                  Mari Bicara Performa
                </h1>
                <p className="text-zinc-400">
                  Punya keluhan soal PC lag atau bingung pilih paket? Chat kami sekarang.
                  Admin online 24 jam siap membantu menyelesaikan masalah device kamu.
                </p>
              </div>

              <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-10">
                {/* Contact Info Cards */}
                <div className="space-y-4">
                  <div className="gaming-card p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-[#F4F4F5] mb-1">WhatsApp Fast Response</h3>
                      <p className="text-zinc-400 text-sm mb-3">
                        Konsultasi langsung dengan admin (24 Jam Online)
                      </p>
                      <a
                        href={WA_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-[#94A3B8] hover:text-[#F4F4F5] transition-colors duration-200 inline-flex items-center"
                      >
                        +{WA_NUMBER} <ArrowRight className="ml-1.5 w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="gaming-card p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-[#F4F4F5] mb-1">WhatsApp Channel</h3>
                      <p className="text-zinc-400 text-sm mb-3">
                        Update testimony & tips tweaking harian.
                      </p>
                      <a
                        href="https://www.whatsapp.com/channel/0029Vb54vP4JkK7CBBrxGf0r"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#94A3B8] hover:text-[#F4F4F5] transition-colors duration-200 inline-flex items-center"
                      >
                        Join Komunitas <ArrowRight className="ml-1.5 w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="gaming-card p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-[#F4F4F5] mb-1">Proses Pengerjaan</h3>
                      <p className="text-zinc-400 text-sm">
                        Kami melayani pengerjaan 100% <strong className="text-zinc-200 font-medium">Remote (Jarak Jauh)</strong> via UltraViewer ke seluruh Indonesia.
                      </p>
                    </div>
                  </div>

                  <div className="gaming-card p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-[#F4F4F5] mb-1">Discord Community</h3>
                      <p className="text-zinc-400 text-sm mb-3">
                        Join mabar & diskusi sesama kustomer.
                      </p>
                      <a
                        href="https://discord.gg/FTQVJQEAtu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#94A3B8] hover:text-[#F4F4F5] transition-colors duration-200 inline-flex items-center"
                      >
                        Join Server <ArrowRight className="ml-1.5 w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Quick Form Trigger to WA */}
                <div className="gaming-card p-6 md:p-8">
                  <h2 className="text-2xl font-bold tracking-tight text-[#F4F4F5] mb-2">Kirim Pesan</h2>
                  <p className="text-zinc-400 mb-8 text-sm">
                    Isi form singkat ini, kamu akan langsung diarahkan ke WhatsApp admin kami.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mb-2">
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
                      <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F4F5]/50 mb-2">
                        Kendala PC / Spesifikasi
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Contoh: Spek saya i3 RAM 8GB, main FF pas war sering drop FPS ke 20..."
                        className="gaming-input h-auto min-h-[120px] py-3.5 leading-relaxed resize-none"
                      ></textarea>
                    </div>
                    <Button type="submit" variant="default" className="w-full mt-2" size="lg">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Lanjut ke WhatsApp
                    </Button>
                    <p className="text-center text-xs text-[#F4F4F5]/50 mt-4">
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

