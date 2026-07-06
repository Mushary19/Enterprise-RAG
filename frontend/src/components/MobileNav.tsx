import { MessageSquare, Database, Menu } from "lucide-react";

type MobileTab = "chat" | "knowledge";

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenSidebar: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenSidebar }: MobileNavProps) {
  return (
    <nav className="flex-shrink-0 bg-slate-900 border-t border-zinc-800 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chats</span>
        </button>

        <button
          onClick={() => onTabChange("chat")}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
            activeTab === "chat"
              ? "text-blue-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button
          onClick={() => onTabChange("knowledge")}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
            activeTab === "knowledge"
              ? "text-blue-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] font-medium">Knowledge</span>
        </button>
      </div>
    </nav>
  );
}
