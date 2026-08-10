import { AnimatePresence, motion } from "framer-motion"
import { useCallback } from "react"
import { transitionBase } from "../../lib/motion"
import type { ChatMessage } from "../../types"
import { MessageBubbleAssistant } from "./MessageBubbleAssistant"
import { MessageBubbleUser } from "./MessageBubbleUser"

interface MessageListProps {
  messages: ChatMessage[]
  streamingMessageId: string | null
  onResend: (text: string) => void
}

export function MessageList({ messages, streamingMessageId, onResend }: MessageListProps) {
  const lastMessage = messages[messages.length - 1]
  const secondToLast = messages[messages.length - 2]

  const handleRegenerateLast = useCallback(() => {
    if (secondToLast?.role === "user") onResend(secondToLast.content)
  }, [secondToLast, onResend])

  return (
    <div className="max-w-[820px] mx-auto w-full px-4 md:px-6 py-6 space-y-6">
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={transitionBase}
          >
            {message.role === "user" ? (
              <MessageBubbleUser message={message} onEditSubmit={onResend} />
            ) : (
              <MessageBubbleAssistant
                message={message}
                isStreaming={message.id === streamingMessageId}
                isLast={message.id === lastMessage?.id}
                onRegenerate={handleRegenerateLast}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
