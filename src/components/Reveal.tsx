import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay animasi dalam ms (untuk stagger antar elemen). */
  delay?: number;
  /** Elemen yang dirender. Default `div`. */
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Reveal — wrapper scroll-reveal ringan berbasis IntersectionObserver.
 *
 * Memanfaatkan class `.scroll-reveal` / `.revealed` yang sudah ada di
 * index.css (fade + translateY halus). Hanya memakai IO (bukan GSAP)
 * sehingga hemat performa di mobile; animasi berjalan sekali saat elemen
 * masuk viewport dan tidak pernah menyembunyikan konten permanen.
 */
const Reveal = ({ children, className = "", delay = 0, as = "div" }: RevealProps) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`scroll-reveal ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
