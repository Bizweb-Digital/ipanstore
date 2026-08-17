import { useEffect, useRef, type ReactNode } from "react";

interface AnimatedTabsProps {
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedTabs — container tab (Optimize / Set PC / Anti Cheat / App SettinX)
 * yang masuk dari bawah dengan fade, lalu bergerak parallax halus mengikuti
 * scroll, TANPA ticker ScrollTrigger global yang tetap hidup saat idle.
 */
const AnimatedTabs = ({ children, className = "" }: AnimatedTabsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let visible = false;
    let raf: number | null = null;

    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const update = () => {
      raf = null;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
      const y = 28 - progress * 42;
      el.style.opacity = String(clamp(progress * 2.5));
      el.style.transform = `translate3d(0, ${Math.round(y * 10) / 10}px, 0)`;
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }, { rootMargin: "120px 0px" });

    observer.observe(el);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
      <div ref={ref} className={className} style={{ willChange: "auto" }}>
      {children}
    </div>
  );
};

export default AnimatedTabs;
