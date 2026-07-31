import { MessageSquareDashed, SearchX } from "lucide-react"

export function EmptySidebarState({ isSearching }: { isSearching: boolean }) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <SearchX className="w-6 h-6 text-zinc-600 mb-2.5" />
        <p className="text-sm text-zinc-400">No matches</p>
        <p className="text-xs text-zinc-600 mt-1">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <MessageSquareDashed className="w-6 h-6 text-zinc-600 mb-2.5" />
      <p className="text-sm text-zinc-400">No conversations yet</p>
      <p className="text-xs text-zinc-600 mt-1">Start a new chat to begin</p>
    </div>
  )
}
