import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"
import { QUERY_KEYS } from "../lib/queryKeys"
import { loadChatMessageById, streamChatMessage } from "../services/api"
import { ChatMessage } from "../types"

export function useLoadMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(sessionId || ""),
    queryFn: () => loadChatMessageById(sessionId!),
    enabled: !!sessionId,
  })
}

export function useSendChatMessage(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  const [isSending, setIsSending] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  )
  const [lastError, setLastError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return
      setLastError(null)

      const messagesKey = QUERY_KEYS.messages(sessionId)
      const now = new Date().toISOString()
      const userMessageId = `pending-user-${crypto.randomUUID()}`
      const assistantMessageId = `pending-assistant-${crypto.randomUUID()}`

      const userMessage: ChatMessage = {
        id: userMessageId,
        session_id: sessionId,
        role: "user",
        content,
        created_at: now,
      }
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        session_id: sessionId,
        role: "assistant",
        content: "",
        created_at: now,
      }

      queryClient.setQueryData<ChatMessage[]>(messagesKey, (old = []) => [
        ...old,
        userMessage,
        assistantMessage,
      ])

      setIsSending(true)
      setStreamingMessageId(assistantMessageId)

      try {
        const result = await streamChatMessage(
          { session_id: sessionId, user_message: content, role: "user" },
          (token) => {
            queryClient.setQueryData<ChatMessage[]>(messagesKey, (old = []) =>
              old.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: message.content + token }
                  : message,
              ),
            )
          },
        )

        queryClient.setQueryData<ChatMessage[]>(messagesKey, (old = []) =>
          old.map((message) => {
            if (message.id === assistantMessageId) {
              return {
                ...message,
                id: result.messageId,
                created_at: result.createdAt,
              }
            }
            if (message.id === userMessageId) {
              return { ...message, id: result.userMessageId }
            }
            return message
          }),
        )

        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
      } catch (err) {
        queryClient.setQueryData<ChatMessage[]>(messagesKey, (old = []) =>
          old.filter(
            (message) =>
              message.id !== userMessageId && message.id !== assistantMessageId,
          ),
        )
        const message = err instanceof Error ? err.message : "Something went wrong"
        setLastError(message)
        toast.error(message)
      } finally {
        setIsSending(false)
        setStreamingMessageId(null)
      }
    },
    [sessionId, queryClient],
  )

  return { sendMessage, isSending, streamingMessageId, lastError }
}
