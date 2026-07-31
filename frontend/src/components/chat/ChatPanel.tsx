import { useLoadMessages, useSendChatMessage } from "../../hooks/useMessages"
import type { ChatSession } from "../../types"
import { ChatHeader } from "./ChatHeader"
import { ChatInput } from "./ChatInput"
import { ChatMessages } from "./ChatMessages"

interface ChatPanelProps {
  activeSession: ChatSession | undefined
  onOpenSidebar?: () => void
  knowledgeOpen?: boolean
  onToggleKnowledge?: () => void
}

export function ChatPanel({
  activeSession,
  onOpenSidebar,
  knowledgeOpen,
  onToggleKnowledge,
}: ChatPanelProps) {
  const { data: messages, isLoading } = useLoadMessages(activeSession?.id)
  const { sendMessage, isSending, streamingMessageId, lastError } = useSendChatMessage(
    activeSession?.id,
  )

  const handleResend = (content: string) => {
    if (activeSession) sendMessage(content)
  }

  const handleRetry = () => {
    const lastUserMessage = [...(messages ?? [])].reverse().find((m) => m.role === "user")
    if (lastUserMessage) handleResend(lastUserMessage.content)
  }

  return (
    <div className="bg-zinc-950 md:border md:border-zinc-800 md:rounded-2xl md:shadow-xl h-full flex flex-col overflow-hidden">
      <ChatHeader
        title={activeSession?.title || "Chat"}
        subtitle={activeSession ? "Active conversation" : "Select or start a new chat"}
        onOpenSidebar={onOpenSidebar}
        knowledgeOpen={knowledgeOpen}
        onToggleKnowledge={onToggleKnowledge}
      />

      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        streamingMessageId={streamingMessageId}
        onResend={handleResend}
        lastError={lastError}
        onRetry={handleRetry}
      />

      <ChatInput
        onSend={handleResend}
        isPending={isSending}
        disabled={isSending || !activeSession}
        onAttachSuccess={() => {
          if (knowledgeOpen === false) onToggleKnowledge?.()
        }}
      />
    </div>
  )
}
