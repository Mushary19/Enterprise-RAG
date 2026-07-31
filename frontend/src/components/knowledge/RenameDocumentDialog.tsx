import { useState } from "react"
import { Button } from "../ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog"
import { Input } from "../ui/Input"

interface RenameDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onRename: (name: string) => void
}

export function RenameDocumentDialog({
  open,
  onOpenChange,
  currentName,
  onRename,
}: RenameDocumentDialogProps) {
  const [value, setValue] = useState(currentName)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValue(currentName)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename document</DialogTitle>
          <DialogDescription>
            This only relabels the document in your view — it doesn't rename any
            underlying file or record.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onRename(value.trim())
              onOpenChange(false)
            }
          }}
        />
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!value.trim()}
            onClick={() => {
              onRename(value.trim())
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
