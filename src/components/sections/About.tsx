import { Cpu, Gauge, ShieldCheck } from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import Reveal from "@/components/effects/Reveal";
import SplitText from "@/components/effects/SplitText";

const features = [
  {
    Icon: Cpu,
    name: "Optimasi PC & Emulator",
    description:
      "Fokus tweak total: CPU, RAM, GPU, dan emulator agar Free Fire smooth tanpa drop.",
    className: "sm:col-span-1",
    background: (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 0%, rgba(148,163,184,0.08), transparent 70%)",
        }}
      />
    ),
  },
  {
    Icon: Gauge,
    name: "Boost FPS Maksimal",
    description:
      "Tingkatkan performa gaming sampai batas terjauh PC kamu — tanpa install ulang untuk paket tertentu.",
    className: "",
    background: (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(148,163,184,0.08), transparent 70%)",
        }}
      />
    ),
  },
  {
    Icon: ShieldCheck,
    name: "Aman & Bergaransi",
    description:
      "Pengerjaan rapi, data aman, garansi gacor. Tidak puas? Kami benerin sampai mantap.",
    className: "",
    background: (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(148,163,184,0.08), transparent 70%)",
        }}
      />
    ),
  },
];

const About = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14 pt-6 md:pt-10">
          <span className="section-subheading">Tentang IPAN STORE</span>
          <SplitText
            tag="h2"
            text="Spesialis Optimasi PC Gaming & Emulator"
            className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-4"
            splitType="words"
            threshold={0.2}
          />
          <p className="text-zinc-400 body-clamp leading-relaxed">
            IPAN STORE adalah jasa profesional yang fokus meningkatkan performa, FPS,
            dan pengalaman gaming kamu. Tanpa perlu install ulang (untuk paket tertentu)
            — PC spek rendah pun bisa jadi lebih responsif dan ringan.
          </p>
        </Reveal>

        <BentoGrid className="max-w-5xl mx-auto auto-rows-[13.5rem]">
          {features.map((f) => (
            <BentoCard
              key={f.name}
              name={f.name}
              description={f.description}
              Icon={f.Icon}
              href="/paket"
              cta="Selengkapnya"
              background={f.background}
              className={f.className}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
};

export default About;
