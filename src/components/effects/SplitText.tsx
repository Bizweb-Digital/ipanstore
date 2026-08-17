import { useEffect, useRef, useState } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  /**
   * "words" (default) → pecah per KATA sehingga tidak ada huruf yang patah
   * ke baris baru (masalah "P C", "G amer"). "chars" hanya jika memang ingin
   * animasi per-huruf (tidak disarankan untuk heading panjang).
   */
  splitType?: "chars" | "words" | "lines";
  threshold?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
}

/**
 * SplitText — animasi teks saat elemen masuk viewport.
 * Animasi memakai CSS + IntersectionObserver agar tidak menyalakan ticker
 * GSAP global untuk animasi sekali jalan.
 *
 * Perbaikan penting:
 * - Default split per KATA, bukan per huruf → heading tidak pernah patah di
 *   tengah kata (huruf C/P/G tidak jatuh ke baris baru sendirian).
 * - Animasi sekali jalan & konten di-set terlihat permanen di akhir, jadi
 *   teks tidak akan hilang atau bergetar saat scroll.
 */
const SplitText = ({
  text,
  className = "",
  delay = 60,
  duration = 0.7,
  ease = "power3.out",
  splitType = "words",
  threshold = 0.15,
  tag = "h2",
  textAlign = "center",
}: SplitTextProps) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const Tag = (tag || "h2") as React.ElementType;
  const units = splitType === "chars" ? Array.from(text) : text.split(" ");

  return (
    <Tag
      ref={ref}
      className={`${className} split-text${visible ? " split-text-visible" : ""}`.trim()}
      style={{ textAlign, wordWrap: "break-word", overflowWrap: "break-word" }}
    >
      {units.map((unit, index) => (
        <span
          key={`${unit}-${index}`}
          className="split-text-unit"
          style={{ transitionDelay: `${index * delay}ms` }}
        >
          {unit}
        </span>
      )).reduce<React.ReactNode[]>((result, unit, index) => {
        result.push(unit);
        if (splitType !== "chars" && index < units.length - 1) result.push(" ");
        return result;
      }, [])}
    </Tag>
  );
};

export default SplitText;
