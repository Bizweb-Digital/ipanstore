import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { WA_LINK } from "./FloatingWhatsApp";
import logo from "@/assets/logo.png";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/testimoni", label: "Testimoni" },
  { to: "/contact", label: "Contact" },
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

  return (
    <>
      {/* Desktop Pill Navbar */}
      <nav className={`pill-nav hidden md:flex ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Ipan Store" className="h-[60px] w-auto object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </Link>

        <ul className="flex items-center gap-8">
          {links.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`nav-link-base relative text-sm font-medium transition-colors ${
                    isActive
                      ? "nav-link-active"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div>
          <Button asChild variant="hero" size="default">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Chat Admin
            </a>
          </Button>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <header
        className={`md:hidden fixed top-0 inset-x-0 z-[4000] transition-all ${
          scrolled
            ? "backdrop-blur-xl bg-background/70 border-b border-border/60"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Ipan Store" className="h-[52px] w-auto object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </Link>

          <button
            className="p-2 text-foreground"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border/60 backdrop-blur-xl bg-background/90">
            <ul className="container mx-auto px-4 py-4 space-y-3">
              {links.map((l) => {
                const isActive = location.pathname === l.to;
                return (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className={`block py-2 text-sm font-medium ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Button asChild variant="hero" className="w-full">
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                    Chat Admin
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
