import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "framer-motion"
import { createContext, useContext, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/cn"
import { transitionBase } from "../../lib/motion"
import { IconButton } from "./IconButton"

const DialogOpenContext = createContext(false)

interface DialogProps extends DialogPrimitive.DialogProps {
  children: ReactNode
}

export function Dialog({ children, open, ...props }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} {...props}>
      <DialogOpenContext.Provider value={!!open}>{children}</DialogOpenContext.Provider>
    </DialogPrimitive.Root>
  )
}

export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

interface DialogContentProps {
  children: ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  const open = useContext(DialogOpenContext)

  return (
    <DialogPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transitionBase}
                className="fixed inset-0 z-50 bg-black/60"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 4 }}
                transition={transitionBase}
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40 focus:outline-none",
                  className,
                )}
              >
                {children}
                <DialogPrimitive.Close asChild>
                  <IconButton
                    label="Close"
                    size="sm"
                    className="absolute right-3 top-3"
                  >
                    <X className="w-4 h-4" />
                  </IconButton>
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-1 pr-6">{children}</div>
}

export function DialogTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold text-zinc-100", className)}
    >
      {children}
    </DialogPrimitive.Title>
  )
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <DialogPrimitive.Description className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
      {children}
    </DialogPrimitive.Description>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center justify-end gap-2">{children}</div>
}
