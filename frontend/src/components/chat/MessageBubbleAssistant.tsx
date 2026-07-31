import { Check, Copy, RotateCcw } from "lucide-react"
import { memo, useState } from "react"
import { useThrottledValue } from "../../hooks/useThrottledValue"
import type { ChatMessage } from "../../types"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { MessageActions } from "./MessageActions"
import { MessageAvatar } from "./MessageAvatar"
import { StreamingCursor } from "./StreamingCursor"

interface MessageBubbleAssistantProps {
  message: ChatMessage
  isStreaming: boolean
  isLast: boolean
  onRegenerate?: () => void
}

function MessageBubbleAssistantImpl({
  message,
  isStreaming,
  isLast,
  onRegenerate,
}: MessageBubbleAssistantProps) {
  const [copied, setCopied] = useState(false)
  const throttledContent = useThrottledValue(message.content, 50, isStreaming)
  const isThinking = isStreaming && !message.content

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group flex gap-3 w-full">
      <MessageAvatar role="assistant" />
      <div className="flex-1 min-w-0 max-w-[70ch]">
        <div className="rounded-2xl px-5 py-4 bg-zinc-900 border border-zinc-800">
          {isThinking ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
              </span>
              <span className="text-sm">Thinking…</span>
            </div>
          ) : (
            <>
              <MarkdownRenderer content={throttledContent} />
              {isStreaming && <StreamingCursor />}
            </>
          )}
        </div>
        {!isThinking && !isStreaming && (
          <MessageActions
            className="mt-1"
            actions={[
              {
                icon: copied ? Check : Copy,
                label: copied ? "Copied" : "Copy message",
                onClick: handleCopy,
              },
              ...(isLast && onRegenerate
                ? [
                    {
                      icon: RotateCcw,
                      label: "Regenerate (sends a new message)",
                      onClick: onRegenerate,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>
    </div>
  )
}

export const MessageBubbleAssistant = memo(MessageBubbleAssistantImpl)
