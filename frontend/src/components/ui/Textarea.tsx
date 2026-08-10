import { forwardRef } from "react"
import { cn } from "../../lib/cn"

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"
