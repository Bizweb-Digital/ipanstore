import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: "instant" });

    // Reset animation
    setShow(false);
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShow(true);
      });
    });

    prevPath.current = location.pathname;
    return () => cancelAnimationFrame(timer);
  }, [location.pathname]);

  return (
    <div
      className={`transition-all duration-500 ease-&lsqb;cubic-bezier(0.16,1,0.3,1)&rsqb; ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
