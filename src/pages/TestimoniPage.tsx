import { Star, Quote, CheckCircle2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import AnimatedCounter from "@/components/AnimatedCounter";

export const testimonials = [
  {
    name: "Raxzy",
    paket: "Elite Optimizer",
    body: "Gacor banget optimize-nya, FPS naik drastis pas main FF. Recommended!",
    initial: "R",
  },
  {
    name: "Cakka",
    paket: "Elite Optimizer",
    body: "Windows oprekan by Ipan beneran beda, ringan & responsif. Mantap!",
    initial: "C",
  },
  {
    name: "Evan",
    paket: "Extreme Optimizer",
    body: "Baru 3 hari pake, langsung jago dan smooth tanpa lag. Worth banget.",
    initial: "E",
  },
  {
    name: "Kepin",
    paket: "Standart Optimizer",
    body: "Semua produk memuaskan, admin fast respon. Dijamin puas.",
    initial: "K",
  },
  {
    name: "Gilang",
    paket: "Standart Optimizer",
    body: "Admin ramah, sabar jelasin. Hasilnya juga top, PC jadi enteng.",
    initial: "G",
  },
  {
    name: "Jojo",
    paket: "Elite Optimizer",
    body: "FPS jadi boost parah, gameplay smooth. Pelayanan bintang lima!",
    initial: "J",
  },
  {
    name: "Ardi",
    paket: "Extreme Optimizer",
    body: "Awalnya ragu, tapi setelah dicoba langsung kerasa bedanya. PC gak pernah seringan ini!",
    initial: "A",
  },
  {
    name: "Reza",
    paket: "SET PC",
    body: "Emulator gw yang tadinya berat banget sekarang lancar jaya. Makasih bang Ipan!",
    initial: "R",
  },
  {
    name: "Dimas",
    paket: "Standart Optimizer",
    body: "Harga murah tapi kualitas gak murahan. Recommended banget buat yang budget tipis.",
    initial: "D",
  },
];

const TestimoniPage = () => {
  return (
    <Layout>
      <SEOHead
        title="Testimoni | IPAN STORE"
        description="Review dan testimoni pelanggan yang telah menggunakan jasa optimasi PC gaming dan boost FPS Free Fire di IPAN STORE."
      />

      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-[#060A14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="gaming-badge-accent mb-4 inline-block">REVIEW & TESTIMONI</span>
          <h1 className="h1-clamp font-display font-bold text-white mb-6">
            Apa Kata <span className="text-gaming-accent">Klien Kami?</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground body-clamp">
            Lebih dari 500+ gamer telah mempercayakan performa PC mereka kepada kami.
            Ini adalah pengalaman asli mereka.
          </p>

          <div className="mt-12 mb-8 p-6 gaming-card max-w-4xl mx-auto flex flex-col md:flex-row justify-around gap-6 items-center border-gaming-primary/20">
            <div className="text-center">
              <p className="font-display text-4xl font-black text-white"><AnimatedCounter end={500} duration={1500} suffix="+" /></p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Klien Puas</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="font-display text-4xl font-black text-gaming-accent flex justify-center items-center gap-2">
                4.9 <Star className="w-6 h-6 fill-gaming-accent text-gaming-accent" />
              </p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Rata-rata Rating</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10" />
            <div className="text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#25D366] mb-1" />
              <p className="text-sm text-[#25D366] font-bold uppercase tracking-wider">Garansi 100%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="gaming-card p-6 md:p-8 flex flex-col relative group">
                <Quote className="absolute top-6 right-6 text-white/5 w-12 h-12 rotate-180 transition-transform group-hover:text-gaming-accent/10" />
                
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-gaming-accent text-gaming-accent" />
                  ))}
                </div>
                
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 flex-1 italic relative z-10">
                  "{t.body}"
                </p>
                
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gaming-primary/20 flex items-center justify-center font-display font-bold text-lg text-gaming-accent">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm md:text-base">{t.name}</p>
                    <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">{t.paket} &middot; Verified Customer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-xs text-muted-foreground/60 italic">
              * Testimoni di atas merupakan contoh ulasan dan dapat diganti dengan review asli dari pelanggan IPAN STORE melalui sistem database/CMS di kemudian hari.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TestimoniPage;
