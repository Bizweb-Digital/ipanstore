import { Cpu, Gauge, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Optimasi PC & Emulator",
    desc: "Fokus tweak total: CPU, RAM, GPU, dan emulator agar Free Fire smooth tanpa drop.",
  },
  {
    icon: Gauge,
    title: "Boost FPS Maksimal",
    desc: "Tingkatkan performa gaming sampai batas terjauh PC kamu — no install ulang.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Bergaransi",
    desc: "Pengerjaan rapi, data aman, garansi gacor. Tidak puas? Kami benerin sampai mantap.",
  },
];

const About = () => {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
            Tentang IPAN STORE
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-6">
            Spesialis <span className="text-gradient">Optimasi PC Gaming</span> & Emulator
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            IPAN STORE adalah jasa profesional yang fokus meningkatkan performa, FPS,
            dan pengalaman gaming kamu. Tanpa perlu install ulang (untuk paket tertentu)
            — PC spek rendah pun bisa jadi <span className="text-primary font-semibold">gacor</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-panel border-glow rounded-2xl p-8 hover:border-primary/40 hover:shadow-elevated transition-[var(--transition-smooth)] group"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
