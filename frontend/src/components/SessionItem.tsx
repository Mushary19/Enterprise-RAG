import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import type { Session } from "../types";

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: SessionItemProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onDelete();
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-blue-500/20 text-zinc-100 border border-blue-500/30"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
      }`}
    >
      <MessageSquare
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          isActive ? "text-blue-400" : "text-zinc-500"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5 truncate">
          {new Date(session.updated_at).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={handleDelete}
        className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
          confirming
            ? "bg-red-500/20 text-red-400 opacity-100"
            : "text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
        } ${isActive ? "opacity-100" : ""}`}
        title={confirming ? "Click again to confirm" : "Delete conversation"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
