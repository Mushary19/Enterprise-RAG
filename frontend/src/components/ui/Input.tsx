import { forwardRef } from "react"
import { cn } from "../../lib/cn"

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-100 placeholder-zinc-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40",
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"
