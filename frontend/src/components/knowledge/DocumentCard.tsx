import { FileText } from "lucide-react"
import { memo, useCallback } from "react"
import type { Document } from "../../types"
import { DocumentActionsMenu } from "./DocumentActionsMenu"
import { DocumentStatusBadge } from "./DocumentStatusBadge"

interface DocumentCardProps {
  document: Document
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentCardImpl({ document, onRename, onDelete }: DocumentCardProps) {
  const handleRename = useCallback((name: string) => onRename(document.id, name), [
    onRename,
    document.id,
  ])
  const handleDelete = useCallback(() => onDelete(document.id), [onDelete, document.id])

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors duration-150">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{document.filename}</p>
        <p className="text-xs text-zinc-500">
          {formatFileSize(document.size)} · {new Date(document.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      <DocumentStatusBadge status={document.status} />
      <DocumentActionsMenu document={document} onRename={handleRename} onDelete={handleDelete} />
    </div>
  )
}

export const DocumentCard = memo(DocumentCardImpl)
