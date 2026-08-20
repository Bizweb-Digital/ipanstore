import { useState, useEffect } from "react";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { WA_LINK } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/effects/PageBackground";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { supabase } from "@/lib/admin/supabase";

interface SupabaseFAQ {
  question: string;
  answer: string;
  sort_order: number;
}

const FALLBACK_FAQS = [
  {
    q: "Apa itu Jasa Optimasi PC Gaming IPAN STORE?",
    a: "IPAN STORE adalah layanan tweak PC & emulator profesional yang membantu gamer meningkatkan FPS, mengurangi input lag, dan menstabilkan performa PC gaming. Kami melayani optimasi Windows, setting emulator Free Fire, serta tweak menu premium lewat IPAN APP SettinX.",
  },
  {
    q: "Apakah layanan ini khusus Free Fire saja?",
    a: "Tidak. Meskipun kami paling dikenal sebagai spesialis boost FPS Free Fire, layanan kami juga mencakup optimasi PC gaming untuk berbagai game populer seperti Valorant, Dota 2, CS2, GTA V, Mobile Legends via emulator, Genshin Impact, dan game AAA lainnya.",
  },
  {
    q: "Apakah cocok untuk laptop atau PC low-end?",
    a: "Sangat cocok. Justru laptop/PC spek rendah (RAM 4GB/8GB dengan Celeron, Core i3, VGA integrated) akan paling merasakan perbedaan signifikan. Kami menonaktifkan service Windows yang memberatkan sehingga resource CPU & RAM 100% fokus ke game.",
  },
  {
    q: "Apakah FPS benar-benar pasti naik?",
    a: "Secara sistem, sumber daya yang sebelumnya terbuang akan dialihkan ke game. Namun, angka peningkatan FPS tergantung pada batas maksimal hardware (VGA & CPU) Anda. Kami menjamin potensi FPS maksimal keluar dari PC Anda.",
  },
  {
    q: "Apa itu IPAN APP SettinX dan kenapa lebih unggul?",
    a: "IPAN APP SettinX adalah aplikasi tweak premium dengan fitur DragShot Velocity, OneTap Vector, Neural AimSync, dan Emulator Overdrive. Lisensi seharga Rp 75.000 (hemat Rp 25.000 dari harga normal Rp 100.000), bayar sekali untuk lifetime, dan menggabungkan semua keunggulan paket optimasi dalam satu aplikasi otomatis.",
  },
  {
    q: "Bagaimana cara order dan proses pengerjaannya?",
    a: "Cukup klik tombol 'Order via WhatsApp'. Admin akan merekomendasikan paket yang tepat untuk spek PC/laptop Anda. Setelah pembayaran, kami akan meremote PC Anda melalui UltraViewer. Anda tinggal duduk santai dan melihat proses optimasi secara live.",
  },
  {
    q: "Apakah ada konsultasi gratis sebelum membeli?",
    a: "Tentu! Konsultasi 100% gratis tanpa syarat. Kirim spesifikasi PC/laptop Anda via WhatsApp beserta keluhannya (misalnya: lag saat war Free Fire, emulator force close, FPS naik-turun), maka admin akan merekomendasikan paket atau solusi yang paling sesuai.",
  },
  {
    q: "Berapa lama proses optimasi selesai?",
    a: "Tergantung paket dan kondisi awal PC. Rata-rata 30 menit – 2 jam. Untuk paket Full Optimization yang mencakup Windows Mod, proses bisa sedikit lebih lama. Semua pengerjaan dilakukan live via remote, jadi Anda bisa melihat langsung hasilnya.",
  },
  {
    q: "Apakah ada garansi dan support setelah optimasi?",
    a: "Ada. Kami memberikan garansi setelah optimasi. Jika ada settingan yang kurang pas (misalnya mouse terasa terlalu licin atau FPS belum maksimal), cukup chat admin kapan saja. Kami akan bantu sesuaikan ulang secara gratis.",
  },
  {
    q: "Apakah data dan file di PC saya aman?",
    a: "100% aman. Kami hanya menonaktifkan service Windows yang tidak penting dan membersihkan cache/registry sampah. Semua file pribadi, dokumen, foto, dan game Anda tetap utuh. Untuk paket tertentu yang membutuhkan install ulang, kami selalu konfirmasi dan backup data dulu sebelumnya.",
  },
];

const Faq = () => {
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(FALLBACK_FAQS);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    async function fetchActiveFaqs() {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('question, answer, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          // Gabungkan: FAQ hardcoded (fallback) dulu di atas, FAQ baru dari
          // database masuk di urutan TERBAWAH.
          const dbFaqs = data.map(faq => ({ q: faq.question, a: faq.answer }));
          const dbQuestions = new Set(dbFaqs.map(f => f.q));

          // Fallback yang belum ada di database tetap tampil di atas
          const baseFaqs = FALLBACK_FAQS.filter(f => !dbQuestions.has(f.q));

          setFaqs([...baseFaqs, ...dbFaqs]);
        } else {
          console.log("No active FAQs from Supabase, using fallback");
          setFaqs(FALLBACK_FAQS);
        }
      } catch (err) {
        console.error("Error fetching FAQs:", err);
        setFaqs(FALLBACK_FAQS);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveFaqs();
  }, []);

  const toggle = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  return (
    <Layout>
      <SEOHead
        title="FAQ: Apakah Optimasi PC Aman & Menaikkan FPS? | IPAN STORE"
        description="Apakah optimasi PC meningkatkan FPS? Apakah jasa tweak PC aman? Berapa lama prosesnya? Apakah bisa untuk laptop low-end? Jawaban lengkap seputar jasa optimasi IPAN STORE."
        jsonLd={[
          faqJsonLd(faqs),
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      {/* Section mengalir normal (tanpa ScrollStack pembungkus). */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
            <PageBackground opacity={0.2} />
            <div className="container mx-auto px-4 relative z-10">
              {/* Hero */}
              <div className="max-w-3xl mx-auto text-center mb-16">
                <span className="gaming-badge mb-5 inline-block">FAQ</span>
                <h1 className="h1-clamp font-bold tracking-tight text-[#F4F4F5] mb-5">
                  Pertanyaan Umum
                </h1>
                <p className="text-zinc-400">
                  Jawaban lengkap untuk pertanyaan yang sering diajukan seputar jasa optimasi PC gaming, boost FPS Free Fire, dan IPAN APP SettinX di IPAN STORE.
                </p>
              </div>

              {/* Accordion — divider lines, no boxed items */}
              <div className="max-w-3xl mx-auto border-b border-white/16">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#94A3B8]" />
                    <p className="text-sm text-zinc-500 font-mono">Memuat FAQ…</p>
                  </div>
                ) : faqs.map((faq, i) => {
                  const isOpen = openIndex === i;
                  return (
                    <div key={i} className="border-t border-white/16">
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        className="w-full flex items-center gap-4 sm:gap-6 text-left py-5 sm:py-6 group"
                      >
                        <span className="font-mono text-xs text-zinc-600 shrink-0 w-6">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <span
                          className={`flex-1 font-medium text-base sm:text-lg tracking-tight transition-colors duration-200 ${
                            isOpen ? "text-[#F4F4F5]" : "text-zinc-200 group-hover:text-[#F4F4F5]"
                          }`}
                        >
                          {faq.q}
                        </span>

                        <Plus
                          className={`h-4 w-4 shrink-0 text-[#F4F4F5]/50 transition-transform duration-200 ${
                            isOpen ? "rotate-45 text-[#94A3B8]" : "group-hover:text-[#94A3B8]"
                          }`}
                          strokeWidth={2}
                        />
                      </button>

                      <div
                        id={`faq-panel-${i}`}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-10 sm:pl-12 pr-8 pb-6 text-sm md:text-base text-zinc-400 leading-relaxed">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA box */}
              <div className="mt-16 gaming-card max-w-2xl mx-auto p-6 md:p-10 text-center">
                <h3 className="text-xl font-semibold tracking-tight text-[#F4F4F5] mb-3">Punya Pertanyaan Lain?</h3>
                <p className="text-zinc-400 mb-8 text-sm md:text-base">
                  Jangan ragu untuk bertanya langsung ke admin. Kami siap membantu menganalisa keluhan performa PC kamu dan merekomendasikan paket terbaik.
                </p>
                <Button asChild variant="default" size="lg">
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
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

