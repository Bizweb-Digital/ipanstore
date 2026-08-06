import { FaDiscord, FaTiktok } from "react-icons/fa";

const Community = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="gaming-card max-w-4xl mx-auto p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#5865F2]/20 blur-[60px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-white/10 blur-[60px] rounded-full" />

          <h2 className="h2-clamp font-display font-bold text-white mb-4 relative z-10">
            Join Komunitas
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto relative z-10 body-clamp">
            Gabung bareng ratusan gamer lainnya di server Discord kami. Update info,
            tips tweaking gratis, dan mabar bareng.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10 w-full sm:w-auto">
            <a
              href="https://discord.gg/FTQVJQEAtu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#5865F2] text-white hover:bg-[#4752C4] px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)] hover:-translate-y-1 w-full sm:w-auto"
            >
              <FaDiscord className="w-6 h-6" />
              Join Discord Server
            </a>
            
            <a
              href="https://www.tiktok.com/@ipann.18"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black px-6 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 w-full sm:w-auto"
            >
              <FaTiktok className="w-6 h-6" />
              Follow TikTok
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
