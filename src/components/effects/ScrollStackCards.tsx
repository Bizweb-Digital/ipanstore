import { Children, isValidElement, useLayoutEffect, useRef, useCallback, type ReactNode } from "react";

/**
 * ScrollStackCards — kartu MENUMPUK halus saat halaman di-scroll ke bawah,
 * persis efek preview reactbits ScrollStack, TANPA getaran/jitter di desktop
 * maupun mobile.
 *
 * Anti-jitter:
 * 1. Satu rAF loop + lerp → gerakan mulus (tidak menulis style langsung dari
 *    event scroll ganda Lenis & window yang sering bertabrakan).
 * 2. Nilai dibulatkan (0.1px / 0.001) agar tidak bergetar antar piksel.
 * 3. Loop idle saat elemen di luar viewport → hemat CPU/baterai.
 * 4. Hanya animasi `transform` (GPU), tanpa menyentuh layout.
 *
 * Struktur: anak-anak dirender sebagai SATU KOLOM (full width) yang saling
 * menumpuk ke bawah saat scroll, lalu "release" bersama di akhir.
 */
interface ScrollStackCardsProps {
  children: ReactNode;
  className?: string;
  /** Jarak vertikal antar kartu yang bertumpuk (px). */
  itemStackDistance?: number;
  /** Posisi titik tumpuk dari atas viewport ("0%"–"40%"). */
  stackPosition?: string;
  /** Seberapa jauh kartu mengecil saat berada di bawah tumpukan. */
  itemScale?: number;
  /** Skala dasar kartu teratas. */
  baseScale?: number;
  /** Margin bawah antar kartu sebelum menumpuk (px). */
  itemDistance?: number;
}

const ScrollStackCards = ({
  children,
  className = "",
  itemStackDistance = 24,
  stackPosition = "12%",
  itemScale = 0.03,
  baseScale = 0.92,
  itemDistance = 60,
}: ScrollStackCardsProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const visibleRef = useRef(true);
  const curYRef = useRef<number[]>([]);
  const curScaleRef = useRef<number[]>([]);
  const layoutTopsRef = useRef<number[]>([]);
  const endTopRef = useRef(0);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === "string" && value.includes("%")) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value as string);
  }, []);

  const getScrollTop = useCallback(() => {
    const lenis = (window as unknown as { __lenis?: { scroll: number } }).__lenis;
    return lenis ? lenis.scroll : window.scrollY;
  }, []);

  const computeTargets = useCallback(() => {
    const cards = cardsRef.current;
    if (!cards.length) return [] as { translateY: number; scale: number }[];

    const scrollTop = getScrollTop();
    const vh = window.innerHeight;
    const stackPosPx = parsePercentage(stackPosition, vh);

    const endTop = endTopRef.current;
    const pinEnd = endTop - vh / 2;

    return cards.map((card, i) => {
      if (!card) return { translateY: 0, scale: 1 };
      const cardTop = layoutTopsRef.current[i] ?? 0;
      const pinStart = cardTop - stackPosPx - itemStackDistance * i;
      const triggerEnd = cardTop - parsePercentage("8%", vh);

      // Progress scale (0 → 1) lalu di-smoothstep agar tidak "klik".
      let p = (scrollTop - pinStart) / (triggerEnd - pinStart);
      if (!isFinite(p)) p = 0;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      const eased = p * p * (3 - 2 * p);

      const targetScale = baseScale + i * itemScale;
      const scale = 1 - eased * (1 - targetScale);

      // Pin via translateY.
      let translateY = 0;
      if (scrollTop >= pinStart && scrollTop <= pinEnd) {
        translateY = scrollTop - cardTop + stackPosPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPosPx + itemStackDistance * i;
      }

      return {
        translateY: Math.round(translateY * 10) / 10,
        scale: Math.round(scale * 1000) / 1000,
      };
    });
  }, [getScrollTop, parsePercentage, stackPosition, itemStackDistance, itemScale, baseScale]);

  const apply = useCallback((targets: { translateY: number; scale: number }[]) => {
    const cards = cardsRef.current;
    // Di HP (touch) scroll native bergerak cepat → pakai lerp lebih halus
    // agar kartu mengikuti dengan buttery (tidak terlihat lompat/tidak smooth).
    const isTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.matchMedia?.("(pointer: coarse)").matches;
    const k = isTouch ? 0.32 : 0.22;

    let moving = false;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const t = targets[i];
      if (!card || !t) continue;

      const cy = curYRef.current[i] ?? t.translateY;
      const cs = curScaleRef.current[i] ?? t.scale;
      const ny = cy + (t.translateY - cy) * k;
      const ns = cs + (t.scale - cs) * k;
      curYRef.current[i] = ny;
      curScaleRef.current[i] = ns;
      moving ||= Math.abs(t.translateY - ny) > 0.1 || Math.abs(t.scale - ns) > 0.001;

      const transform = `translate3d(0, ${Math.round(ny * 10) / 10}px, 0) scale(${Math.round(ns * 1000) / 1000})`;
      if (card.style.transform !== transform) card.style.transform = transform;
    }
    return moving;
  }, []);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    if (apply(computeTargets())) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
      rafRef.current = null;
      cardsRef.current.forEach(card => {
        card.style.willChange = "auto";
      });
    }
  }, [computeTargets, apply]);

  const start = useCallback(() => {
    if (runningRef.current || !visibleRef.current) return;
    runningRef.current = true;
    cardsRef.current.forEach(card => {
      card.style.willChange = "transform";
    });
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cardsRef.current.forEach(card => {
      card.style.willChange = "auto";
    });
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const els = Array.from(scroller.querySelectorAll("[data-stack-card]")) as HTMLElement[];
    cardsRef.current = els;
    curYRef.current = els.map(() => 0);
    curScaleRef.current = els.map(() => 1);

    const getLayoutTop = (el: HTMLElement) => {
      let top = 0;
      let node: HTMLElement | null = el;
      while (node) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return top;
    };
    const measureLayout = () => {
      layoutTopsRef.current = els.map(getLayoutTop);
      const endElement = scroller.querySelector(".scroll-stack-cards-end") as HTMLElement | null;
      endTopRef.current = endElement ? getLayoutTop(endElement) : 0;
    };
    measureLayout();

    els.forEach((card, i) => {
      if (i < els.length - 1) card.style.marginBottom = `${itemDistance}px`;
      card.style.willChange = "auto";
      card.style.transformOrigin = "top center";
      card.style.backfaceVisibility = "hidden";
      card.style.transform = "translateZ(0)";
    });

    const onScroll = () => start();
    const onResize = () => {
      measureLayout();
      start();
    };
    const lenis = (window as unknown as { __lenis?: { on: (e: string, cb: () => void) => void; off?: (e: string, cb: () => void) => void } }).__lenis;
    if (lenis) lenis.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const resizeObserver = new ResizeObserver(() => {
      measureLayout();
      start();
    });
    resizeObserver.observe(scroller);
    els.forEach(el => resizeObserver.observe(el));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visibleRef.current = e.isIntersecting;
          if (e.isIntersecting) start();
          else stop();
        });
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(scroller);

    visibleRef.current = false;

    return () => {
      if (lenis?.off) lenis.off("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      io.disconnect();
      stop();
      cardsRef.current = [];
    };
  }, [itemDistance, start, stop]);

  return (
    <div ref={scrollerRef} className={`scroll-stack-cards relative w-full ${className}`.trim()}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <div key={(child as { key?: string | number }).key ?? i} data-stack-card className="w-full">
            {child}
          </div>
        ) : null
      )}
      <div className="scroll-stack-cards-end w-full h-px" />
    </div>
  );
};

export default ScrollStackCards;
