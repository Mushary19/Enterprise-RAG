import { Menu, MessageSquare, PanelRightClose, PanelRightOpen } from "lucide-react"
import { IconButton } from "../ui/IconButton"
import { Tooltip } from "../ui/Tooltip"
import { ModelSelector } from "./ModelSelector"

interface ChatHeaderProps {
  title: string
  subtitle: string
  onOpenSidebar?: () => void
  knowledgeOpen?: boolean
  onToggleKnowledge?: () => void
}

export function ChatHeader({
  title,
  subtitle,
  onOpenSidebar,
  knowledgeOpen,
  onToggleKnowledge,
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 md:px-5 md:py-4 border-b border-zinc-800 flex-shrink-0 flex items-center gap-3">
      {onOpenSidebar && (
        <IconButton
          label="Open conversation history"
          onClick={onOpenSidebar}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </IconButton>
      )}

      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-zinc-400" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-zinc-100 truncate text-sm">{title}</h2>
        <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
      </div>

      <ModelSelector />

      {onToggleKnowledge && (
        <Tooltip content={knowledgeOpen ? "Hide knowledge panel" : "Show knowledge panel"}>
          <IconButton
            label={knowledgeOpen ? "Hide knowledge panel" : "Show knowledge panel"}
            onClick={onToggleKnowledge}
            variant={knowledgeOpen ? "active" : "ghost"}
          >
            {knowledgeOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}
