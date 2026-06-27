import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + (Math.random() * 8 + 2), 100);
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => setFadeOut(true), 400);
      const completeTimer = setTimeout(() => onComplete(), 1000);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0f1c] overflow-hidden transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative w-[min(420px,86vw)] text-center">
        <div className="mb-8 animate-pulse flex justify-center">
          <img src={logo} alt="Ipan Store" className="h-16 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
        </div>

        <div className="glass-panel border-glow rounded-md p-4 bg-background/50 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            <span>Booting kernel...</span>
            <span className="text-primary">{Math.floor(progress)}%</span>
          </div>
          
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 transition-all duration-100"
              style={{ width: `${progress}%`, boxShadow: "0 0 16px rgba(34,211,238,0.6)" }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 text-[9px] font-mono text-muted-foreground/70">
            <span className={progress > 30 ? "text-primary font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" : ""}>CPU {progress > 30 ? "✓" : "..."}</span>
            <span className={progress > 60 ? "text-primary font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" : ""}>RAM {progress > 60 ? "✓" : "..."}</span>
            <span className={progress > 90 ? "text-primary font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" : ""}>GPU {progress > 90 ? "✓" : "..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
