import * as PopoverPrimitive from "@radix-ui/react-popover"
import { AnimatePresence, motion } from "framer-motion"
import { createContext, useContext, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { transitionFast } from "../../lib/motion"

const PopoverOpenContext = createContext(false)

interface PopoverProps extends PopoverPrimitive.PopoverProps {
  children: ReactNode
}

export function Popover({ children, open, ...props }: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} {...props}>
      <PopoverOpenContext.Provider value={!!open}>{children}</PopoverOpenContext.Provider>
    </PopoverPrimitive.Root>
  )
}

export const PopoverTrigger = PopoverPrimitive.Trigger

interface PopoverContentProps {
  children: ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

export function PopoverContent({ children, align = "start", className }: PopoverContentProps) {
  const open = useContext(PopoverOpenContext)

  return (
    <PopoverPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Content asChild align={align} sideOffset={8} forceMount>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={transitionFast}
              className={cn(
                "z-50 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/40 focus:outline-none",
                className,
              )}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  )
}
