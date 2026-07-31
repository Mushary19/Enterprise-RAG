import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

// Pinning has no backend field on ChatSession — this persists locally only,
// per browser, per device. See docs/known-limitations.md.
export function useSessionPins() {
  const [pinnedIds, setPinnedIds] = useLocalStorage<string[]>("pinned_sessions", [])

  const isPinned = useCallback(
    (sessionId: string) => pinnedIds.includes(sessionId),
    [pinnedIds],
  )

  const togglePin = useCallback(
    (sessionId: string) => {
      setPinnedIds((prev) =>
        prev.includes(sessionId)
          ? prev.filter((id) => id !== sessionId)
          : [...prev, sessionId],
      )
    },
    [setPinnedIds],
  )

  return { pinnedIds, isPinned, togglePin }
}
