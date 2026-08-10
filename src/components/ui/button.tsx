import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-lg active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#111111] text-white hover:bg-[#333333] shadow-soft-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-white/16 bg-transparent text-[#F4F4F5] hover:bg-white/5 hover:border-white/24",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-zinc-300 hover:bg-white/5 hover:text-[#F4F4F5]",
        link: "text-zinc-50 underline-offset-4 hover:underline",
        whatsapp:
          "bg-[#25D366] text-white font-semibold hover:bg-[#20bd5a] shadow-soft-sm",
        "gaming-outline":
          "border border-white/16 bg-transparent text-[#F4F4F5] hover:bg-white/5 hover:border-white/24",
        "gaming-glow":
          "bg-[#111111] text-white font-semibold shadow-soft-sm hover:bg-[#333333]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        xl: "h-12 md:h-14 px-7 md:px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
