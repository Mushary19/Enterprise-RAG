import { Bot, User } from "lucide-react"
import { cn } from "../../lib/cn"

export function MessageAvatar({ role }: { role: "user" | "assistant" }) {
  const isUser = role === "user"
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
        isUser ? "bg-zinc-800 border border-zinc-700/50" : "bg-blue-500/10 border border-blue-500/20",
      )}
      aria-hidden="true"
    >
      {isUser ? (
        <User className="w-3.5 h-3.5 text-zinc-400" />
      ) : (
        <Bot className="w-3.5 h-3.5 text-blue-400" />
      )}
    </div>
  )
}
