import { FolderOpen, SearchX } from "lucide-react"

export function EmptyKnowledgeState({ isSearching }: { isSearching: boolean }) {
  if (isSearching) {
    return (
      <div className="text-center py-10 px-4">
        <SearchX className="w-6 h-6 text-zinc-600 mx-auto mb-2.5" />
        <p className="text-sm text-zinc-400">No matching documents</p>
      </div>
    )
  }

  return (
    <div className="text-center py-10 px-4">
      <FolderOpen className="w-6 h-6 text-zinc-600 mx-auto mb-2.5" />
      <p className="text-sm text-zinc-400">No documents yet</p>
      <p className="text-xs text-zinc-600 mt-1">Upload a PDF to build your knowledge base</p>
    </div>
  )
}
