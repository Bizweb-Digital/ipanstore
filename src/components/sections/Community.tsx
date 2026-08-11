import { FaDiscord, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Marquee } from "../ui/marquee";
import Reveal from "../effects/Reveal";

const trustTags = [
  "FPS BOOST",
  "GARANSI GACOR",
  "RESPONSIF",
  "PC SPEK RENDAH OK",
  "NO INSTALL ULANG",
  "ELITE CUSTOMER",
  "500+ KLIEN",
  "DISCORD AKTIF",
];

const Community = () => {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden border-t border-white/16">
      {/* Marquee trust strip — Magic UI */}
      <div className="relative mb-10 [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        <Marquee pauseOnHover repeat={3} className="[--duration:30s] [--gap:3rem]">
          {trustTags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500 whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container mx-auto px-4">
        <div className="gaming-card max-w-3xl mx-auto p-6 md:p-10 text-center">
          <Reveal>
            <h2 className="h2-clamp font-bold tracking-tight text-[#F4F4F5] mb-3 leading-tight">
              Join Komunitas
            </h2>
          </Reveal>
          <p className="text-zinc-400 body-clamp mb-6 max-w-lg mx-auto leading-relaxed">
            Gabung bareng ratusan gamer lainnya di server Discord kami. Update info,
            tips tweaking gratis, dan mabar bareng.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto sm:mx-auto">
            <Button asChild variant="default" size="lg" className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333]">
              <a
                href="https://discord.gg/FTQVJQEAtu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <FaDiscord className="w-4 h-4" />
                Join Discord Server
              </a>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a
                href="https://www.tiktok.com/@ipann.18"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <FaTiktok className="w-4 h-4" />
                Follow TikTok
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
