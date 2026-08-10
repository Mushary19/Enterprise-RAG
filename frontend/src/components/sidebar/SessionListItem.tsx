import { MessageSquare, Pin, Trash2 } from "lucide-react"
import { memo, useCallback, useState } from "react"
import { cn } from "../../lib/cn"
import { IconButton } from "../ui/IconButton"
import type { ChatSession } from "../../types"

interface SessionListItemProps {
  session: ChatSession
  isActive: boolean
  isPinned: boolean
  onSelect: (id: string) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

function SessionListItemImpl({
  session,
  isActive,
  isPinned,
  onSelect,
  onTogglePin,
  onDelete,
}: SessionListItemProps) {
  const [confirming, setConfirming] = useState(false)

  const handleSelect = useCallback(() => onSelect(session.id), [onSelect, session.id])

  const handleTogglePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onTogglePin(session.id)
    },
    [onTogglePin, session.id],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (confirming) {
        onDelete(session.id)
      } else {
        setConfirming(true)
        setTimeout(() => setConfirming(false), 2500)
      }
    },
    [confirming, onDelete, session.id],
  )

  return (
    <div
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelect()
        }
      }}
      className={cn(
        "group w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        isActive
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
      )}
    >
      <MessageSquare
        className={cn(
          "w-4 h-4 mt-0.5 flex-shrink-0",
          isActive ? "text-blue-400" : "text-zinc-500",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5 truncate">
          {new Date(session.created_at).toLocaleDateString()}
        </p>
      </div>
      <div
        className={cn(
          "flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150",
          isActive || confirming ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <IconButton
          label={isPinned ? "Unpin conversation" : "Pin conversation"}
          size="sm"
          variant={isPinned ? "active" : "ghost"}
          onClick={handleTogglePin}
        >
          <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
        </IconButton>
        <IconButton
          label={confirming ? "Click again to confirm" : "Delete conversation"}
          size="sm"
          variant={confirming ? "danger" : "ghost"}
          onClick={handleDelete}
          className={confirming ? "text-red-400 bg-red-500/10" : undefined}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
  )
}

export const SessionListItem = memo(SessionListItemImpl)
