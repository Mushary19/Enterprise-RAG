import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { AnimatePresence, motion } from "framer-motion"
import { useState, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { transitionFast } from "../../lib/motion"

export const TooltipProvider = TooltipPrimitive.Provider

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Content
              side={side}
              sideOffset={6}
              className="z-50"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: side === "top" ? 2 : -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={transitionFast}
                className={cn(
                  "rounded-lg bg-zinc-800 border border-zinc-700/50 px-2.5 py-1.5 text-xs text-zinc-200 shadow-lg shadow-black/20",
                )}
              >
                {content}
              </motion.div>
            </TooltipPrimitive.Content>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
