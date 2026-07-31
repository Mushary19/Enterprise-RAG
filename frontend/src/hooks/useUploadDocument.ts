import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { QUERY_KEYS } from "../lib/queryKeys"
import { uploadKnowledgeDocument } from "../services/api"
import type { Document } from "../types"

// Shared by the Knowledge Workspace dropzone and the chat composer's attach
// button — both ingest a PDF the same way, so the upload + cache-seeding
// logic lives in one place.
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadKnowledgeDocument,
    onSuccess: (result, file) => {
      // Ingestion runs synchronously on the backend (no background worker
      // yet — see docs/known-limitations.md), so a successful response
      // means the document is already fully processed.
      const newDocument: Document = {
        id: `${result.filename}-${Date.now()}`,
        filename: result.filename,
        status: "processed",
        uploaded_at: new Date().toISOString(),
        size: file.size,
        parentChunks: result.parent_chunks_generated,
        childChunks: result.child_chunks_generated,
      }

      queryClient.setQueryData<Document[]>(QUERY_KEYS.documents, (old = []) => [
        newDocument,
        ...old,
      ])

      toast.success(`${result.filename} processed successfully`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to upload document")
    },
  })
}
