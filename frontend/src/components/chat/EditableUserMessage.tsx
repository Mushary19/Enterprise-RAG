import { useRef, useState } from "react"
import { Button } from "../ui/Button"
import { Textarea } from "../ui/Textarea"

interface EditableUserMessageProps {
  content: string
  onCancel: () => void
  onSubmit: (text: string) => void
}

export function EditableUserMessage({ content, onCancel, onSubmit }: EditableUserMessageProps) {
  const [value, setValue] = useState(content)
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <div className="w-full">
      <Textarea
        ref={ref}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
          if (e.key === "Escape") onCancel()
        }}
        rows={3}
        className="rounded-xl bg-zinc-950/60 border border-zinc-700 px-3 py-2"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>
          Send edited message
        </Button>
      </div>
    </div>
  )
}
