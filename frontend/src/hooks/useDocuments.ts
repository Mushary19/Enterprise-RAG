import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../lib/queryKeys";
import type { Document } from "../types";

// There is no backend endpoint to list previously uploaded documents yet
// (see docs/known-limitations.md), so this list only reflects documents
// uploaded during the current browser session, seeded via setQueryData
// from the upload mutation in KnowledgePanel.
export function useDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.documents,
    queryFn: (): Document[] => [],
    staleTime: Infinity,
  });
}
