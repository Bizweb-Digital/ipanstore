import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on desktop
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const attachHoverEvents = () => {
      const links = document.querySelectorAll("a, button, input, textarea, select, [role='button']");
      links.forEach((link) => {
        // Prevent duplicate listeners by checking dataset
        if (!(link as HTMLElement).dataset.cursorAttached) {
          link.addEventListener("mouseenter", () => setIsHovering(true));
          link.addEventListener("mouseleave", () => setIsHovering(false));
          (link as HTMLElement).dataset.cursorAttached = "true";
        }
      });
    };

    window.addEventListener("mousemove", updateCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    attachHoverEvents();

    const observer = new MutationObserver(() => {
      attachHoverEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      observer.disconnect();
    };
  }, []);

  if (typeof window === "undefined" || window.innerWidth < 768) return null;

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-2 h-2 bg-[#94A3B8] rounded-full pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out ${
          isHovering ? "scale-150 opacity-70" : ""
        } ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      />
      <div
        className={`fixed top-0 left-0 w-8 h-8 border border-[#94A3B8]/30 rounded-full pointer-events-none z-[99998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
          isHovering ? "w-12 h-12 opacity-30 bg-[#94A3B8]/5 border-[#94A3B8]/50" : "opacity-25"
        } ${isVisible ? "" : "opacity-0"}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      />
    </>
  );
};

export default CustomCursor;
