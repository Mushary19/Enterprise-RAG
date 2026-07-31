import { Search } from "lucide-react"
import { Input } from "../ui/Input"

interface KnowledgeSearchProps {
  value: string
  onChange: (value: string) => void
}

export function KnowledgeSearch({ value, onChange }: KnowledgeSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      <Input
        type="text"
        placeholder="Search documents..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        aria-label="Search documents"
      />
    </div>
  )
}
