import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSession } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });
}
