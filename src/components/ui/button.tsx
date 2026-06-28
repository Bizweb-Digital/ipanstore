import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-xl",
  {
    variants: {
      variant: {
        default: "bg-gaming-primary text-white hover:bg-gaming-primary/90 shadow-glow-sm hover:shadow-glow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-gaming-card hover:bg-gaming-card-hover hover:border-gaming-accent text-foreground hover:shadow-glow-cyan",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-white/5 hover:text-foreground",
        link: "text-gaming-accent underline-offset-4 hover:underline",
        whatsapp: "bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]",
        "gaming-outline": "border border-gaming-accent bg-transparent text-gaming-accent hover:bg-gaming-accent/10 shadow-glow-cyan",
        "gaming-glow": "bg-gaming-primary text-white shadow-glow-md hover:shadow-glow-lg hover:-translate-y-1 font-bold tracking-wide",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-14 md:h-16 px-8 md:px-10 text-base md:text-lg",
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
