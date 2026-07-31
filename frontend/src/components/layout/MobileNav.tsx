import { Database, Menu, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "../../lib/cn"
import { transitionFast } from "../../lib/motion"

type MobileTab = "chat" | "knowledge"

interface MobileNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onOpenSidebar: () => void
}

export function MobileNav({ activeTab, onTabChange, onOpenSidebar }: MobileNavProps) {
  const tabs: { id: MobileTab; label: string; icon: typeof MessageSquare }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "knowledge", label: "Knowledge", icon: Database },
  ]

  return (
    <nav className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Open conversation history"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chats</span>
        </button>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors",
                isActive ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  transition={transitionFast}
                  className="absolute inset-0 rounded-lg bg-blue-500/10"
                />
              )}
              <Icon className="relative w-5 h-5" />
              <span className="relative text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
