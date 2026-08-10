import { motion } from "framer-motion"
import { useState } from "react"
import { useLocalStorage } from "../../hooks/useLocalStorage"
import { useSessionPins } from "../../hooks/useSessionPins"
import { transitionBase } from "../../lib/motion"
import type { ChatSession } from "../../types"
import { NewChatButton } from "./NewChatButton"
import { SessionList } from "./SessionList"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarSearch } from "./SidebarSearch"
import { SidebarUserMenu } from "./SidebarUserMenu"

interface SidebarShellProps {
  sessions: ChatSession[] | undefined
  isLoading: boolean
  activeSessionId: string | undefined
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  onClose?: () => void
}

export function SidebarShell({
  sessions,
  isLoading,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose,
}: SidebarShellProps) {
  const [collapsedStored, setCollapsed] = useLocalStorage("sidebar_collapsed", false)
  const collapsed = !onClose && collapsedStored
  const [searchQuery, setSearchQuery] = useState("")
  const { pinnedIds, isPinned, togglePin } = useSessionPins()

  const filteredSessions = sessions?.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 288 }}
      transition={transitionBase}
      className="bg-zinc-900 border-r border-zinc-800 flex flex-col h-full w-[288px] flex-shrink-0 overflow-hidden"
    >
      <div className="p-3 border-b border-zinc-800 flex-shrink-0 space-y-3">
        <SidebarHeader
          collapsed={collapsed}
          onToggleCollapse={onClose ? undefined : () => setCollapsed((v) => !v)}
          onClose={onClose}
        />
        <NewChatButton collapsed={collapsed} onClick={onNewChat} />
        {!collapsed && <SidebarSearch value={searchQuery} onChange={setSearchQuery} />}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-hidden py-2 px-2.5 min-h-0">
          <SessionList
            sessions={filteredSessions}
            isLoading={isLoading}
            isSearching={searchQuery.length > 0}
            activeSessionId={activeSessionId}
            pinnedIds={pinnedIds}
            isPinned={isPinned}
            onSelectSession={onSelectSession}
            onTogglePin={togglePin}
            onDeleteSession={onDeleteSession}
          />
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      <div className="p-2.5 border-t border-zinc-800 flex-shrink-0">
        <SidebarUserMenu collapsed={collapsed} />
      </div>
    </motion.aside>
  )
}
