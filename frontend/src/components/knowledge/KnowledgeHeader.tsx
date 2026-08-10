import { Database } from "lucide-react"
import type { Document } from "../../types"
import { KnowledgeStats } from "./KnowledgeStats"

export function KnowledgeHeader({ documents }: { documents: Document[] | undefined }) {
  return (
    <div className="px-4 py-3 md:px-5 md:py-4 border-b border-zinc-800 flex-shrink-0 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
          <Database className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-100 text-sm">Knowledge Base</h2>
          <p className="text-xs text-zinc-500">Your uploaded documents</p>
        </div>
      </div>
      <KnowledgeStats documents={documents} />
    </div>
  )
}
