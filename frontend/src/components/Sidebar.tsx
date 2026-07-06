import { LogOut, Plus, Search, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import type { Session } from "../types"
import { SessionList } from "./SessionList"

interface SidebarProps {
  sessions: Session[] | undefined
  isLoading: boolean
  activeSessionId: string | undefined
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  onClose?: () => void
}

export function Sidebar({
  sessions,
  isLoading,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = sessions?.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <aside className="w-[280px] sm:w-[300px] bg-slate-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Fixed header: brand + new chat */}
      <div className="p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-100">AI Workspace</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Fixed search */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Scrollable sessions */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 min-h-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-3">
          Recent
        </p>
        <SessionList
          sessions={filteredSessions}
          isLoading={isLoading}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
        />
      </div>

      {/* Fixed user footer */}
      {user && (
        <div className="p-3 border-t border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {user.email}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
