import { ArrowUp, Loader2, Paperclip } from "lucide-react"
import { useRef } from "react"
import toast from "react-hot-toast"
import { IconButton } from "../ui/IconButton"
import { Tooltip } from "../ui/Tooltip"

interface ChatInputToolbarProps {
  canSend: boolean
  isSending: boolean
  onSubmit: () => void
  onAttach: (file: File) => void
  isUploading: boolean
}

export function ChatInputToolbar({
  canSend,
  isSending,
  onSubmit,
  onAttach,
  isUploading,
}: ChatInputToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      toast.error("Only PDF files are supported.")
      return
    }
    onAttach(file)
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Tooltip content="Attach a PDF to the knowledge base">
        <IconButton
          label="Attach a PDF to the knowledge base"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </IconButton>
      </Tooltip>

      <IconButton
        label="Send message"
        variant="active"
        size="lg"
        onClick={onSubmit}
        disabled={!canSend}
        className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500"
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
      </IconButton>
    </div>
  )
}
