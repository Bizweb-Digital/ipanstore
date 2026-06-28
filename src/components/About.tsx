import { Cpu, Gauge, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Optimasi PC & Emulator",
    desc: "Fokus tweak total: CPU, RAM, GPU, dan emulator agar Free Fire smooth tanpa drop.",
    badge: "SYSTEM",
  },
  {
    icon: Gauge,
    title: "Boost FPS Maksimal",
    desc: "Tingkatkan performa gaming sampai batas terjauh PC kamu — no install ulang (untuk paket tertentu).",
    badge: "PERFORMANCE",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Bergaransi",
    desc: "Pengerjaan rapi, data aman, garansi gacor. Tidak puas? Kami benerin sampai mantap.",
    badge: "TRUST",
  },
];

const About = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-gaming-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="section-subheading">Tentang IPAN STORE</span>
          <h2 className="h2-clamp font-display font-bold text-white mb-6">
            Spesialis <span className="text-gaming-accent">Optimasi PC Gaming</span> & Emulator
          </h2>
          <p className="text-muted-foreground body-clamp">
            IPAN STORE adalah jasa profesional yang fokus meningkatkan performa, FPS,
            dan pengalaman gaming kamu. Tanpa perlu install ulang (untuk paket tertentu)
            — PC spek rendah pun bisa jadi lebih responsif dan ringan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="gaming-card p-8 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gaming-primary/10 border border-gaming-primary/20 flex items-center justify-center text-gaming-accent group-hover:scale-110 group-hover:bg-gaming-primary/20 transition-all duration-300">
                  <f.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <span className="gaming-badge text-[9px]">{f.badge}</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-3 tracking-wide">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
