import { useState } from "react"
import { useDeleteSession } from "../hooks/useDeleteSession"
import { useSessions } from "../hooks/useSessions"
import { ChatPanel } from "./ChatPanel"
import { KnowledgePanel } from "./KnowledgePanel"
import { MobileNav } from "./MobileNav"
import { Sidebar } from "./Sidebar"

function Workspace() {
  type MobileTab = "chat" | "knowledge"

  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat")
  const { data: sessions, isLoading } = useSessions()
  const deleteMutation = useDeleteSession()

  const activeSession = sessions?.find((s) => s.id === activeSessionId)

  const handleNewChat = () => {
    const newId = `sess-${Date.now()}`
    setActiveSessionId(newId)
    setSidebarOpen(false)
    setMobileTab("chat")
  }

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
    setSidebarOpen(false)
    setMobileTab("chat")
  }

  const handleDeleteSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      setActiveSessionId(undefined)
    }
    deleteMutation.mutate(sessionId)
  }

  return (
    <div className="h-[100dvh] bg-zinc-950 flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          sessions={sessions}
          isLoading={isLoading}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          sessions={sessions}
          isLoading={isLoading}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex min-w-0 h-full">
        {/* Desktop: both panels side by side */}
        <div className="hidden md:flex flex-1 gap-4 p-4 h-full">
          <div className="w-[340px] flex-shrink-0 h-full">
            <KnowledgePanel />
          </div>
          <div className="flex-1 min-w-0 h-full">
            <ChatPanel
              activeSession={activeSession}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          </div>
        </div>

        {/* Mobile: single panel with bottom nav */}
        <div className="md:hidden flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            {mobileTab === "chat" ? (
              <ChatPanel
                activeSession={activeSession}
                onOpenSidebar={() => setSidebarOpen(true)}
              />
            ) : (
              <KnowledgePanel />
            )}
          </div>
          <MobileNav
            activeTab={mobileTab}
            onTabChange={setMobileTab}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>
      </main>
    </div>
  )
}

export default Workspace
