import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium border",
  {
    variants: {
      variant: {
        neutral: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        danger: "bg-red-500/10 text-red-400 border-red-500/20",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}
