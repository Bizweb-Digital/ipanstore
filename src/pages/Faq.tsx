import { useState } from "react";
import { Plus, ArrowRight, MessageCircleQuestion, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { WA_LINK } from "@/components/FloatingWhatsApp";

const faqs = [
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
    a: "Ada. Kami memberikan garansi setelah optimasi. Jika ada settingan yang kurang pas (misalnya mouse terasa terlalu licin atau FPS belum maksimal), cukup chat admin kapan saja. Kami akan bantu调整 ulang secara gratis.",
  },
  {
    q: "Apakah data dan file di PC saya aman?",
    a: "100% aman. Kami hanya menonaktifkan service Windows yang tidak penting dan membersihkan cache/registry sampah. Semua file pribadi, dokumen, foto, dan game Anda tetap utuh. Untuk paket tertentu yang membutuhkan install ulang, kami selalu konfirmasi dan backup data dulu sebelumnya.",
  },
];

const QuestionBadge = ({ open }: { open: boolean }) => (
  <div
    className={`relative shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-display font-black text-lg sm:text-xl transition-all duration-300 ${
      open
        ? "bg-gaming-accent text-[#060A14] shadow-[0_0_20px_rgba(56,189,248,0.5)] rotate-[360deg]"
        : "bg-[#0B1120] border border-gaming-accent/30 text-gaming-accent"
    }`}
    aria-hidden="true"
  >
    <span className="relative z-10">?</span>
    {!open && (
      <>
        <span className="absolute inset-0 rounded-xl border border-gaming-accent/40 animate-pulse-glow" />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gaming-accent opacity-70" />
      </>
    )}
  </div>
);

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  return (
    <Layout>
      <SEOHead
        title="FAQ IPAN STORE | Pertanyaan Optimasi PC Gaming & Boost FPS Free Fire"
        description="Pertanyaan yang sering diajukan seputar jasa optimasi PC gaming, boost FPS Free Fire, IPAN APP SettinX, cara order, garansi, dan keamanan data di IPAN STORE."
        keywords="FAQ optimasi PC, tanya jawab boost FPS, jasa tweak emulator Free Fire, pertanyaan IPAN APP SettinX"
      />

      <section className="relative pt-32 pb-24 min-h-[80vh] overflow-hidden bg-[#060A14]">
        {/* Abstract Background Elements */}
        <div className="absolute top-40 right-10 w-72 h-72 bg-gaming-primary/5 blur-[80px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gaming-accent/5 blur-[100px] rounded-full" />

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="gaming-badge-accent mb-4 inline-flex items-center gap-1.5">
              <MessageCircleQuestion className="h-3 w-3" /> FAQ
            </span>
            <h1 className="h1-clamp font-display font-bold text-white mb-6">
              Pertanyaan <span className="text-gaming-accent">Umum</span>
            </h1>
            <p className="text-muted-foreground body-clamp">
              Jawaban lengkap untuk pertanyaan yang sering diajukan seputar jasa optimasi PC gaming, boost FPS Free Fire, dan IPAN APP SettinX di IPAN STORE.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? "bg-[#0F172A] border-gaming-accent/60 shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                      : "bg-[#0B1120] border-white/10 hover:border-gaming-accent/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="w-full flex items-center gap-4 sm:gap-5 text-left p-4 sm:p-5 group"
                  >
                    <QuestionBadge open={isOpen} />

                    <span
                      className={`flex-1 font-display font-bold text-sm sm:text-base uppercase tracking-wider transition-colors ${
                        isOpen ? "text-white" : "text-white/90 group-hover:text-gaming-accent"
                      }`}
                    >
                      {faq.q}
                    </span>

                    <span
                      className={`h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                        isOpen
                          ? "bg-gaming-accent/15 border-gaming-accent/60 text-gaming-accent rotate-45"
                          : "border-white/10 text-muted-foreground group-hover:border-gaming-accent/40 group-hover:text-gaming-accent"
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>

                  <div
                    id={`faq-panel-${i}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-[68px] sm:pl-[76px] pr-4 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">
                        <div className="border-l-2 border-gaming-accent/30 pl-4">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center gaming-card max-w-2xl mx-auto p-6 md:p-8 border-gaming-primary/20 bg-gaming-primary/5">
            <h3 className="font-display font-bold text-xl text-white mb-3">Punya Pertanyaan Lain?</h3>
            <p className="text-muted-foreground mb-8 text-sm md:text-base">
              Jangan ragu untuk bertanya langsung ke admin. Kami siap membantu menganalisa keluhan performa PC kamu dan merekomendasikan paket terbaik.
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#25D366] hover:bg-[#1FB958] text-white font-bold text-sm shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transition-all"
            >
              Chat via WhatsApp
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Faq;