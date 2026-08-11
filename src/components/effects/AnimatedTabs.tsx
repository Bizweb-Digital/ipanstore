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
 * yang ikut BERGERAK saat halaman di-scroll: masuk dari bawah dengan fade +
 * parallax halus, tanpa getaran. Memakai gsap ScrollTrigger `scrub` yang
 * smooth dan hanya menganimasikan transform + opacity (GPU).
 */
const AnimatedTabs = ({ children, className = "" }: AnimatedTabsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Masuk dari bawah saat pertama kali terlihat.
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        }
      );

      // Parallax sangat halus mengikuti scroll (tidak bergetar).
      gsap.to(el, {
        y: -14,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
};

export default AnimatedTabs;
