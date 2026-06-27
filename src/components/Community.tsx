import { MessageCircle, Music2 } from "lucide-react";

const links = [
  {
    name: "WhatsApp Channel",
    desc: "Update promo & tips harian",
    href: "https://whatsapp.com/channel/0029Vb54vP4JkK7CBBrxGf0r",
    icon: MessageCircle,
    color: "from-[hsl(142_70%_45%)] to-[hsl(142_70%_55%)]",
  },
  {
    name: "Discord",
    desc: "Komunitas gamer & support",
    href: "https://discord.gg/FTQVJQEAtu",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.417-2.157 2.417zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.417-2.157 2.417z" />
      </svg>
    ),
    color: "from-[hsl(235_86%_65%)] to-[hsl(265_86%_70%)]",
  },
  {
    name: "TikTok",
    desc: "Konten gaming harian",
    href: "https://www.tiktok.com/@ipann.18",
    icon: Music2,
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
                className="group glass rounded-2xl p-8 text-center hover:border-primary/40 hover:shadow-elevated hover:-translate-y-2 transition-[var(--transition-smooth)]"
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
