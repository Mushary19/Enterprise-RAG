import {
  ChatMessage,
  ChatMessagePayload,
  ChatSession,
  KnowledgeUploadResponse,
  LoginRequest,
  RegisterUserPayload,
} from "../types"
import { apiClient } from "./apiClient"
import { STORAGE_KEY } from "../context/AuthContext"

export const loginUser = async (data: LoginRequest) => {
  const response = await apiClient.post("/auth/login", data)
  return response.data
}

export const registerUser = async (data: RegisterUserPayload) => {
  const response = await apiClient.post("/auth/register", data)
  return response.data
}

export const loadChatSessions = async (): Promise<ChatSession[]> => {
  const response = await apiClient.get("/chat/sessions")
  return response.data
}

export const loadChatMessageById = async (
  sessionId?: string,
): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`/chat/${sessionId}/messages`)
  return response.data
}

export async function uploadKnowledgeDocument(
  file: File,
): Promise<KnowledgeUploadResponse> {
  const token = localStorage.getItem(STORAGE_KEY)
  const formData = new FormData()
  formData.append("file", file)

  // Deliberately bypasses apiClient: axios's default JSON Content-Type on that
  // instance would stop the browser from generating the multipart boundary.
  // Using fetch here lets it set the correct multipart/form-data header itself.
  const response = await fetch(`${apiClient.defaults.baseURL}/knowledge/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? `Upload failed with status ${response.status}`)
  }

  return data as KnowledgeUploadResponse
}

export interface StreamChatMessageResult {
  messageId: string
  userMessageId: string
  createdAt: string
}

export async function streamChatMessage(
  data: ChatMessagePayload,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<StreamChatMessageResult> {
  const token = localStorage.getItem(STORAGE_KEY)

  const response = await fetch(`${apiClient.defaults.baseURL}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let result: StreamChatMessageResult | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""

    for (const rawEvent of events) {
      const line = rawEvent.trim()
      if (!line.startsWith("data:")) continue

      const event = JSON.parse(line.slice(5).trim())

      if (event.type === "token") {
        onToken(event.content as string)
      } else if (event.type === "done") {
        result = {
          messageId: event.message_id,
          userMessageId: event.user_message_id,
          createdAt: event.created_at,
        }
      } else if (event.type === "error") {
        throw new Error(event.message ?? "Streaming failed")
      }
    }
  }

  if (!result) {
    throw new Error("Stream ended without a completion event")
  }

  return result
}
