import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useDocuments } from "../../hooks/useDocuments"
import { QUERY_KEYS } from "../../lib/queryKeys"
import type { Document } from "../../types"
import { DocumentList } from "./DocumentList"
import { KnowledgeHeader } from "./KnowledgeHeader"
import { KnowledgeSearch } from "./KnowledgeSearch"
import { UploadDropzone } from "./UploadDropzone"

export function KnowledgePanel() {
  const queryClient = useQueryClient()
  const { data: documents, isLoading } = useDocuments()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredDocuments = documents?.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRename = (id: string, name: string) => {
    queryClient.setQueryData<Document[]>(QUERY_KEYS.documents, (old = []) =>
      old.map((doc) => (doc.id === id ? { ...doc, filename: name } : doc)),
    )
  }

  const handleDelete = (id: string) => {
    queryClient.setQueryData<Document[]>(QUERY_KEYS.documents, (old = []) =>
      old.filter((doc) => doc.id !== id),
    )
  }

  return (
    <div className="bg-zinc-950 md:border md:border-zinc-800 md:rounded-2xl md:shadow-xl h-full flex flex-col overflow-hidden">
      <KnowledgeHeader documents={documents} />

      <div className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0 space-y-4">
        <UploadDropzone />

        {documents && documents.length > 0 && (
          <KnowledgeSearch value={searchQuery} onChange={setSearchQuery} />
        )}

        <DocumentList
          documents={filteredDocuments}
          isLoading={isLoading}
          isSearching={searchQuery.length > 0}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
