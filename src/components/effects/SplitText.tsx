import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

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
 * SplitText — animasi teks saat elemen masuk viewport (reactbits).
 * Versi ini memakai gsap + ScrollTrigger + SplitText yang sudah ada di
 * package gsap (tanpa dependensi tambahan @gsap/react).
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

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    let split: GSAPSplitText | null = null;
    let st: ScrollTrigger | null = null;

    try {
      split = new GSAPSplitText(el, {
        type: splitType,
        charsClass: "split-char",
        wordsClass: "split-word",
        linesClass: "split-line",
        reduceWhiteSpace: false,
      });

      const targets: Element[] =
        splitType.includes("words") && split.words.length
          ? split.words
          : splitType.includes("chars") && split.chars?.length
            ? split.chars
            : split.lines?.length
              ? split.lines
              : split.words || split.chars || [];

      // Pastikan teks terlihat (tidak pernah menghilang permanen).
      gsap.set(targets, { opacity: 1, y: 0 });

      st = ScrollTrigger.create({
        trigger: el,
        start: `top ${(1 - threshold) * 100}%`,
        once: true,
        onEnter: () => {
          gsap.fromTo(
            targets,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration,
              ease,
              stagger: delay / 1000,
              force3D: true,
              overwrite: true,
            }
          );
        },
      });
    } catch (_err) {
      if (el) el.style.opacity = "1";
    }

    return () => {
      st?.kill();
      try {
        split?.revert();
      } catch (_err) {
        /* noop */
      }
    };
  }, [text, delay, duration, ease, splitType, threshold]);

  const Tag = (tag || "h2") as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ textAlign, wordWrap: "break-word", overflowWrap: "break-word" }}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
