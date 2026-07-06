import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";

export function useMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(sessionId || ""),
    queryFn: () => getMessages(sessionId!),
    enabled: !!sessionId,
  });
}
