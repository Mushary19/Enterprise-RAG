import { Check, ChevronDown, Cpu } from "lucide-react"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover"

// Cosmetic only — the backend hardcodes a single Groq model with no
// model-switching endpoint. See docs/known-limitations.md.
const MODEL = { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" }

export function ModelSelector() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors duration-150">
          <Cpu className="w-3.5 h-3.5" />
          {MODEL.label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="min-w-[200px]">
        <div className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Model
        </div>
        <div className="flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 bg-zinc-800/60">
          {MODEL.label}
          <Check className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </PopoverContent>
    </Popover>
  )
}
