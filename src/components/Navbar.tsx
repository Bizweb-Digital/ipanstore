import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { WA_LINK } from "./FloatingWhatsApp";

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
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all ${
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center font-display font-black text-primary-foreground shadow-glow">
            I
          </span>
          <span className="font-display text-lg font-black tracking-wide">
            IPAN <span className="text-gradient">STORE</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`relative text-sm font-medium transition-colors ${
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

        <div className="hidden md:block">
          <Button asChild variant="hero" size="default">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Chat Admin
            </a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border/60 backdrop-blur-xl bg-background/90">
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
  );
};

export default Navbar;
