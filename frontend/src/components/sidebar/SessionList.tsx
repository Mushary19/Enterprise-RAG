import { useVirtualizer } from "@tanstack/react-virtual"
import { useMemo, useRef } from "react"
import type { ChatSession } from "../../types"
import { EmptySidebarState } from "./EmptySidebarState"
import { SessionGroupHeader } from "./SessionGroupHeader"
import { SessionListItem } from "./SessionListItem"
import { SessionListSkeleton } from "./SessionListSkeleton"

type Row =
  | { type: "header"; key: string; label: string }
  | { type: "session"; key: string; session: ChatSession }

interface SessionListProps {
  sessions: ChatSession[] | undefined
  isLoading: boolean
  isSearching: boolean
  activeSessionId: string | undefined
  pinnedIds: string[]
  isPinned: (id: string) => boolean
  onSelectSession: (id: string) => void
  onTogglePin: (id: string) => void
  onDeleteSession: (id: string) => void
}

export function SessionList({
  sessions,
  isLoading,
  isSearching,
  activeSessionId,
  pinnedIds,
  isPinned,
  onSelectSession,
  onTogglePin,
  onDeleteSession,
}: SessionListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rows = useMemo<Row[]>(() => {
    if (!sessions || sessions.length === 0) return []

    const pinned = sessions.filter((s) => pinnedIds.includes(s.id))
    const recent = sessions.filter((s) => !pinnedIds.includes(s.id))

    const result: Row[] = []
    if (pinned.length > 0) {
      result.push({ type: "header", key: "header-pinned", label: "Pinned" })
      pinned.forEach((s) => result.push({ type: "session", key: s.id, session: s }))
    }
    if (recent.length > 0) {
      result.push({ type: "header", key: "header-recent", label: "Recent" })
      recent.forEach((s) => result.push({ type: "session", key: s.id, session: s }))
    }
    return result
  }, [sessions, pinnedIds])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.type === "header" ? 36 : 58),
    overscan: 8,
    getItemKey: (index) => rows[index]?.key ?? index,
  })

  if (isLoading) {
    return <SessionListSkeleton />
  }

  if (rows.length === 0) {
    return <EmptySidebarState isSearching={isSearching} />
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="h-full overflow-y-auto px-0.5">
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
      >
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={row.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.type === "header" ? (
                <SessionGroupHeader label={row.label} />
              ) : (
                <SessionListItem
                  session={row.session}
                  isActive={row.session.id === activeSessionId}
                  isPinned={isPinned(row.session.id)}
                  onSelect={onSelectSession}
                  onTogglePin={onTogglePin}
                  onDelete={onDeleteSession}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
