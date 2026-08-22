import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WA_LINK } from "../FloatingWhatsApp";
import logo from "@/assets/logo.png";
import logoWebp from "@/assets/logo.webp";
import logoWebp293 from "@/assets/logo-293.webp";

const StaggeredMenu = lazy(() => import("../StaggeredMenu"));

const links = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/paket", label: "Paket" },
  { to: "/testimoni", label: "Testimoni" },
  { to: "/order", label: "Order" },
  { to: "/garansi", label: "Garansi" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontak", label: "Kontak" },
  { to: "/admin/login", label: "Login Admin", variant: "primary" },
];

const socialLinks = [
  { label: "WhatsApp", link: WA_LINK },
  { label: "Discord", link: "https://discord.gg/FTQVJQEAtu" },
  { label: "TikTok", link: "https://www.tiktok.com/@ipann.18" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMenuItemClick = (link: string) => {
    navigate(link);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`glass-nav hidden lg:block ${scrolled ? "scrolled" : ""}`}>
        <div className="container mx-auto h-16 flex items-center justify-between gap-4">
          {/* Logo — klik untuk refresh & kembali ke beranda */}
          <a
            href="/"
            aria-label="IPAN STORE — kembali ke beranda"
            className="flex items-center shrink-0 relative z-[4100]"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
          >
            <picture>
              <source srcSet={`${logoWebp293} 293w, ${logoWebp} 600w`} sizes="(max-width: 768px) 120px, 144px" type="image/webp" />
              <img
                src={logo}
                alt="Ipan Store"
                width={288}
                height={110}
                className="h-10 w-auto object-contain"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
          </a>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="whatsapp" size="sm" className="shrink-0">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap">
                Order via WhatsApp
              </a>
            </Button>

            {/* Staggered menu trigger — desktop */}
            <Suspense fallback={null}><StaggeredMenu
              position="right"
              className="sm-desktop"
              colors={['#1a1a1a', '#2d2d2d', '#404045']}
              items={links.map((l) => ({
                label: l.label,
                link: l.to,
                ariaLabel: `Go to ${l.label}`
              }))}
              socialItems={socialLinks}
              displaySocials={true}
              displayItemNumbering={true}
              logoUrl={logoWebp}
              menuButtonColor="#F4F4F5"
              openMenuButtonColor="#F4F4F5"
              accentColor="#94A3B8"
              changeMenuColorOnOpen={false}
              isFixed={true}
              closeOnClickAway={true}
              onItemClick={handleMenuItemClick}
            /></Suspense>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar with Staggered Menu */}
      <div className="lg:hidden">
        <Suspense fallback={null}><StaggeredMenu
          onLogoClick={() => { window.location.href = "/"; }}
          position="right"
          colors={['#1a1a1a', '#2d2d2d', '#404045']}
          items={links.map((l) => ({
            label: l.label,
            link: l.to,
            ariaLabel: `Go to ${l.label}`
          }))}
          socialItems={socialLinks}
          displaySocials={true}
          displayItemNumbering={true}
          logoUrl={logoWebp}
          menuButtonColor="#F4F4F5"
          openMenuButtonColor="#F4F4F5"
          accentColor="#94A3B8"
          changeMenuColorOnOpen={false}
          isFixed={true}
          closeOnClickAway={true}
          onItemClick={handleMenuItemClick}
        /></Suspense>
      </div>
    </>
  );
};

export default Navbar;
