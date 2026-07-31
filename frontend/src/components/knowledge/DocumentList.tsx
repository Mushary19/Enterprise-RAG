import { motion } from "framer-motion"
import { fadeSlideUp, staggerContainer, transitionBase } from "../../lib/motion"
import type { Document } from "../../types"
import { DocumentCard } from "./DocumentCard"
import { EmptyKnowledgeState } from "./EmptyKnowledgeState"
import { KnowledgeSkeleton } from "./KnowledgeSkeleton"

interface DocumentListProps {
  documents: Document[] | undefined
  isLoading: boolean
  isSearching: boolean
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function DocumentList({
  documents,
  isLoading,
  isSearching,
  onRename,
  onDelete,
}: DocumentListProps) {
  if (isLoading) return <KnowledgeSkeleton />

  if (!documents || documents.length === 0) {
    return <EmptyKnowledgeState isSearching={isSearching} />
  }

  return (
    <motion.div
      className="space-y-2"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {documents.map((document) => (
        <motion.div key={document.id} variants={fadeSlideUp} transition={transitionBase}>
          <DocumentCard document={document} onRename={onRename} onDelete={onDelete} />
        </motion.div>
      ))}
    </motion.div>
  )
}
