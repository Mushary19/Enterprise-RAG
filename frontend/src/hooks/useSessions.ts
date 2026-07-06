import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";

export function useSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: getSessions,
  });
}
