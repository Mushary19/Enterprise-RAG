import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

// There is no backend endpoint to delete a chat session (only create/read),
// so "delete" hides the conversation from this browser's sidebar only — the
// underlying messages remain in the database. See docs/known-limitations.md.
export function useHiddenSessions() {
  const [hiddenIds, setHiddenIds] = useLocalStorage<string[]>("hidden_sessions", [])

  const isHidden = useCallback((sessionId: string) => hiddenIds.includes(sessionId), [
    hiddenIds,
  ])

  const hideSession = useCallback(
    (sessionId: string) => {
      setHiddenIds((prev) => (prev.includes(sessionId) ? prev : [...prev, sessionId]))
    },
    [setHiddenIds],
  )

  return { hiddenIds, isHidden, hideSession }
}
