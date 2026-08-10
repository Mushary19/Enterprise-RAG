import { AlertCircle, RotateCcw } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "../ui/Button"
import { ChatMessagesSkeleton } from "./ChatMessagesSkeleton"
import { EmptyChatState } from "./EmptyChatState"
import { MessageList } from "./MessageList"
import type { ChatMessage } from "../../types"

interface ChatMessagesProps {
  messages: ChatMessage[] | undefined
  isLoading: boolean
  streamingMessageId: string | null
  onResend: (text: string) => void
  lastError: string | null
  onRetry: () => void
}

export function ChatMessages({
  messages,
  isLoading,
  streamingMessageId,
  onResend,
  lastError,
  onRetry,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    const isNearBottom = distanceFromBottom < 120

    if (isNearBottom) {
      endRef.current?.scrollIntoView({
        behavior: streamingMessageId ? "auto" : "smooth",
        block: "end",
      })
    }
  }, [messages, streamingMessageId])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <ChatMessagesSkeleton />
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return <EmptyChatState onSuggestionClick={onResend} />
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0"
    >
      <MessageList messages={messages} streamingMessageId={streamingMessageId} onResend={onResend} />

      {lastError && (
        <div className="max-w-[820px] mx-auto w-full px-4 md:px-6 pb-4">
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="flex-1 text-sm text-red-300">{lastError}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
