import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_LINK } from "@/components/FloatingWhatsApp";

const faqs = [
  {
    q: "Apakah layanan ini khusus Free Fire?",
    a: "Tidak. Meski kami sangat dikenal untuk optimasi emulator Free Fire, layanan kami mencakup optimasi PC gaming secara menyeluruh. Kami bisa boost FPS untuk game PC lain seperti Valorant, Dota 2, CS2, GTA V, hingga game AAA.",
  },
  {
    q: "Apakah cocok untuk laptop low-end?",
    a: "Sangat cocok. Justru laptop low-end (seperti RAM 4GB/8GB dengan prosesor Celeron/Core i3 lama) akan paling merasakan perbedaan performanya. Kami akan matikan service Windows yang berat agar resource 100% fokus ke game.",
  },
  {
    q: "Apakah FPS pasti naik?",
    a: "Secara sistem iya, karena resource yang tadinya terbuang akan dialihkan ke game. Namun, peningkatan FPS (berapa angka naiknya) akan sangat bergantung pada batas maksimal hardware (VGA & CPU) yang kamu miliki. Kami menjamin 'potensi maksimal' dari PC kamu keluar.",
  },
  {
    q: "Bagaimana cara order dan prosesnya?",
    a: "Kamu cukup klik tombol 'Order via WhatsApp'. Admin akan bantu pilihkan paket, setelah pembayaran, kami akan meremote PC kamu menggunakan UltraViewer. Kamu tinggal duduk manis melihat PC kamu dioptimasi dari jarak jauh.",
  },
  {
    q: "Apakah bisa konsultasi dulu sebelum beli?",
    a: "Tentu! Konsultasi 100% gratis. Silakan chat admin via WhatsApp, kasih tau spesifikasi PC/laptop kamu dan keluhannya (misal: sering patah-patah pas war FF). Nanti admin kasih rekomendasi paket yang paling pas.",
  },
  {
    q: "Apakah hasil tiap device berbeda?",
    a: "Betul. PC dengan spek mumpuni yang sebelumnya 'salah setting' akan mendapat lonjakan FPS drastis. Sementara PC low-end mungkin kenaikannya tidak setinggi PC dewa, tapi akan jauh lebih stabil (minim frame drop) dan enteng buat multitasking.",
  },
  {
    q: "Berapa lama proses optimasi?",
    a: "Tergantung paket yang dipilih dan kondisi PC kamu. Rata-rata memakan waktu 30 menit hingga 2 jam. Untuk paket Full Optimization yang mencakup Windows Mod, bisa memakan waktu lebih lama. Semua dilakukan live via remote.",
  },
  {
    q: "Apakah ada support setelah optimasi?",
    a: "Ada. Kami memberikan garansi dan support after-sales. Jika setelah optimasi ada settingan yang kurang pas (misal sensitivitas mouse terlalu licin), silakan chat admin lagi, kami bantu sesuaikan gratis.",
  },
];

const Faq = () => {
  return (
    <Layout>
      <SEOHead
        title="FAQ IPAN STORE | Pertanyaan Seputar Optimasi PC Gaming"
        description="Temukan jawaban seputar layanan optimasi PC gaming, boost FPS Free Fire, proses order, dan hasil optimasi device di IPAN STORE."
      />

      <section className="relative pt-32 pb-24 min-h-[80vh] overflow-hidden bg-[#060A14]">
        {/* Abstract Background Elements */}
        <div className="absolute top-40 right-10 w-72 h-72 bg-gaming-primary/5 blur-[80px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gaming-accent/5 blur-[100px] rounded-full" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="gaming-badge-accent mb-4 inline-block">FAQ</span>
            <h1 className="h1-clamp font-display font-bold text-white mb-6">
              Pertanyaan <span className="text-gaming-accent">Umum</span>
            </h1>
            <p className="text-muted-foreground body-clamp">
              Jawaban cepat untuk pertanyaan yang sering diajukan seputar jasa optimasi PC IPAN STORE.
            </p>
          </div>

          <div className="max-w-3xl mx-auto gaming-card p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/5 border-b last:border-0 px-2 py-1">
                  <AccordionTrigger className="text-left font-semibold text-white hover:text-gaming-accent hover:no-underline py-4 transition-colors">
                    <span className="flex gap-4 items-start">
                      <HelpCircle className="h-5 w-5 text-gaming-accent shrink-0 mt-0.5 opacity-70" />
                      {faq.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pl-9 pb-5 text-sm md:text-base">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-16 text-center gaming-card max-w-2xl mx-auto p-6 md:p-8 border-gaming-primary/20 bg-gaming-primary/5">
            <h3 className="font-display font-bold text-xl text-white mb-3">Punya Pertanyaan Lain?</h3>
            <p className="text-muted-foreground mb-8 text-sm md:text-base">
              Jangan ragu untuk bertanya langsung ke admin. Kami siap membantu menganalisa keluhan performa PC kamu.
            </p>
            <Button asChild variant="whatsapp" className="rounded-xl shadow-[0_0_15px_rgba(37,211,102,0.3)] w-full sm:w-auto">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                Chat via WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Faq;
