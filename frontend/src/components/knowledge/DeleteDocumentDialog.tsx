import { ConfirmDialog } from "../ui/ConfirmDialog"

interface DeleteDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filename: string
  onConfirm: () => void
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  filename,
  onConfirm,
}: DeleteDocumentDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove document"
      description={
        <>
          This removes <span className="text-zinc-300 font-medium">{filename}</span> from
          this list. It does not delete it from the knowledge base yet — there's no
          delete endpoint on the backend (see docs/known-limitations.md).
        </>
      }
      confirmLabel="Remove from list"
      danger
      onConfirm={() => {
        onConfirm()
        onOpenChange(false)
      }}
    />
  )
}
