import type { Session } from "../types";
import { SessionItem } from "./SessionItem";
import { Loader2 } from "lucide-react";

interface SessionListProps {
  sessions: Session[] | undefined;
  isLoading: boolean;
  activeSessionId: string | undefined;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  isLoading,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SessionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          isActive={session.id === activeSessionId}
          onClick={() => onSelectSession(session.id)}
          onDelete={() => onDeleteSession(session.id)}
        />
      ))}
    </div>
  );
}
