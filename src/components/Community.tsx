import { FaWhatsapp, FaDiscord, FaTiktok } from "react-icons/fa";

const links = [
  {
    name: "WhatsApp Channel",
    desc: "Update promo & tips harian",
    href: "https://whatsapp.com/channel/0029Vb54vP4JkK7CBBrxGf0r",
    icon: FaWhatsapp,
    color: "from-[hsl(142_70%_45%)] to-[hsl(142_70%_55%)]",
  },
  {
    name: "Discord",
    desc: "Komunitas gamer & support",
    href: "https://discord.gg/FTQVJQEAtu",
    icon: FaDiscord,
    color: "from-[hsl(235_86%_65%)] to-[hsl(265_86%_70%)]",
  },
  {
    name: "TikTok",
    desc: "Konten gaming harian",
    href: "https://www.tiktok.com/@ipann.18",
    icon: FaTiktok,
    color: "from-[hsl(340_82%_60%)] to-[hsl(195_100%_55%)]",
  },
];

const Community = () => {
  return (
    <section id="community" className="relative py-24 md:py-32 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">
            Komunitas
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black mt-4 mb-4">
            Gabung <span className="text-gradient">Komunitas Ipan Store</span>
          </h2>
          <p className="text-muted-foreground">
            Update promo, tips & trick, sampai tutorial gratis langsung dari Ipan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.name}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass-panel border-glow rounded-2xl p-8 text-center hover:border-primary/40 hover:shadow-elevated hover:-translate-y-2 transition-[var(--transition-smooth)]"
              >
                <div
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${l.color} text-white mb-5 group-hover:scale-110 group-hover:shadow-glow transition-all`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{l.name}</h3>
                <p className="text-sm text-muted-foreground">{l.desc}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Community;
