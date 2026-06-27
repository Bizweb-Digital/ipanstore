import { Star, Users, Award, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";

const testimonials = [
  { name: "Raxzy", text: "Gacor banget optimize-nya, FPS naik drastis pas main FF. Recommended!", paket: "Elite Optimizer" },
  { name: "Cakka", text: "Windows oprekan by Ipan beneran beda, ringan & responsif. Mantap!", paket: "Elite Optimizer" },
  { name: "Evan", text: "Baru 3 hari pake, langsung jago dan smooth tanpa lag. Worth banget.", paket: "Extreme Optimizer" },
  { name: "Kepin", text: "Semua produk memuaskan, admin fast respon. Dijamin puas.", paket: "Standart Optimizer" },
  { name: "Gilang", text: "Admin ramah, sabar jelasin. Hasilnya juga top, PC jadi enteng.", paket: "Standart Optimizer" },
  { name: "Jojo", text: "FPS jadi boost parah, gameplay smooth. Pelayanan bintang lima!", paket: "Elite Optimizer" },
  { name: "Ardi", text: "Awalnya ragu, tapi setelah dicoba langsung kerasa bedanya. PC gak pernah seringan ini!", paket: "Extreme Optimizer" },
  { name: "Reza", text: "Emulator gw yang tadinya berat banget sekarang lancar jaya. Makasih bang Ipan!", paket: "SET PC" },
  { name: "Dimas", text: "Harga murah tapi kualitas gak murahan. Recommended banget buat yang budget tipis.", paket: "Standart Optimizer" },
];

const stats = [
  { icon: Users, value: <AnimatedCounter end={500} duration={2000} suffix="+" />, label: "Klien Puas" },
  { icon: Star, value: "4.9", label: "Rating" },
  { icon: Award, value: "24/7", label: "Online Support" },
  { icon: ShieldCheck, value: "100%", label: "Garansi Gacor" },
];

const TestimoniPage = () => {
  const { ref: statsRef, revealed: statsRevealed } = useScrollReveal<HTMLDivElement>();
  const { ref: gridRef, revealed: gridRevealed } = useScrollReveal<HTMLDivElement>();

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <PageTransition>
        {/* Hero */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-[hsl(217_91%_60%)]/20 blur-[140px]" />

          <div className="container mx-auto px-4 relative text-center">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
              Testimoni
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mt-4 mb-6 leading-tight animate-fade-up">
              Kata Mereka yang <span className="text-gradient">Sudah Di OPTIMIZE</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-up delay-100">
              Ratusan klien sudah merasakan bedanya. Berikut review langsung dari mereka.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="relative py-12">
          <div className="container mx-auto px-4">
            <div
              ref={statsRef}
              className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto scroll-reveal-stagger ${statsRevealed ? "revealed" : ""}`}
            >
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-panel border-glow rounded-2xl p-6 text-center">
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" strokeWidth={2.2} />
                    <div className="font-display text-3xl md:text-4xl font-black text-gradient">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials grid */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div
              ref={gridRef}
              className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto scroll-reveal-stagger ${gridRevealed ? "revealed" : ""}`}
            >
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="glass-panel border-glow rounded-2xl p-7 hover:border-primary/40 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                    <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center font-display font-black text-primary-foreground shadow-glow">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.paket} · Verified Customer
                      </div>
                    </div>
                  </div>
                </div>
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

export default TestimoniPage;
