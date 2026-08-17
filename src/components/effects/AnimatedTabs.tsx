import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedTabsProps {
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedTabs — container tab (Optimize / Set PC / Anti Cheat / App SettinX)
 * yang masuk dari bawah dengan fade, lalu bergerak parallax halus mengikuti
 * scroll, TANPA kedipan/getaran.
 *
 * Satu elemen, satu tween: reveal dan parallax digabung dalam satu
 * timeline GSAP sehingga tidak ada dua tween yang saling menimpa transform
 * elemen yang sama (penyebab kedipan/jump).
 */
const AnimatedTabs = ({ children, className = "" }: AnimatedTabsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Timeline gabungan: reveal fade-in dari bawah, lalu parallax halus.
      // Satu tween menulis transform, tidak ada konflik antar-tween.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      tl.fromTo(
        el,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
      ).to(el, { y: -14, ease: "none" }, 0);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} style={{ willChange: "opacity, transform" }}>
      {children}
    </div>
  );
};

export default AnimatedTabs;
