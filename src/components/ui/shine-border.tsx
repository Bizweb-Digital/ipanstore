import * as React from "react";

import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#94A3B8",
  className,
  style,
  ...props
}: ShineBorderProps) {
  const gradient = `radial-gradient(transparent,transparent, ${
    Array.isArray(shineColor) ? shineColor.join(",") : shineColor
  },transparent,transparent)`;

  return (
    <div
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "var(--border-width)",
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 size-full overflow-hidden rounded-[inherit]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute -inset-full animate-shine will-change-transform"
        style={{ backgroundImage: gradient, backgroundSize: "100% 100%" }}
      />
    </div>
  );
}
