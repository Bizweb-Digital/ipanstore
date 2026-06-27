import { useState } from "react";
import {
  MessageCircle,
  Clock,
  Send,
  ChevronDown,
  Music2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── FAQ Data ─── */
const faqs = [
  {
    q: "Apakah data saya aman?",
    a: "100% aman. Kami tidak menghapus data pribadi kamu. Proses optimasi hanya menyentuh system settings, services, dan tweaks performa. Data file, game, dan aplikasi kamu tetap utuh.",
  },
  {
    q: "Berapa lama proses optimasi?",
    a: "Tergantung paket yang dipilih. Untuk paket Standart biasanya 30-60 menit, Elite 1-2 jam, dan Extreme 2-3 jam. Semua dikerjakan via remote (TeamViewer/AnyDesk).",
  },
  {
    q: "Apakah ada garansi?",
    a: "Tentu! Semua paket sudah termasuk garansi. Kalau ada masalah setelah optimasi, tinggal hubungi admin dan kami akan benerin sampai mantap. Garansi berlaku selama kamu pakai OS yang sama.",
  },
  {
    q: "Apakah harus install ulang Windows?",
    a: "Tidak untuk paket Standart Optimizer. Untuk paket Elite dan Extreme yang menggunakan Windows Mod, Windows akan di-install ulang dengan versi yang sudah di-optimasi oleh Ipan.",
  },
  {
    q: "Spek PC minimum berapa?",
    a: "Semua spek bisa! Justru PC spek rendah yang paling kerasa perbedaannya setelah dioptimasi. Bahkan PC dengan RAM 2GB dan prosesor lama pun bisa jadi lebih responsif.",
  },
  {
    q: "Bagaimana cara pembayaran?",
    a: "Pembayaran via transfer bank (BCA, BRI, Mandiri, dll), DANA, OVO, GoPay, atau ShopeePay. Bayar setelah proses optimasi selesai dan kamu puas dengan hasilnya.",
  },
  {
    q: "Apakah bisa untuk laptop?",
    a: "Bisa banget! Semua paket support untuk PC desktop maupun laptop. Untuk laptop gaming, hasilnya bahkan bisa lebih signifikan karena biasanya banyak bloatware bawaan.",
  },
];

/* ─── Paket options ─── */
const paketOptions = [
  { value: "", label: "-- Pilih Paket (Opsional) --" },
  { value: "SET PC (50K)", label: "SET PC — 50K" },
  { value: "Standart Optimizer (50K)", label: "Standart Optimizer — 50K" },
  { value: "Elite Optimizer (100K)", label: "Elite Optimizer — 100K (Paling Laris)" },
  { value: "Extreme Optimizer (150K)", label: "Extreme Optimizer — 150K (Pro Choice)" },
  { value: "Belum tahu, mau konsultasi", label: "Belum tahu, mau konsultasi dulu" },
];

const deviceOptions = [
  { value: "", label: "-- Pilih Perangkat --" },
  { value: "PC Desktop", label: "PC Desktop" },
  { value: "Laptop", label: "Laptop" },
  { value: "Keduanya", label: "Keduanya (PC + Laptop)" },
];

/* ─── FAQ Item ─── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-primary shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="px-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

/* ─── Page ─── */
const Contact = () => {
  const [nama, setNama] = useState("");
  const [device, setDevice] = useState("");
  const [paket, setPaket] = useState("");
  const [pesan, setPesan] = useState("");

  const { ref: formRef, revealed: formRevealed } = useScrollReveal<HTMLDivElement>();
  const { ref: faqRef, revealed: faqRevealed } = useScrollReveal<HTMLDivElement>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let msg = `Halo min, saya ${nama || "calon customer"}.`;
    if (device) msg += `\nPerangkat: ${device}`;
    if (paket) msg += `\nPaket yang diminati: ${paket}`;
    if (pesan) msg += `\n\nPesan:\n${pesan}`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <PageTransition>
        {/* Hero */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-[hsl(217_91%_60%)]/20 blur-[140px]" />

          <div className="container mx-auto px-4 relative text-center">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
              Hubungi Kami
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mt-4 mb-6 leading-tight animate-fade-up">
              Konsultasi <span className="text-gradient">Gratis</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-up delay-100">
              Isi form di bawah untuk langsung chat ke WhatsApp admin, atau hubungi kami lewat channel lainnya.
            </p>
          </div>
        </section>

        {/* Contact Form + Info */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div
              ref={formRef}
              className={`grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto scroll-reveal ${formRevealed ? "revealed" : ""}`}
            >
              {/* Form */}
              <div className="lg:col-span-3">
                <div className="glass-strong rounded-2xl p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-[hsl(142_70%_45%)] flex items-center justify-center text-white">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">Chat via WhatsApp</h2>
                      <p className="text-sm text-muted-foreground">
                        Isi form ini, lalu klik kirim untuk langsung chat admin
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                        Nama Kamu
                      </label>
                      <input
                        type="text"
                        placeholder="Masukkan nama kamu"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="contact-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                        Jenis Perangkat
                      </label>
                      <select
                        value={device}
                        onChange={(e) => setDevice(e.target.value)}
                        className="contact-select"
                        required
                      >
                        {deviceOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                        Paket yang Diminati
                      </label>
                      <select
                        value={paket}
                        onChange={(e) => setPaket(e.target.value)}
                        className="contact-select"
                      >
                        {paketOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                        Pesan / Keluhan
                      </label>
                      <textarea
                        placeholder="Ceritakan masalah PC kamu atau tanyakan apa saja..."
                        value={pesan}
                        onChange={(e) => setPesan(e.target.value)}
                        rows={4}
                        className="contact-textarea"
                      />
                    </div>

                    <Button type="submit" variant="whatsapp" size="lg" className="w-full">
                      <Send className="h-5 w-5 mr-2" />
                      Kirim via WhatsApp
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Klik tombol di atas akan membuka WhatsApp dengan pesan yang sudah diformat
                    </p>
                  </form>
                </div>
              </div>

              {/* Info Cards */}
              <div className="lg:col-span-2 space-y-5">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-2xl p-6 flex items-start gap-4 hover:border-primary/40 hover:shadow-elevated transition-all duration-300 group block"
                >
                  <div className="h-12 w-12 rounded-xl bg-[hsl(142_70%_45%)] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base mb-1">WhatsApp</h3>
                    <p className="text-sm text-primary font-semibold">+62 889-7649-6870</p>
                    <p className="text-xs text-muted-foreground mt-1">Fast response, chat langsung!</p>
                  </div>
                </a>

                {/* Jam Operasional */}
                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base mb-1">Jam Operasional</h3>
                    <p className="text-sm text-foreground/80">Senin – Minggu</p>
                    <p className="text-sm text-primary font-semibold">24 Jam Online</p>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base mb-1">Layanan Remote</h3>
                    <p className="text-sm text-muted-foreground">
                      Semua dikerjakan via remote (TeamViewer/AnyDesk). Bisa dari mana saja!
                    </p>
                  </div>
                </div>

                {/* Social */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display font-bold text-base mb-4">Ikuti Kami</h3>
                  <div className="space-y-3">
                    <a
                      href="https://discord.gg/FTQVJQEAtu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="h-9 w-9 rounded-lg glass flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.417-2.157 2.417zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.417-2.157 2.417z" />
                        </svg>
                      </span>
                      Discord — Komunitas Gamer
                    </a>
                    <a
                      href="https://www.tiktok.com/@ipann.18"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="h-9 w-9 rounded-lg glass flex items-center justify-center">
                        <Music2 className="h-4 w-4" />
                      </span>
                      TikTok — @ipann.18
                    </a>
                    <a
                      href="https://whatsapp.com/channel/0029Vb54vP4JkK7CBBrxGf0r"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="h-9 w-9 rounded-lg glass flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      WhatsApp Channel — Update & Promo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
                FAQ
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-4">
                Pertanyaan <span className="text-gradient">Umum</span>
              </h2>
              <p className="text-muted-foreground">
                Jawaban untuk pertanyaan yang paling sering ditanyakan.
              </p>
            </div>

            <div
              ref={faqRef}
              className={`max-w-3xl mx-auto space-y-3 scroll-reveal ${faqRevealed ? "revealed" : ""}`}
            >
              {faqs.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>
      </PageTransition>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Contact;
