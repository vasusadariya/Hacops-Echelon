import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold uppercase tracking-wide",
    "border border-border",
    "transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "ring-offset-background",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** 🇮🇳 PRIMARY – Saffron (Main Actions) */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",

        /** ❌ FRAUD / REJECT */
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive",

        /** 🏛 OUTLINE – Govt secondary actions */
        outline:
          "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",

        /** ✅ SUCCESS / VERIFIED (Green) */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 active:bg-secondary/90",

        /** Minimal */
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",

        /** Link style */
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline border-none shadow-none",
      },

      size: {
        /** Default Govt Button */
        default: "h-9 px-5 rounded-md",

        /** Compact */
        sm: "h-8 px-4 rounded-md text-xs",

        /** Prominent CTA */
        lg: "h-11 px-8 rounded-md text-sm",

        /** Icon-only */
        icon: "h-9 w-9 rounded-md",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
