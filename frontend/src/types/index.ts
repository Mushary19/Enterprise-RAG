export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface Document {
  id: string
  filename: string
  status: "processed" | "parsing" | "ocr_engaged"
  uploaded_at: string
  size: number
}

export interface SendMessagePayload {
  sessionId: string
  content: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterUserPayload {
  email: string
  password: string
}
