import React, {
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  background?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#E2E8F0",
      background = "#0a0a0a",
      borderRadius = "0.75rem",
      shimmerDuration = "2.75s",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--shimmer-color": shimmerColor,
            "--shimmer-bg": background,
            "--shimmer-radius": borderRadius,
            "--shimmer-duration": shimmerDuration,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-sm font-medium text-white [border-radius:var(--shimmer-radius)] [background:var(--shimmer-bg)] transition-transform duration-300 ease-out active:translate-y-px",
          className
        )}
        {...props}
      >
        <span
          className="pointer-events-none absolute inset-0 z-10 [border-radius:var(--shimmer-radius)]"
          aria-hidden="true"
        >
          <span
            className="absolute inset-y-0 w-1/3 animate-shimmer-sweep opacity-70"
            style={{
              background: `linear-gradient(90deg, transparent, ${shimmerColor}55, transparent)`,
            }}
          />
        </span>
        <span className="relative z-20 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
