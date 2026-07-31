import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/cn"
import { IconButton } from "../ui/IconButton"
import { Tooltip } from "../ui/Tooltip"

export interface MessageAction {
  icon: LucideIcon
  label: string
  onClick: () => void
}

interface MessageActionsProps {
  actions: MessageAction[]
  className?: string
}

export function MessageActions({ actions, className }: MessageActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150",
        className,
      )}
    >
      {actions.map((action) => (
        <Tooltip key={action.label} content={action.label}>
          <IconButton label={action.label} size="sm" onClick={action.onClick}>
            <action.icon className="w-3.5 h-3.5" />
          </IconButton>
        </Tooltip>
      ))}
    </div>
  )
}
