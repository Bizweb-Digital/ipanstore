import { Link } from "react-router-dom";
import { WA_LINK } from "./FloatingWhatsApp";
import logo from "@/assets/logo.png";
import { FaWhatsapp, FaDiscord, FaTiktok } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-[#0B1120] overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-gaming-primary to-transparent opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-gaming-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img
                src={logo}
                alt="Ipan Store"
                className="h-20 sm:h-24 w-auto object-contain drop-shadow-lg"
              />
            </Link>
            <p className="text-muted-foreground max-w-md leading-relaxed text-sm mb-8">
              Spesialis jasa optimasi PC gaming & emulator Free Fire.
              Boost FPS, tweaks total, Windows Mod by Ipan. Performa maksimal untuk device kamu.
            </p>
            {/* Social */}
            <div className="flex gap-4">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] transition-all hover:shadow-[0_0_15px_rgba(37,211,102,0.3)] text-muted-foreground"
              >
                <FaWhatsapp className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@ipann.18"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white hover:text-white transition-all text-muted-foreground"
              >
                <FaTiktok className="h-5 w-5" />
              </a>
              <a
                href="https://discord.gg/FTQVJQEAtu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#5865F2]/10 hover:border-[#5865F2] hover:text-[#5865F2] transition-all hover:shadow-[0_0_15px_rgba(88,101,242,0.3)] text-muted-foreground"
              >
                <FaDiscord className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-6 text-sm tracking-wider uppercase text-white">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> Beranda</Link></li>
              <li><Link to="/layanan" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> Layanan</Link></li>
              <li><Link to="/paket" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> Paket</Link></li>
              <li><Link to="/testimoni" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> Testimoni</Link></li>
              <li><Link to="/faq" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> FAQ</Link></li>
              <li><Link to="/kontak" className="hover:text-gaming-accent transition-colors flex items-center gap-2"><span className="text-gaming-primary/50 text-xs">▸</span> Kontak</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-display font-semibold mb-6 text-sm tracking-wider uppercase text-white">
              Layanan
            </h4>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Jam Operasional</p>
              <p className="text-sm text-white mb-1">Senin – Minggu</p>
              <p className="text-gaming-accent font-bold text-sm">24 Jam Online</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Metode</p>
              <p className="text-sm text-white">
                Remote via UltraViewer
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IPAN STORE. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Designed for Performance
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
