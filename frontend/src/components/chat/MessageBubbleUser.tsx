import { Check, Copy, Pencil } from "lucide-react"
import { memo, useState } from "react"
import type { ChatMessage } from "../../types"
import { EditableUserMessage } from "./EditableUserMessage"
import { MessageActions } from "./MessageActions"
import { MessageAvatar } from "./MessageAvatar"

interface MessageBubbleUserProps {
  message: ChatMessage
  onEditSubmit: (text: string) => void
}

function MessageBubbleUserImpl({ message, onEditSubmit }: MessageBubbleUserProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isEditing) {
    return (
      <div className="flex gap-3 w-full justify-end">
        <div className="max-w-[70ch] w-full">
          <EditableUserMessage
            content={message.content}
            onCancel={() => setIsEditing(false)}
            onSubmit={(text) => {
              setIsEditing(false)
              onEditSubmit(text)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-3 w-full justify-end">
      <div className="flex flex-col items-end gap-1 max-w-[70ch]">
        <div className="rounded-2xl px-4 py-2.5 bg-zinc-800 text-zinc-100">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <MessageActions
          actions={[
            { icon: Pencil, label: "Edit prompt", onClick: () => setIsEditing(true) },
            { icon: copied ? Check : Copy, label: copied ? "Copied" : "Copy", onClick: handleCopy },
          ]}
        />
      </div>
      <MessageAvatar role="user" />
    </div>
  )
}

export const MessageBubbleUser = memo(MessageBubbleUserImpl)
