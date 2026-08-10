import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { AnimatePresence, motion } from "framer-motion"
import { createContext, useContext, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { transitionFast } from "../../lib/motion"

const DropdownOpenContext = createContext(false)

interface DropdownMenuProps extends DropdownMenuPrimitive.DropdownMenuProps {
  children: ReactNode
}

export function DropdownMenu({ children, open, ...props }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root open={open} {...props}>
      <DropdownOpenContext.Provider value={!!open}>
        {children}
      </DropdownOpenContext.Provider>
    </DropdownMenuPrimitive.Root>
  )
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

interface DropdownMenuContentProps {
  children: ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

export function DropdownMenuContent({
  children,
  align = "end",
  className,
}: DropdownMenuContentProps) {
  const open = useContext(DropdownOpenContext)

  return (
    <DropdownMenuPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Content asChild align={align} sideOffset={6} forceMount>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={transitionFast}
              className={cn(
                "z-50 min-w-[180px] rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/40 focus:outline-none",
                className,
              )}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Portal>
  )
}

interface DropdownMenuItemProps extends DropdownMenuPrimitive.DropdownMenuItemProps {
  danger?: boolean
}

export function DropdownMenuItem({ className, danger, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-100 cursor-pointer",
        danger
          ? "text-red-400 focus:bg-red-500/10 data-[highlighted]:bg-red-500/10"
          : "text-zinc-300 focus:bg-zinc-800 data-[highlighted]:bg-zinc-800",
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-zinc-800" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </DropdownMenuPrimitive.Label>
  )
}
