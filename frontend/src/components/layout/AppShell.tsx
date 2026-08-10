import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useHiddenSessions } from "../../hooks/useHiddenSessions"
import { useSessions } from "../../hooks/useSessions"
import { ChatPanel } from "../chat/ChatPanel"
import { KnowledgePanel } from "../knowledge/KnowledgePanel"
import { SidebarShell } from "../sidebar/SidebarShell"
import { transitionBase } from "../../lib/motion"
import { MobileNav } from "./MobileNav"

type MobileTab = "chat" | "knowledge"

function AppShell() {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [knowledgeOpen, setKnowledgeOpen] = useState(true)
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat")

  const { data: sessions, isLoading } = useSessions()
  const { hideSession, isHidden } = useHiddenSessions()

  const visibleSessions = sessions?.filter((s) => !isHidden(s.id))

  const activeSession = activeSessionId
    ? visibleSessions?.find((s) => s.id === activeSessionId) ?? {
        id: activeSessionId,
        title: "New Conversation",
        created_at: new Date().toISOString(),
      }
    : undefined

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
    if (sessionId === activeSessionId) setActiveSessionId(undefined)
    hideSession(sessionId)
  }

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="h-[100dvh] bg-zinc-950 flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <SidebarShell
          sessions={visibleSessions}
          isLoading={isLoading}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionBase}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={transitionBase}
              className="md:hidden fixed inset-y-0 left-0 z-50"
            >
              <SidebarShell
                sessions={visibleSessions}
                isLoading={isLoading}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex min-w-0 h-full">
        {/* Desktop: chat + collapsible knowledge context panel */}
        <div className="hidden md:flex flex-1 gap-4 p-4 h-full min-w-0">
          <div className="flex-1 min-w-0 h-full">
            <ChatPanel
              activeSession={activeSession}
              onOpenSidebar={() => setSidebarOpen(true)}
              knowledgeOpen={knowledgeOpen}
              onToggleKnowledge={() => setKnowledgeOpen((v) => !v)}
            />
          </div>

          <AnimatePresence initial={false}>
            {knowledgeOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={transitionBase}
                className="h-full flex-shrink-0 overflow-hidden"
              >
                <div className="w-[340px] h-full">
                  <KnowledgePanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

export default AppShell
