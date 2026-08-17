import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const progressTimer = setTimeout(() => setProgress(100), 100);

    return () => clearTimeout(progressTimer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => setFadeOut(true), 120);
      const completeTimer = setTimeout(() => onComplete(), 200);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 bg-[#060A14] ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gaming-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-[min(420px,86vw)] text-center">
        <div className="mb-10 flex justify-center relative">
          <img src={logo} alt="Ipan Store" width={288} height={216} className="h-16 sm:h-20 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(148,163,184,0.35)]" />
        </div>

        <div className="gaming-card p-6 border-white/5">
          <div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-muted-foreground mb-4">
            <span className="cyber-glitch-text" data-text="INITIALIZING SYSTEM">INITIALIZING SYSTEM</span>
            <span className="text-gaming-accent font-bold">{Math.floor(progress)}%</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden bg-white/5 rounded-full mb-4 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-gaming-primary to-gaming-accent transition-all duration-100 rounded-full shadow-[0_0_10px_rgba(148,163,184,0.35)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-display uppercase tracking-wider text-muted-foreground/50">
            <div className={`flex flex-col items-center gap-1 transition-colors ${progress > 30 ? "text-gaming-accent" : ""}`}>
              <span>CPU TWEAK</span>
              <span className="text-xs">{progress > 30 ? "DONE" : "WAIT"}</span>
            </div>
            <div className={`flex flex-col items-center gap-1 transition-colors ${progress > 60 ? "text-gaming-accent" : ""}`}>
              <span>RAM BOOST</span>
              <span className="text-xs">{progress > 60 ? "DONE" : "WAIT"}</span>
            </div>
            <div className={`flex flex-col items-center gap-1 transition-colors ${progress > 90 ? "text-gaming-cyan drop-shadow-[0_0_5px_rgba(148,163,184,0.35)]" : ""}`}>
              <span>GPU TUNE</span>
              <span className="text-xs">{progress > 90 ? "READY" : "WAIT"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
