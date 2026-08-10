import { Link } from "react-router-dom";
import { WA_LINK } from "./FloatingWhatsApp";
import logo from "@/assets/logo.png";
import { FaWhatsapp, FaDiscord, FaTiktok } from "react-icons/fa";

const quickLinks = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/paket", label: "Paket" },
  { to: "/testimoni", label: "Testimoni" },
  { to: "/order", label: "Order" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontak", label: "Kontak" },
];

const socials = [
  {
    href: WA_LINK,
    label: "WhatsApp",
    icon: FaWhatsapp,
    external: true,
  },
  {
    href: "https://www.tiktok.com/@ipann.18",
    label: "TikTok",
    icon: FaTiktok,
    external: true,
  },
  {
    href: "https://discord.gg/FTQVJQEAtu",
    label: "Discord",
    icon: FaDiscord,
    external: true,
  },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-white/16 bg-[#0C0C0C]">
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a
              href="/"
              aria-label="IPAN STORE — kembali ke beranda"
              className="inline-block mb-6"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              <img
                src={logo}
                alt="Ipan Store"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </a>
            <p className="text-zinc-500 max-w-md leading-relaxed text-sm mb-8">
              Spesialis jasa optimasi PC gaming & emulator Free Fire.
              Boost FPS, tweaks total, Windows Mod by Ipan. Performa maksimal untuk device kamu.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="h-10 w-10 rounded-lg bg-[#131314] border border-white/16 flex items-center justify-center text-zinc-500 hover:text-[#F4F4F5] hover:border-white/24 transition-colors duration-200"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links + Info (compact 2 columns) */}
          <div className="grid grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h4 className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-500 mb-6">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                {quickLinks.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="hover:text-[#F4F4F5] transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-500 mb-6">
                Layanan
              </h4>
              <div className="border border-white/16 rounded-lg p-4 mb-4 bg-[#131314]/40">
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em] mb-1.5">
                  Jam Operasional
                </p>
                <p className="text-sm text-zinc-200 mb-0.5">Senin – Minggu</p>
                <p className="text-sm font-medium text-[#F4F4F5]">24 Jam Online</p>
              </div>
              <div className="border border-white/16 rounded-lg p-4 bg-[#131314]/40">
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em] mb-1.5">
                  Metode
                </p>
                <p className="text-sm text-zinc-200">Remote via UltraViewer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/16 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-zinc-500">
            © {new Date().getFullYear()} IPAN STORE. All rights reserved.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            Designed for Performance
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
