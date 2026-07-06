import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Menu } from "lucide-react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { sendMessage } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";
import { useMessages } from "../hooks/useMessages";
import type { Session } from "../types";

interface ChatPanelProps {
  activeSession: Session | undefined;
  onOpenSidebar?: () => void;
}

export function ChatPanel({ activeSession, onOpenSidebar }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useMessages(activeSession?.id);

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sessions,
      });
    },
  });

  const handleSend = (content: string) => {
    if (activeSession) {
      sendMutation.mutate({
        sessionId: activeSession.id,
        content,
      });
    }
  };

  return (
    <div className="bg-slate-900 md:border md:border-zinc-800 md:rounded-2xl md:shadow-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-zinc-800 flex-shrink-0 flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-100 truncate">
            {activeSession?.title || "Chat"}
          </h2>
          <p className="text-xs text-zinc-500 truncate">
            {activeSession ? "Active conversation" : "Select or create a chat"}
          </p>
        </div>
      </div>

      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        isSending={sendMutation.isPending}
      />

      <ChatInput
        onSend={handleSend}
        isPending={sendMutation.isPending || !activeSession}
      />
    </div>
  );
}
