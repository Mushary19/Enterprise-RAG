import { Loader2 } from "lucide-react"
import { cn } from "../../lib/cn"

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("w-4 h-4 animate-spin text-zinc-500", className)}
      aria-hidden="true"
    />
  )
}
