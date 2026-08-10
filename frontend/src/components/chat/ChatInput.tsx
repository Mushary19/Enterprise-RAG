import { useEffect, useRef, useState } from "react"
import { useUploadDocument } from "../../hooks/useUploadDocument"
import { Textarea } from "../ui/Textarea"
import { ChatInputToolbar } from "./ChatInputToolbar"

interface ChatInputProps {
  onSend: (content: string) => void
  isPending: boolean
  disabled: boolean
  onAttachSuccess?: () => void
}

export function ChatInput({ onSend, isPending, disabled, onAttachSuccess }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadMutation = useUploadDocument()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleAttach = (file: File) => {
    uploadMutation.mutate(file, { onSuccess: () => onAttachSuccess?.() })
  }

  return (
    <div className="flex-shrink-0 px-3 pb-3 pt-1 md:px-6 md:pb-5 md:pt-2">
      <div className="max-w-[820px] mx-auto w-full">
        <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-[1.75rem] px-3 py-2 md:px-4 md:py-2.5 shadow-lg shadow-black/20 focus-within:border-zinc-700 transition-colors duration-150">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the assistant..."
            rows={1}
            disabled={disabled}
            className="py-2"
          />
          <ChatInputToolbar
            canSend={!disabled && message.trim().length > 0}
            isSending={isPending}
            onSubmit={handleSubmit}
            onAttach={handleAttach}
            isUploading={uploadMutation.isPending}
          />
        </div>
        <p className="text-[11px] text-zinc-600 text-center mt-2">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  )
}
