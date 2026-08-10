import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react"
import { IconButton } from "../ui/IconButton"
import { Tooltip } from "../ui/Tooltip"

interface SidebarHeaderProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

export function SidebarHeader({ collapsed, onToggleCollapse, onClose }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between h-9">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-zinc-100 truncate">AI Workspace</span>
        )}
      </div>

      {onClose && (
        <IconButton label="Close sidebar" size="sm" onClick={onClose} className="md:hidden">
          <X className="w-4 h-4" />
        </IconButton>
      )}

      {onToggleCollapse && (
        <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            size="sm"
            onClick={onToggleCollapse}
            className="hidden md:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}
