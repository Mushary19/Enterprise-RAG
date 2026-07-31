import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { IconButton } from "../ui/IconButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu"
import { DeleteDocumentDialog } from "./DeleteDocumentDialog"
import { DocumentDetailsDialog } from "./DocumentDetailsDialog"
import { RenameDocumentDialog } from "./RenameDocumentDialog"
import type { Document } from "../../types"

interface DocumentActionsMenuProps {
  document: Document
  onRename: (name: string) => void
  onDelete: () => void
}

export function DocumentActionsMenu({ document, onRename, onDelete }: DocumentActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <IconButton label="Document actions" size="sm">
            <MoreVertical className="w-4 h-4" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
            <Eye className="w-4 h-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem danger onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} document={document} />
      <RenameDocumentDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={document.filename}
        onRename={onRename}
      />
      <DeleteDocumentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        filename={document.filename}
        onConfirm={onDelete}
      />
    </>
  )
}
