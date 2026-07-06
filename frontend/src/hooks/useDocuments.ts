import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";

export function useDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.documents,
    queryFn: getDocuments,
  });
}
