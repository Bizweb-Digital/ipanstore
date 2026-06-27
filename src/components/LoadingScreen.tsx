import { useEffect, useState } from "react";

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
        // Accelerating progress
        const increment = prev < 60 ? 3 : prev < 85 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setFadeOut(true), 300);
      const completeTimer = setTimeout(() => onComplete(), 900);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-600 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[hsl(217_91%_60%)]/20 blur-[120px] animate-float delay-300" />

        {/* Scanline effect */}
        <div className="absolute inset-0 loading-scanline pointer-events-none" />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="loading-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative mb-10 z-10">
        <div className="loading-logo-glow">
          <span className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-primary flex items-center justify-center font-display text-4xl md:text-5xl font-black text-primary-foreground shadow-glow">
            I
          </span>
        </div>
        <div className="mt-4 text-center">
          <span className="font-display text-2xl md:text-3xl font-black tracking-wider">
            IPAN <span className="text-gradient">STORE</span>
          </span>
        </div>
      </div>

      {/* Glitch text */}
      <div className="relative z-10 mb-8">
        <span className="loading-glitch-text font-display text-sm md:text-base tracking-[0.4em] uppercase text-primary/80">
          INITIALIZING SYSTEM
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-64 md:w-80">
        <div className="h-1 rounded-full bg-border/40 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full rounded-full bg-gradient-neon transition-all duration-100 ease-out loading-progress-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">
            Loading Assets
          </span>
          <span className="font-display text-[10px] tracking-widest text-primary">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
