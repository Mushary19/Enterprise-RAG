import { Plus } from "lucide-react"
import { Button } from "../ui/Button"
import { IconButton } from "../ui/IconButton"
import { Tooltip } from "../ui/Tooltip"

interface NewChatButtonProps {
  collapsed: boolean
  onClick: () => void
}

export function NewChatButton({ collapsed, onClick }: NewChatButtonProps) {
  if (collapsed) {
    return (
      <Tooltip content="New chat" side="right">
        <IconButton label="New chat" variant="subtle" size="lg" onClick={onClick}>
          <Plus className="w-5 h-5" />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button variant="primary" size="md" onClick={onClick} className="w-full">
      <Plus className="w-4 h-4" />
      New Chat
    </Button>
  )
}
