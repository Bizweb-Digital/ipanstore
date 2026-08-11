import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

const AnimatedCounter = ({ end, duration = 1500, suffix = "" }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo for a fast start and slow finish, looks very dynamic
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(easeOutExpo * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <>{count}{suffix}</>;
};

export default AnimatedCounter;
