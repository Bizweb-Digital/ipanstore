import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingWhatsApp from "../FloatingWhatsApp";
import PageTransition from "../effects/PageTransition";
import SplashCursor from "../effects/SplashCursor";
import GlobalScannerBackground from "../effects/GlobalScannerBackground";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  if (typeof window === 'undefined') return null;

  // Detect mobile device untuk optimasi performa
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Satu instance Lenis global untuk seluruh aplikasi. Dibuat sekali dan
  // dipakai bersama oleh semua halaman — mencegah banyak rAF loop Lenis
  // yang bertumpuk (penyebab scroll bergetar/tersendat).
  useEffect(() => {
    const w = window as unknown as { __lenis?: Lenis; __lenisRaf?: number };
    if (w.__lenis) return; // sudah ada, jangan buat lagi

    // Deteksi perangkat sentuh — di HP kita pakai scroll native (paling
    // mulus & natural), BUKAN Lenis smooth-touch yang membuat scroll terasa
    // kebut dan gerakannya tidak smooth/jitter.
    const isTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.matchMedia?.("(pointer: coarse)").matches;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Native wheel scroll avoids a second JavaScript scroll pipeline on
      // desktop. Lenis still tracks scroll state for stack effects.
      smoothWheel: false,
      wheelMultiplier: 1,
      // Mobile: biarkan browser handle touch scroll (native) → natural,
      // tidak terlalu cepat, dan halus. Lenis hanya membaca posisi scroll.
      touchMultiplier: 1,
      syncTouch: false,
      syncTouchLerp: 0.075,
      infinite: false
    });

    w.__lenis = lenis;

    let pageVisible = !document.hidden;
    const raf = (time: number) => {
      if (!pageVisible) {
        w.__lenisRaf = undefined;
        return;
      }
      lenis.raf(time);
      if (lenis.isSmooth) {
        w.__lenisRaf = requestAnimationFrame(raf);
      } else {
        w.__lenisRaf = undefined;
      }
    };
    const wake = () => {
      if (pageVisible && !w.__lenisRaf) w.__lenisRaf = requestAnimationFrame(raf);
    };
    const stopWhenHidden = () => {
      pageVisible = !document.hidden;
      if (!pageVisible && w.__lenisRaf) {
        cancelAnimationFrame(w.__lenisRaf);
        w.__lenisRaf = undefined;
      } else if (pageVisible && lenis.isSmooth) {
        wake();
      }
    };
    const offVirtualScroll = lenis.on("virtual-scroll", wake);
    const offScroll = lenis.on("scroll", wake);
    document.addEventListener("visibilitychange", stopWhenHidden);

    return () => {
      if (w.__lenisRaf) cancelAnimationFrame(w.__lenisRaf);
      offVirtualScroll();
      offScroll();
      document.removeEventListener("visibilitychange", stopWhenHidden);
      lenis.destroy();
      w.__lenis = undefined;
      w.__lenisRaf = undefined;
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#1a1a1a] text-[#F4F4F5] font-sans antialiased overflow-x-hidden">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#111111] text-white px-4 py-2 rounded-lg border border-white/16 z-[10000]"
      >
        Skip to content
      </a>
      <SplashCursor
        COLOR="#94A3B8"
        RAINBOW_MODE={false}
        SIM_RESOLUTION={isMobile ? 96 : 128}
        DYE_RESOLUTION={isMobile ? 768 : 1440}
        PRESSURE_ITERATIONS={isMobile ? 6 : 12}
        SHADING={true}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        CURL={3}
      />
      {/* Latar animasi Scanner global — fixed, hadir di semua page dan tetap
          terlihat saat user scroll ke bagian manapun. z-0 agar konten yang
          memakai relative/z-10 tampil di atasnya. */}
      <GlobalScannerBackground />
      <Navbar />
      <div id="main-content">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Layout;
