import { ArrowLeft, ArrowRight, Settings, Zap, HardDrive, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/layout/Layout";
import { WA_NUMBER } from "@/components/FloatingWhatsApp";
import PageBackground from "@/components/effects/PageBackground";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

const features = [
  {
    icon: Settings,
    title: "Registry Tweaks",
    desc: "Modifikasi registry Windows tingkat lanjut untuk responsivitas sistem.",
  },
  {
    icon: Zap,
    title: "Input Lag Reduction",
    desc: "Meminimalkan delay antara klik keyboard/mouse dengan aksi di monitor.",
  },
  {
    icon: HardDrive,
    title: "Debloat Windows",
    desc: "Menghapus aplikasi bawaan Windows yang memakan RAM dan CPU secara diam-diam.",
  },
  {
    icon: RefreshCw,
    title: "Network Tweak",
    desc: "Optimasi network adapter untuk ping yang lebih stabil saat main game online.",
  },
];

const benefits = [
  {
    title: "FPS Meningkat:",
    desc: " Game berat seperti Valorant, CS2, Dota 2, atau GTA V akan terasa lebih mulus karena CPU tidak lagi terbebani background process.",
  },
  {
    title: "Alt-Tab Instan:",
    desc: " Berpindah aplikasi dari game ke Discord/Chrome menjadi jauh lebih cepat tanpa freeze.",
  },
  {
    title: "Windows Enteng:",
    desc: " Penggunaan RAM saat idle (standby) akan turun drastis (sangat terasa untuk PC dengan RAM 8GB).",
  },
];

const TweakingPcGaming = () => {
  return (
    <Layout>
      <SEOHead
        title="Jasa Tweaking PC Gaming: Debloat Windows & Turunkan Input Lag | IPAN STORE"
        description="Jasa tweaking Windows untuk gaming: debloat bloatware, optimasi registry, turunkan input lag & ping. Support Windows 10/11 untuk PC rakitan & laptop gaming (ROG, Legion, Nitro, Omen, MSI)."
        jsonLd={[
          serviceJsonLd({
            name: "Tweaking PC Gaming",
            description:
              "Tweaking Windows 10/11 untuk gaming: registry tweaks, debloat bloatware, optimasi power plan & network adapter agar FPS naik, input lag turun, dan Windows lebih ringan. Pengerjaan remote via UltraViewer.",
            path: "/layanan/tweaking-pc-gaming",
            price: "50000",
          }),
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Layanan", path: "/layanan" },
            { name: "Tweaking PC Gaming", path: "/layanan/tweaking-pc-gaming" },
          ]),
        ]}
      />

      {/* Section mengalir normal (tanpa ScrollStack pembungkus). */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
            <PageBackground opacity={0.2} />
            <div className="container mx-auto px-4 relative z-10">
              <article className="max-w-4xl mx-auto">
                {/* Back link */}
                <Button asChild variant="ghost" size="sm" className="-ml-3 mb-8 text-zinc-400">
                  <Link to="/layanan">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Layanan
                  </Link>
                </Button>

                {/* Header */}
                <span className="gaming-badge mb-5 inline-flex">SYSTEM OPTIMIZATION</span>
                <h1 className="h1-clamp font-bold tracking-tight text-zinc-50 mb-6">
                  Tweaking PC Gaming
                </h1>
                <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                  Windows bawaan pabrik (default) dipenuhi dengan bloatware, background services yang tidak perlu,
                  dan settingan power yang membatasi performa hardware. Layanan Tweaking PC Gaming kami
                  akan membongkar batasan tersebut dan memaksa PC kamu fokus 100% untuk menjalankan game.
                </p>

                {/* Feature cards */}
                <div className="mt-12 grid sm:grid-cols-2 gap-4">
                  {features.map((f) => (
                    <div key={f.title} className="gaming-card p-5">
                      <f.icon className="h-5 w-5 text-zinc-300 mb-4" strokeWidth={1.75} />
                      <h3 className="font-semibold tracking-tight text-zinc-50 mb-2">{f.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mb-8 mt-16">
                  Keuntungan Tweaking
                </h3>
                <ul className="space-y-6">
                  {benefits.map((b, i) => (
                    <li key={b.title} className="flex gap-4 sm:gap-5">
                      <span className="flex-shrink-0 w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 flex items-center justify-center font-mono text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-1.5 text-sm sm:text-base text-zinc-400 leading-relaxed">
                        <strong className="text-zinc-50 font-semibold">{b.title}</strong>{b.desc}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Supported OS note */}
                <div className="mt-12 p-5 sm:p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-50 font-semibold">Sistem Operasi yang Didukung:</strong> Windows 10 & Windows 11.
                  Sangat direkomendasikan untuk PC Rakitan atau Laptop Gaming segala merk (ASUS ROG/TUF, Lenovo Legion, Acer Nitro, HP Omen/Victus, MSI).
                  Estimasi pengerjaan: 30 menit – 2 jam via remote, tergantung kondisi awal PC dan paket yang dipilih.
                  Cocok untuk semua game populer: Valorant, CS2, Dota 2, GTA V, Genshin Impact, hingga game AAA.
                </div>

                {/* CTA + internal links */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-zinc-800 pt-8">
                  <Button asChild variant="whatsapp" size="lg" className="w-full sm:w-auto">
                    <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo min, saya mau tanya layanan Tweaking PC Gaming")}`} target="_blank" rel="noopener noreferrer">
                      Konsultasi via WhatsApp
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link to="/paket">Lihat Harga Paket</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto text-zinc-400">
                    <Link to="/testimoni">Lihat Bukti Testimoni</Link>
                  </Button>
                </div>
              </article>
            </div>
          </section>
    </Layout>
  );
};

export default TweakingPcGaming;
