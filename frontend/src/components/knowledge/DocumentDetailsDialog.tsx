import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog"
import { DocumentStatusBadge } from "./DocumentStatusBadge"
import type { Document } from "../../types"

interface DocumentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200 font-medium">{value}</span>
    </div>
  )
}

export function DocumentDetailsDialog({
  open,
  onOpenChange,
  document,
}: DocumentDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">{document.filename}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <DetailRow label="Status" value={<DocumentStatusBadge status={document.status} />} />
          <DetailRow label="Size" value={formatFileSize(document.size)} />
          <DetailRow
            label="Uploaded"
            value={new Date(document.uploaded_at).toLocaleString()}
          />
          <DetailRow label="Parent chunks" value={document.parentChunks ?? "—"} />
          <DetailRow label="Child chunks (embeddings)" value={document.childChunks ?? "—"} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
