import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"
import { cn } from "../../lib/cn"

export const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        ghost: "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60",
        subtle: "text-zinc-400 hover:text-zinc-100 bg-zinc-800/40 hover:bg-zinc-800",
        danger: "text-zinc-500 hover:text-red-400 hover:bg-red-500/10",
        active: "text-blue-400 bg-blue-500/10",
      },
      size: {
        sm: "w-7 h-7",
        md: "w-9 h-9",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = "IconButton"
