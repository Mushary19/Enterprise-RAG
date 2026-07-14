import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../lib/queryKeys"
import { loadChatSessions } from "../services/api"

export function useSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: loadChatSessions,
  })
}
