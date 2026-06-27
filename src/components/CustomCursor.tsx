import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleLinkHoverEvents = () => {
      const links = document.querySelectorAll("a, button, input, textarea, select, [role='button']");
      links.forEach((link) => {
        link.addEventListener("mouseenter", () => setIsHovering(true));
        link.addEventListener("mouseleave", () => setIsHovering(false));
      });
    };

    window.addEventListener("mousemove", updateCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Initial attach
    handleLinkHoverEvents();

    // Re-attach on DOM mutations (e.g. routing)
    const observer = new MutationObserver(() => {
      handleLinkHoverEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      observer.disconnect();
    };
  }, []);

  if (typeof window === "undefined" || window.innerWidth < 768) return null; // Don't show on mobile

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-out ${
          isHovering ? "w-5 h-5 opacity-60" : ""
        } ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      />
      <div
        className={`fixed top-0 left-0 w-8 h-8 border-[1.5px] border-primary rounded-full pointer-events-none z-[99998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
          isHovering ? "w-12 h-12 opacity-20" : "opacity-30"
        } ${isVisible ? "" : "opacity-0"}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      />
    </>
  );
};

export default CustomCursor;
