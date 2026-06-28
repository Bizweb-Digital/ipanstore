import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { WA_LINK } from "./FloatingWhatsApp";
import logo from "@/assets/logo.png";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/paket", label: "Paket" },
  { to: "/testimoni", label: "Testimoni" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontak", label: "Kontak" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Navbar - Glass */}
      <nav className={`glass-nav hidden lg:block ${scrolled ? "scrolled" : ""}`}>
        <div className="container mx-auto h-[76px] flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Ipan Store"
              className="h-[52px] w-auto object-contain transition-transform hover:scale-105"
            />
          </Link>

          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`nav-link ${isActive(l.to) ? "active" : ""}`}
                >
                  {l.label}
                  {isActive(l.to) && (
                    <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gaming-accent shadow-glow-cyan rounded-full" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <Button asChild variant="gaming-glow" size="sm" className="rounded-xl">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Order via WhatsApp
            </a>
          </Button>
        </div>
      </nav>

      {/* Mobile Navbar - Glass */}
      <header
        className={`lg:hidden fixed top-0 inset-x-0 z-[4000] transition-all backdrop-blur-md ${
          scrolled || open
            ? "bg-[#060A14]/90 border-b border-white/5 shadow-lg"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Ipan Store"
              className="h-[44px] w-auto object-contain"
            />
          </Link>

          <button
            className="p-2 text-foreground rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="bg-[#060A14] border-b border-white/10 shadow-2xl overflow-hidden animate-accordion-down">
            <ul className="container mx-auto px-4 py-4 space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`block py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
                      isActive(l.to)
                        ? "text-gaming-accent bg-gaming-accent/10 border border-gaming-accent/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="pt-4 pb-2">
                <Button asChild variant="gaming-glow" className="w-full">
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                    Order via WhatsApp
                  </a>
                </Button>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
