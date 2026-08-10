import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingWhatsApp from "./FloatingWhatsApp";
import PageTransition from "./PageTransition";
import SplashCursor from "./SplashCursor";
import GlobalScannerBackground from "./GlobalScannerBackground";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  if (typeof window === 'undefined') return null;

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
      // Desktop: smooth wheel aktif.
      smoothWheel: !isTouch,
      wheelMultiplier: 1,
      // Mobile: biarkan browser handle touch scroll (native) → natural,
      // tidak terlalu cepat, dan halus. Lenis hanya membaca posisi scroll.
      touchMultiplier: 1,
      syncTouch: !isTouch ? true : false,
      syncTouchLerp: 0.075,
      infinite: false
    });

    w.__lenis = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      w.__lenisRaf = requestAnimationFrame(raf);
    };
    w.__lenisRaf = requestAnimationFrame(raf);

    return () => {
      if (w.__lenisRaf) cancelAnimationFrame(w.__lenisRaf);
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
        SPLAT_RADIUS={0.15}
        SPLAT_FORCE={4000}
        DENSITY_DISSIPATION={4}
        VELOCITY_DISSIPATION={2.5}
        CURL={2}
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
